import { proxyPublicRequest } from "@/server/proxy";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const token = searchParams.get("token") ?? "";
	return proxyPublicRequest({
		path: `/yee/auth/verify-email?token=${encodeURIComponent(token)}`
	});
}
