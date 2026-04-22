import { proxyDashboardRequest } from "@/app/api/dashboard/_utils";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ placeId: string }> }
) {
	const { placeId } = await params;

	return proxyDashboardRequest({
		targetPath: `/yee/dashboard/places/${placeId}`,
		authorization: request.headers.get("authorization")
	});
}

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ placeId: string }> }
) {
	const { placeId } = await params;

	return proxyDashboardRequest({
		targetPath: `/yee/dashboard/places/${placeId}`,
		method: "PATCH",
		body: await request.json(),
		authorization: request.headers.get("authorization")
	});
}
