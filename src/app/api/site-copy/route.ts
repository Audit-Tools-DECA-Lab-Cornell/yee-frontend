import { proxyPublicRequest } from "@/app/api/_lib/backend-proxy";

/** Site copy is publicly readable — no auth required. */
export async function GET() {
	return proxyPublicRequest({ path: "/yee/site-copy" });
}
