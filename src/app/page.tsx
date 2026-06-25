import type { Metadata } from "next";
import {
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
} from "@/components/brand/landing";

export const metadata: Metadata = {
	title: "YEE - Youth Enabling Environments | Public Space Audit Tool",
	description:
		"YEE turns youth experience into structured evidence for better public spaces. Evaluate parks, recreation areas, and community spaces through youth-led audits, scoring, and clear reports.",
	keywords: [
		"youth public space audit tool",
		"park audit tool",
		"public space evaluation",
		"youth engagement in urban planning",
		"built environment assessment",
		"youth-friendly public spaces",
		"Youth Enabling Environments",
		"community space assessment",
		"public space research tool",
		"YEE audit"
	],
	openGraph: {
		title: "YEE - Youth Enabling Environments",
		description:
			"Evaluate parks, recreation areas, and community spaces through structured youth observations, scoring, and clear reports.",
		type: "website"
	},
	twitter: {
		card: "summary_large_image",
		title: "YEE - Youth Enabling Environments",
		description: "Youth-led audits for better public spaces."
	}
};

/** JSON-LD structured data for the landing page. */
const jsonLd = {
	"@context": "https://schema.org",
	"@type": "SoftwareApplication",
	name: "YEE Audit Tools",
	alternateName: "Youth Enabling Environments",
	description:
		"A structured digital platform for conducting and managing Youth Enabling Environment audits of public spaces. Built for research teams and youth engagement professionals.",
	applicationCategory: "ResearchApplication",
	operatingSystem: "Web",
	offers: {
		"@type": "Offer",
		availability: "https://schema.org/InStock"
	},
	featureList: [
		"Youth-led public space audits",
		"Domain-based scoring",
		"Youth-weighted score calculations",
		"Comparison reports",
		"CSV and Excel export",
		"Printable audit reports"
	]
};

const CREAM = "oklch(0.975 0.012 80)";

/* ─────────────────────────────────────────────────────────────────────────────
   Root
───────────────────────────────────────────────────────────────────────────── */

export default function LandingPage() {
	return (
		<>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-lg focus:border focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-lg focus:ring-2 focus:ring-ring">
				Skip to main content
			</a>
			<div style={{ background: CREAM }}>
				<LandingNav />
				<main id="main-content">
					<HeroSection />
					<IdentityBand />
					<ProblemSection />
					<SolutionSection />
					<HowItWorksSection />
					<DomainsSection />
					<ScoringSection />
					<ReportsSection />
					<FinalCtaSection />
				</main>
				<LandingFooter />
			</div>
		</>
	);
}
