import { Badge } from "@/components/ui/badge";

import type { AuthoringInstrument } from "./schema";

export function SurveyMap({ authoring }: { authoring: AuthoringInstrument }) {
	return (
		<div className="overflow-hidden rounded-md border border-border bg-card">
			<div className="border-b border-border px-5 py-4">
				<h2 className="text-lg font-semibold text-foreground">Survey map</h2>
				<p className="text-sm text-muted-foreground">
					A compact read-only map of the logical questions auditors answer.
				</p>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full min-w-[760px] text-left text-sm">
					<thead className="bg-muted/60 text-xs uppercase tracking-[0.08em] text-muted-foreground">
						<tr>
							<th className="px-4 py-3 font-semibold">Section</th>
							<th className="px-4 py-3 font-semibold">Question</th>
							<th className="px-4 py-3 font-semibold">Primary answers</th>
							<th className="px-4 py-3 font-semibold">Follow-up</th>
							<th className="px-4 py-3 font-semibold">Binding</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-border">
						{authoring.sections.flatMap(section =>
							section.questions.map((question, index) => (
								<tr key={question.id} className="align-top">
									<td className="px-4 py-4 font-medium text-foreground">
										{index === 0 ? section.title : ""}
									</td>
									<td className="max-w-md px-4 py-4">
										<p className="font-medium text-foreground">{question.prompt}</p>
										<code className="mt-1 block text-xs text-muted-foreground">{question.id}</code>
									</td>
									<td className="px-4 py-4 text-muted-foreground">
										{question.primary.options.map(option => option.label).join(" · ")}
									</td>
									<td className="px-4 py-4">
										{question.followUp ? (
											<div className="space-y-1">
												<Badge variant="secondary">Conditional</Badge>
												<p className="max-w-xs text-muted-foreground">
													{question.followUp.prompt}
												</p>
											</div>
										) : (
											<span className="text-muted-foreground">None</span>
										)}
									</td>
									<td className="px-4 py-4">
										<Badge variant={question.responseBinding ? "outline" : "warning"}>
											{question.responseBinding ? "Existing" : "New"}
										</Badge>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
