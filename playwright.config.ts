import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL || "http://localhost:3000";
const parsedBaseUrl = new URL(baseURL);
const isLocalBaseUrl = ["localhost", "127.0.0.1"].includes(parsedBaseUrl.hostname);
const localPort = parsedBaseUrl.port || (parsedBaseUrl.protocol === "https:" ? "443" : "80");

export default defineConfig({
	testDir: "./tests/",
	timeout: 60_000,
	expect: { timeout: 60_000 },
	fullyParallel: false,
	retries: 1,
	use: {
		baseURL,
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
		video: "retain-on-failure",
		actionTimeout: 60_000,
		navigationTimeout: 60_000
	},
	projects: [
		{
			name: "chromium",
			testMatch: /.*tests\/e2e\/.*\.spec\.ts/,
			testIgnore: /.*tests\/e2e\/(manager|auditor|admin)-.*\.spec\.ts/,
			use: { ...devices["Desktop Chrome"] }
		},
		{ name: "manager-chromium", testMatch: /.*manager.*\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
		{ name: "auditor-chromium", testMatch: /.*auditor.*\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
		{ name: "admin-chromium", testMatch: /.*admin.*\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
		{
			name: "visual-chromium",
			testMatch: /.*visual\/.*\.spec\.ts/,
			use: {
				...devices["Desktop Chrome"],
				colorScheme: "light",
				// MacBook Pro 16" default scaled resolution rendered at 2x for Retina-accurate PNGs.
				viewport: {
					width: 1728,
					height: 1117
				},
				deviceScaleFactor: 2
			}
		}
	],
	webServer: isLocalBaseUrl
		? {
				command: `pnpm exec next dev --hostname 127.0.0.1 --port ${localPort}`,
				url: baseURL,
				reuseExistingServer: true,
				timeout: 120_000,
				env: {
					BACKEND_API_URL: process.env.E2E_API_BASE_URL || "http://127.0.0.1:8000"
				}
			}
		: undefined
});
