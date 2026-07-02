import { expect, test } from "@playwright/test";

import { loginAsAdmin } from "../helpers/auth";

// Runs under `admin-chromium` (filename matches /admin/).
// Covers Stage 9: instrument admin, users management, admin-scoped raw-data export.
test.describe("@admin instrument + users + raw-data export", () => {
	test("instrument admin page renders Instrument Management", async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto("/admin/instruments");

		await expect(page.getByText("Instrument Management").first()).toBeVisible({ timeout: 30_000 });
		// Admin-only authoring affordance.
		await expect(page.getByRole("button", { name: /create new draft/i }).first()).toBeVisible({
			timeout: 15_000
		});
	});

	test("users admin page renders the Users table", async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto("/admin/users");

		// Anchor on the loaded-table CardDescription, NOT a getByText("Users")
		// substring (which matches the "Loading users..." LoadingCard flash).
		await expect(page.getByText(/All managers, auditors, and admins across the system/i).first()).toBeVisible({
			timeout: 30_000
		});
	});

	test("admin raw-data page renders scoped title and Export All triggers a download", async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto("/admin/raw-data");

		await expect(page.getByText("Admin Raw Data").first()).toBeVisible({ timeout: 30_000 });
		await expect(page.getByRole("button", { name: "Export All" }).first()).toBeVisible({
			timeout: 15_000
		});

		const [download] = await Promise.all([
			page.waitForEvent("download"),
			page.getByRole("button", { name: "Export All" }).first().click()
		]);
		// The admin page sets filename="admin-raw-data.csv".
		expect(download.suggestedFilename()).toBe("admin-raw-data.csv");
	});
});
