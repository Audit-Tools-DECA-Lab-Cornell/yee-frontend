import { expect, test } from "@playwright/test";

import { loginAsManager } from "../helpers/auth";

// Runs under `manager-chromium` (filename matches /manager/).
// Covers: projects list shows seeded data; create-project form loads.
test.describe("@manager projects list + create form", () => {
	test("projects list page shows seeded projects", async ({ page }) => {
		await loginAsManager(page);
		await page.goto("/manager/projects");

		await expect(page.getByRole("heading", { name: "Projects", exact: true }).first()).toBeVisible({
			timeout: 30_000
		});

		// Both seeded projects must appear as links.
		await expect(page.getByRole("link", { name: "Youth Enabling Environments Baseline 2026" }).first()).toBeVisible(
			{ timeout: 15_000 }
		);
		await expect(page.getByRole("link", { name: "Community Amenities Follow-up" }).first()).toBeVisible();

		// Primary action is present.
		await expect(page.getByRole("link", { name: /create project/i }).first()).toBeVisible();
	});

	test("create project form loads at /manager/projects/new", async ({ page }) => {
		await loginAsManager(page);
		await page.goto("/manager/projects/new");

		await expect(page.getByRole("heading", { name: "Create Project" }).first()).toBeVisible({
			timeout: 30_000
		});
		await expect(page.locator("#project-name")).toBeVisible();
		await expect(page.locator("#project-start-date")).toBeVisible();
	});
});
