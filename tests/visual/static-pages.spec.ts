import { expect, test } from "@playwright/test";

// Runs ONLY under the `visual-chromium` project (testMatch /.*visual\/.*\.spec\.ts/,
// fixed 1728x1117 @2x viewport, colorScheme light). Filename has no role word, so
// it does NOT leak into manager-/auditor-/admin-chromium or the e2e `chromium` project.
//
// Targets are UNAUTHENTICATED, mostly-static pages so the pixel baseline is
// deterministic and independent of seed data or a logged-in session.
//
// Baselines: generated on the canonical CI runner with
//   pnpm exec playwright test --project=visual-chromium --update-snapshots
// (do NOT commit macOS-generated baselines — font/AA rendering differs from the
// ubuntu CI runner and would cause false diffs). See README / Stage 11 notes.

// Only genuinely PUBLIC routes — confirmed NOT in src/middleware.ts PROTECTED_ROUTES.
// (/yee/introduction is protected → redirects unauthenticated visits to /login, so it
// cannot be baselined here; it would need an authenticated visual project + fixed seed.)
const PAGES: { name: string; path: string; ready: RegExp }[] = [
	{ name: "login", path: "/login", ready: /sign in/i },
	{ name: "signup", path: "/signup", ready: /sign up|create|account/i },
	{ name: "forgot-password", path: "/forgot-password", ready: /reset|forgot|email/i }
];

test.describe("@visual static unauthenticated pages", () => {
	for (const { name, path, ready } of PAGES) {
		test(`${name} matches the visual baseline`, async ({ page }) => {
			await page.goto(path);
			// Anchor on stable visible copy before snapshotting so we don't capture
			// a mid-hydration frame.
			await expect(page.getByText(ready).first()).toBeVisible({ timeout: 30_000 });
			await expect(page).toHaveScreenshot(`${name}.png`, {
				fullPage: true,
				animations: "disabled",
				maxDiffPixelRatio: 0.02
			});
		});
	}
});
