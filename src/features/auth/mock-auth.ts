import { api } from "@/lib/api/api-client";
import type { UserRole } from "@/types/auth";
export type { UserRole } from "@/types/auth";

export type MockUserState = {
	role: UserRole;
	approved: boolean;
	profileComplete: boolean;
	redirectTo: string;
	label: string;
	description: string;
};

export const mockUserStates: MockUserState[] = [
	{
		role: "ADMIN",
		approved: true,
		profileComplete: true,
		redirectTo: "/admin",
		label: "Admin demo",
		description: "Admin gets full platform access and a system-wide overview."
	},
	{
		role: "MANAGER",
		approved: true,
		profileComplete: true,
		redirectTo: "/manager",
		label: "Manager demo",
		description: "Manager lands directly in the dashboard."
	},
	{
		role: "AUDITOR",
		approved: false,
		profileComplete: false,
		redirectTo: "/waiting-approval",
		label: "Auditor awaiting approval",
		description: "New auditor has signed up but cannot access fieldwork yet."
	},
	{
		role: "AUDITOR",
		approved: true,
		profileComplete: false,
		redirectTo: "/complete-profile",
		label: "Approved auditor, profile incomplete",
		description: "Auditor is approved and now needs onboarding details."
	},
	{
		role: "AUDITOR",
		approved: true,
		profileComplete: true,
		redirectTo: "/auditor",
		label: "Active auditor",
		description: "Auditor can view the dashboard and start assigned audits."
	}
];

export type LoginPayload = {
	email: string;
	password: string;
};

export type SignupPayload = {
	name: string;
	email: string;
	password: string;
	role: UserRole;
};

export async function login(payload: LoginPayload) {
	return api.post("/auth/login", payload);
}

export async function signup(payload: SignupPayload) {
	return api.post("/auth/signup", payload);
}

export async function getCurrentUser() {
	return api.get("/auth/me");
}

export function getMockRedirect(state: MockUserState) {
	if (!state.approved) return "/waiting-approval";
	if (!state.profileComplete) return `/complete-profile?role=${state.role}`;
	return state.redirectTo;
}
