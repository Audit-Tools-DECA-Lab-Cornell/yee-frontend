import { proxyDashboardRequest } from "@/app/api/dashboard/_utils";

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ instrumentId: string }> }
) {
	const { instrumentId } = await params;
	return proxyDashboardRequest({
		targetPath: `/yee/admin/instruments/${instrumentId}`,
		method: "PATCH",
		body: await request.json(),
		authorization: request.headers.get("authorization")
	});
}
