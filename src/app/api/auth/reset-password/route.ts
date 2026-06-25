import { proxyPublicRequest } from "@/app/api/_lib/backend-proxy";

export async function POST(request: Request) {
	return proxyPublicRequest({
		path: "/yee/auth/reset-password",
		method: "POST",
		body: await request.json()
	});
}
