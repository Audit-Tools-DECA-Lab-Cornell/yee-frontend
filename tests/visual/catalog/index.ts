import { adminTargets } from "./admin";
import { auditorTargets } from "./auditor";
import { authTargets } from "./auth";
import { managerTargets } from "./manager";
import type { CaptureTarget } from "./types";
import { yeeTargets } from "./yee";

export const captureCatalog = [
	...authTargets,
	...managerTargets,
	...adminTargets,
	...auditorTargets,
	...yeeTargets
] satisfies readonly CaptureTarget[];

export type { CaptureState, CaptureTarget } from "./types";
