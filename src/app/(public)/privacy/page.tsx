import type { Metadata } from "next";
import Link from "next/link";
import {
	ArrowLeft,
	BarChart3,
	Clock3,
	Database,
	Eye,
	LockKeyhole,
	Mail,
	ShieldCheck,
	Smartphone,
	Users
} from "lucide-react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { LandingFooter } from "@/components/brand/landing";

export const metadata: Metadata = {
	title: "Privacy Policy",
	description:
		"Privacy Policy for YEE Audit Tools, the Youth Enabling Environments web and mobile audit platform."
};

const sections = [
	{ id: "information", label: "Information we collect" },
	{ id: "use", label: "How we use information" },
	{ id: "sharing", label: "When information is shared" },
	{ id: "analytics", label: "Analytics and diagnostics" },
	{ id: "access", label: "Access and research privacy" },
	{ id: "security", label: "Security and offline storage" },
	{ id: "retention", label: "Retention and deletion" },
	{ id: "youth", label: "Youth participants" },
	{ id: "international", label: "International processing" },
	{ id: "changes", label: "Changes to this policy" },
	{ id: "contact", label: "Contact" }
] as const;

const summaryCards = [
	{
		icon: ShieldCheck,
		title: "No ads or data sales",
		body: "YEE does not sell personal information or use audit data for targeted advertising."
	},
	{
		icon: Users,
		title: "Role-scoped access",
		body: "Auditors, managers, and administrators receive different access based on their responsibilities."
	},
	{
		icon: Smartphone,
		title: "Offline fieldwork",
		body: "The mobile app can keep assigned work and in-progress audit data on the device so fieldwork can continue offline."
	}
] as const;

export default function PrivacyPolicyPage() {
	return (
		<div className="min-h-dvh bg-background">
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-md focus:border focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-lg focus:ring-2 focus:ring-ring">
				Skip to main content
			</a>

			<header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
				<div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
					<Link href="/" aria-label="YEE Audit Tools, go to home">
						<BrandLogo variant="horizontalSubtitle" tone="light" className="h-9 w-auto" priority />
					</Link>
					<Link
						href="/"
						className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
						<ArrowLeft className="size-4" aria-hidden="true" />
						Back to YEE
					</Link>
				</div>
			</header>

			<main id="main-content">
				<section className="border-b border-border bg-[radial-gradient(circle_at_top_right,var(--yee-green-100)_0,transparent_42%)]">
					<div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
						<div className="max-w-3xl">
							<p className="text-sm font-medium text-(--yee-green-700)">YEE Audit Tools</p>
							<h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
								Privacy Policy
							</h1>
							<p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
								This Privacy Policy explains how the Youth Enabling Environments Audit Tool ("YEE Audit
								Tools," "YEE," "we," or "us") handles information across the YEE web platform and
								mobile field-audit application.
							</p>
							<div className="mt-6 flex flex-wrap gap-2 text-sm">
								<span className="rounded-full border border-(--yee-green-200) bg-(--yee-green-50) px-3 py-1.5 font-medium text-(--yee-green-900)">
									Effective September 22, 2026
								</span>
								<span className="rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground">
									Web + mobile
								</span>
							</div>
						</div>

						<div className="mt-10 grid gap-4 md:grid-cols-3">
							{summaryCards.map(card => (
								<div key={card.title} className="rounded-lg border border-border bg-card p-5 shadow-(--shadow-card)">
									<div className="flex size-10 items-center justify-center rounded-md bg-(--yee-green-50) text-(--yee-green-800)">
										<card.icon className="size-5" aria-hidden="true" />
									</div>
									<h2 className="mt-4 text-base font-semibold text-foreground">{card.title}</h2>
									<p className="mt-2 text-sm leading-6 text-muted-foreground">{card.body}</p>
								</div>
							))}
						</div>
					</div>
				</section>

				<div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8 lg:py-14">
					<aside className="hidden lg:block">
						<nav className="sticky top-24 rounded-lg border border-border bg-card p-4" aria-label="Privacy policy sections">
							<p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
								On this page
							</p>
							<ul className="space-y-1">
								{sections.map(section => (
									<li key={section.id}>
										<a
											href={`#${section.id}`}
											className="block rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
											{section.label}
										</a>
									</li>
								))}
							</ul>
						</nav>
					</aside>

					<article className="min-w-0 max-w-3xl space-y-10">
						<section className="rounded-lg border border-(--yee-green-200) bg-(--yee-green-50) p-5 sm:p-6">
							<div className="flex gap-3">
								<ShieldCheck className="mt-0.5 size-5 shrink-0 text-(--yee-green-800)" aria-hidden="true" />
								<div>
									<h2 className="font-semibold text-(--yee-green-950)">The short version</h2>
									<p className="mt-2 text-sm leading-6 text-(--yee-green-900)">
										YEE collects the information needed to create accounts, assign fieldwork, complete
										audits, synchronize offline work, generate reports, and keep the service reliable. Access
										is limited by role and organization. We do not sell user data or run advertising in YEE.
									</p>
								</div>
							</div>
						</section>

						<PolicySection id="information" icon={Database} title="1. Information we collect">
							<p>Depending on your role and how your organization uses YEE, we may process:</p>
							<ul>
								<li>
									<strong>Account and profile information:</strong> name, email address, organization or
									institution, account role, job title, professional disciplines, optional phone number,
									account status, and generated user or auditor identifiers.
								</li>
								<li>
									<strong>Project and place information:</strong> research projects, assigned places, place
									details, project membership, and assignment records entered by authorized managers.
								</li>
								<li>
									<strong>Audit and research information:</strong> survey responses, domain weights,
									comments, section comments, submission status, timestamps, scores, and report/export data.
								</li>
								<li>
									<strong>Technical and usage information:</strong> app or browser version, operating
									system, device and network information, IP-derived technical information, page or screen
									views, taps/clicks, app lifecycle events, errors, diagnostics, and performance data.
								</li>
								<li>
									<strong>Local offline data:</strong> the mobile app stores assigned places, instrument
									content, in-progress drafts, pending synchronization records, and related metadata on the
									device so audits can continue without a network connection.
								</li>
							</ul>
							<p>
								YEE does not request device GPS, camera, microphone, contacts, or photo-library access as a
								standard part of the audit workflow. A place being evaluated may have location information
								entered by an authorized manager, but that is information about the research site, not a
								continuous record of an auditor&apos;s device location.
							</p>
						</PolicySection>

						<PolicySection id="use" icon={BarChart3} title="2. How we use information">
							<p>We use information to:</p>
							<ul>
								<li>create and maintain accounts and verify sign-in;</li>
								<li>assign auditors to projects and places;</li>
								<li>save, synchronize, submit, score, and report YEE audits;</li>
								<li>support offline fieldwork and restore pending work after connectivity returns;</li>
								<li>generate reports, comparisons, and authorized research exports;</li>
								<li>detect errors, prevent abuse, maintain security, and improve reliability and usability; and</li>
								<li>respond to support, privacy, and account requests.</li>
							</ul>
						</PolicySection>

						<PolicySection id="sharing" icon={Users} title="3. When information is shared">
							<p>We do not sell personal information and do not share YEE data for targeted advertising.</p>
							<p>Information may be made available to:</p>
							<ul>
								<li>
									<strong>Authorized people in your YEE workspace.</strong> Managers can access information
									needed to manage their organization&apos;s projects, auditors, audits, and reports. Platform
									administrators may have broader access for system administration.
								</li>
								<li>
									<strong>Service providers.</strong> YEE may use providers for application hosting,
									database hosting, mobile app delivery and updates, maps/place lookup, analytics, and error
									monitoring. These providers process information to deliver those services to YEE.
								</li>
								<li>
									<strong>Research or institutional recipients.</strong> Authorized exports or reports may be
									shared by the organization running a project according to its research protocol, consent
									process, institutional requirements, and applicable law.
								</li>
								<li>
									<strong>Legal and safety purposes.</strong> We may disclose information when reasonably
									necessary to comply with law, protect users, investigate misuse, or protect the service.
								</li>
							</ul>
						</PolicySection>

						<PolicySection id="analytics" icon={Eye} title="4. Analytics and diagnostics">
							<p>
								When enabled in a YEE deployment, we use <strong>PostHog</strong> for product analytics and
								session replay and <strong>Sentry</strong> for crash, error, and performance monitoring.
								These tools may receive a YEE user identifier, email address, role, organization or account
								context, device/app information, navigation events, and diagnostic information.
							</p>
							<p>
								Session replay can record interaction context such as screens viewed, taps/clicks, and
								on-screen content to help diagnose usability and reliability problems. YEE does not use
								session replay for advertising.
							</p>
							<p>
								The web application may also use Google Maps or Places services for manager-entered place
								search and map previews when that feature is configured. The mobile application uses Expo
								services for application delivery and updates.
							</p>
						</PolicySection>

						<PolicySection id="access" icon={Users} title="5. Access and research privacy">
							<p>
								YEE uses role-based access controls. Auditors are limited to their assigned fieldwork and
								their own submissions. Managers are scoped to their organization&apos;s projects and may
								review submissions, reports, and authorized raw-data exports. Platform administrators may
								access system-wide data when needed to operate the service.
							</p>
							<p>
								Reporting and comparison surfaces are designed to use generated auditor identifiers, such
								as AUD-001, instead of personal names where a full identity is not needed. Organizations
								should avoid entering unnecessary personal or sensitive information in free-text audit
								comments.
							</p>
						</PolicySection>

						<PolicySection id="security" icon={LockKeyhole} title="6. Security and offline storage">
							<p>
								YEE uses administrative and technical safeguards intended to protect information. On the
								web, authentication tokens are stored in an HttpOnly session cookie with secure production
								settings. On mobile, authentication sessions and offline-login credentials are stored using
								the operating system&apos;s secure storage when available.
							</p>
							<p>
								To support offline fieldwork, in-progress audit drafts and synchronization queues are stored
								locally in account-scoped device storage. Application-level encryption is not currently
								enabled for those local draft records. Protect access to any device used for YEE fieldwork,
								and remove app data before transferring a device to another person.
							</p>
							<p>
								Production network traffic is expected to use HTTPS/TLS. No method of storage or
								transmission is completely secure, so we cannot guarantee absolute security.
							</p>
						</PolicySection>

						<PolicySection id="retention" icon={Clock3} title="7. Retention and deletion">
							<p>
								We retain account and project information for as long as it is reasonably needed to provide
								YEE, administer the relevant research workspace, maintain security, and satisfy applicable
								institutional, legal, or research-record obligations.
							</p>
							<p>
								Mobile offline drafts may remain on a device until they are submitted, cleared, or the
								application data is removed. Submitted audit records may be retained by the organization
								operating the project under its approved research or records-retention requirements.
							</p>
							<p>
								You may request deletion of your YEE account and account-linked personal information by
								contacting your organization&apos;s YEE manager or the privacy contact below. Where a submitted
								research record must be retained, we may retain or de-identify that record as permitted or
								required by the applicable research protocol, institutional policy, or law. Deletion may
								take additional time to propagate through backups and security logs.
							</p>
						</PolicySection>

						<PolicySection id="youth" icon={Users} title="8. Youth participants">
							<p>
								YEE is designed for youth-engaged environmental assessment and may be used by youth
								participants as part of an organization-led research, education, or community project.
								Organizations using YEE are responsible for determining participant eligibility and
								obtaining any parental permission, participant consent or assent, ethics approval, or other
								authorization required for their project.
							</p>
							<p>
								YEE does not use youth audit information for targeted advertising and does not sell that
								information.
							</p>
						</PolicySection>

						<PolicySection id="international" icon={Database} title="9. International processing">
							<p>
								YEE and its service providers may process or store information in the United States or in
								other countries where the relevant service provider operates. If you access YEE from
								outside the United States, your information may therefore be transferred across borders.
							</p>
						</PolicySection>

						<PolicySection id="changes" icon={Clock3} title="10. Changes to this policy">
							<p>
								We may update this Privacy Policy when YEE features, data practices, or legal requirements
								change. The effective date at the top of this page will be updated when a revised policy is
								published.
							</p>
						</PolicySection>

						<PolicySection id="contact" icon={Mail} title="11. Contact">
							<p>
								YEE Audit Tools is developed for the Youth Enabling Environments project in collaboration
								with the DECA Lab (Design Environments with/for Children &amp; Adolescents) at Cornell
								University.
							</p>
							<div className="rounded-lg border border-border bg-card p-5">
								<p className="text-sm font-semibold text-foreground">Privacy questions or deletion requests</p>
								<a
									href="mailto:j.loebach@cornell.edu?subject=YEE%20Privacy%20Request"
									className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-(--yee-green-700) underline-offset-4 hover:underline">
									<Mail className="size-4" aria-hidden="true" />
									j.loebach@cornell.edu
								</a>
								<p className="mt-3 text-sm leading-6 text-muted-foreground">
									DECA Lab, Department of Human Centered Design, Cornell University, Ithaca, New York,
									United States.
								</p>
							</div>
						</PolicySection>
					</article>
				</div>
			</main>

			<LandingFooter />
		</div>
	);
}

function PolicySection({
	id,
	icon: Icon,
	title,
	children
}: {
	id: string;
	icon: typeof ShieldCheck;
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section id={id} className="scroll-mt-28">
			<div className="mb-4 flex items-center gap-3">
				<div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-(--yee-green-50) text-(--yee-green-800)">
					<Icon className="size-4.5" aria-hidden="true" />
				</div>
				<h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
			</div>
			<div className="space-y-4 text-[15px] leading-7 text-muted-foreground [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
				{children}
			</div>
		</section>
	);
}
