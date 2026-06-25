import type { NextRequest } from "next/server";

import { proxyRequest } from "@/app/api/_lib/backend-proxy";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ instrumentId: string }> }
) {
  const { instrumentId } = await params;
  return proxyRequest({
    request,
    path: `/yee/admin/instruments/${encodeURIComponent(instrumentId)}`,
    method: "PATCH",
    body: await request.json(),
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ instrumentId: string }> }
) {
  const { instrumentId } = await params;
  return proxyRequest({
    request,
    path: `/yee/admin/instruments/${encodeURIComponent(instrumentId)}`,
    method: "DELETE",
  });
}
