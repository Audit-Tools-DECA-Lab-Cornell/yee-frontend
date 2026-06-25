"use client";
import Image from "next/image";
import Link from "next/link";
import {
	MapPin,
	Users,
	ClipboardList,
	BarChart3,
	Download,
	ArrowRight,
	CheckCircle2,
	Dumbbell,
	Droplets,
	Heart,
	Sparkles,
	Activity,
	FileBarChart,
	Eye,
	Star,
	GitCompare,
	Printer,
	FileSpreadsheet
} from "lucide-react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/* ─────────────────────────────────────────────────────────────────────────────
   Palette helpers - landing uses warm cream surfaces, distinct from app interior
───────────────────────────────────────────────────────────────────────────── */

/** Warm cream page background - warmer than the app's cool-tinted white. */
const CREAM = "oklch(0.975 0.012 80)";
/** Slightly deeper cream for alternate sections. */
const CREAM_ALT = "oklch(0.96 0.014 80)";

/* ─────────────────────────────────────────────────────────────────────────────
   Navigation - warm cream bar, charcoal type, brand-colored logo
───────────────────────────────────────────────────────────────────────────── */

function LandingNav() {
	return (
		<header
			className="sticky top-0 z-50 border-b"
			style={{ background: CREAM, borderColor: "oklch(0 0 0 / 0.08)" }}>
			<nav
				className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8"
				aria-label="Main navigation">
				{/* Brand */}
				<Link href="/" aria-label="YEE - Youth Enabling Environments, go to home">
					<BrandLogo variant="horizontalSubtitle" tone="light" className="h-9 w-auto" priority />
				</Link>

				{/* Anchor links */}
				<div className="hidden items-center gap-1 lg:flex" role="list">
					{[
						{ href: "#platform", label: "The Platform" },
						{ href: "#how", label: "How It Works" },
						{ href: "#domains", label: "Domains" },
						{ href: "#reports", label: "Reports" }
					].map(link => (
						<a
							key={link.href}
							href={link.href}
							role="listitem"
							className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
							style={{ color: "oklch(0.35 0.015 240)" }}
							onFocus={e => {
								e.currentTarget.style.background = "oklch(0 0 0 / 0.05)";
							}}
							onBlur={e => {
								e.currentTarget.style.background = "transparent";
							}}>
							{link.label}
						</a>
					))}
				</div>

				{/* Auth CTAs */}
				<div className="flex items-center gap-2.5">
					<Link
						href="/login"
						className="hidden text-sm font-medium sm:block"
						style={{ color: "oklch(0.40 0.015 240)" }}>
						Sign In
					</Link>
					<Button
						asChild
						size="sm"
						className="font-semibold"
						style={{
							background: "var(--yee-green-900)",
							color: "oklch(0.97 0.008 158)"
						}}>
						<Link href="/signup">Get Started</Link>
					</Button>
				</div>
			</nav>
		</header>
	);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Hero - cream background, brand mark as hero visual (not a product screenshot)
───────────────────────────────────────────────────────────────────────────── */

function HeroSection() {
	return (
		<section
			className="relative overflow-hidden"
			style={{ background: CREAM }}
			aria-label="YEE platform introduction">
			{/* Subtle warm gradient wash behind mark */}
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					backgroundImage: `radial-gradient(ellipse 60% 80% at 75% 45%, oklch(0.84 0.04 158 / 0.18) 0, transparent 65%)`
				}}
				aria-hidden="true"
			/>

			<div className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pt-14">
				<div className="grid items-center gap-12 lg:grid-cols-[1fr_auto] lg:gap-20">
					{/* Left - text */}
					<div className="max-w-2xl space-y-8 pt-8">
						<div className="space-y-5">
							<Badge
								variant="success"
								className="border px-3"
								style={{
									background: "var(--yee-green-50)",
									borderColor: "var(--yee-green-200)",
									color: "var(--yee-green-700)"
								}}>
								<span
									className="mr-1.5 inline-block size-1.5 rounded-full"
									style={{ background: "var(--yee-green-600)" }}
									aria-hidden="true"
								/>
								Youth-led · Research-grade · Evidence-based
							</Badge>

							<h1
								className="text-[2.75rem] font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.5rem]"
								style={{ color: "oklch(0.14 0.006 240)" }}>
								Youth-led audits
								<br />
								for better <span style={{ color: "var(--yee-green-700)" }}>public spaces.</span>
							</h1>
						</div>

						<p
							className="text-base leading-relaxed sm:text-lg"
							style={{ color: "oklch(0.40 0.012 240)", maxWidth: "42rem" }}>
							Evaluate parks, recreation areas, and community spaces through structured youth
							observations, scoring, and clear reports that decision-makers can act on.
						</p>

						<div className="flex flex-wrap items-center gap-3">
							<Button
								asChild
								size="lg"
								className="font-semibold"
								style={{
									background: "var(--yee-green-900)",
									color: "oklch(0.97 0.008 158)"
								}}>
								<Link href="/signup">
									Start an Audit Project
									<ArrowRight className="ml-1 size-4" aria-hidden="true" />
								</Link>
							</Button>
							<Button
								asChild
								size="lg"
								variant="outline"
								className="font-medium"
								style={{
									borderColor: "oklch(0 0 0 / 0.14)",
									background: "transparent",
									color: "oklch(0.28 0.008 240)"
								}}>
								<a href="#reports">View Sample Report</a>
							</Button>
						</div>

						{/* Trust line */}
						<p className="text-xs font-medium" style={{ color: "oklch(0.60 0.012 240)" }}>
							Research-grade instrument · Youth-weighted scoring · Export-ready reports
						</p>
					</div>

					{/* Right - brand mark as hero visual */}
					<div className="flex justify-center items-start -mt-10 pb-10 lg:justify-end">
						<HeroMarkComposition />
					</div>
				</div>
			</div>
		</section>
	);
}

/**
 * The YEE logo mark is the hero visual - a large map-pin–with-leaf that
 * signals place, environment, and field research. Positioned over the report
 * mockup card so the brand and data artifact feel unified.
 */
function HeroMarkComposition() {
	return (
		<div className="relative flex flex-col items-center gap-0">
			{/* Large logo mark */}
			<div className="relative z-10">
				<Image
					src="/brand/logo-mark-gradient.png"
					alt="YEE - map pin with leaf, symbolising youth-enabled places"
					width={1024}
					height={1024}
					priority
					className="h-auto w-44 select-none drop-shadow-sm sm:w-52 lg:w-60"
				/>
			</div>

			{/* Report card - partially behind the mark */}
			<div className="relative -mt-8 z-0 w-64 sm:w-72 lg:w-80">
				<ReportMockupCard />
			</div>
		</div>
	);
}

/** Compact inline report mockup shown beneath the logo mark in the hero. */
function ReportMockupCard() {
	const domains = [
		{ label: "Access", score: 80, color: "oklch(0.55 0.16 200)" },
		{ label: "Activity Spaces", score: 65, color: "oklch(0.58 0.16 60)" },
		{ label: "Amenities", score: 78, color: "oklch(0.55 0.15 280)" },
		{ label: "Experience", score: 71, color: "oklch(0.55 0.18 350)" },
		{ label: "Aesthetics & Care", score: 69, color: "var(--yee-green-600)" },
		{ label: "Use & Usability", score: 73, color: "oklch(0.52 0.15 230)" }
	];

	return (
		<div
			className="rounded-lg border p-5"
			style={{
				background: "var(--yee-surface-card)",
				borderColor: "var(--border)",
				boxShadow: "var(--shadow-panel)"
			}}
			role="img"
			aria-label="Sample YEE audit report: Riverside Community Park, overall score 72">
			<div className="mb-4 flex items-start justify-between gap-3">
				<div>
					<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
						Audit Report
					</p>
					<p className="mt-0.5 text-sm font-semibold text-foreground">Riverside Community Park</p>
					<p className="text-xs text-muted-foreground">6 domains · 48 observations</p>
				</div>
				<div
					className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg border"
					style={{ background: "var(--yee-green-50)", borderColor: "var(--yee-green-200)" }}>
					<span className="text-lg font-bold leading-none" style={{ color: "var(--yee-green-900)" }}>
						72
					</span>
					<span className="text-[9px] text-muted-foreground">/ 100</span>
				</div>
			</div>

			<div className="space-y-2" role="list" aria-label="Domain scores">
				{domains.map(domain => (
					<div key={domain.label} role="listitem">
						<div className="mb-0.5 flex items-center justify-between">
							<span className="text-[11px] font-medium text-foreground">{domain.label}</span>
							<span className="text-[11px] tabular-nums text-muted-foreground">{domain.score}</span>
						</div>
						<div
							className="h-1.5 overflow-hidden rounded-full"
							style={{ background: "var(--border)" }}
							role="progressbar"
							aria-valuenow={domain.score}
							aria-valuemin={0}
							aria-valuemax={100}
							aria-label={`${domain.label}: ${domain.score} out of 100`}>
							<div
								className="h-full rounded-full"
								style={{ width: `${domain.score}%`, background: domain.color }}
							/>
						</div>
					</div>
				))}
			</div>

			<div
				className="mt-3 flex items-center justify-between rounded-lg border px-3 py-2"
				style={{ background: "var(--yee-green-50)", borderColor: "var(--yee-green-200)" }}>
				<div>
					<p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
						Youth-Weighted
					</p>
					<p className="text-sm font-bold" style={{ color: "var(--yee-green-900)" }}>
						74 / 100
					</p>
				</div>
				<Star className="size-3.5 shrink-0" style={{ color: "var(--yee-green-600)" }} aria-hidden="true" />
			</div>

			<div className="mt-2.5 flex items-center gap-2">
				<div
					className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-1.5 text-[11px] font-medium text-muted-foreground"
					style={{ borderColor: "var(--border)" }}>
					<Download className="size-3" aria-hidden="true" /> Export CSV
				</div>
				<div
					className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-1.5 text-[11px] font-medium text-muted-foreground"
					style={{ borderColor: "var(--border)" }}>
					<Printer className="size-3" aria-hidden="true" /> Print
				</div>
			</div>
		</div>
	);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Identity Band - dark green strip with stacked logo; brand moment
───────────────────────────────────────────────────────────────────────────── */

function IdentityBand() {
	return (
		<div
			id="platform"
			className="relative overflow-hidden py-16 sm:py-20"
			style={{ background: "var(--yee-green-950)" }}>
			{/* Radial glow */}
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					backgroundImage: `radial-gradient(ellipse 55% 70% at 50% 50%, oklch(0.5 0.07 159 / 0.18) 0, transparent 70%)`
				}}
				aria-hidden="true"
			/>

			<div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="grid items-center gap-10 lg:grid-cols-[auto_1fr]">
					{/* Stacked logo - large brand moment */}
					<div className="flex justify-center lg:justify-start">
						<BrandLogo variant="stackedSubtitle" tone="dark" className="h-auto w-36 sm:w-44 lg:w-52" />
					</div>

					{/* Statements */}
					<div className="space-y-6 lg:border-l lg:pl-10" style={{ borderColor: "oklch(1 0 0 / 0.1)" }}>
						<p
							className="text-2xl font-semibold leading-snug tracking-tight sm:text-3xl"
							style={{ color: "oklch(0.95 0.006 158)" }}>
							Turning youth field observations into planning evidence.
						</p>
						<div className="grid gap-4 sm:grid-cols-3" role="list" aria-label="Platform pillars">
							{[
								{
									num: "6",
									label: "Audit domains",
									sub: "Access · Activity · Amenities · Experience · Aesthetics · Use"
								},
								{
									num: "2×",
									label: "Score views",
									sub: "Raw domain scores and youth-weighted scores side by side"
								},
								{
									num: "∞",
									label: "Exportable",
									sub: "CSV, Excel, and print-ready reports from every audit"
								}
							].map(item => (
								<div key={item.label} role="listitem" className="space-y-1">
									<p className="text-3xl font-bold" style={{ color: "var(--yee-green-500)" }}>
										{item.num}
									</p>
									<p className="text-sm font-semibold" style={{ color: "oklch(0.95 0.006 158)" }}>
										{item.label}
									</p>
									<p
										className="text-xs leading-relaxed"
										style={{ color: "oklch(0.95 0.006 158 / 0.55)" }}>
										{item.sub}
									</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Problem
───────────────────────────────────────────────────────────────────────────── */

function ProblemSection() {
	const painPoints = [
		{
			icon: Users,
			title: "Planned by adults, experienced by youth",
			body: "Most public spaces are designed and evaluated by adults who rarely use them. Youth perspectives remain informal, anecdotal, and invisible to planners."
		},
		{
			icon: ClipboardList,
			title: "Feedback that can't be compared or reported",
			body: "Youth feedback collected through surveys or focus groups is hard to aggregate, benchmark, or present in a format that supports decision-making."
		},
		{
			icon: BarChart3,
			title: "Evidence that doesn't reach the right people",
			body: "Even when youth observation data exists, it often lacks structure, scoring, and export formats that make it actionable for researchers and municipal teams."
		}
	];

	return (
		<section
			className="py-16 sm:py-20 lg:py-24"
			style={{ background: CREAM_ALT }}
			aria-labelledby="problem-heading">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-2xl text-center">
					<p
						className="text-xs font-semibold uppercase tracking-[0.28em]"
						style={{ color: "var(--yee-green-700)" }}>
						The Gap
					</p>
					<h2
						id="problem-heading"
						className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
						style={{ color: "oklch(0.14 0.006 240)" }}>
						Public spaces need youth voices - in a form that drives change.
					</h2>
					<p className="mt-4 text-base leading-relaxed text-muted-foreground">
						Youth experience parks and community spaces differently than adults. But that experience rarely
						makes it into planning processes in a structured, comparable, or credible way.
					</p>
				</div>

				<div className="mt-12 grid gap-6 sm:grid-cols-3">
					{painPoints.map(point => (
						<article
							key={point.title}
							className="rounded-lg border bg-white p-6"
							style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}>
							<div
								className="mb-4 flex size-10 items-center justify-center rounded-lg"
								style={{ background: CREAM_ALT }}
								aria-hidden="true">
								<point.icon className="size-5 text-muted-foreground" />
							</div>
							<h3 className="mb-2 text-sm font-semibold" style={{ color: "oklch(0.14 0.006 240)" }}>
								{point.title}
							</h3>
							<p className="text-sm leading-relaxed text-muted-foreground">{point.body}</p>
						</article>
					))}
				</div>
			</div>
		</section>
	);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Solution
───────────────────────────────────────────────────────────────────────────── */

function SolutionSection() {
	const features = [
		{ label: "Structured observations", description: "Standardised questions across all six YEE domains" },
		{ label: "Physical conditions", description: "Document what auditors see on the ground" },
		{ label: "Open-ended comments", description: "Capture qualitative youth voice alongside scores" },
		{ label: "Raw domain scores", description: "Transparent, auditable calculations per domain" },
		{ label: "Youth-weighted scores", description: "Weighted by what youth actually value most" },
		{ label: "Multi-place comparison", description: "Compare parks and spaces side by side" },
		{ label: "Printable reports", description: "Polished one-page summaries ready to share" },
		{ label: "CSV & Excel export", description: "Full data exports for research and analysis" }
	];

	return (
		<section className="bg-white py-16 sm:py-20 lg:py-24" aria-labelledby="solution-heading">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
					<div>
						<p
							className="text-xs font-semibold uppercase tracking-[0.28em]"
							style={{ color: "var(--yee-green-700)" }}>
							What YEE Captures
						</p>
						<h2
							id="solution-heading"
							className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
							style={{ color: "oklch(0.14 0.006 240)" }}>
							Every audit collects evidence that actually travels.
						</h2>
						<p className="mt-4 text-base leading-relaxed text-muted-foreground">
							YEE structures youth observations into a rigorous evidence base - from first observation
							through to exportable reports that planners, researchers, and funders can use directly.
						</p>

						{/* Brand mark - decorative, reinforces place-based identity */}
						<div className="mt-8 flex items-center gap-4">
							<Image
								src="/brand/logo-mark.png"
								alt=""
								width={1024}
								height={1024}
								aria-hidden
								className="h-12 w-12 select-none opacity-25"
							/>
							<p className="text-sm italic leading-relaxed text-muted-foreground">
								&ldquo;Turning youth field observations into planning evidence.&rdquo;
							</p>
						</div>
					</div>

					<div className="grid gap-3 sm:grid-cols-2">
						{features.map(feature => (
							<div
								key={feature.label}
								className="flex items-start gap-3 rounded-lg border bg-white px-4 py-3.5"
								style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}>
								<CheckCircle2
									className="mt-0.5 size-4 shrink-0"
									style={{ color: "var(--yee-green-600)" }}
									aria-hidden="true"
								/>
								<div>
									<p className="text-sm font-semibold" style={{ color: "oklch(0.14 0.006 240)" }}>
										{feature.label}
									</p>
									<p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
										{feature.description}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}

/* ─────────────────────────────────────────────────────────────────────────────
   How It Works
───────────────────────────────────────────────────────────────────────────── */

function HowItWorksSection() {
	const steps = [
		{
			number: "01",
			icon: FileBarChart,
			title: "Create a Project",
			body: "Set up a research project with a name, description, and the places you want to assess. Projects organise all your audits and reports in one workspace."
		},
		{
			number: "02",
			icon: MapPin,
			title: "Add Places & Assign Auditors",
			body: "Add parks, recreation areas, or community spaces to the project. Invite youth auditors by email - they receive guided access to their assigned places."
		},
		{
			number: "03",
			icon: ClipboardList,
			title: "Complete the Audit",
			body: "Auditors use the structured YEE instrument - a multi-step, domain-based form - to record observations, conditions, and comments for each space."
		},
		{
			number: "04",
			icon: BarChart3,
			title: "Review Reports & Exports",
			body: "Managers access scored reports immediately after submission. Compare places, drill into domain breakdowns, print summaries, or export full datasets."
		}
	];

	return (
		<section
			id="how"
			className="py-16 sm:py-20 lg:py-24"
			style={{ background: CREAM }}
			aria-labelledby="how-heading">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-2xl text-center">
					<p
						className="text-xs font-semibold uppercase tracking-[0.28em]"
						style={{ color: "var(--yee-green-700)" }}>
						How It Works
					</p>
					<h2
						id="how-heading"
						className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
						style={{ color: "oklch(0.14 0.006 240)" }}>
						From project setup to published report in four steps.
					</h2>
				</div>

				<div className="relative mt-14">
					{/* Horizontal connector line on desktop */}
					<div
						className="absolute left-0 right-0 top-11 hidden h-px lg:block"
						style={{ background: "var(--yee-green-200)" }}
						aria-hidden="true"
					/>

					<div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
						{steps.map(step => (
							<article key={step.number} className="relative flex flex-col gap-4">
								{/* Step circle */}
								<div
									className="relative z-10 flex size-14 shrink-0 items-center justify-center self-start rounded-full border-2 shadow-sm"
									style={{
										background: "white",
										borderColor: "var(--yee-green-300, var(--yee-green-200))"
									}}>
									<step.icon
										className="size-5"
										style={{ color: "var(--yee-green-700)" }}
										aria-hidden="true"
									/>
								</div>

								<div className="space-y-2">
									<p
										className="text-[10px] font-semibold uppercase tracking-[0.24em]"
										style={{ color: "var(--yee-green-600)" }}>
										Step {step.number}
									</p>
									<h3
										className="text-sm font-semibold leading-snug"
										style={{ color: "oklch(0.14 0.006 240)" }}>
										{step.title}
									</h3>
									<p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
								</div>
							</article>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Domains - dark green panel (inverted), starkly different from COPA
───────────────────────────────────────────────────────────────────────────── */

type DomainCard = {
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	name: string;
	description: string;
};

function DomainsSection() {
	const domains: DomainCard[] = [
		{
			icon: MapPin,
			name: "Access",
			description:
				"How easily youth can reach and enter the space - pathways, entrances, and barriers to movement."
		},
		{
			icon: Dumbbell,
			name: "Activity Spaces",
			description: "The range, condition, and appropriateness of active play and sport areas available to youth."
		},
		{
			icon: Droplets,
			name: "Amenities",
			description: "Presence and condition of facilities: seating, water, washrooms, shade, and lighting."
		},
		{
			icon: Heart,
			name: "Experience",
			description: "How welcoming, safe, and enjoyable youth find the space - sense of belonging and comfort."
		},
		{
			icon: Sparkles,
			name: "Aesthetics & Care",
			description: "Visual quality, maintenance, and overall upkeep of the environment from a youth perspective."
		},
		{
			icon: Activity,
			name: "Use & Usability",
			description: "How actively the space is used, perceived usability across age groups, and inclusion."
		}
	];

	return (
		<section
			id="domains"
			className="relative overflow-hidden py-16 sm:py-20 lg:py-24"
			style={{ background: "var(--yee-green-950)" }}
			aria-labelledby="domains-heading">
			{/* Watermark logo mark - large decorative element */}
			<div
				className="pointer-events-none absolute -right-16 -top-16 opacity-[0.05] sm:opacity-[0.07]"
				aria-hidden="true">
				<Image
					src="/brand/logo-mark-white.png"
					alt=""
					width={1024}
					height={1024}
					className="h-auto w-96 select-none lg:w-lg"
				/>
			</div>

			<div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-2xl text-center">
					<p
						className="text-xs font-semibold uppercase tracking-[0.28em]"
						style={{ color: "var(--yee-green-500)" }}>
						Audit Domains
					</p>
					<h2
						id="domains-heading"
						className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
						style={{ color: "oklch(0.97 0.008 158)" }}>
						Six dimensions of youth-friendly public space.
					</h2>
					<p className="mt-4 text-base leading-relaxed" style={{ color: "oklch(0.95 0.006 158 / 0.65)" }}>
						The YEE instrument evaluates each space across six research-based domains, giving a complete
						picture of how well a public space serves young people.
					</p>
				</div>

				<div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{domains.map(domain => (
						<article
							key={domain.name}
							className="rounded-lg border p-5 transition-colors"
							style={{
								borderColor: "oklch(1 0 0 / 0.1)",
								background: "oklch(1 0 0 / 0.04)"
							}}>
							<div
								className="mb-4 flex size-10 items-center justify-center rounded-lg"
								style={{ background: "var(--yee-green-900)" }}>
								<domain.icon
									className="size-5"
									style={{ color: "var(--yee-green-500)" }}
									aria-hidden="true"
								/>
							</div>
							<h3 className="mb-2 text-sm font-semibold" style={{ color: "oklch(0.97 0.008 158)" }}>
								{domain.name}
							</h3>
							<p className="text-sm leading-relaxed" style={{ color: "oklch(0.95 0.006 158 / 0.62)" }}>
								{domain.description}
							</p>
						</article>
					))}
				</div>
			</div>
		</section>
	);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Youth-Weighted Scoring
───────────────────────────────────────────────────────────────────────────── */

function ScoringSection() {
	return (
		<section className="bg-white py-16 sm:py-20 lg:py-24" aria-labelledby="scoring-heading">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
					<div>
						<p
							className="text-xs font-semibold uppercase tracking-[0.28em]"
							style={{ color: "var(--yee-green-700)" }}>
							Youth-Weighted Scoring
						</p>
						<h2
							id="scoring-heading"
							className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
							style={{ color: "oklch(0.14 0.006 240)" }}>
							Scores that reflect what youth actually value.
						</h2>
						<p className="mt-4 text-base leading-relaxed text-muted-foreground">
							YEE produces both a raw score - the straightforward average across all domains - and a
							youth-weighted score, which applies weights based on evidence of what young people
							prioritise most in public spaces.
						</p>
						<p className="mt-3 text-base leading-relaxed text-muted-foreground">
							Presenting both scores gives researchers, planners, and funders a transparent view of how a
							space performs by standard measures and by youth-centered criteria.
						</p>

						<div className="mt-8 space-y-3">
							{[
								{
									label: "Raw Score",
									description: "Equal weight across all domains. Good for baseline benchmarking."
								},
								{
									label: "Youth-Weighted Score",
									description:
										"Weighted by what youth value most. Better for youth-centered planning decisions."
								}
							].map(item => (
								<div
									key={item.label}
									className="flex items-start gap-3 rounded-lg border px-4 py-3.5"
									style={{ borderColor: "var(--border)", background: CREAM }}>
									<div
										className="mt-1 size-2 shrink-0 rounded-full"
										style={{ background: "var(--yee-green-600)" }}
										aria-hidden="true"
									/>
									<div>
										<p className="text-sm font-semibold" style={{ color: "oklch(0.14 0.006 240)" }}>
											{item.label}
										</p>
										<p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
											{item.description}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>

					<div role="img" aria-label="Score comparison between raw score and youth-weighted score per domain">
						<ScoreComparisonMockup />
					</div>
				</div>
			</div>
		</section>
	);
}

function ScoreComparisonMockup() {
	const domains = [
		{ label: "Access", raw: 80, weighted: 76 },
		{ label: "Activity Spaces", raw: 65, weighted: 71 },
		{ label: "Amenities", raw: 78, weighted: 74 },
		{ label: "Experience", raw: 71, weighted: 79 },
		{ label: "Aesthetics & Care", raw: 69, weighted: 64 },
		{ label: "Use & Usability", raw: 73, weighted: 80 }
	];

	return (
		<div
			className="rounded-lg border p-6"
			style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-elevated)", background: "white" }}>
			<div className="mb-5 flex items-center gap-6">
				<div className="flex items-center gap-2">
					<div
						className="h-2 w-5 rounded-full"
						style={{ background: "oklch(0.78 0.008 240)" }}
						aria-hidden="true"
					/>
					<span className="text-xs text-muted-foreground">Raw Score</span>
				</div>
				<div className="flex items-center gap-2">
					<div
						className="h-2 w-5 rounded-full"
						style={{ background: "var(--yee-green-600)" }}
						aria-hidden="true"
					/>
					<span className="text-xs text-muted-foreground">Youth-Weighted</span>
				</div>
			</div>

			<div className="space-y-4" role="list" aria-label="Domain score comparison">
				{domains.map(domain => (
					<div key={domain.label} role="listitem">
						<span className="mb-1.5 block text-xs font-medium" style={{ color: "oklch(0.14 0.006 240)" }}>
							{domain.label}
						</span>
						<div className="mb-1 flex items-center gap-2">
							<div
								className="h-2 flex-1 overflow-hidden rounded-full"
								style={{ background: "var(--border)" }}
								role="progressbar"
								aria-valuenow={domain.raw}
								aria-valuemin={0}
								aria-valuemax={100}
								aria-label={`${domain.label} raw score: ${domain.raw}`}>
								<div
									className="h-full rounded-full"
									style={{ width: `${domain.raw}%`, background: "oklch(0.78 0.008 240)" }}
								/>
							</div>
							<span className="w-6 text-right text-[11px] tabular-nums text-muted-foreground">
								{domain.raw}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<div
								className="h-2 flex-1 overflow-hidden rounded-full"
								style={{ background: "var(--yee-green-100)" }}
								role="progressbar"
								aria-valuenow={domain.weighted}
								aria-valuemin={0}
								aria-valuemax={100}
								aria-label={`${domain.label} youth-weighted score: ${domain.weighted}`}>
								<div
									className="h-full rounded-full"
									style={{ width: `${domain.weighted}%`, background: "var(--yee-green-600)" }}
								/>
							</div>
							<span
								className="w-6 text-right text-[11px] font-semibold tabular-nums"
								style={{ color: "var(--yee-green-700)" }}>
								{domain.weighted}
							</span>
						</div>
					</div>
				))}
			</div>

			<div
				className="mt-5 grid grid-cols-2 gap-3 rounded-lg border p-3.5"
				style={{ background: "var(--yee-green-50)", borderColor: "var(--yee-green-200)" }}>
				<div className="text-center">
					<p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
						Raw Overall
					</p>
					<p className="mt-0.5 text-xl font-bold" style={{ color: "oklch(0.14 0.006 240)" }}>
						72
					</p>
				</div>
				<div className="text-center">
					<p
						className="text-[10px] font-medium uppercase tracking-[0.18em]"
						style={{ color: "var(--yee-green-600)" }}>
						Youth-Weighted
					</p>
					<p className="mt-0.5 text-xl font-bold" style={{ color: "var(--yee-green-900)" }}>
						74
					</p>
				</div>
			</div>
		</div>
	);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Reports
───────────────────────────────────────────────────────────────────────────── */

function ReportsSection() {
	const reportFeatures = [
		{
			icon: Eye,
			label: "Total score & domain breakdown",
			description: "Every report shows the overall score and a breakdown across all six YEE domains."
		},
		{
			icon: Star,
			label: "Highest & lowest domains",
			description: "At-a-glance callouts highlight where a space performs best and where it needs work."
		},
		{
			icon: GitCompare,
			label: "Multi-place comparison reports",
			description: "Side-by-side comparisons across multiple parks and spaces within the same project."
		},
		{
			icon: Printer,
			label: "Print-ready summaries",
			description: "Clean, formatted reports suitable for stakeholder presentations and planning documents."
		},
		{
			icon: FileSpreadsheet,
			label: "CSV & Excel export",
			description: "Full dataset exports for integration with research tools, SPSS, or custom analysis."
		},
		{
			icon: BarChart3,
			label: "Youth-weighted scoring",
			description: "Reports display both raw and youth-weighted scores so you can see both perspectives."
		}
	];

	return (
		<section
			id="reports"
			className="py-16 sm:py-20 lg:py-24"
			style={{ background: CREAM_ALT }}
			aria-labelledby="reports-heading">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-2xl text-center">
					<p
						className="text-xs font-semibold uppercase tracking-[0.28em]"
						style={{ color: "var(--yee-green-700)" }}>
						Reports &amp; Exports
					</p>
					<h2
						id="reports-heading"
						className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
						style={{ color: "oklch(0.14 0.006 240)" }}>
						Reports that go straight into planning conversations.
					</h2>
					<p className="mt-4 text-base leading-relaxed text-muted-foreground">
						YEE generates structured, professional reports the moment an audit is submitted. No manual
						compilation, no reformatting - just evidence ready to share.
					</p>
				</div>

				<div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{reportFeatures.map(feature => (
						<div
							key={feature.label}
							className="rounded-lg border bg-white p-5"
							style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}>
							<div
								className="mb-3 flex size-9 items-center justify-center rounded-lg border"
								style={{
									background: "var(--yee-green-50)",
									borderColor: "var(--yee-green-200)"
								}}>
								<feature.icon
									className="size-4"
									style={{ color: "var(--yee-green-700)" }}
									aria-hidden="true"
								/>
							</div>
							<h3 className="mb-1.5 text-sm font-semibold" style={{ color: "oklch(0.14 0.006 240)" }}>
								{feature.label}
							</h3>
							<p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Final CTA - uses banner-light image as a featured brand visual
───────────────────────────────────────────────────────────────────────────── */

function FinalCtaSection() {
	return (
		<section
			className="relative overflow-hidden py-20 sm:py-24 lg:py-28"
			style={{ background: "var(--yee-green-900)" }}
			aria-labelledby="cta-heading">
			{/* Banner image - large, faded, placed as background texture */}
			<div className="pointer-events-none absolute inset-0 flex items-center justify-end" aria-hidden="true">
				<Image
					src="/brand/banner-dark.png"
					alt=""
					width={1428}
					height={530}
					className="h-full w-auto max-w-none select-none object-contain opacity-10"
				/>
			</div>

			<div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
				{/* Stacked logo mark above the CTA headline */}
				<div className="mb-8 flex justify-center">
					<Image
						src="/brand/logo-mark-white.png"
						alt="YEE logo mark"
						width={1024}
						height={1024}
						className="h-16 w-16 select-none opacity-80"
					/>
				</div>

				<h2
					id="cta-heading"
					className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem]"
					style={{ color: "oklch(0.97 0.008 158)" }}>
					Ready to understand public spaces through youth experience?
				</h2>
				<p
					className="mx-auto mt-5 max-w-xl text-base leading-relaxed sm:text-lg"
					style={{ color: "oklch(0.95 0.006 158 / 0.72)" }}>
					Set up your first YEE project in minutes. Add places, invite youth auditors, and start collecting
					structured evidence that decision-makers can use.
				</p>
				<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
					<Button
						asChild
						size="lg"
						className="font-semibold"
						style={{
							background: "var(--yee-green-500)",
							color: "oklch(0.08 0.02 160)"
						}}>
						<Link href="/signup">
							Start an Audit Project
							<ArrowRight className="ml-1 size-4" aria-hidden="true" />
						</Link>
					</Button>
					<Button
						asChild
						size="lg"
						variant="outline"
						className="border font-medium"
						style={{
							borderColor: "oklch(1 0 0 / 0.22)",
							background: "transparent",
							color: "oklch(0.95 0.006 158)"
						}}>
						<Link href="/login">Sign In</Link>
					</Button>
				</div>
			</div>
		</section>
	);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Footer - warm cream, uses horizontal subtitle logo
───────────────────────────────────────────────────────────────────────────── */

function LandingFooter() {
	const currentYear = new Date().getFullYear();

	return (
		<footer className="border-t py-10" style={{ background: CREAM_ALT, borderColor: "oklch(0 0 0 / 0.08)" }}>
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
					<div className="flex flex-col items-center gap-2 sm:items-start">
						<BrandLogo variant="horizontalSubtitle" tone="light" className="h-10 w-auto" />
						<p className="text-xs text-muted-foreground">
							Public space audit platform for youth-led research
						</p>
					</div>

					<nav aria-label="Footer navigation">
						<ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
							{[
								{ href: "#platform", label: "The Platform" },
								{ href: "#how", label: "How It Works" },
								{ href: "#domains", label: "Domains" },
								{ href: "/login", label: "Sign In" },
								{ href: "/signup", label: "Get Started" }
							].map(link => (
								<li key={link.href}>
									<Link
										href={link.href}
										className="text-xs text-muted-foreground transition-colors hover:text-foreground">
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</nav>
				</div>

				<div className="mt-8 border-t pt-6" style={{ borderColor: "oklch(0 0 0 / 0.08)" }}>
					<p className="text-center text-xs text-muted-foreground">
						© {currentYear} YEE Audit Tools - Youth Enabling Environments. All rights reserved.
					</p>
				</div>
			</div>
		</footer>
	);
}

export {
	LandingNav,
	HeroSection,
	HeroMarkComposition,
	ReportMockupCard,
	IdentityBand,
	ProblemSection,
	SolutionSection,
	HowItWorksSection,
	DomainsSection,
	ScoringSection,
	ScoreComparisonMockup,
	ReportsSection,
	FinalCtaSection,
	LandingFooter
};
