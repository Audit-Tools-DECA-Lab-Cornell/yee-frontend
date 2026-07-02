import { proxyPublicRequest } from "@/server/backend/proxy";

export async function POST(request: Request) {
	return proxyPublicRequest({
		path: "/yee/auth/resend-verification",
		method: "POST",
		body: await request.json()
	});
}
