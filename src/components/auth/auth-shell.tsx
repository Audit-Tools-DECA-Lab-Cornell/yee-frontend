import type { ReactNode } from "react";

export function AuthShell({
	eyebrow,
	title,
	description,
	children
}: {
	eyebrow: string;
	title: string;
	description: string;
	children: ReactNode;
}) {
	return (
		<div className="min-h-screen bg-[#f6f3ea] px-4 py-8 sm:px-6 lg:px-8">
			<div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_460px]">
				<section className="relative overflow-hidden rounded-[2rem] bg-linear-to-br from-[#10231f] via-[#17302c] to-[#21483b] px-8 py-10 text-white shadow-xl shadow-emerald-950/10">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_28%)]" />
					<div className="relative z-10 flex h-full flex-col justify-between">
						<div>
							<p className="text-xs font-medium uppercase tracking-[0.28em] text-emerald-100/80">{eyebrow}</p>
							<h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
								{title}
							</h1>
							<p className="mt-4 max-w-lg text-base leading-8 text-emerald-50/78">{description}</p>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<div className="rounded-3xl border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
								<p className="text-sm text-emerald-50/70">For auditors</p>
								<p className="mt-2 text-lg font-semibold">Assigned places, audit history, and start-audit access.</p>
							</div>
							<div className="rounded-3xl border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
								<p className="text-sm text-emerald-50/70">For managers</p>
								<p className="mt-2 text-lg font-semibold">Projects, places, auditors, and workspace oversight in one app.</p>
							</div>
						</div>
					</div>
				</section>

				<section className="flex items-center">
					<div className="w-full rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">{children}</div>
				</section>
			</div>
		</div>
	);
}
