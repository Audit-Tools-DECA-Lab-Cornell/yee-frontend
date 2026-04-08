import { proxyDashboardRequest } from "@/app/api/dashboard/_utils";

export async function GET(request: Request) {
	return proxyDashboardRequest({
		targetPath: "/yee/dashboard/reports/place-comparisons",
		authorization: request.headers.get("authorization")
	});
}
