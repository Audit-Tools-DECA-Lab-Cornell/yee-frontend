# Audit Tools Frontend

Next.js frontend for DECA Lab's Audit Tools platform. This repository contains the browser UI for authentication, role-based dashboards, manager/admin reporting, and the Youth Enabling Environments (YEE) audit workflow.

The frontend and backend live in separate repos:

- Frontend: this repo
- Backend: FastAPI service in `audit-tools-backend`

The frontend talks to the backend through local Next.js API proxy routes under [`src/app/api`](/Users/andishasafdariyan/auditTools/audit-tools-yee-frontend/src/app/api).

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

- `/dashboard`
- `/dashboard/projects`
- `/dashboard/projects/new`
- `/dashboard/projects/[projectId]`
- `/dashboard/projects/[projectId]/edit`
- `/dashboard/places`
- `/dashboard/places/new`
- `/dashboard/places/[placeId]`
- `/dashboard/places/[placeId]/edit`
- `/dashboard/auditors`
- `/dashboard/auditors/invite`
- `/dashboard/audits`
- `/dashboard/reports`
- `/dashboard/raw-data`
- `/dashboard/settings`

### Auditor

Auditors can access only their own assigned work:

- `/my-dashboard`
- `/my-dashboard/places`
- `/my-dashboard/audits`
- `/my-dashboard/settings`
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

The frontend stores the signed-in session in browser local storage through [`src/lib/auth/session.ts`](/Users/andishasafdariyan/auditTools/audit-tools-yee-frontend/src/lib/auth/session.ts).

### YEE audit flow

The YEE audit flow is split into multiple pages:

- `/yee/introduction`
- `/yee/audit/[placeId]/page/1` through `/page/8`
- `/yee/audit/[placeId]/review`
- `/yee/audit/[placeId]/submitted`
- `/yee/submissions/[submissionId]`

Current behavior:

- step pages and review use backend-backed draft state via `/api/yee/places/[placeId]/audit-state`
- draft data includes metadata, high-level answers, domain weights, comments, and question responses
- the instrument payload now includes section intro text and section comment prompts derived from the source QSF
- page 1 uses the spreadsheet-aligned visit-frequency wording and weather is treated as multi-select
- domain question groups now pair presence and condition answers together, and condition follow-ups only appear when the presence answer is positive
- score preview calls `/api/yee/audits/score` with the backend-required payload shape
- final submission calls `/api/yee/audits`
- after submit, the place becomes locked for that auditor
- submitted audits open a read-only results page at `/yee/submissions/[submissionId]`

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

Cap score percentage and final max-score presentation are intentionally left extensible until the final cap logic is confirmed.

## Tech Stack

- Next.js 15 App Router
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
```

Notes:

- `API_BASE_URL` is used by server-side proxy routes
- `NEXT_PUBLIC_API_BASE_URL` is available to client-side helpers if needed

## Local Setup

### 1. Install dependencies

```bash
cd /Users/andishasafdariyan/auditTools/audit-tools-yee-frontend
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
cd /Users/andishasafdariyan/auditTools/audit-tools-backend
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

### Public and onboarding routes

- `/`
- `/login`
- `/signup`
- `/verify-email`
- `/invite/[token]`
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

- `/dashboard`
- `/dashboard/projects`
- `/dashboard/projects/new`
- `/dashboard/projects/[projectId]`
- `/dashboard/projects/[projectId]/edit`
- `/dashboard/places`
- `/dashboard/places/new`
- `/dashboard/places/[placeId]`
- `/dashboard/places/[placeId]/edit`
- `/dashboard/auditors`
- `/dashboard/auditors/invite`
- `/dashboard/audits`
- `/dashboard/reports`
- `/dashboard/raw-data`
- `/dashboard/settings`

### Auditor routes

- `/my-dashboard`
- `/my-dashboard/places`
- `/my-dashboard/audits`
- `/my-dashboard/settings`
- `/yee/introduction`
- `/yee/audit/[placeId]`
- `/yee/audit/[placeId]/page/[step]`
- `/yee/audit/[placeId]/review`
- `/yee/audit/[placeId]/submitted`
- `/yee/submissions/[submissionId]`

### Frontend proxy API routes

Auth:

- `/api/auth/login`
- `/api/auth/signup`
- `/api/auth/me`
- `/api/auth/verify-email`
- `/api/auth/resend-verification`
- `/api/auth/complete-profile`
- `/api/auth/invite/[token]`
- `/api/auth/invite/[token]/accept`

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
- frontend fetch helper: [`src/lib/yee-instrument.ts`](/Users/andishasafdariyan/auditTools/audit-tools-yee-frontend/src/lib/yee-instrument.ts)

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

- frontend proxy helpers in [`src/lib/dashboard/live-api.ts`](/Users/andishasafdariyan/auditTools/audit-tools-yee-frontend/src/lib/dashboard/live-api.ts)
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
    api/
      auth/
      dashboard/
      yee/
    admin/
    dashboard/
    my-dashboard/
    yee/
  components/
    app/
    auth/
    dashboard/
    reporting/
    ui/
    yee/
  lib/
    api/
    auth/
    dashboard/
    yee-*.ts
```

Important files:

- App shell: [`src/app/layout.tsx`](/Users/andishasafdariyan/auditTools/audit-tools-yee-frontend/src/app/layout.tsx)
- Providers: [`src/app/providers.tsx`](/Users/andishasafdariyan/auditTools/audit-tools-yee-frontend/src/app/providers.tsx)
- Auth provider: [`src/components/auth/auth-provider.tsx`](/Users/andishasafdariyan/auditTools/audit-tools-yee-frontend/src/components/auth/auth-provider.tsx)
- Dashboard shell: [`src/components/dashboard/dashboard-shell.tsx`](/Users/andishasafdariyan/auditTools/audit-tools-yee-frontend/src/components/dashboard/dashboard-shell.tsx)
- Manager/admin live dashboard content: [`src/components/dashboard/live-dashboard.tsx`](/Users/andishasafdariyan/auditTools/audit-tools-yee-frontend/src/components/dashboard/live-dashboard.tsx)
- YEE wizard: [`src/components/yee/yee-audit-wizard.tsx`](/Users/andishasafdariyan/auditTools/audit-tools-yee-frontend/src/components/yee/yee-audit-wizard.tsx)
- Submitted results page: [`src/components/yee/yee-submission-report.tsx`](/Users/andishasafdariyan/auditTools/audit-tools-yee-frontend/src/components/yee/yee-submission-report.tsx)
- YEE draft/results client helpers: [`src/lib/yee-audit-api.ts`](/Users/andishasafdariyan/auditTools/audit-tools-yee-frontend/src/lib/yee-audit-api.ts)
- YEE scoring helpers: [`src/lib/yee-scoring.ts`](/Users/andishasafdariyan/auditTools/audit-tools-yee-frontend/src/lib/yee-scoring.ts)

## Architecture Summary

The frontend uses a simple layered pattern:

1. page routes render UI containers
2. components handle layout and feature UI
3. lib helpers call frontend proxy routes
4. frontend proxy routes forward to the FastAPI backend

This keeps backend URLs and tokens out of most UI components and gives one place to handle `502 Could not reach backend` behavior.

For more detail, see:

- [docs/architecture.md](/Users/andishasafdariyan/auditTools/audit-tools-yee-frontend/docs/architecture.md)
- [docs/roles-and-permissions.md](/Users/andishasafdariyan/auditTools/audit-tools-yee-frontend/docs/roles-and-permissions.md)
- [docs/scoring.md](/Users/andishasafdariyan/auditTools/audit-tools-yee-frontend/docs/scoring.md)
- [docs/deployment.md](/Users/andishasafdariyan/auditTools/audit-tools-yee-frontend/docs/deployment.md)

## Known Limitations / Pending Work

- The frontend still uses browser local session storage rather than cookie-based auth.
- Some pages are still placeholder-style UI shells around live backend data and will need more product polish.
- The YEE flow now has backend-backed draft state and locked submitted results, but it is still a place-scoped draft model rather than a more advanced revisioned audit-session system.
- Final visual design, accessibility review, and full browser automation coverage are still future work.

## Verification Commands

Useful checks:

```bash
npm run dev
npm run build
```

If you are validating the full product locally, run both repos:

```bash
cd /Users/andishasafdariyan/auditTools/audit-tools-backend
.venv/bin/uvicorn app.main:app --reload

cd /Users/andishasafdariyan/auditTools/audit-tools-yee-frontend
npm run dev
```

## Public Testing

If you share the app through ngrok or another tunnel:

- keep the frontend server running
- keep the backend server running
- keep the tunnel process running
- remember that the public URL changes when a new ngrok session starts

## Related Docs

- [docs/architecture.md](/Users/andishasafdariyan/auditTools/audit-tools-yee-frontend/docs/architecture.md)
- [docs/roles-and-permissions.md](/Users/andishasafdariyan/auditTools/audit-tools-yee-frontend/docs/roles-and-permissions.md)
- [docs/scoring.md](/Users/andishasafdariyan/auditTools/audit-tools-yee-frontend/docs/scoring.md)
- [docs/deployment.md](/Users/andishasafdariyan/auditTools/audit-tools-yee-frontend/docs/deployment.md)
