import { expect, test } from "@playwright/test";

import { AUDIT_HUB, PLACE_HUB, PROJECT_BASELINE } from "../fixtures/ids";
import { loginAsManager } from "../helpers/auth";

// Runs under `manager-chromium` (filename matches /manager/).
// Covers Stage 9: manager audit list + manager audit edit flow entry.
test.describe("@manager audits list + edit flow", () => {
	test("audits list page renders the Audits table", async ({ page }) => {
		await loginAsManager(page);
		await page.goto("/manager/audits");

		// Anchor on the loaded-table CardDescription, which is NOT present in the
		// <LoadingCard label="audits"> ("Loading audits...") state — so a plain
		// getByText("Audits") substring won't false-green on the loading flash.
		await expect(page.getByText(/Filter by project or place, compare selected audits/i).first()).toBeVisible({
			timeout: 30_000
		});
	});

	test("audits table honors project/place deep-link filters and opens a report", async ({ page }) => {
		await loginAsManager(page);
		// Place detail's "Open Audits" action passes these params; the table must
		// open pre-filtered instead of ignoring them.
		await page.goto(`/manager/audits?projectId=${PROJECT_BASELINE}&placeId=${PLACE_HUB}`);

		await expect(page.getByText(/Filter by project or place, compare selected audits/i).first()).toBeVisible({
			timeout: 30_000
		});
		// Deep-link filters count as active filters.
		await expect(page.getByRole("button", { name: /clear filters/i }).first()).toBeVisible({
			timeout: 15_000
		});
		// The filtered place (Westside Youth Hub) has seeded submissions, so a
		// View Report action must be present and lead to the read-only report.
		const viewReport = page.getByRole("link", { name: /view report/i }).first();
		await expect(viewReport).toBeVisible({ timeout: 15_000 });
		await viewReport.click();
		await page.waitForURL(/\/yee\/submissions\//, { timeout: 30_000 });
		await expect(page.getByText("Read-only report").first()).toBeVisible({ timeout: 30_000 });
	});

	test("manager audit edit entry resolves to the wizard for a seeded audit", async ({ page }) => {
		await loginAsManager(page);
		// The index page redirects /edit -> /edit/page/1 (server redirect).
		await page.goto(`/manager/audits/${AUDIT_HUB}/edit`);

		// A valid seeded SUBMITTED audit's edit-state is readable (GROUND-TRUTH L14),
		// so we should land on the first wizard step, not bounced to /login or a 404.
		await expect(page).toHaveURL(new RegExp(`/manager/audits/${AUDIT_HUB}/edit/page/1`), {
			timeout: 30_000
		});
		await expect(page).not.toHaveURL(/\/login(\/|$|\?)/);
	});
});
