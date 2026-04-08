import { proxyJsonRequest } from "@/app/api/auth/_utils";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
	const { token } = await params;
	return proxyJsonRequest({
		targetPath: `/yee/auth/invite/${encodeURIComponent(token)}/accept`,
		method: "POST",
		body: await request.json()
	});
}
