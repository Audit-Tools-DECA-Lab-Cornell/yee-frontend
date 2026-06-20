import { proxyDashboardRequest } from "@/app/api/dashboard/_utils";

export async function DELETE(
	request: Request,
	context: { params: Promise<{ managerId: string }> }
) {
	const { managerId } = await context.params;
	return proxyDashboardRequest({
		targetPath: `/yee/dashboard/managers/${managerId}`,
		method: "DELETE",
		authorization: request.headers.get("authorization")
	});
}
