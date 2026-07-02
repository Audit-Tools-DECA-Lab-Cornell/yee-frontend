import { proxyPublicRequest } from "@/server/backend/proxy";

export async function POST(request: Request) {
	const frontendOrigin = new URL(request.url).origin;
	return proxyPublicRequest({
		path: "/yee/auth/signup",
		method: "POST",
		body: await request.json(),
		additionalHeaders: { "X-Frontend-Origin": frontendOrigin }
	});
}
