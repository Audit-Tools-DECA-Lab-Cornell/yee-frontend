# Audit Tools Frontend

Next.js frontend for DECA Lab's Audit Tools platform. This repository contains the browser UI for authentication, role-based dashboards, manager/admin reporting, and the Youth Enabling Environments (YEE) audit workflow.

The frontend and backend live in separate repos:

- Frontend: this repo
- Backend: FastAPI service in `../../audit-tools-backend`

The frontend talks to the backend through local Next.js API proxy routes under [`src/app/api`](yee-frontend/src/app/api).

## What This App Does

This is not a single survey page. It is a role-based website with:

- authentication and onboarding
- separate admin, manager, and auditor dashboards
- project, place, auditor, audit, reporting, and raw-data pages
- YEE multi-step audit flow
- backend-backed YEE draft state
- manager editing for projects and places
- locked submitted YEE results pages
- manager/admin reporting and CSV export flows
- spreadsheet/QSF-backed section intros, weighting prompts, and conditional survey rendering

## Roles

### Admin

Admins can access system-wide views:

- `/admin`
- `/admin/users`
- `/admin/projects`
- `/admin/places`
- `/admin/audits`
- `/admin/raw-data`
- `/admin/settings`

### Manager

Managers can access organization-scoped workspace pages:

- `/manager`
- `/manager/projects`
- `/manager/projects/new`
- `/manager/projects/[projectId]`
- `/manager/projects/[projectId]/edit`
- `/manager/places`
- `/manager/places/new`
- `/manager/places/[placeId]`
- `/manager/places/[placeId]/edit`
- `/manager/auditors`
- `/manager/auditors/invite`
- `/manager/audits`
- `/manager/reports`
- `/manager/raw-data`
- `/manager/settings`

### Auditor

Auditors can access only their own assigned work:

- `/auditor`
- `/auditor/places`
- `/auditor/settings`
- `/yee/introduction`
- `/yee/audit/[placeId]/page/[step]`
- `/yee/audit/[placeId]/review`
- `/yee/audit/[placeId]/submitted`
- `/yee/submissions/[submissionId]`

## Current Product Behavior

### Authentication and onboarding

The frontend uses backend auth, not mocked auth pages.

The current flow is:

1. `/` redirects to `/login`
2. login and signup call backend auth endpoints through `/api/auth/*`
3. the backend response provides:
   - `account_type`
   - `email_verified`
   - `approved`
   - `profile_completed`
   - `next_step`
   - `dashboard_path`
4. the frontend routes the user to:
   - `/verify-email`
   - `/waiting-approval`
   - `/complete-profile`
   - role dashboard

The frontend stores the signed-in token in an HttpOnly cookie managed by the
Next.js auth route handlers. Shared session routing logic lives in
[`src/features/auth/session.ts`](yee-frontend/src/features/auth/session.ts).

### YEE audit flow

The YEE audit flow is split into multiple pages:

- `/yee/introduction`
- `/yee/audit/[placeId]/page/1` through `/page/8`
- `/yee/audit/[placeId]/review`
- `/yee/audit/[placeId]/submitted`
- `/yee/submissions/[submissionId]`

Current behavior:

- step pages and review use backend-backed draft state via `/api/yee/places/[placeId]/audit-state`
- draft data includes metadata, high-level answers, domain weights, comments, section comments, weighting comments, and question responses
- the instrument payload now includes section intro text and section comment prompts derived from the source QSF
- page 1 uses the spreadsheet-aligned visit-frequency wording and weather is treated as multi-select
- page 2 uses stakeholder-provided weighting copy and more prominent question styling
- domain question groups now pair presence and condition answers together, and condition follow-ups only appear when the presence answer is positive
- each audit section uses pale-green survey cards with stacked answer buttons and softer selected states
- each domain section includes its own optional comments box
- the survey now includes a dedicated final-comments page before review
- score preview calls `/api/yee/audits/score` with the backend-required payload shape
- final submission calls `/api/yee/audits`
- after submit, the place becomes locked for that auditor
- submitted audits open a read-only results page at `/yee/submissions/[submissionId]`
- local duplicate draft rows are handled by the backend using the latest matching YEE draft instead of crashing on save/submit

### Manager workspace behavior

Current manager pages support:

- clickable overview cards that route into real workspace pages
- projects and places create flows
- project and place edit flows with real backend persistence
- place-level auditor assignment with project/place/auditor selection
- structured filtering on manager audit, report, and raw-data pages
- CSV export for all, filtered, or selected raw audit rows
- comparison views that use generated auditor IDs only

### Reporting and score display

The current reporting experience includes:

- raw and youth-weighted totals
- domain-level raw and youth-weighted breakdowns
- read-only submitted report pages
- print and CSV export actions from submitted reports
- manager comparison views with bar-style score summaries
- per-domain percentage bar graphics for both raw and youth-weighted score views
- shared score legends that explain lower / middle / upper score ranges
- manager comparison cards that show percentage bars for each audit's total raw and total youth-weighted score

Cap score percentage and final max-score presentation are intentionally left extensible until the final cap logic is confirmed.

### Auditor dashboard behavior

The current auditor workspace is intentionally more task-focused than the manager workspace.

Current behavior:

- the auditor overview has exactly three primary actions:
  - `View My Audits`
  - `Start New Audit`
  - `Continue Audits in Progress`
- the old duplicate top-header `Start Audit` action was removed
- the previous header status badges were removed so they do not conflict with the field snapshot
- the assigned-place audit-status widget was moved into the overview page under `Assigned Places`
- the visible auditor navigation uses `/auditor/places` as the `My Audits` destination
- the auditor field snapshot and assigned-place table now share the same fetched audit-state source
- auditor filtering now supports `Project` and `Place` filters in both the overview widget and the `My Audits` page

## Tech Stack

- Next.js 16 App Router with Cache Components enabled
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui primitives
- lucide-react
- TanStack Query is installed, but most current data fetching is still plain `fetch`

## Environment Variables

Copy `.env.example` to `.env` and point it at the backend:

```bash
API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

Notes:

- `API_BASE_URL` is used by server-side proxy routes
- `NEXT_PUBLIC_API_BASE_URL` is available to client-side helpers if needed
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` enables Google Places autocomplete and richer map previews in manager place forms
- In production on Vercel, `API_BASE_URL` must point to the real deployed backend. If it is missing, the frontend proxy routes fall back to `http://127.0.0.1:8000`, which causes `Could not reach backend` errors.

## Local Setup

### 1. Install dependencies

```bash
cd yee-frontend
npm install
```

### 2. Start the frontend

```bash
npm run dev
```

Frontend URL:

- [http://localhost:3000](http://localhost:3000)

### 3. Start the backend

In a second terminal:

```bash
cd ../audit-tools-backend
.venv/bin/uvicorn app.main:app --reload
```

Useful backend URLs:

- [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
- [http://127.0.0.1:8000/yee/instrument](http://127.0.0.1:8000/yee/instrument)

If the backend is offline, the frontend proxy routes will return `502 Could not reach backend`.

## Demo Accounts

These are useful for local or tunnel-based testing:

- Admin: `admin-demo@yee.local` / `DemoPass123!`
- Manager: `manager-demo@yee.local` / `DemoPass123!`
- Auditor 1: `auditor-demo-1@yee.local` / `DemoPass123!`
- Auditor 2: `auditor-demo-2@yee.local` / `DemoPass123!`
- Auditor 3: `auditor-demo-3@yee.local` / `DemoPass123!`

## Route Map

The public URL map is stable. Internally, `src/app` uses route groups such as
`(auth)`, `(onboarding)`, `(admin)`, `(manager)`, `(auditor)`, and `(fieldwork)`
so the code structure reflects ownership without changing URLs.

### Public and onboarding routes

- `/`
- `/login`
- `/signup`
- `/forgot-password`
- `/reset-password`
- `/verify-email`
- `/invite/[token]`
- `/manager-invite/[token]`
- `/waiting-approval`
- `/complete-profile`

### Admin routes

- `/admin`
- `/admin/users`
- `/admin/projects`
- `/admin/places`
- `/admin/audits`
- `/admin/raw-data`
- `/admin/settings`

### Manager routes

- `/manager`
- `/manager/projects`
- `/manager/projects/new`
- `/manager/projects/[projectId]`
- `/manager/projects/[projectId]/edit`
- `/manager/places`
- `/manager/places/new`
- `/manager/places/[placeId]`
- `/manager/places/[placeId]/edit`
- `/manager/auditors`
- `/manager/auditors/invite`
- `/manager/audits`
- `/manager/reports`
- `/manager/raw-data`
- `/manager/settings`

### Auditor routes

- `/auditor`
- `/auditor/places`
- `/auditor/settings`
- `/yee/introduction`
- `/yee/audit/[placeId]`
- `/yee/audit/[placeId]/page/[step]`
- `/yee/audit/[placeId]/review`
- `/yee/audit/[placeId]/submitted`
- `/yee/submissions/[submissionId]`

Notes:

- the visible `My Audits` page lives at `/auditor/places`

### Frontend proxy API routes

Auth:

- `/api/auth/login`
- `/api/auth/signup`
- `/api/auth/session`
- `/api/auth/me`
- `/api/auth/logout`
- `/api/auth/forgot-password`
- `/api/auth/reset-password`
- `/api/auth/verify-email`
- `/api/auth/resend-verification`
- `/api/auth/complete-profile`
- `/api/auth/invite/[token]`
- `/api/auth/invite/[token]/accept`
- `/api/auth/manager-invites/[token]`
- `/api/auth/manager-invites/[token]/accept`

Dashboard:

- `/api/dashboard/overview`
- `/api/dashboard/projects`
- `/api/dashboard/projects/[projectId]`
- `/api/dashboard/places`
- `/api/dashboard/places/[placeId]`
- `/api/dashboard/auditors`
- `/api/dashboard/assignments`
- `/api/dashboard/auditor-invites`
- `/api/dashboard/audits`
- `/api/dashboard/reports/place-comparisons`
- `/api/dashboard/raw-data`
- `/api/dashboard/my-places`

## Developer Notes

### YEE instrument source of truth

The YEE survey UI is driven by a backend-derived instrument payload:

- source file: backend `app/data/yee_instrument.qsf`
- backend normalization: backend `app/yee_scoring.py`
- frontend fetch helper: [`src/features/yee-audit/api/yee-instrument.ts`](yee-frontend/src/features/yee-audit/api/yee-instrument.ts)

The backend currently enriches the instrument payload with:

- scored survey items
- block/domain names
- normalized block titles
- lightweight item kind metadata for presence vs condition rows
- section intro text
- section comment prompts

This keeps the frontend survey rendering aligned to the actual instrument instead of duplicating fragile wording in React.

### Editing and persistence

Project and place editing now use real patch flows:

- frontend proxy helpers in [`src/features/workspaces/api/live-api.ts`](yee-frontend/src/features/workspaces/api/live-api.ts)
- Next API proxy routes under `src/app/api/dashboard/projects/[projectId]` and `src/app/api/dashboard/places/[placeId]`
- backend persistence in the FastAPI dashboard router

### What is still intentionally pending

- final cap-score denominator/percentage logic
- any future mobile/offline app work
- broader spreadsheet-by-spreadsheet copy polishing beyond the QSF-backed metadata already exposed
- `/api/dashboard/users`

YEE:

- `/api/yee/instrument`
- `/api/yee/audits`
- `/api/yee/audits/[submissionId]`
- `/api/yee/audits/score`
- `/api/yee/my-audits`
- `/api/yee/places/[placeId]/audit-state`

## Project Structure

High-level structure:

```text
src/
  app/
    (public)/
    (auth)/
    (onboarding)/
    (fieldwork)/
    admin/
    manager/
    auditor/
    api/
      auth/
      dashboard/
      yee/
    layout.tsx
    not-found.tsx
  components/
    app/
    brand/
    layouts/
      dashboard/
    providers/
    ui/
  features/
    admin/
    auditor/
    auth/
    manager/
    reporting/
    workspaces/
    yee-audit/
  lib/
    api/
    csv/
    auth/
      cookies.ts
    format.ts
    utils.ts
  server/
    backend/
      config.ts
      proxy.ts
      response.ts
  types/
    auth.ts
```

Important files:

- App shell: [`src/app/layout.tsx`](yee-frontend/src/app/layout.tsx)
- Providers: [`src/components/providers/app-providers.tsx`](yee-frontend/src/components/providers/app-providers.tsx)
- Auth provider: [`src/features/auth/components/auth-provider.tsx`](yee-frontend/src/features/auth/components/auth-provider.tsx)
- Dashboard shell: [`src/components/layouts/dashboard/dashboard-shell.tsx`](yee-frontend/src/components/layouts/dashboard/dashboard-shell.tsx)
- Workspace data helpers: [`src/features/workspaces/api/live-api.ts`](yee-frontend/src/features/workspaces/api/live-api.ts)
- Reporting UI: [`src/features/reporting/components/live-reports.tsx`](yee-frontend/src/features/reporting/components/live-reports.tsx)
- YEE wizard: [`src/features/yee-audit/components/yee-audit-wizard.tsx`](yee-frontend/src/features/yee-audit/components/yee-audit-wizard.tsx)
- Submitted results page: [`src/features/yee-audit/components/yee-submission-report.tsx`](yee-frontend/src/features/yee-audit/components/yee-submission-report.tsx)
- YEE draft/results client helpers: [`src/features/yee-audit/api/yee-audit-api.ts`](yee-frontend/src/features/yee-audit/api/yee-audit-api.ts)
- Backend proxy helpers: [`src/server/backend/proxy.ts`](yee-frontend/src/server/backend/proxy.ts)
- Shared auth/session types: [`src/types/auth.ts`](yee-frontend/src/types/auth.ts)

## Architecture Summary

The frontend uses a simple layered pattern:

1. page routes render UI containers
2. features own role and workflow UI/client helpers
3. shared components provide UI, brand, providers, and layout shells
4. frontend proxy routes forward to the FastAPI backend

This keeps backend URLs and tokens out of most UI components and gives one place to handle `502 Could not reach backend` behavior.

For more detail, see:

- [docs/architecture.md](yee-frontend/docs/architecture.md)
- [docs/roles-and-permissions.md](yee-frontend/docs/roles-and-permissions.md)
- [docs/scoring.md](yee-frontend/docs/scoring.md)
- [docs/deployment.md](yee-frontend/docs/deployment.md)

## Known Limitations / Pending Work

- Some feature modules are still large and should be split along existing export
  boundaries in later behavior-preserving cleanup passes.
- Some pages are still placeholder-style UI shells around live backend data and will need more product polish.
- The YEE flow now has backend-backed draft state and locked submitted results, but it is still a place-scoped draft model rather than a more advanced revisioned audit-session system.
- Final visual design and accessibility review are still future work, but the repo now includes a curated web screenshot capture flow at `pnpm screenshots:web` plus public auth visual baselines via `pnpm test:visual`.

## Verification Commands

Useful checks:

```bash
pnpm dev
pnpm build
pnpm test:unit
pnpm test:visual
pnpm screenshots:web
```

If you are validating the full product locally, run both repos:

```bash
cd ../audit-tools-backend
.venv/bin/uvicorn app.main:app --reload

cd yee-frontend
npm run dev
```

## Public Testing

If you share the app through ngrok or another tunnel:

- keep the frontend server running
- keep the backend server running
- keep the tunnel process running
- remember that the public URL changes when a new ngrok session starts

## Related Docs

- [docs/architecture.md](yee-frontend/docs/architecture.md)
- [docs/roles-and-permissions.md](yee-frontend/docs/roles-and-permissions.md)
- [docs/scoring.md](yee-frontend/docs/scoring.md)
- [docs/deployment.md](yee-frontend/docs/deployment.md)
