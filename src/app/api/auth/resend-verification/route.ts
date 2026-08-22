import { proxyPublicRequest } from "@/server/proxy";

export async function POST(request: Request) {
	return proxyPublicRequest({
		path: "/yee/auth/resend-verification",
		method: "POST",
		body: await request.json()
	});
}
