import { expect, test } from "@playwright/test";

import { loginAsAdmin } from "../helpers/auth";

// Runs under the `admin-chromium` project (filename matches /admin/).
test.describe("@admin dashboard shell + logout", () => {
	test("admin lands on /admin with the Admin Overview shell and nav", async ({ page }) => {
		await loginAsAdmin(page);

		await expect(page).toHaveURL(/\/admin(\/|$|\?)/);
		await expect(page.getByRole("heading", { name: "Admin Overview" }).first()).toBeVisible({
			timeout: 30_000
		});

		// Admin-distinctive sidebar nav links.
		for (const label of ["Users", "Instruments"]) {
			await expect(page.getByRole("link", { name: label, exact: true }).first()).toBeVisible();
		}
	});

	test("admin can log out and then loses access to /admin", async ({ page }) => {
		await loginAsAdmin(page);

		await Promise.all([
			page.waitForResponse(resp => resp.url().includes("/api/auth/logout")),
			page.getByRole("button", { name: /logout/i }).click()
		]);
		await expect(page).toHaveURL(/\/login(\/|$|\?)/);

		await page.goto("/admin");
		await expect(page).toHaveURL(/\/login(\/|$|\?)/);
	});
});
