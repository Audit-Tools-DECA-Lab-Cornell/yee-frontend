export const E2E_PASSWORD = process.env.E2E_PASSWORD ?? "DemoPass123!";

export const e2eUsers = {
	admin: {
		email: process.env.E2E_ADMIN_EMAIL ?? "admin-demo@yee.local",
		password: process.env.E2E_ADMIN_PASSWORD ?? E2E_PASSWORD
	},
	manager: {
		email: process.env.E2E_MANAGER_EMAIL ?? "manager-demo@yee.local",
		password: process.env.E2E_MANAGER_PASSWORD ?? E2E_PASSWORD
	},
	auditor: {
		email: process.env.E2E_AUDITOR_EMAIL ?? "auditor-demo-1@yee.local",
		password: process.env.E2E_AUDITOR_PASSWORD ?? E2E_PASSWORD
	}
} as const;

export type E2ERole = keyof typeof e2eUsers;
