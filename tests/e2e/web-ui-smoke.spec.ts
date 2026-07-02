import { expect, test } from "@playwright/test";

import { loginAsAuditor, loginAsManager } from "../helpers/auth";

test.describe("@web-ui seeded backend sync", () => {
	test("manager can sign in and see the dashboard shell", async ({ page }) => {
		await loginAsManager(page);
		await expect(page).toHaveURL(/\/manager(\/|$|\?)/);
		await expect(page.getByRole("heading", { name: "Manager Overview" }).first()).toBeVisible({
			timeout: 30_000
		});
	});

	test("auditor can sign in and see the auditor shell", async ({ page }) => {
		await loginAsAuditor(page);
		await expect(page).toHaveURL(/\/auditor(\/|$|\?)/);
		await expect(page.getByRole("heading", { name: "Auditor Overview" }).first()).toBeVisible({
			timeout: 30_000
		});
	});
});
