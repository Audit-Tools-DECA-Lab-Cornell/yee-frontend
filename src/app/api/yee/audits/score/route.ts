import { proxyPublicRequest } from "@/app/api/_lib/backend-proxy";

/** Score calculation is unauthenticated — the backend validates the payload structure, not identity. */
export async function POST(request: Request) {
	return proxyPublicRequest({
		path: "/yee/audits/score",
		method: "POST",
		body: await request.json()
	});
}
