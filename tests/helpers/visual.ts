import { mkdir } from "node:fs/promises";
import path from "node:path";

import { errors, type APIRequestContext, type Page } from "@playwright/test";

import { type E2ERole } from "../fixtures/users";
import { getE2EBaseUrl, seedBrowserSession } from "./session";

export const VISUAL_VIEWPORT = {
	width: 1728,
	height: 1117
} as const;

const LOCAL_SCREENSHOT_CAPTURE_ENABLED = ["1", "true", "yes"].includes(
	(process.env.CAPTURE_LOCAL_SCREENSHOTS ?? "").trim().toLowerCase()
);
const NETWORK_IDLE_TIMEOUT_MS = 5_000;
const SCROLL_SETTLE_MS = 200;
const SCROLL_EPSILON_PX = 24;
const MAX_SCROLL_FRAMES = 40;
const SCREENSHOTS_ROOT = path.join("public", "screenshots");
const VISUAL_STYLE = `
	html {
		scroll-behavior: auto !important;
	}

	*, *::before, *::after {
		animation-duration: 0s !important;
		animation-delay: 0s !important;
		transition-duration: 0s !important;
		transition-delay: 0s !important;
		caret-color: transparent !important;
	}
`;

export interface PrepareVisualPageOptions {
	readonly role: E2ERole;
	readonly route: string;
	readonly viewport?: typeof VISUAL_VIEWPORT;
}

export interface ViewportScrollCaptureResult {
	readonly files: readonly string[];
	readonly scrolled: boolean;
}

export function isLocalScreenshotCaptureEnabled(): boolean {
	return LOCAL_SCREENSHOT_CAPTURE_ENABLED;
}

async function waitForNetworkIdle(page: Page): Promise<void> {
	try {
		await page.waitForLoadState("networkidle", { timeout: NETWORK_IDLE_TIMEOUT_MS });
	} catch (error) {
		if (error instanceof errors.TimeoutError) {
			return;
		}
		throw error;
	}
}

async function stabilizeVisualState(page: Page): Promise<void> {
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.addStyleTag({ content: VISUAL_STYLE });
	await page.waitForLoadState("domcontentloaded");
	await waitForNetworkIdle(page);
}

export async function preparePublicVisualPage(page: Page, route: string): Promise<void> {
	await page.context().clearCookies();
	await page.setViewportSize(VISUAL_VIEWPORT);
	await page.goto(new URL(route, getE2EBaseUrl()).toString(), {
		waitUntil: "domcontentloaded"
	});
	await stabilizeVisualState(page);
}

export async function prepareVisualPage(
	page: Page,
	request: APIRequestContext,
	options: PrepareVisualPageOptions
): Promise<void> {
	await page.setViewportSize(options.viewport ?? VISUAL_VIEWPORT);
	await seedBrowserSession(page.context(), request, options.role);
	await page.goto(new URL(options.route, getE2EBaseUrl()).toString(), {
		waitUntil: "domcontentloaded"
	});
	await stabilizeVisualState(page);
}

export async function captureViewportScrollFrames(
	page: Page,
	baseRelativePath: string
): Promise<ViewportScrollCaptureResult> {
	await stabilizeVisualState(page);

	const root = path.resolve(process.cwd(), SCREENSHOTS_ROOT);
	const overlayOpen = await page.evaluate(
		() =>
			document.querySelector(
				'[role="dialog"],[role="alertdialog"],[role="menu"],[role="listbox"],[data-slot="popover-content"],[data-radix-popper-content-wrapper]'
			) !== null
	);

	if (!overlayOpen) {
		await page.evaluate(() => window.scrollTo(0, 0));
		await page.waitForTimeout(SCROLL_SETTLE_MS);
	}

	const layout = await page.evaluate(() => {
		const doc = document.documentElement;
		const bodyStyle = getComputedStyle(document.body);
		const docStyle = getComputedStyle(doc);
		const scrollLocked =
			document.body.hasAttribute("data-scroll-locked") ||
			bodyStyle.overflowY === "hidden" ||
			bodyStyle.overflow === "hidden" ||
			docStyle.overflowY === "hidden" ||
			docStyle.overflow === "hidden";
		return {
			scrollHeight: doc.scrollHeight,
			clientHeight: doc.clientHeight,
			scrollLocked
		};
	});

	const needsScroll =
		!overlayOpen && !layout.scrollLocked && layout.scrollHeight - layout.clientHeight > SCROLL_EPSILON_PX;
	if (!needsScroll) {
		const relativePath = `${baseRelativePath}.png`;
		const outputPath = path.join(root, relativePath);
		await mkdir(path.dirname(outputPath), { recursive: true });
		await page.screenshot({ path: outputPath });
		return {
			files: [relativePath],
			scrolled: false
		};
	}

	const files: string[] = [];
	for (let frame = 1; frame <= MAX_SCROLL_FRAMES; frame += 1) {
		const relativePath = path.posix.join(baseRelativePath, `${String(frame).padStart(2, "0")}.png`);
		const outputPath = path.join(root, relativePath);
		await mkdir(path.dirname(outputPath), { recursive: true });
		await page.screenshot({ path: outputPath });
		files.push(relativePath);

		const beforeScrollY = await page.evaluate(() => window.scrollY);
		if (beforeScrollY + layout.clientHeight >= layout.scrollHeight - SCROLL_EPSILON_PX) {
			break;
		}

		await page.evaluate(step => window.scrollBy(0, step), layout.clientHeight);
		await page.waitForTimeout(SCROLL_SETTLE_MS);

		const afterScrollY = await page.evaluate(() => window.scrollY);
		if (afterScrollY <= beforeScrollY + 1) {
			break;
		}
	}

	return {
		files,
		scrolled: files.length > 1
	};
}
