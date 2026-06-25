import type { NextRequest } from "next/server";

import { proxyRequest } from "@/app/api/_lib/backend-proxy";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ copyId: string }> }
) {
  const { copyId } = await params;
  return proxyRequest({
    request,
    path: `/yee/admin/site-copy/${encodeURIComponent(copyId)}`,
    method: "PATCH",
    body: await request.json(),
  });
}
