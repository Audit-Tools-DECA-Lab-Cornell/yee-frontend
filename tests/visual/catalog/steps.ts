import { expect, type Locator, type Page } from "@playwright/test";

const MOBILE_VIEWPORT = { width: 390, height: 844 } as const;

export class StateUnavailableError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "StateUnavailableError";
	}
}

async function isVisible(locator: Locator): Promise<boolean> {
	return locator.isVisible().catch(() => false);
}

export async function expectText(page: Page, text: RegExp | string): Promise<void> {
	await expect(page.getByText(text).first()).toBeVisible({ timeout: 30_000 });
}

export async function openDashboardMenu(page: Page): Promise<void> {
	await page.setViewportSize(MOBILE_VIEWPORT);
	const trigger = page.getByRole("button", { name: /open dashboard menu/i }).first();
	if (!(await isVisible(trigger))) {
		throw new StateUnavailableError("No dashboard menu trigger found");
	}
	await trigger.click();
	await expect(page.getByRole("dialog").first()).toBeVisible({ timeout: 10_000 });
}

export async function openFilterDropdown(page: Page, triggerName: RegExp | string): Promise<void> {
	const trigger = page.getByRole("button", { name: triggerName }).first();
	if (!(await isVisible(trigger))) {
		throw new StateUnavailableError(`No "${triggerName}" filter trigger found`);
	}
	await trigger.scrollIntoViewIfNeeded();
	await trigger.click();
	await expect(page.getByRole("menu").first()).toBeVisible({ timeout: 10_000 });
}

export async function openConfirmFromButton(page: Page, buttonName: RegExp | string): Promise<void> {
	const trigger = page.getByRole("button", { name: buttonName }).first();
	if (!(await isVisible(trigger))) {
		throw new StateUnavailableError(`No "${buttonName}" confirm trigger found`);
	}
	if (!(await trigger.isEnabled().catch(() => false))) {
		throw new StateUnavailableError(`"${buttonName}" confirm trigger is disabled`);
	}
	await trigger.scrollIntoViewIfNeeded();
	await trigger.click();
	const dialog = page.locator('[role="alertdialog"],[role="dialog"]').first();
	await expect(dialog).toBeVisible({ timeout: 10_000 });
}
