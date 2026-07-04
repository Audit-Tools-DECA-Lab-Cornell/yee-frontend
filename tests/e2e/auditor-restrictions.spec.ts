import { expect, test } from "@playwright/test";

import { SUBMISSION_HUB, SUBMISSION_HUB_AUDITOR_02 } from "../fixtures/ids";
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

// Regression pins for the manager-access widening of GET /yee/audits/{id}:
// auditors must stay owner-gated on the shared submission detail route.
test.describe("@auditor submission report stays owner-gated", () => {
	test("auditor opens their own submitted report", async ({ page }) => {
		await loginAsAuditor(page);
		// SUBMISSION_HUB belongs to the seeded auditor-demo-1 (AUD001).
		await page.goto(`/yee/submissions/${SUBMISSION_HUB}`);

		await expect(page.getByText("Read-only report").first()).toBeVisible({ timeout: 30_000 });
		await expect(page.getByText("Submission overview").first()).toBeVisible({ timeout: 15_000 });
	});

	test("auditor cannot read another auditor's submission", async ({ page }) => {
		await loginAsAuditor(page);
		// SUBMISSION_HUB_AUDITOR_02 belongs to auditor-demo-2.
		await page.goto(`/yee/submissions/${SUBMISSION_HUB_AUDITOR_02}`);

		// The viewer surfaces the backend 403 instead of the locked report.
		await expect(page.getByText("Read-only report")).toHaveCount(0, { timeout: 30_000 });
		await expect(page.getByText(/do not have access|failed to load/i).first()).toBeVisible({
			timeout: 30_000
		});
	});
});
