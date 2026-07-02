import type { Metadata } from "next";

import { SiteCopyAdminPanel } from "@/features/admin/components/site-copy-admin-panel";

export const metadata: Metadata = { title: "Website Copy" };

export default function AdminContentPage() {
	return <SiteCopyAdminPanel />;
}
