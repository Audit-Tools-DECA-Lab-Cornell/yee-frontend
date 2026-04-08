import { proxyJsonRequest } from "@/app/api/auth/_utils";

export async function POST(request: Request) {
	return proxyJsonRequest({
		targetPath: "/yee/auth/complete-profile",
		method: "POST",
		body: await request.json(),
		authorization: request.headers.get("authorization")
	});
}
