import { proxyJsonRequest } from "@/app/api/auth/_utils";

export async function POST(request: Request) {
	const frontendOrigin = new URL(request.url).origin;
	return proxyJsonRequest({
		targetPath: "/yee/auth/reset-password",
		method: "POST",
		body: await request.json(),
		headers: {
			"X-Frontend-Origin": frontendOrigin
		}
	});
}
