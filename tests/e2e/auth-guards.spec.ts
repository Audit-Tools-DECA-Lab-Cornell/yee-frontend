import { expect, test } from "@playwright/test";

import { e2eUsers } from "../fixtures/users";
import { loginAsAuditor, loginAsManager } from "../helpers/auth";

// Runs under the `chromium` integration project (no role prefix in the filename).
// Mirrors src/middleware.ts PROTECTED_ROUTES:
//   /admin -> [ADMIN], /manager -> [MANAGER], /auditor -> [AUDITOR, MANAGER]
// Unauthenticated -> /login; wrong role -> redirect to the user's own dashboard_path.
test.describe("@auth route guards + negative auth", () => {
	test("unauthenticated visits to protected routes redirect to /login", async ({ page }) => {
		for (const route of ["/manager", "/auditor", "/admin"]) {
			await page.goto(route);
			await expect(page, `${route} should redirect to /login`).toHaveURL(/\/login(\/|$|\?)/, {
				timeout: 30_000
			});
		}
	});

	test("auditor is redirected away from the manager /manager to /auditor", async ({ page }) => {
		await loginAsAuditor(page);
		await page.goto("/manager");
		await expect(page).toHaveURL(/\/auditor(\/|$|\?)/);
	});

	test("manager is redirected away from /admin to /manager", async ({ page }) => {
		await loginAsManager(page);
		await page.goto("/admin");
		await expect(page).toHaveURL(/\/manager(\/|$|\?)/);
	});

	test("bad credentials show an error and stay on /login", async ({ page }) => {
		await page.goto("/login");
		await page.locator("#email").fill(e2eUsers.manager.email);
		await page.locator("#password").fill("definitely-the-wrong-password");
		await page.getByRole("button", { name: /^sign in$/i }).click();

		await expect(page.getByText(/invalid|incorrect|failed|credential|password|not verified/i).first()).toBeVisible({
			timeout: 20_000
		});
		await expect(page).toHaveURL(/\/login(\/|$|\?)/);
	});
});
