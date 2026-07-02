import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { loginViaApi } from "../helpers/api";
import {
	captureViewportScrollFrames,
	isLocalScreenshotCaptureEnabled,
	preparePublicVisualPage,
	prepareVisualPage
} from "../helpers/visual";
import { captureCatalog, type CaptureTarget } from "./catalog";

const SCREENSHOTS_ROOT = path.join("public", "screenshots");

interface ManifestEntry {
	readonly area: string;
	readonly route: string;
	readonly file: string;
	readonly label: string;
	readonly scrolled: boolean;
}

const manifest: ManifestEntry[] = [];
let protectedScreenshotsAvailable: Promise<boolean> | null = null;

function getOverviewBasePath(target: CaptureTarget): string {
	return path.posix.join(...target.segments, "01-overview");
}

async function waitForCaptureReady(
	page: Parameters<typeof preparePublicVisualPage>[0],
	target: CaptureTarget
): Promise<void> {
	if (!target.readyText) {
		await expect(page.locator("main").first()).toBeVisible({ timeout: 30_000 });
		return;
	}

	await expect(page.getByText(target.readyText).first()).toBeVisible({ timeout: 30_000 });
}

async function canCaptureProtectedScreenshots(request: Parameters<typeof loginViaApi>[0]): Promise<boolean> {
	if (!protectedScreenshotsAvailable) {
		protectedScreenshotsAvailable = (async () => {
			try {
				await loginViaApi(request, "manager");
				return true;
			} catch (error) {
				if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
					return false;
				}
				throw error;
			}
		})();
	}

	return protectedScreenshotsAvailable;
}

for (const target of captureCatalog) {
	test(target.label, async ({ page, request }) => {
		test.skip(!isLocalScreenshotCaptureEnabled(), "Run via `pnpm screenshots:web` to write local PNGs.");

		if (target.role === "public") {
			await preparePublicVisualPage(page, target.route);
		} else {
			const protectedScreenshotsReachable = await canCaptureProtectedScreenshots(request);
			test.skip(
				!protectedScreenshotsReachable,
				"Protected screenshots require the local YEE backend at E2E_API_BASE_URL."
			);

			await prepareVisualPage(page, request, {
				role: target.role,
				route: target.route
			});
		}

		await waitForCaptureReady(page, target);
		const result = await captureViewportScrollFrames(page, getOverviewBasePath(target));

		for (const file of result.files) {
			manifest.push({
				area: target.segments[0] ?? "unknown",
				route: target.route,
				file,
				label: target.label,
				scrolled: result.scrolled
			});
		}
	});
}

test.afterAll(async () => {
	if (manifest.length === 0) {
		return;
	}

	const outputPath = path.resolve(process.cwd(), SCREENSHOTS_ROOT, "manifest.json");
	const sortedManifest = [...manifest].sort((left, right) => left.file.localeCompare(right.file));
	await mkdir(path.dirname(outputPath), { recursive: true });
	await writeFile(outputPath, `${JSON.stringify({ captures: sortedManifest }, null, 2)}\n`, "utf8");
	expect(sortedManifest.length).toBeGreaterThan(0);
});
