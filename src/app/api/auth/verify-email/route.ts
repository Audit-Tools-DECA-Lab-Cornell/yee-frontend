import { proxyPublicRequest } from "@/app/api/_lib/backend-proxy";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const token = searchParams.get("token") ?? "";
	return proxyPublicRequest({
		path: `/yee/auth/verify-email?token=${encodeURIComponent(token)}`
	});
}
