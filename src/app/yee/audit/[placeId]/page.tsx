import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { YeeAuditForm } from "@/components/yee/yee-audit-form";
import { Button } from "@/components/ui/button";

export default async function YeeAuditPage({
	params
}: {
	params: Promise<{ placeId: string }>;
}) {
	const { placeId } = await params;

	return (
		<div className="min-h-screen bg-[#f6f3ea] py-6">
			<div className="mx-auto flex max-w-5xl items-center justify-between px-6">
				<Button asChild variant="outline" className="rounded-2xl">
					<Link href="/dashboard/audits">
						<ArrowLeft className="size-4" />
						Back to dashboard
					</Link>
				</Button>
			</div>
			<YeeAuditForm placeId={placeId} />
		</div>
	);
}
