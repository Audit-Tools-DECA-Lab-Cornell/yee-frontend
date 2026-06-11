import { proxyDashboardRequest } from "@/app/api/dashboard/_utils";

export async function GET(request: Request) {
	return proxyDashboardRequest({
		targetPath: "/yee/dashboard/manager-invites",
		authorization: request.headers.get("authorization")
	});
}

export async function POST(request: Request) {
	const frontendOrigin = new URL(request.url).origin;
	return proxyDashboardRequest({
		targetPath: "/yee/dashboard/manager-invites",
		method: "POST",
		body: await request.json(),
		authorization: request.headers.get("authorization"),
		headers: {
			"X-Frontend-Origin": frontendOrigin
		}
	});
}
