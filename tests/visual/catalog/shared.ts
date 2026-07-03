import { openDashboardMenu } from "./steps";
import type { CaptureState } from "./types";

export const dashboardChromeStates: readonly CaptureState[] = [
	{
		name: "mobile-nav-open",
		label: "Mobile navigation open",
		optional: true,
		setup: ({ page }) => openDashboardMenu(page)
	}
];
