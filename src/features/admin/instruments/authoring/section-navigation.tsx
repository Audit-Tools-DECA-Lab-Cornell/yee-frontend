"use client";

import { getThemeByDomainKey } from "@/features/yee-audit/config/yee-domain-theme";
import { cn } from "@/lib/utils";

import type { AuthoringSection } from "./schema";

export function SectionNavigation({
	sections,
	selectedId,
	onSelect
}: {
	sections: AuthoringSection[];
	selectedId: string;
	onSelect: (id: string) => void;
}) {
	return (
		<nav aria-label="Instrument sections" className="space-y-1">
			<p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
				Sections
			</p>
			{sections.map(section => {
				const theme = getThemeByDomainKey(section.id);
				const selected = section.id === selectedId;
				return (
					<button
						key={section.id}
						type="button"
						onClick={() => onSelect(section.id)}
						className={cn(
							"flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
							selected
								? "bg-accent font-semibold text-accent-foreground"
								: "text-muted-foreground hover:bg-muted hover:text-foreground"
						)}>
						<span
							className={cn("size-2.5 rounded-full bg-muted-foreground", theme?.fillClass)}
							aria-hidden="true"
						/>
						<span className="min-w-0 flex-1 truncate">{section.title || "Untitled section"}</span>
						<span className="tabular-nums text-xs">{section.questions.length}</span>
					</button>
				);
			})}
		</nav>
	);
}
