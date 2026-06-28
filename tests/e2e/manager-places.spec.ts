import { expect, test } from "@playwright/test";

import { loginAsManager } from "../helpers/auth";

// Runs under `manager-chromium` (filename matches /manager/).
// Covers: places list shows seeded data; add-place form loads.
test.describe("@manager places list + add form", () => {
	test("places list page shows seeded places", async ({ page }) => {
		await loginAsManager(page);
		await page.goto("/dashboard/places");

		await expect(page.getByRole("heading", { name: "Places", exact: true }).first()).toBeVisible({
			timeout: 30_000
		});

		// Two seeded places from the Baseline 2026 project must be visible.
		await expect(page.getByText("Westside Youth Hub").first()).toBeVisible({ timeout: 15_000 });
		await expect(page.getByText("South Transit Plaza").first()).toBeVisible();

		// Primary action is present.
		await expect(page.getByRole("link", { name: /add place/i }).first()).toBeVisible();
	});

	test("add place form loads at /dashboard/places/new", async ({ page }) => {
		await loginAsManager(page);
		await page.goto("/dashboard/places/new");

		await expect(page.getByRole("heading", { name: "Add Place" }).first()).toBeVisible({
			timeout: 30_000
		});
		await expect(page.locator("#place-name")).toBeVisible();
		await expect(page.locator("#place-city")).toBeVisible();
	});
});
