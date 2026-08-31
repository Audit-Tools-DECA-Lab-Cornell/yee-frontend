import { expect, test, type Page } from "@playwright/test";

import { loginAsAdmin } from "../helpers/auth";

async function openInstrumentDraft(page: Page): Promise<string> {
	await page.goto("/admin/instruments");
	await expect(page.getByText("YEE instrument").first()).toBeVisible({ timeout: 30_000 });
	const forkResponse = page.waitForResponse(
		response => response.url().includes("/api/admin/instruments/") && response.url().endsWith("/fork")
	);
	await page.getByRole("button", { name: /create draft/i }).click();
	const payload = await (await forkResponse).json();
	await expect(page.getByRole("heading", { name: "Instrument workbench" })).toBeVisible({ timeout: 30_000 });
	return String(payload.id);
}

async function deleteDraft(page: Page, draftId: string) {
	const response = await page.request.delete(`/api/admin/instruments/${draftId}`);
	expect(response.ok()).toBe(true);
}

test.describe("@admin instrument + users + raw-data export", () => {
	test("instrument admin separates the live version from editable drafts", async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto("/admin/instruments");
		await expect(page.getByText("YEE instrument").first()).toBeVisible({ timeout: 30_000 });
		await expect(page.getByRole("button", { name: /create draft/i })).toBeVisible();
		await expect(page.getByText("Version history")).toBeVisible();
		await expect(page.getByText("Spreadsheet", { exact: true })).toHaveCount(0);
	});

	test("workbench edits a logical question with its own answers and follow-up", async ({ page }) => {
		await loginAsAdmin(page);
		const draftId = await openInstrumentDraft(page);
		try {
			const firstQuestion = page.locator("article").first();
			await expect(firstQuestion.getByRole("textbox", { name: "Question wording" })).toHaveValue(
				/public transportation/i
			);
			await expect(firstQuestion.getByRole("textbox", { name: "Option 1" }).first()).toHaveValue("Yes");
			await expect(firstQuestion.getByRole("textbox", { name: "Option 2" }).first()).toHaveValue("No");
			await expect(firstQuestion.getByRole("textbox", { name: "Follow-up wording" })).toHaveValue(
				/rate the condition/i
			);
			await expect(firstQuestion.getByText("Required when shown")).toBeVisible();
		} finally {
			await deleteDraft(page, draftId);
		}
	});

	test("question options are independent and one-level undo restores wording", async ({ page }) => {
		await loginAsAdmin(page);
		const draftId = await openInstrumentDraft(page);
		try {
			const firstPrompt = page.locator("article").first().getByRole("textbox", { name: "Question wording" });
			const original = await firstPrompt.inputValue();
			await firstPrompt.fill("Edited access question");
			await expect(page.getByText("Unsaved")).toBeVisible();
			await page.getByRole("button", { name: "Undo" }).click();
			await expect(firstPrompt).toHaveValue(original);
			const firstOption = page.locator("article").first().getByRole("textbox", { name: "Option 1" }).first();
			const secondOption = page.locator("article").nth(1).getByRole("textbox", { name: "Option 1" }).first();
			const secondValue = await secondOption.inputValue();
			await firstOption.fill("Yes, definitely");
			await expect(secondOption).toHaveValue(secondValue);
			await page.getByRole("button", { name: "Undo" }).click();
			await expect(firstOption).toHaveValue("Yes");
		} finally {
			await deleteDraft(page, draftId);
		}
	});

	test("survey map and validated developer import replace the spreadsheet and raw editor", async ({ page }) => {
		await loginAsAdmin(page);
		const draftId = await openInstrumentDraft(page);
		try {
			await page.getByRole("tab", { name: "Survey map" }).click();
			await expect(page.getByRole("table")).toBeVisible();
			await expect(page.getByRole("columnheader", { name: "Question" })).toBeVisible();
			await page.getByRole("tab", { name: "Developer" }).click();
			await expect(page.getByRole("button", { name: "Download JSON" })).toBeVisible();
			await expect(page.getByRole("button", { name: "Import validated JSON" })).toBeVisible();
			await expect(page.getByRole("textbox", { name: "Instrument JSON" })).toHaveCount(0);
		} finally {
			await deleteDraft(page, draftId);
		}
	});

	test("users admin page renders the Users table", async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto("/admin/users");
		await expect(page.getByText(/All managers, auditors, and admins across the system/i).first()).toBeVisible({
			timeout: 30_000
		});
	});

	test("admin raw-data page downloads CSV", async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto("/admin/raw-data");
		await expect(page.getByText("Admin Raw Data").first()).toBeVisible({ timeout: 30_000 });
		await page.getByRole("button", { name: "Export all" }).first().click();
		const [download] = await Promise.all([
			page.waitForEvent("download"),
			page.getByRole("menuitem", { name: /csv/i }).first().click()
		]);
		expect(download.suggestedFilename()).toMatch(/^yee-raw-data-\d{4}-\d{2}-\d{2}\.csv$/);
	});
});
