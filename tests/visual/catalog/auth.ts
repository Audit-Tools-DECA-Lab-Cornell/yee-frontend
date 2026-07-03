import type { CaptureTarget } from "./types";

export const authTargets: readonly CaptureTarget[] = [
	{
		segments: ["public", "landing"],
		role: "public",
		route: "/",
		readyText: /Youth Enabling Environments/i,
		states: [{ name: "overview", label: "Public landing page" }]
	},
	{
		segments: ["auth", "login"],
		role: "public",
		route: "/login",
		readyText: /sign in/i,
		states: [{ name: "overview", label: "Login" }]
	},
	{
		segments: ["auth", "signup"],
		role: "public",
		route: "/signup",
		readyText: /Create an organization account/i,
		states: [{ name: "overview", label: "Signup" }]
	},
	{
		segments: ["auth", "forgot-password"],
		role: "public",
		route: "/forgot-password",
		readyText: /forgot your password/i,
		states: [{ name: "overview", label: "Forgot password" }]
	},
	{
		segments: ["auth", "reset-password"],
		role: "public",
		route: "/reset-password",
		readyText: /Set a new password/i,
		states: [{ name: "overview", label: "Reset password" }]
	},
	{
		segments: ["auth", "verify-email"],
		role: "public",
		route: "/verify-email?email=manager-demo%40yee.local",
		readyText: /Check your inbox/i,
		states: [{ name: "overview", label: "Verify email" }]
	}
];
