import type { Page } from "@playwright/test";

import type { E2ERole } from "../../fixtures/users";

export type CaptureRole = E2ERole | "public";

export interface CaptureContext {
	readonly page: Page;
}

export interface CaptureState {
	readonly name: string;
	readonly label: string;
	readonly setup?: (ctx: CaptureContext) => Promise<void>;
	readonly optional?: boolean;
}

export interface CaptureTarget {
	readonly segments: readonly string[];
	readonly role: CaptureRole;
	readonly route: string;
	readonly readyText?: RegExp | string;
	readonly states: readonly CaptureState[];
}
