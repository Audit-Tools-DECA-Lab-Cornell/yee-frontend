import type { NextRequest } from "next/server";

import { proxyRequest } from "@/app/api/_lib/backend-proxy";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const instrumentKey = searchParams.get("instrument_key") ?? "yee";
  return proxyRequest({
    request,
    path: `/yee/admin/instruments?instrument_key=${encodeURIComponent(instrumentKey)}`,
  });
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const activate = searchParams.get("activate") ?? "true";
  return proxyRequest({
    request,
    path: `/yee/admin/instruments?activate=${encodeURIComponent(activate)}`,
    method: "POST",
    body: await request.json(),
  });
}
