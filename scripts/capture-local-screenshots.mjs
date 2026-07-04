#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";

const STRUCTURED_AREAS = ["public", "auth", "admin", "manager", "auditor", "yee"];

for (const area of STRUCTURED_AREAS) {
	rmSync(path.join(process.cwd(), "public", "screenshots", area), {
		recursive: true,
		force: true
	});
}
//
const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const buildArgs = ["build"];
const args = ["exec", "playwright", "test", "--project=screenshots-chromium", "--workers=1"];
const env = {
	...process.env,
	CAPTURE_LOCAL_SCREENSHOTS: "1",
	E2E_BASE_URL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000",
	E2E_USE_NEXT_START: "1"
};

console.log("Building YEE frontend for screenshot capture...");
const buildResult = spawnSync(command, buildArgs, {
	cwd: process.cwd(),
	env,
	stdio: "inherit"
});

if (buildResult.error) {
	console.error(buildResult.error.message);
	process.exit(1);
}

if ((buildResult.status ?? 1) !== 0) {
	process.exit(buildResult.status ?? 1);
}

console.log("Capturing curated YEE web screenshots via Playwright...");
console.log(`Base URL: ${env.E2E_BASE_URL}`);

const result = spawnSync(command, args, {
	cwd: process.cwd(),
	env,
	stdio: "inherit"
});

if (result.error) {
	console.error(result.error.message);
	process.exit(1);
}

process.exit(result.status ?? 1);
