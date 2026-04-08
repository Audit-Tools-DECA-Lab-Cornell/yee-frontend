import { proxyDashboardRequest } from "@/app/api/dashboard/_utils";

export async function GET(request: Request) {
	return proxyDashboardRequest({
		targetPath: "/yee/dashboard/users",
		authorization: request.headers.get("authorization")
	});
}

export async function POST(request: Request) {
	return proxyDashboardRequest({
		targetPath: "/yee/dashboard/users/approve",
		method: "POST",
		body: await request.json(),
		authorization: request.headers.get("authorization")
	});
}
