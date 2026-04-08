import { proxyJsonRequest } from "@/app/api/auth/_utils";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const token = searchParams.get("token") || "";
	return proxyJsonRequest({
		targetPath: `/yee/auth/verify-email?token=${encodeURIComponent(token)}`
	});
}
