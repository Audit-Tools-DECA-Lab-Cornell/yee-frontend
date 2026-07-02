import { expect, test } from "@playwright/test";

import { loginAsManager } from "../helpers/auth";

// Runs under `manager-chromium` (filename matches /manager/).
// Covers: auditors list shows seeded auditors; assignment panel present.
test.describe("@manager auditors list + assignment panel", () => {
	test("auditors page shows seeded auditors and Invite New Auditor button", async ({ page }) => {
		await loginAsManager(page);
		await page.goto("/manager/auditors");

		await expect(page.getByRole("heading", { name: "Auditors", exact: true }).first()).toBeVisible({
			timeout: 30_000
		});

		// The seed has 3 auditors; at least one row must be present.
		await expect(page.getByRole("cell").first()).toBeVisible({ timeout: 15_000 });

		// Invite action is always present (empty or populated).
		await expect(page.getByRole("link", { name: /invite new auditor/i }).first()).toBeVisible();
	});

	test("assignment panel renders on the auditors page", async ({ page }) => {
		await loginAsManager(page);
		await page.goto("/manager/auditors");

		// AssignmentPanel heading is rendered below the auditors table.
		await expect(page.getByText(/assign auditors to places and projects/i).first()).toBeVisible({
			timeout: 30_000
		});

		// The project selector inside the panel must be present.
		await expect(page.locator("#assignment-project")).toBeVisible();
	});
});
