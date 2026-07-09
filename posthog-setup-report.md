<wizard-report>
# PostHog post-wizard report

The wizard has completed a full PostHog integration for the YEE Audit Tool frontend. Here is a summary of every change made:

- **Reverse proxy** — `next.config.ts` now routes `/ingest/*` through the app origin (and `/ingest/static/*`, `/ingest/array/*` to the assets CDN) so PostHog requests bypass ad blockers.
- **Client-side init** — `analytics-provider.tsx` updated to use `/ingest` as `api_host`, added `ui_host`, `defaults: "2026-01-30"`, `capture_exceptions: true`, and `debug` in development.
- **Server-side client** — `src/lib/analytics/posthog-server.ts` created with a singleton `PostHog` (posthog-node) client, flushing immediately for short-lived route handlers.
- **posthog-node installed** — `posthog-node@5.40.0` added as a project dependency.
- **Environment variables** — `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` written to `.env.local`.
- **User identification** — already handled end-to-end by `AnalyticsIdentitySync` in `analytics-provider.tsx` (identifies on login/session restore, resets on logout). An explicit `posthog.identify()` was also added in `invite-accept-screen.tsx` at the moment of invite acceptance.
- **10 business events** instrumented across 7 files (see table below).
- **PostHog dashboard** "Analytics basics (wizard)" created with 5 insights.

| Event | Description | File |
|---|---|---|
| `manager_signed_up` | Manager creates an organization account | `src/app/(auth)/signup/page.tsx` |
| `profile_completed` | User finishes profile setup during onboarding | `src/app/(onboarding)/complete-profile/page.tsx` |
| `password_reset_requested` | User submits a forgot-password request | `src/app/(auth)/forgot-password/page.tsx` |
| `audit_step_advanced` | Auditor moves forward to the next wizard step | `src/features/yee-audit/components/yee-audit-wizard.tsx` |
| `audit_review_opened` | Auditor opens the review screen before submitting | `src/features/yee-audit/components/yee-audit-wizard.tsx` |
| `audit_submitted` | Audit successfully submitted | `src/features/yee-audit/components/yee-audit-wizard.tsx` |
| `audit_saved_and_exited` | Auditor saves draft and exits without submitting | `src/features/yee-audit/components/yee-audit-wizard.tsx` |
| `report_exported` | User exports a report (any format) | `src/features/reporting/components/export-menu-button.tsx` |
| `server_user_logged_in` | Server-side: user authenticated via login API route | `src/app/api/auth/login/route.ts` |
| `invite_accepted` | User accepts an auditor invite | `src/features/auth/components/invite-accept-screen.tsx` |

## Next steps

We've built some insights and a dashboard to keep an eye on user behaviour:

- **Dashboard** — [Analytics basics (wizard)](https://us.posthog.com/project/505201/dashboard/1824507)
- [Signup → Profile completion funnel](https://us.posthog.com/project/505201/insights/hXVggm8r)
- [Audit completion funnel (review → submitted)](https://us.posthog.com/project/505201/insights/eKBPOfMR)
- [Audits submitted over time](https://us.posthog.com/project/505201/insights/uWUWBFgo)
- [Audit abandonment rate (saved-and-exited vs submitted)](https://us.posthog.com/project/505201/insights/0ckGCe3M)
- [Report exports by format](https://us.posthog.com/project/505201/insights/Holahtft)

## Verify before merging

- [ ] Run a full production build (`pnpm build`) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` to `.env.example` and any CI/deploy bootstrap scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify in PostHog Error Tracking.
- [ ] Confirm the returning-visitor path also calls `identify` — the `AnalyticsIdentitySync` component handles this via `useEffect` watching `session`, so verify the session hydration effect runs correctly on page refresh.

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
