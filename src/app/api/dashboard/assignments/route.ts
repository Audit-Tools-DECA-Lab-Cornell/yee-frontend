import { proxyDashboardRequest } from "@/app/api/dashboard/_utils";

export async function POST(request: Request) {
	return proxyDashboardRequest({
		targetPath: "/yee/dashboard/assignments",
		method: "POST",
		body: await request.json(),
		authorization: request.headers.get("authorization")
	});
}
