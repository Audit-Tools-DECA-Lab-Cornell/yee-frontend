import { Badge } from "@/components/ui/badge";
import { getThemeByDomainKey } from "@/features/yee-audit/config/yee-domain-theme";
import { cn } from "@/lib/utils";

import type { AuthoringInstrument } from "./schema";

export function AuditorPreview({ authoring }: { authoring: AuthoringInstrument }) {
	return (
		<div className="mx-auto max-w-3xl space-y-5">
			<div className="rounded-md border border-border bg-muted/50 p-4">
				<p className="text-sm font-semibold text-foreground">Auditor preview</p>
				<p className="text-sm text-muted-foreground">
					Follow-ups are expanded here for review. In an audit, they appear only after a configured answer.
				</p>
			</div>
			{authoring.sections.map(section => {
				const theme = getThemeByDomainKey(section.id);
				return (
					<section key={section.id} className="overflow-hidden rounded-md border border-border bg-card">
						<header className={cn("border-b border-border bg-muted/60 px-5 py-4", theme?.headerClass)}>
							<h2 className="text-xl font-semibold">{section.title}</h2>
							{section.instructions ? (
								<p className="mt-2 text-sm leading-relaxed opacity-85">{section.instructions}</p>
							) : null}
						</header>
						<div className="space-y-5 p-5">
							{section.questions.map((question, index) => (
								<div key={question.id} className="space-y-3 rounded-md border border-border p-4">
									<p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
										Question {index + 1}
									</p>
									<p className="font-medium text-foreground">{question.prompt}</p>
									<div className="grid gap-2 sm:grid-cols-2">
										{question.primary.options.map(option => (
											<div
												key={option.id}
												className="rounded-md border border-border bg-background px-3 py-2 text-sm">
												{option.label}
											</div>
										))}
									</div>
									{question.followUp ? (
										<div className="space-y-3 border-l-2 border-primary/40 pl-4">
											<div className="flex flex-wrap items-center gap-2">
												<Badge variant="secondary">Follow-up</Badge>
												<span className="text-xs text-muted-foreground">
													Shown after:{" "}
													{question.primary.options
														.filter(option =>
															question.followUp?.triggerOptionIds.includes(option.id)
														)
														.map(option => option.label)
														.join(", ") || "No answer configured"}
												</span>
											</div>
											<p className="font-medium text-foreground">{question.followUp.prompt}</p>
											<div className="grid gap-2 sm:grid-cols-3">
												{question.followUp.options.map(option => (
													<div
														key={option.id}
														className="rounded-md border border-border bg-background px-3 py-2 text-sm">
														{option.label}
													</div>
												))}
											</div>
										</div>
									) : null}
								</div>
							))}
						</div>
					</section>
				);
			})}
		</div>
	);
}
