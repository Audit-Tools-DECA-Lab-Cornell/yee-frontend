import { proxyJsonRequest } from "@/app/api/auth/_utils";

export async function POST(request: Request) {
	return proxyJsonRequest({
		targetPath: "/yee/auth/signup",
		method: "POST",
		body: await request.json()
	});
}
