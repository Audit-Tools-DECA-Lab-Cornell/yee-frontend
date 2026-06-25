import { proxyPublicRequest } from "@/app/api/_lib/backend-proxy";

export async function POST(request: Request) {
	return proxyPublicRequest({
		path: "/yee/auth/forgot-password",
		method: "POST",
		body: await request.json()
	});
}
