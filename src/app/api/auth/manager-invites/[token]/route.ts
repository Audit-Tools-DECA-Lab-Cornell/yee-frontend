import { proxyPublicRequest } from "@/server/backend/proxy";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
	const { token } = await params;
	return proxyPublicRequest({
		path: `/yee/auth/manager-invites/${encodeURIComponent(token)}`
	});
}
