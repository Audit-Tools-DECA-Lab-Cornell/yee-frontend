import type { NextRequest } from "next/server";

import { proxyRequest } from "@/app/api/_lib/backend-proxy";

export async function GET(request: NextRequest) {
  return proxyRequest({ request, path: "/yee/auth/me" });
}
