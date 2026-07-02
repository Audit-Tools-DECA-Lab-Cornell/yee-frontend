import { expect, test } from "@playwright/test";

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

	// DEFERRED (intentionally not a test): "manager opens a submitted report".
	// The reports place-comparison builder (services/dashboard.py fetch_reporting_rows)
	// inner-joins YeeAuditSubmission, which is EMPTY after `app.seed` (L9/L17 — seeded
	// SUBMITTED audits carry scores on the Audit shell, not as submission rows). So no
	// "Open latest report" link renders for seeded data and the page cannot be reached.
	// Separately, the manager → GET /yee/audits/{submission_id} route (audits.py:319-323)
	// gates to the owning auditor or admin, so a manager hits 404/403 even with a real
	// submission — a genuine PRODUCT bug, tracked as a Stage-12 follow-up. To cover this
	// end-to-end, first seed a real submission via the live POST /yee/audits flow AND fix
	// the manager report route; only then assert the locked-report body renders.

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
