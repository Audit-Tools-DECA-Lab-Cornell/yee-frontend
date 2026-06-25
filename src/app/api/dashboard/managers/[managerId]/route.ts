import type { NextRequest } from "next/server";

import { proxyRequest } from "@/app/api/_lib/backend-proxy";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ managerId: string }> }) {
	const { managerId } = await params;
	return proxyRequest({
		request,
		path: `/yee/dashboard/managers/${encodeURIComponent(managerId)}`,
		method: "DELETE"
	});
}
