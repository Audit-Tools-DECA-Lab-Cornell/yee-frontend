import type { Metadata } from "next";

import { SiteCopyAdminPanel } from "@/components/dashboard/content/site-copy-admin-panel";

export const metadata: Metadata = { title: "Website Copy" };

export default function AdminContentPage() {
	return <SiteCopyAdminPanel />;
}
