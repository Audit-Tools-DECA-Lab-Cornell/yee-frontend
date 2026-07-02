import { proxyPublicRequest } from "@/server/backend/proxy";

export async function POST(request: Request) {
	return proxyPublicRequest({
		path: "/yee/auth/forgot-password",
		method: "POST",
		body: await request.json()
	});
}
