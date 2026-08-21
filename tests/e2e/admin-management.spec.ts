import { expect, test, type Page } from "@playwright/test";

import { loginAsAdmin } from "../helpers/auth";

/**
 * Open a fresh instrument draft. Nothing is written until Save is pressed, so
 * these specs can type freely without touching a real instrument version.
 */
async function openInstrumentDraft(page: Page) {
	await page.goto("/admin/instruments");
	await expect(page.getByText("Instrument Management").first()).toBeVisible({ timeout: 30_000 });
	await page.getByRole("button", { name: /create new draft/i }).click();
	await expect(page.getByRole("tab", { name: /Sections/ })).toBeVisible({ timeout: 15_000 });
}

/** Sections collapse by default (only the first is open), so expand before asserting. */
async function expandInstrumentSection(page: Page, name: RegExp) {
	const header = page.getByRole("button", { name }).first();
	await header.scrollIntoViewIfNeeded();
	if ((await header.getAttribute("aria-expanded")) !== "true") await header.click();
	await expect(header).toHaveAttribute("aria-expanded", "true");
}

// Runs under `admin-chromium` (filename matches /admin/).
// Covers Stage 9: instrument admin, users management, admin-scoped raw-data export.
test.describe("@admin instrument + users + raw-data export", () => {
	test("instrument admin page renders Instrument Management", async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto("/admin/instruments");

		await expect(page.getByText("Instrument Management").first()).toBeVisible({ timeout: 30_000 });
		// Admin-only authoring affordance.
		await expect(page.getByRole("button", { name: /create new draft/i }).first()).toBeVisible({
			timeout: 15_000
		});
	});

	test("instrument editor preserves spaces, double spaces, and line breaks through re-renders", async ({ page }) => {
		await loginAsAdmin(page);
		await openInstrumentDraft(page);
		await page.getByRole("tab", { name: /Sections/ }).click();
		const givenSectionTitle = page.getByRole("textbox", { name: "Section title" }).first();
		const originalTitle = await givenSectionTitle.inputValue();

		await givenSectionTitle.focus();
		await givenSectionTitle.evaluate((input: HTMLInputElement) =>
			input.setSelectionRange(input.value.length, input.value.length)
		);
		// One key at a time: the bug was a controlled `value` that re-sanitized on
		// every render, so the trailing space vanished before the next keystroke.
		await givenSectionTitle.press("Space");
		await expect(givenSectionTitle).toHaveValue(`${originalTitle} `);

		await givenSectionTitle.press("Space");
		await givenSectionTitle.press("a");
		await expect(givenSectionTitle).toHaveValue(`${originalTitle}  a`);

		const givenInstructions = page.getByRole("textbox", { name: "Instructions" }).first();
		await givenInstructions.focus();
		await givenInstructions.evaluate((input: HTMLTextAreaElement) => {
			input.setSelectionRange(input.value.length, input.value.length);
		});
		const originalInstructions = await givenInstructions.inputValue();
		await givenInstructions.press("Enter");
		await givenInstructions.press("Enter");
		await givenInstructions.press("b");

		await expect(givenInstructions).toHaveValue(`${originalInstructions}\n\nb`);
	});

	test("instrument editor distinguishes matrix questions from answer options", async ({ page }) => {
		await loginAsAdmin(page);
		await openInstrumentDraft(page);
		await expect(page.getByRole("tab", { name: /Scale Guidance/ })).toHaveCount(0);

		await page.getByRole("tab", { name: /Sections/ }).click();
		await expandInstrumentSection(page, /^Access/);

		const presenceItem = page.getByRole("article", { name: "QID1#1" });
		await expect(presenceItem.getByRole("textbox", { name: "Question 1" })).toHaveValue(
			/Is there at least 1 public transportation stop/
		);
		await expect(presenceItem.getByRole("textbox", { name: "Question 2" })).toHaveValue(
			/Are there sidewalks leading to the main entrance/
		);
		await expect(presenceItem.getByRole("textbox", { name: "Answer option 1" })).toHaveValue("Yes");
		await expect(presenceItem.getByRole("textbox", { name: "Answer option 2" })).toHaveValue("No");
	});

	test("condition items expose their shared prompt alongside questions and answers", async ({ page }) => {
		await loginAsAdmin(page);
		await openInstrumentDraft(page);
		await page.getByRole("tab", { name: /Sections/ }).click();
		await expandInstrumentSection(page, /^Access/);

		const conditionItem = page.getByRole("article", { name: "QID1#2" });
		await expect(conditionItem.getByRole("textbox", { name: "Shared prompt" })).toHaveValue(
			/please rate the condition/i
		);
		await expect(conditionItem.getByRole("textbox", { name: "Question 1" })).toHaveValue(
			/public transportation stop/
		);
		await expect(conditionItem.getByRole("textbox", { name: "Answer option 1" })).toHaveValue("Poor");
		await expect(conditionItem.getByRole("textbox", { name: "Answer option 2" })).toHaveValue("Acceptable");
		await expect(conditionItem.getByRole("textbox", { name: "Answer option 3" })).toHaveValue("Great");
	});

	test("Scale Guidance is absent from the editor and the version viewer", async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto("/admin/instruments");
		await expect(page.getByText("Instrument Management").first()).toBeVisible({ timeout: 30_000 });

		await expect(page.getByText(/Scale Guidance/i)).toHaveCount(0);
		await expect(page.getByRole("tab", { name: /Scale Guidance/ })).toHaveCount(0);

		await openInstrumentDraft(page);
		await expect(page.getByRole("tab", { name: /Scale Guidance/ })).toHaveCount(0);
		await expect(page.getByRole("tab", { name: /Audit Copy/ })).toBeVisible();
	});

	test("closing a dirty editor asks before discarding, and both answers behave", async ({ page }) => {
		await loginAsAdmin(page);
		await openInstrumentDraft(page);
		await page.getByRole("tab", { name: /Sections/ }).click();

		const givenSectionTitle = page.getByRole("textbox", { name: "Section title" }).first();
		const originalTitle = await givenSectionTitle.inputValue();
		await givenSectionTitle.fill(`${originalTitle} edited`);
		await expect(page.getByText("Unsaved changes")).toBeVisible();

		await page.getByRole("button", { name: /close editor/i }).click();
		await expect(page.getByRole("alertdialog")).toBeVisible();

		// Keep editing: the draft and the edit both survive.
		await page.getByRole("button", { name: /keep editing/i }).click();
		await expect(page.getByRole("alertdialog")).toHaveCount(0);
		await expect(givenSectionTitle).toHaveValue(`${originalTitle} edited`);

		// Discard: the editor closes back to the empty state.
		await page.getByRole("button", { name: /close editor/i }).click();
		await page.getByRole("button", { name: /discard changes/i }).click();
		await expect(page.getByText("No draft open")).toBeVisible();
	});

	test("invalid JSON opens the advanced editor and explains why saving is blocked", async ({ page }) => {
		await loginAsAdmin(page);
		await openInstrumentDraft(page);

		await page.getByRole("button", { name: /show advanced json editor/i }).click();
		await page.getByRole("textbox", { name: "Instrument JSON" }).fill("{ not valid json");

		await expect(page.getByRole("alert")).toContainText(/not valid/i);
		await expect(page.getByRole("textbox", { name: "Instrument JSON" })).toBeVisible();
		await expect(page.getByText(/Fix the JSON in the advanced editor before saving/i)).toBeVisible();
		await expect(page.getByRole("button", { name: /save draft version/i })).toBeDisabled();
	});

	test("a publish 409 names the scored questions the version is missing", async ({ page }) => {
		await loginAsAdmin(page);

		// Mock only the create call, so nothing is written to a real instrument.
		await page.route("**/api/admin/instruments**", async route => {
			if (route.request().method() !== "POST") return route.fallback();
			await route.fulfill({
				status: 409,
				contentType: "application/json",
				body: JSON.stringify({
					detail: {
						message: "This version is missing questions the scoring needs, so it can't be published.",
						scoring_compatibility: {
							ok: false,
							scoring_version: "yee-1",
							required_item_count: 17,
							present_item_count: 15,
							missing_items: ["QID1#1", "QID11#2"],
							missing_choices: []
						}
					}
				})
			});
		});

		await openInstrumentDraft(page);
		await page.getByRole("button", { name: /save draft version/i }).click();

		await expect(page.getByText(/Restore QID1#1, QID11#2/)).toBeVisible({ timeout: 15_000 });
		await expect(page.getByText(/15 of the 17 questions/)).toBeVisible();
	});

	test("users admin page renders the Users table", async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto("/admin/users");

		// Anchor on the loaded-table CardDescription, NOT a getByText("Users")
		// substring (which matches the "Loading users..." LoadingCard flash).
		await expect(page.getByText(/All managers, auditors, and admins across the system/i).first()).toBeVisible({
			timeout: 30_000
		});
	});

	test("admin raw-data page renders scoped title and Export all → CSV downloads", async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto("/admin/raw-data");

		await expect(page.getByText("Admin Raw Data").first()).toBeVisible({ timeout: 30_000 });
		await expect(page.getByRole("button", { name: "Export all" }).first()).toBeVisible({
			timeout: 15_000
		});

		await page.getByRole("button", { name: "Export all" }).first().click();
		const [download] = await Promise.all([
			page.waitForEvent("download"),
			page.getByRole("menuitem", { name: /csv/i }).first().click()
		]);
		expect(download.suggestedFilename()).toMatch(/^yee-raw-data-\d{4}-\d{2}-\d{2}\.csv$/);
	});
});
