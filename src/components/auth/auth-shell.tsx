import type { ReactNode } from "react";

import { BrandLogo } from "@/components/brand/brand-logo";

type AuthShellProps = {
	eyebrow?: string;
	title?: string;
	description?: string;
	children: ReactNode;
};

export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
	return (
		<div className="min-h-dvh bg-background">
			<div className="mx-auto grid min-h-dvh max-w-6xl lg:grid-cols-[minmax(0,1fr)_minmax(440px,520px)]">
				{/* Brand panel — hidden on small screens */}
				<section
					className="hidden flex-col justify-between border-r border-white/10 px-10 py-12 lg:flex"
					style={{ background: "var(--sidebar)" }}
					aria-label="YEE Audit Tools product overview">
					<div className="space-y-10">
						<BrandLogo variant="horizontalSubtitle" tone="dark" className="max-w-[340px]" priority />

						<div className="max-w-md space-y-4">
							<p
								className="text-xs uppercase tracking-[0.28em]"
								style={{ color: "oklch(0.95 0.006 158 / 0.58)" }}>
								Field research platform
							</p>
							<h1
								className="text-3xl font-semibold leading-tight tracking-tight"
								style={{ color: "var(--sidebar-foreground)" }}>
								Youth Enabling Environment research, structured and accessible.
							</h1>
							<p className="text-sm leading-relaxed" style={{ color: "oklch(0.95 0.006 158 / 0.68)" }}>
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
								Assigned places, structured audit forms, and full submission history.
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
								Projects, places, auditor oversight, and reporting in one workspace.
							</p>
						</div>
					</div>
				</section>

				{/* Form panel */}
				<section className="flex min-h-dvh items-center justify-center bg-[radial-gradient(circle_at_top,oklch(0.98_0.01_158)_0,oklch(0.97_0.004_240)_40%,oklch(0.965_0.003_240)_100%)] px-4 py-12 sm:px-8">
					<div className="w-full max-w-md">
						<div className="mb-6 flex items-center justify-center lg:justify-start">
							<div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-(--shadow-card)">
								<BrandLogo variant="mark" tone="light" className="h-10 w-10 shrink-0" priority />
								<div className="min-w-0">
									<p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
										YEE Audit Tools
									</p>
									<p className="text-sm font-medium tracking-tight text-foreground">
										Youth Enabling Environments
									</p>
								</div>
							</div>
						</div>

						<div className="rounded-lg border border-border bg-card p-8 shadow-(--shadow-panel)">
							<div className="space-y-3">
								{eyebrow ? (
									<p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
										{eyebrow}
									</p>
								) : null}
								{title ? <h1 className="text-2xl font-semibold tracking-tight">{title}</h1> : null}
								{description ? (
									<p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
								) : null}
							</div>

							<div className={title || description || eyebrow ? "mt-6" : ""}>{children}</div>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}
