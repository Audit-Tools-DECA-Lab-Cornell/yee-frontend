import { expect, test } from "@playwright/test";

import { loginAsAuditor } from "../helpers/auth";

// Runs under `auditor-chromium` (filename matches /auditor/).
// Covers Stage 9: an auditor must not reach manager-only reports/exports.
// Assertions are robust to the wrong-role redirect target (middleware sends to
// the user's dashboard_path, but in production serve mode it can land on /login
// — see PROGRESS.md Stage 7 review L16). Either way the auditor must NOT see the
// privileged manager content and must NOT remain on the protected path.
test.describe("@auditor cannot access manager reports/exports", () => {
	test("auditor is kept out of the manager reports dashboard", async ({ page }) => {
		await loginAsAuditor(page);
		await page.goto("/manager/reports");

		await expect(page).not.toHaveURL(/\/manager\/reports/, { timeout: 30_000 });
		await expect(page.getByText("Export options")).toHaveCount(0);
	});

	test("auditor is kept out of the manager raw-data export", async ({ page }) => {
		await loginAsAuditor(page);
		await page.goto("/manager/raw-data");

		await expect(page).not.toHaveURL(/\/manager\/raw-data/, { timeout: 30_000 });
		await expect(page.getByText("Manager Raw Data")).toHaveCount(0);
	});
});
