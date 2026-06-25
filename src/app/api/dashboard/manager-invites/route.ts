import type { NextRequest } from "next/server";

import { proxyRequest } from "@/app/api/_lib/backend-proxy";

export async function GET(request: NextRequest) {
  return proxyRequest({ request, path: "/yee/dashboard/manager-invites" });
}

export async function POST(request: NextRequest) {
  const frontendOrigin = new URL(request.url).origin;
  return proxyRequest({
    request,
    path: "/yee/dashboard/manager-invites",
    method: "POST",
    body: await request.json(),
    additionalHeaders: { "X-Frontend-Origin": frontendOrigin },
  });
}
