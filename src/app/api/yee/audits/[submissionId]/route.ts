import type { NextRequest } from "next/server";

import { proxyRequest } from "@/app/api/_lib/backend-proxy";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const { submissionId } = await params;
  return proxyRequest({
    request,
    path: `/yee/audits/${encodeURIComponent(submissionId)}`,
  });
}
