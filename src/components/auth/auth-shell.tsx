import type { ReactNode } from "react";

type AuthShellProps = {
	eyebrow?: string;
	title?: string;
	description?: string;
	children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
	return (
		<div className="min-h-screen bg-background">
			<div className="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-[420px_minmax(0,1fr)]">
				{/* Brand panel — hidden on small screens */}
				<section
					className="hidden lg:flex flex-col justify-between px-10 py-12"
					style={{ background: "var(--sidebar)" }}
					aria-label="YEE Audit Tools product overview">
					{/* Logo / wordmark area */}
					<div>
						<div className="flex items-center gap-2.5">
							<span
								className="flex size-8 items-center justify-center rounded-md text-xs font-bold"
								style={{
									background: "var(--sidebar-primary)",
									color: "var(--sidebar-primary-foreground)"
								}}
								aria-hidden="true">
								YEE
							</span>
							<span
								className="text-sm font-semibold tracking-tight"
								style={{ color: "var(--sidebar-foreground)" }}>
								Audit Tools
							</span>
						</div>

						<div className="mt-10 max-w-xs">
							<h1
								className="text-2xl font-semibold leading-snug tracking-tight"
								style={{ color: "var(--sidebar-foreground)" }}>
								Youth Enabling Environment research, structured and accessible.
							</h1>
							<p
								className="mt-4 text-sm leading-relaxed"
								style={{ color: "oklch(0.95 0.006 158 / 0.65)" }}>
								A digital platform for conducting and managing YEE space audits. Built for research
								teams who need reliability in the field.
							</p>
						</div>
					</div>

					{/* Proof points */}
					<div className="space-y-3">
						<div
							className="rounded-lg border p-4"
							style={{
								borderColor: "var(--sidebar-border)",
								background: "oklch(1 0 0 / 0.05)"
							}}>
							<p className="text-xs font-medium" style={{ color: "oklch(0.95 0.006 158 / 0.55)" }}>
								For auditors
							</p>
							<p
								className="mt-1.5 text-sm font-medium leading-snug"
								style={{ color: "var(--sidebar-foreground)" }}>
								Assigned places, structured audit form, and full submission history.
							</p>
						</div>
						<div
							className="rounded-lg border p-4"
							style={{
								borderColor: "var(--sidebar-border)",
								background: "oklch(1 0 0 / 0.05)"
							}}>
							<p className="text-xs font-medium" style={{ color: "oklch(0.95 0.006 158 / 0.55)" }}>
								For managers
							</p>
							<p
								className="mt-1.5 text-sm font-medium leading-snug"
								style={{ color: "var(--sidebar-foreground)" }}>
								Projects, places, auditor oversight, and research reporting — in one workspace.
							</p>
						</div>
					</div>
				</section>

				{/* Form panel */}
				<section className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-8">
					<div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-[var(--shadow-panel)]">
						{children}
					</div>
				</section>
			</div>
		</div>
	);
}
