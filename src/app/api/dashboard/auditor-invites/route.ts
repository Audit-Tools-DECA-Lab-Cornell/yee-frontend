import { proxyDashboardRequest } from "@/app/api/dashboard/_utils";

export async function POST(request: Request) {
	return proxyDashboardRequest({
		targetPath: "/yee/dashboard/auditor-invites",
		method: "POST",
		body: await request.json(),
		authorization: request.headers.get("authorization")
	});
}
