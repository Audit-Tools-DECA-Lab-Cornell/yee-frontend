import type { Metadata } from "next";

import { LiveProjectsTable } from "@/features/manager/components/live-dashboard";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
	return <LiveProjectsTable />;
}
