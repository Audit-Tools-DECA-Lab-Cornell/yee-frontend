import { proxyPublicRequest } from "@/app/api/_lib/backend-proxy";

/** The YEE instrument definition is public — no auth required. */
export async function GET() {
  return proxyPublicRequest({ path: "/yee/instrument" });
}
