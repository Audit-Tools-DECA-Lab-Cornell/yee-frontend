import { proxyDashboardRequest } from "@/app/api/dashboard/_utils";

export async function GET(request: Request) {
	return proxyDashboardRequest({
		targetPath: "/yee/admin/site-copy",
		authorization: request.headers.get("authorization")
	});
}

export async function POST(request: Request) {
	const url = new URL(request.url);
	const activate = url.searchParams.get("activate") ?? "true";
	return proxyDashboardRequest({
		targetPath: `/yee/admin/site-copy?activate=${encodeURIComponent(activate)}`,
		method: "POST",
		body: await request.json(),
		authorization: request.headers.get("authorization")
	});
}
