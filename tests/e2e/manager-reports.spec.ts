import { expect, test } from "@playwright/test";

import { SUBMISSION_HUB } from "../fixtures/ids";
import { loginAsManager } from "../helpers/auth";

// Runs under `manager-chromium` (filename matches /manager/).
// Covers Stage 9: reports dashboard + manager-scoped raw-data export.
test.describe("@manager reports + raw-data export", () => {
	test("reports dashboard renders with export options", async ({ page }) => {
		await loginAsManager(page);
		await page.goto("/manager/reports");

		await expect(page.getByText("Reports dashboard").first()).toBeVisible({ timeout: 30_000 });
		// Export options card is a manager-distinctive reporting affordance.
		await expect(page.getByText("Export options").first()).toBeVisible({ timeout: 15_000 });
	});

	// Formerly DEFERRED: the seed now writes YeeAuditSubmission rows for every
	// SUBMITTED audit, and GET /yee/audits/{submission_id} grants managers
	// project-scoped read access — so a manager can open individual reports.
	test("manager opens a submitted report from the reports dashboard", async ({ page }) => {
		await loginAsManager(page);
		await page.goto("/manager/reports");

		// Compare Places renders one "Open latest report" link per place row.
		const reportLink = page.getByRole("link", { name: /open latest report/i }).first();
		await expect(reportLink).toBeVisible({ timeout: 30_000 });
		await reportLink.click();

		await page.waitForURL(/\/yee\/submissions\//, { timeout: 30_000 });
		await expect(page.getByText("Read-only report").first()).toBeVisible({ timeout: 30_000 });
		await expect(page.getByText("Submission overview").first()).toBeVisible({ timeout: 15_000 });
	});

	test("manager reads a seeded submission report directly with a manager back-link", async ({ page }) => {
		await loginAsManager(page);
		await page.goto(`/yee/submissions/${SUBMISSION_HUB}`);

		await expect(page.getByText("Read-only report").first()).toBeVisible({ timeout: 30_000 });
		await expect(page.getByText("Submission overview").first()).toBeVisible({ timeout: 15_000 });
		// The viewer adapts navigation per role: managers go back to /manager/audits.
		await expect(page.getByRole("link", { name: /back to my audits/i }).first()).toHaveAttribute(
			"href",
			"/manager/audits"
		);
	});

	test("manager raw-data page renders scoped title and export buttons", async ({ page }) => {
		await loginAsManager(page);
		await page.goto("/manager/raw-data");

		// Manager scope title (the page passes title="Manager Raw Data").
		await expect(page.getByText("Manager Raw Data").first()).toBeVisible({ timeout: 30_000 });
		await expect(page.getByRole("button", { name: "Export All" }).first()).toBeVisible({
			timeout: 15_000
		});
	});

	test("clicking Export All triggers a CSV download", async ({ page }) => {
		await loginAsManager(page);
		await page.goto("/manager/raw-data");

		await expect(page.getByRole("button", { name: "Export All" }).first()).toBeVisible({
			timeout: 30_000
		});

		const [download] = await Promise.all([
			page.waitForEvent("download"),
			page.getByRole("button", { name: "Export All" }).first().click()
		]);
		// The page sets filename="manager-raw-data.csv".
		expect(download.suggestedFilename()).toBe("manager-raw-data.csv");
	});
});
