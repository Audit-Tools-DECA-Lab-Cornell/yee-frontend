import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PlaceholderAction = {
	label: string;
	href: string;
	variant?: "default" | "outline";
};

export function PlaceholderPage({
	title,
	description,
	body,
	actions = []
}: {
	title: string;
	description: string;
	body: ReactNode;
	actions?: PlaceholderAction[];
}) {
	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle className="text-2xl">{title}</CardTitle>
				<CardDescription className="max-w-3xl leading-6">{description}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-5">
				<div className="text-sm leading-7 text-slate-600">{body}</div>
				{actions.length > 0 ? (
					<div className="flex flex-wrap gap-3">
						{actions.map(action => (
							<Button
								key={`${action.href}-${action.label}`}
								asChild
								variant={action.variant === "outline" ? "outline" : "default"}
								className={
									action.variant === "outline"
										? "rounded-2xl"
										: "rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]"
								}>
								<Link href={action.href}>{action.label}</Link>
							</Button>
						))}
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}
