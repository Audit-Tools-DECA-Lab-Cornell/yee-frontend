import { proxyJsonRequest } from "@/app/api/auth/_utils";

export async function GET(request: Request) {
	return proxyJsonRequest({
		targetPath: "/yee/auth/me",
		authorization: request.headers.get("authorization")
	});
}
