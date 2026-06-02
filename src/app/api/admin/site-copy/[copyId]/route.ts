import { proxyDashboardRequest } from "@/app/api/dashboard/_utils";

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ copyId: string }> }
) {
	const { copyId } = await params;
	return proxyDashboardRequest({
		targetPath: `/yee/admin/site-copy/${copyId}`,
		method: "PATCH",
		body: await request.json(),
		authorization: request.headers.get("authorization")
	});
}
