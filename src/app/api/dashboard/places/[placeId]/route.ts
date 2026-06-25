import type { NextRequest } from "next/server";

import { proxyRequest } from "@/app/api/_lib/backend-proxy";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const { placeId } = await params;
  return proxyRequest({
    request,
    path: `/yee/dashboard/places/${encodeURIComponent(placeId)}`,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const { placeId } = await params;
  return proxyRequest({
    request,
    path: `/yee/dashboard/places/${encodeURIComponent(placeId)}`,
    method: "PATCH",
    body: await request.json(),
  });
}
