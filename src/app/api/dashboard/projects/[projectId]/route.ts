import { proxyDashboardRequest } from "@/app/api/dashboard/_utils";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ projectId: string }> }
) {
	const { projectId } = await params;

	return proxyDashboardRequest({
		targetPath: `/yee/dashboard/projects/${projectId}`,
		authorization: request.headers.get("authorization")
	});
}
