import { expect, test } from "@playwright/test";

import { SUBMISSION_HUB } from "../fixtures/ids";
import { loginAsManager } from "../helpers/auth";
import { captureDownload, expectCsv, expectPdf, expectZipContainer } from "../helpers/downloads";

// Runs under `manager-chromium` (filename matches /manager/).
// Covers Stage 9: reports dashboard + manager-scoped raw-data export.
test.describe("@manager reports + raw-data export", () => {
	test("reports dashboard renders with export options", async ({ page }) => {
		await loginAsManager(page);
		await page.goto("/manager/reports");

		await expect(page.getByText("Reports dashboard").first()).toBeVisible({ timeout: 30_000 });
		// The mode-aware export split-button replaces the old "Export options" card;
		// in the default Compare Places mode its label names the artifact.
		await expect(page.getByRole("button", { name: /export place comparison/i }).first()).toBeVisible({
			timeout: 15_000
		});
	});

	// Formerly DEFERRED: the seed now writes YeeAuditSubmission rows for every
	// SUBMITTED audit, and GET /yee/audits/{submission_id} grants managers
	// project-scoped read access — so a manager can open individual reports.
	test("manager opens a submitted report from the reports dashboard", async ({ page }) => {
		await loginAsManager(page);
		await page.goto("/manager/reports");

		// Compare Places renders one "Open latest report" link per place row.
		const reportLink = page.getByRole("link", { name: /open latest report/i }).first();
		await expect(reportLink).toBeVisible({ timeout: 30_000 });
		await reportLink.click();

		await page.waitForURL(/\/yee\/submissions\//, { timeout: 30_000 });
		await expect(page.getByText("Read-only report").first()).toBeVisible({ timeout: 30_000 });
		await expect(page.getByText("Submission overview").first()).toBeVisible({ timeout: 15_000 });
	});

	test("manager reads a seeded submission report directly with a manager back-link", async ({ page }) => {
		await loginAsManager(page);
		await page.goto(`/yee/submissions/${SUBMISSION_HUB}`);

		await expect(page.getByText("Read-only report").first()).toBeVisible({ timeout: 30_000 });
		await expect(page.getByText("Submission overview").first()).toBeVisible({ timeout: 15_000 });
		// The viewer adapts navigation per role: managers go back to /manager/audits.
		await expect(page.getByRole("link", { name: /back to my audits/i }).first()).toHaveAttribute(
			"href",
			"/manager/audits"
		);
	});

	test("manager raw-data page renders scoped title and export buttons", async ({ page }) => {
		await loginAsManager(page);
		await page.goto("/manager/raw-data");

		// Manager scope title (the page passes title="Manager Raw Data").
		await expect(page.getByText("Manager Raw Data").first()).toBeVisible({ timeout: 30_000 });
		await expect(page.getByRole("button", { name: "Export all" }).first()).toBeVisible({
			timeout: 15_000
		});
	});

	test("Export all → CSV triggers a raw-data download", async ({ page }) => {
		await loginAsManager(page);
		await page.goto("/manager/raw-data");

		// The format-aware control is now a dropdown: open it, then pick CSV.
		await page.getByRole("button", { name: "Export all" }).first().click();
		const [download] = await Promise.all([
			page.waitForEvent("download"),
			page.getByRole("menuitem", { name: /csv/i }).first().click()
		]);
		expect(download.suggestedFilename()).toMatch(/^yee-raw-data-\d{4}-\d{2}-\d{2}\.csv$/);
	});

	test("Export all → Excel downloads a PK-headered workbook", async ({ page }) => {
		await loginAsManager(page);
		await page.goto("/manager/raw-data");

		await page.getByRole("button", { name: "Export all" }).first().click();
		const download = await captureDownload(page, () =>
			page.getByRole("menuitem", { name: /excel/i }).first().click()
		);
		expectZipContainer(download, "xlsx");
	});

	test("R1 submission report exports a byte-valid PDF and CSV", async ({ page }) => {
		await loginAsManager(page);
		await page.goto(`/yee/submissions/${SUBMISSION_HUB}`);
		await expect(page.getByText("Submission overview").first()).toBeVisible({ timeout: 30_000 });

		// PDF.
		await page.getByRole("button", { name: "Export" }).first().click();
		const pdf = await captureDownload(page, () => page.getByRole("menuitem", { name: /pdf/i }).first().click());
		expectPdf(pdf);
		expect(pdf.filename).toMatch(/^yee-audit-.+\.pdf$/);

		// CSV — asserts the legacy identity columns are preserved.
		await page.getByRole("button", { name: "Export" }).first().click();
		const csv = await captureDownload(page, () => page.getByRole("menuitem", { name: /csv/i }).first().click());
		const [header] = expectCsv(csv);
		expect(header.slice(0, 5)).toEqual(["Auditor ID", "Place", "Place ID", "Submitted At", "Raw Score"]);
	});

	test("R2 place comparison exports a PDF from the dashboard toolbar", async ({ page }) => {
		await loginAsManager(page);
		await page.goto("/manager/reports");

		const exportButton = page.getByRole("button", { name: /export place comparison/i }).first();
		await expect(exportButton).toBeVisible({ timeout: 30_000 });
		await exportButton.click();
		const pdf = await captureDownload(page, () => page.getByRole("menuitem", { name: /pdf/i }).first().click());
		expectPdf(pdf);
		expect(pdf.filename).toMatch(/^yee-place-comparison-\d{4}-\d{2}-\d{2}\.pdf$/);
	});
});
