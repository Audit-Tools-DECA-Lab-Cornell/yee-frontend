import { expect, type Page } from "@playwright/test";

import { type E2ERole, e2eUsers } from "../fixtures/users";

const ROLE_LANDING: Record<E2ERole, (pathname: string) => boolean> = {
	admin: pathname => pathname === "/admin" || pathname.startsWith("/admin/"),
	manager: pathname => pathname === "/manager" || pathname.startsWith("/manager/"),
	auditor: pathname => pathname === "/auditor" || pathname.startsWith("/auditor/")
};

/**
 * Log in as a specific role through the real /login form.
 *
 * The YEE login page renders a single shared form (no per-role cards and no
 * data-testid hooks), so we target the email/password inputs by id and the
 * submit button by its accessible name, then wait for the role's landing route.
 */
export async function loginAsRole(page: Page, role: E2ERole) {
	await page.goto("/login");

	const { email, password } = e2eUsers[role];

	const emailInput = page.locator("#email");
	const passwordInput = page.locator("#password");
	const submitButton = page.getByRole("button", { name: /^sign in$/i });

	await expect(emailInput).toBeVisible({ timeout: 15_000 });
	await emailInput.fill(email);
	await passwordInput.fill(password);

	await Promise.all([
		page.waitForURL(url => ROLE_LANDING[role](url.pathname), { timeout: 30_000 }),
		submitButton.click()
	]);
}

export async function loginAsAdmin(page: Page) {
	return loginAsRole(page, "admin");
}

export async function loginAsManager(page: Page) {
	return loginAsRole(page, "manager");
}

export async function loginAsAuditor(page: Page) {
	return loginAsRole(page, "auditor");
}
