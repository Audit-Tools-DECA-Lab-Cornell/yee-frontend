import { expect, test } from "@playwright/test";

import { PLACE_HUB } from "../fixtures/ids";
import { loginAsManager } from "../helpers/auth";

// Runs under `manager-chromium` (filename matches /manager/).
// Covers: places list shows seeded data; add-place form loads.
test.describe("@manager places list + add form", () => {
	test("places list page shows seeded places", async ({ page }) => {
		await loginAsManager(page);
		await page.goto("/manager/places");

		await expect(page.getByRole("heading", { name: "Places", exact: true }).first()).toBeVisible({
			timeout: 30_000
		});

		// Two seeded places from the Baseline 2026 project must be visible.
		await expect(page.getByText("Westside Youth Hub").first()).toBeVisible({ timeout: 15_000 });
		await expect(page.getByText("South Transit Plaza").first()).toBeVisible();

		// Primary action is present.
		await expect(page.getByRole("link", { name: /add place/i }).first()).toBeVisible();
	});

	test("place detail lists submitted reports with working links", async ({ page }) => {
		await loginAsManager(page);
		// Westside Youth Hub has three seeded submissions.
		await page.goto(`/manager/places/${PLACE_HUB}`);

		await expect(page.getByText("Submitted reports").first()).toBeVisible({ timeout: 30_000 });
		const reportLink = page.getByRole("link", { name: /^open report$/i }).first();
		await expect(reportLink).toBeVisible({ timeout: 15_000 });
		await reportLink.click();
		await page.waitForURL(/\/yee\/submissions\//, { timeout: 30_000 });
		await expect(page.getByText("Read-only report").first()).toBeVisible({ timeout: 30_000 });
	});

	test("add place form loads at /manager/places/new", async ({ page }) => {
		await loginAsManager(page);
		await page.goto("/manager/places/new");

		await expect(page.getByRole("heading", { name: "Add Place" }).first()).toBeVisible({
			timeout: 30_000
		});
		await expect(page.locator("#place-name")).toBeVisible();
		await expect(page.locator("#place-city")).toBeVisible();
	});
});
