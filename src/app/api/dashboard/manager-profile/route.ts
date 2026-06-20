import { proxyDashboardRequest } from "@/app/api/dashboard/_utils";

export async function GET(request: Request) {
	return proxyDashboardRequest({
		targetPath: "/yee/dashboard/manager-profile",
		authorization: request.headers.get("authorization")
	});
}

export async function PUT(request: Request) {
	return proxyDashboardRequest({
		targetPath: "/yee/dashboard/manager-profile",
		method: "PUT",
		body: await request.json(),
		authorization: request.headers.get("authorization")
	});
}
