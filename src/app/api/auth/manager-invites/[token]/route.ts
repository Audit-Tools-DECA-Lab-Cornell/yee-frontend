import { proxyJsonRequest } from "@/app/api/auth/_utils";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
	const { token } = await params;
	return proxyJsonRequest({
		targetPath: `/yee/auth/manager-invites/${encodeURIComponent(token)}`
	});
}
