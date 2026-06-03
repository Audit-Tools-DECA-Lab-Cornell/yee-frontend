import { proxyDashboardRequest } from "@/app/api/dashboard/_utils";

export async function GET(request: Request) {
	const url = new URL(request.url);
	const instrumentKey = url.searchParams.get("instrument_key") ?? "yee";
	return proxyDashboardRequest({
		targetPath: `/yee/admin/instruments?instrument_key=${encodeURIComponent(instrumentKey)}`,
		authorization: request.headers.get("authorization")
	});
}

export async function POST(request: Request) {
	const url = new URL(request.url);
	const activate = url.searchParams.get("activate") ?? "true";
	return proxyDashboardRequest({
		targetPath: `/yee/admin/instruments?activate=${encodeURIComponent(activate)}`,
		method: "POST",
		body: await request.json(),
		authorization: request.headers.get("authorization")
	});
}
