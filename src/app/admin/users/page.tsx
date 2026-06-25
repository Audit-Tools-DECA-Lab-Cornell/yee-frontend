import type { Metadata } from "next";

import { LiveUsersTable } from "@/components/dashboard/live-dashboard";

export const metadata: Metadata = { title: "Users" };

export default function AdminUsersPage() {
	return <LiveUsersTable />;
}
