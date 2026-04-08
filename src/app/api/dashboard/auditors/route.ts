import { proxyDashboardRequest } from "@/app/api/dashboard/_utils";

export async function GET(request: Request) {
	return proxyDashboardRequest({
		targetPath: "/yee/dashboard/auditors",
		authorization: request.headers.get("authorization")
	});
}
