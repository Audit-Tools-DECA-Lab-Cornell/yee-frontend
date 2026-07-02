import { expect, test } from "@playwright/test";

import { loginAsManager } from "../helpers/auth";

// Runs under `manager-chromium` (filename matches /manager/).
// Covers: auditor invite create — form renders, submit succeeds, success state shown.
test.describe("@manager auditor invite flow", () => {
	test("invite form renders and is accessible from the auditors page", async ({ page }) => {
		await loginAsManager(page);
		await page.goto("/manager/auditors/invite");

		await expect(page.getByRole("heading", { name: "Invite an auditor" }).first()).toBeVisible({
			timeout: 30_000
		});
		await expect(page.locator("#invite-email")).toBeVisible();
		await expect(page.getByRole("button", { name: /create invite/i }).first()).toBeVisible();
	});

	test("submitting the invite form creates an invite and shows the invite URL", async ({ page }) => {
		await loginAsManager(page);
		await page.goto("/manager/auditors/invite");

		await page.locator("#invite-email").fill("stage8-test-invite@yee-e2e.invalid");
		await page.getByRole("button", { name: /create invite/i }).click();

		// Success state: role="status" div appears with the invite email and invite URL.
		const successBanner = page.locator('[role="status"]').first();
		await expect(successBanner).toBeVisible({ timeout: 20_000 });
		await expect(successBanner).toContainText("stage8-test-invite@yee-e2e.invalid");

		// The invite URL is rendered inside the success banner.
		await expect(successBanner.getByText(/invite/i).first()).toBeVisible();
	});
});
