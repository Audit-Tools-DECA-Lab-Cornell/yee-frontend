import { expect, test } from "@playwright/test";

import { loginAsAuditor } from "../helpers/auth";

// Runs under the `auditor-chromium` project (filename matches /auditor/).
test.describe("@auditor dashboard shell + logout", () => {
	test("auditor lands on /my-dashboard with the Auditor Overview shell and nav", async ({ page }) => {
		await loginAsAuditor(page);

		await expect(page).toHaveURL(/\/my-dashboard(\/|$|\?)/);
		await expect(page.getByRole("heading", { name: "Auditor Overview" }).first()).toBeVisible({
			timeout: 30_000
		});

		// Auditor sidebar nav is just Overview + My Audits.
		await expect(page.getByRole("link", { name: "My Audits", exact: true }).first()).toBeVisible();
	});

	test("auditor can log out and then loses access to /my-dashboard", async ({ page }) => {
		await loginAsAuditor(page);

		await Promise.all([
			page.waitForResponse(resp => resp.url().includes("/api/auth/logout")),
			page.getByRole("button", { name: /logout/i }).click()
		]);
		await expect(page).toHaveURL(/\/login(\/|$|\?)/);

		await page.goto("/my-dashboard");
		await expect(page).toHaveURL(/\/login(\/|$|\?)/);
	});
});
