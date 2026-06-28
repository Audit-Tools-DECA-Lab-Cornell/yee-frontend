import { expect, test } from "@playwright/test";

import { loginAsManager } from "../helpers/auth";

// Runs under the `manager-chromium` project (filename matches /manager/).
test.describe("@manager dashboard shell + logout", () => {
	test("manager lands on /dashboard with the Manager Overview shell and nav", async ({ page }) => {
		await loginAsManager(page);

		await expect(page).toHaveURL(/\/dashboard(\/|$|\?)/);
		await expect(page.getByRole("heading", { name: "Manager Overview" }).first()).toBeVisible({
			timeout: 30_000
		});

		// Manager-distinctive sidebar nav links (auditor/admin shells differ).
		for (const label of ["Auditors", "Reports", "Raw Data"]) {
			await expect(page.getByRole("link", { name: label, exact: true }).first()).toBeVisible();
		}
		// Manager primary action.
		await expect(page.getByRole("link", { name: /create project/i }).first()).toBeVisible();
	});

	test("manager can log out and then loses access to /dashboard", async ({ page }) => {
		await loginAsManager(page);

		await Promise.all([
			page.waitForResponse(resp => resp.url().includes("/api/auth/logout")),
			page.getByRole("button", { name: /logout/i }).click()
		]);
		await expect(page).toHaveURL(/\/login(\/|$|\?)/);

		// Session is cleared: navigating back to a protected route bounces to /login.
		await page.goto("/dashboard");
		await expect(page).toHaveURL(/\/login(\/|$|\?)/);
	});
});
