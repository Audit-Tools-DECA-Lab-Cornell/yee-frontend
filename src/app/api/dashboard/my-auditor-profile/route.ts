import { proxyDashboardRequest } from "@/app/api/dashboard/_utils";

export async function POST(request: Request) {
	return proxyDashboardRequest({
		targetPath: "/yee/dashboard/my-auditor-profile",
		method: "POST",
		authorization: request.headers.get("authorization")
	});
}
