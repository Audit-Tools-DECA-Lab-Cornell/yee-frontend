# audit-tools-yee-frontend

Next.js frontend for the Audit Tools platform. This app now includes:

- auth and onboarding entry pages
- separate role-based dashboard experiences for admin, manager, and auditor
- manager action routes for creating projects and places
- the Youth Enabling Environments (YEE) audit form under its own route
- local Next.js API proxy routes that forward audit requests to the backend

The frontend and backend live in separate repos. This repo is the product UI layer.

## Current product direction

This app is no longer treated as "just the YEE survey page".

The current frontend structure reflects the broader platform flow:

- users start at login
- onboarding state determines where they go next
- dashboard pages act as the main workspace
- navigation and allowed actions vary by role
- the YEE audit form is one child workflow inside the product

Current mocked flow:

1. `/` redirects to `/login`
2. user can navigate through mocked login states
3. onboarding pages simulate approval and profile completion
4. dashboard pages provide the main navigation shell
5. audit actions open the YEE form at `/yee/audit/[placeId]`

## Tech stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- lucide-react
- React Query

## Prerequisites

- Node.js 20+
- npm
- backend repo available locally if you want the audit form to load real data

Backend default:

- `http://127.0.0.1:8000`

## Environment variables

The frontend uses `.env` for backend connectivity.

Expected values:

```bash
API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

Notes:

- `API_BASE_URL` is used by server-side proxy routes under `src/app/api/yee/*`
- `NEXT_PUBLIC_API_BASE_URL` is used by the client API helper in `src/lib/api/api-client.ts`

## Getting started

### 1. Install dependencies

```bash
cd audit-tools-yee-frontend
npm install
```

### 2. Start the frontend

```bash
npm run dev
```

Open:

- [http://localhost:3000](http://localhost:3000)

### 3. Start the backend if you want the YEE audit form to work

In a second terminal:

```bash
cd /Users/andishasafdariyan/auditTools/audit-tools-backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

Useful backend URLs:

- [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
- [http://127.0.0.1:8000/yee/instrument](http://127.0.0.1:8000/yee/instrument)

If the backend is not running, the survey route will show a `502 Could not reach backend` error through the frontend proxy.

## Available routes

### Auth and onboarding

- `/`
  - redirects to `/login`
- `/login`
  - mocked login entry page
- `/signup`
  - mocked signup page
- `/waiting-approval`
  - placeholder page for auditor approval state
- `/complete-profile`
  - placeholder page for required onboarding/profile setup

### Admin routes

- `/admin`
  - admin overview with system-wide metrics and account snapshot
- `/admin/users`
  - all users across roles and organizations
- `/admin/projects`
  - project list using shared dashboard content
- `/admin/places`
  - place list using shared dashboard content
- `/admin/audits`
  - audit list using shared dashboard content
- `/admin/settings`
  - admin-only settings placeholder

### Manager routes

- `/dashboard`
  - manager overview with quick actions
- `/dashboard/projects`
  - project list
- `/dashboard/projects/new`
  - create project placeholder form
- `/dashboard/places`
  - place list
- `/dashboard/places/new`
  - add place placeholder form
- `/dashboard/auditors`
  - auditor management list with invite action
- `/dashboard/audits`
  - audit list
- `/dashboard/reports`
  - report and comparison placeholder
- `/dashboard/settings`
  - manager settings placeholder

### Auditor routes

- `/my-dashboard`
  - auditor overview
- `/my-dashboard/places`
  - assigned places only
- `/my-dashboard/audits`
  - personal audit history only
- `/my-dashboard/settings`
  - personal settings placeholder

### YEE audit

- `/yee/audit/[placeId]`
  - YEE audit form page for a specific place
  - example: `/yee/audit/place-central-park`

### Local proxy API routes

- `/api/yee/instrument`
  - proxies backend `GET /yee/instrument`
- `/api/yee/audits`
  - proxies backend `POST /yee/audits`
- `/api/yee/audits/score`
  - proxies backend `POST /yee/audits/score`

## How the app is organized

### App routes

```text
src/app/
  api/yee/
    audits/route.ts
    audits/score/route.ts
    instrument/route.ts
  admin/
    audits/page.tsx
    layout.tsx
    page.tsx
    places/page.tsx
    projects/page.tsx
    settings/page.tsx
    users/page.tsx
  complete-profile/page.tsx
  dashboard/
    auditors/page.tsx
    audits/page.tsx
    layout.tsx
    page.tsx
    places/page.tsx
    places/new/page.tsx
    projects/page.tsx
    projects/new/page.tsx
    reports/page.tsx
    settings/page.tsx
  login/page.tsx
  my-dashboard/
    audits/page.tsx
    layout.tsx
    page.tsx
    places/page.tsx
    settings/page.tsx
  signup/page.tsx
  waiting-approval/page.tsx
  yee/audit/[placeId]/page.tsx
  globals.css
  layout.tsx
  page.tsx
  providers.tsx
```

### Shared UI and feature components

```text
src/components/
  auth/
    auth-shell.tsx
  dashboard/
    dashboard-header.tsx
    dashboard-shell.tsx
    dashboard-sidebar.tsx
  yee/
    yee-audit-form.tsx
  ui/
    badge.tsx
    button.tsx
    card.tsx
    input.tsx
    label.tsx
    ...
```

### Supporting libraries

```text
src/lib/
  api/
    api-client.ts
  auth/
    mock-auth.ts
  dashboard/
    mock-data.ts
    workspace-config.ts
  utils.ts
```

## Key implementation details

### Homepage behavior

File:

- `src/app/page.tsx`

What it does:

- redirects all traffic from `/` to `/login`
- prevents the survey from being the first screen users see

### Auth flow

Files:

- `src/app/login/page.tsx`
- `src/app/signup/page.tsx`
- `src/app/waiting-approval/page.tsx`
- `src/app/complete-profile/page.tsx`
- `src/components/auth/auth-shell.tsx`
- `src/lib/auth/mock-auth.ts`

What it does:

- provides the first-pass product flow before backend auth is fully wired
- uses mocked role and approval/profile states
- gives a realistic navigation structure for admin, manager, and auditor journeys

Current limitation:

- forms are not connected to real backend auth endpoints yet
- login/signup buttons currently demonstrate navigation states, not real authentication

### Dashboard shell

Files:

- `src/app/dashboard/layout.tsx`
- `src/app/admin/layout.tsx`
- `src/app/my-dashboard/layout.tsx`
- `src/components/dashboard/dashboard-shell.tsx`
- `src/components/dashboard/dashboard-sidebar.tsx`
- `src/components/dashboard/dashboard-header.tsx`
- `src/lib/dashboard/workspace-config.ts`

What it does:

- creates a shared role-aware dashboard layout
- includes responsive sidebar behavior
- provides a consistent top header and action area
- swaps navigation, copy, badges, and primary actions by role

### Dashboard content

Files:

- `src/app/dashboard/page.tsx`
- `src/app/dashboard/auditors/page.tsx`
- `src/app/dashboard/projects/page.tsx`
- `src/app/dashboard/projects/new/page.tsx`
- `src/app/dashboard/places/page.tsx`
- `src/app/dashboard/places/new/page.tsx`
- `src/app/dashboard/audits/page.tsx`
- `src/app/dashboard/reports/page.tsx`
- `src/app/dashboard/settings/page.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/users/page.tsx`
- `src/app/my-dashboard/page.tsx`
- `src/app/my-dashboard/places/page.tsx`
- `src/app/my-dashboard/audits/page.tsx`
- `src/app/my-dashboard/settings/page.tsx`
- `src/lib/dashboard/mock-data.ts`

What it does:

- uses mock data to make each role-specific dashboard feel realistic before backend endpoints are ready
- gives managers action-oriented pages, auditors a simplified fieldwork view, and admins a system-wide overview
- shows tables and summary cards that can later be replaced with API-backed queries

### YEE audit form

Files:

- `src/app/yee/audit/[placeId]/page.tsx`
- `src/components/yee/yee-audit-form.tsx`

What it does:

- moves the YEE form out of the homepage
- scopes the form to a place-based route
- still uses the existing proxy API routes for instrument loading and audit submission

Requirement:

- backend must be running for instrument loading and submission to work

## Backend integration notes

This frontend currently depends on the backend for audit-specific functionality.

Expected backend behavior:

- `GET /yee/instrument`
- `POST /yee/audits`
- `POST /yee/audits/score`

Planned future backend integration areas:

- login
- signup
- current user / session
- role detection
- approval status
- profile completion status
- projects
- places
- audits
- auditors

The current frontend structure is designed so those endpoints can be added without changing the overall route architecture.

## Mocked behavior vs real behavior

### Already real

- App Router routing
- dashboard layout and pages
- YEE route placement
- survey fetch and submit flow through frontend proxy routes
- backend environment variable configuration

### Still mocked

- login
- signup
- role-based redirect logic
- approval workflow
- profile completion workflow
- dashboard data

## Common commands

Run the dev server:

```bash
npm run dev
```

Run lint:

```bash
npm run lint -- src/app src/components src/lib
```

Run production build:

```bash
npm run build
```

Format the repo:

```bash
npm run format
```

## Recommended local test path

If you want to sanity-check the current product flow manually:

1. open `/`
2. confirm it redirects to `/login`
3. click one of the mocked login states
4. confirm onboarding pages work
5. open `/dashboard`
6. navigate through projects, places, audits, and settings
7. click `Start Audit`
8. confirm the app opens `/yee/audit/place-central-park`
9. if backend is running, confirm the instrument loads

## Known limitations

- auth is placeholder-only right now
- dashboard tables use mocked data
- route protection is still mocked through login choices rather than a real session
- there are no project detail or place detail pages yet
- there is no route protection yet
- the audit route is reachable directly without login guard
- backend proxy routes work only if the backend is available
- Next may warn about multiple lockfiles in the parent workspace during builds

## Suggested next steps

1. Replace mocked auth flow with real backend login/signup/current-user calls.
2. Add route guards based on user state and role.
3. Replace dashboard mock data with React Query hooks.
4. Add project profile and place profile pages.
5. Add assignment-aware start-audit logic using real place records.
6. Add results/review pages after audit submission.

## Handoff summary

If another engineer opens this repo today, the important things to know are:

- the app starts at `/login`, not the survey
- the dashboard and the YEE form stay in the same frontend repo
- the survey lives at `/yee/audit/[placeId]`
- dashboard pages are scaffolded and styled, but still mocked
- audit data still depends on the backend running at `127.0.0.1:8000` unless environment variables are changed
