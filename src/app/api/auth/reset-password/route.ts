import { proxyPublicRequest } from "@/server/proxy";

export async function POST(request: Request) {
	return proxyPublicRequest({
		path: "/yee/auth/reset-password",
		method: "POST",
		body: await request.json()
	});
}
