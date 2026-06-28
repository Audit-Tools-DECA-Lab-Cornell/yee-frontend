import { expect, test } from "@playwright/test";

import { AUDIT_HUB } from "../fixtures/ids";
import { loginAsManager } from "../helpers/auth";

// Runs under `manager-chromium` (filename matches /manager/).
// Covers Stage 9: manager audit list + manager audit edit flow entry.
test.describe("@manager audits list + edit flow", () => {
	test("audits list page renders the Audits table", async ({ page }) => {
		await loginAsManager(page);
		await page.goto("/dashboard/audits");

		// Anchor on the loaded-table CardDescription, which is NOT present in the
		// <LoadingCard label="audits"> ("Loading audits...") state — so a plain
		// getByText("Audits") substring won't false-green on the loading flash.
		await expect(
			page.getByText(/Filter by project or place, compare selected audits/i).first()
		).toBeVisible({ timeout: 30_000 });
	});

	test("manager audit edit entry resolves to the wizard for a seeded audit", async ({ page }) => {
		await loginAsManager(page);
		// The index page redirects /edit -> /edit/page/1 (server redirect).
		await page.goto(`/dashboard/audits/${AUDIT_HUB}/edit`);

		// A valid seeded SUBMITTED audit's edit-state is readable (GROUND-TRUTH L14),
		// so we should land on the first wizard step, not bounced to /login or a 404.
		await expect(page).toHaveURL(new RegExp(`/dashboard/audits/${AUDIT_HUB}/edit/page/1`), {
			timeout: 30_000
		});
		await expect(page).not.toHaveURL(/\/login(\/|$|\?)/);
	});
});
