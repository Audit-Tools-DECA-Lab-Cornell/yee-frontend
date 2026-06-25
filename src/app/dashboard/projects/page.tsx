import type { Metadata } from "next";

import { LiveProjectsTable } from "@/components/dashboard/live-dashboard";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return <LiveProjectsTable />;
}
