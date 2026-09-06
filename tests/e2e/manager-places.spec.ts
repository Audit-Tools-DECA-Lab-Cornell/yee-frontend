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

	test("place detail compares only the reports a manager applies", async ({ page }) => {
		// Given: a place with three submitted reports.
		await page.setViewportSize({ width: 1728, height: 1000 });
		await loginAsManager(page);
		await page.goto(`/manager/places/${PLACE_HUB}`);
		await expect(page.getByText("Submitted reports").first()).toBeVisible({ timeout: 30_000 });

		const reportCheckboxes = page.getByRole("checkbox", { name: /select report/i });
		await expect(reportCheckboxes).toHaveCount(3, { timeout: 15_000 });
		const reportRows = reportCheckboxes.locator("xpath=ancestor::tr");
		const selectedIdentities = await Promise.all(
			[0, 1].map(async index => ({
				auditor: await reportRows.nth(index).getByRole("cell").nth(1).innerText(),
				date: await reportRows.nth(index).getByRole("cell").nth(3).innerText()
			}))
		);
		const unselectedIdentity = {
			auditor: await reportRows.nth(2).getByRole("cell").nth(1).innerText(),
			date: await reportRows.nth(2).getByRole("cell").nth(3).innerText()
		};
		const compareButton = page.getByRole("button", { name: /compare selected/i });
		await expect(compareButton).toBeDisabled();

		// When: exactly two reports are selected and the comparison is applied.
		await reportCheckboxes.nth(0).check();
		await reportCheckboxes.nth(1).check();
		await compareButton.click();

		// Then: the fixed-domain ledger contains only those two audit rows.
		const ledger = page.getByRole("table", { name: /raw score domain comparison/i });
		await expect(ledger).toBeVisible();
		await expect(ledger.getByRole("row")).toHaveCount(4);
		await expect(ledger.getByRole("columnheader")).toHaveCount(8);
		for (const identity of selectedIdentities) {
			await expect(
				ledger.getByRole("rowheader").filter({ hasText: identity.auditor }).filter({ hasText: identity.date })
			).toHaveCount(1);
		}
		await expect(
			ledger
				.getByRole("rowheader")
				.filter({ hasText: unselectedIdentity.auditor })
				.filter({ hasText: unselectedIdentity.date })
		).toHaveCount(0);
	});

	test("place detail keeps report selection when the browse view changes", async ({ page }) => {
		// Given: one report is selected in the table view.
		await loginAsManager(page);
		await page.goto(`/manager/places/${PLACE_HUB}`);
		const firstReport = page.getByRole("checkbox", { name: /select report/i }).first();
		await expect(firstReport).toBeVisible({ timeout: 30_000 });
		await firstReport.check();

		// When: the manager switches to the chart and back to the table.
		await page.getByRole("button", { name: "Chart" }).click();
		await page.getByRole("button", { name: "Table" }).click();

		// Then: the pending report remains selected.
		await expect(page.getByRole("checkbox", { name: /select report/i }).first()).toBeChecked();
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
