# Frontend Architecture

## Purpose

This document explains how the Audit Tools frontend is structured today so future engineers can understand where data comes from, where routing decisions happen, and where to extend the app safely.

## Top-Level Architecture

The frontend is a Next.js App Router application that acts as the browser UI layer for the Audit Tools platform.

It is intentionally separated from the FastAPI backend.

Current responsibilities of the frontend:

- render auth and onboarding pages
- render role-based dashboard UIs
- render manager/admin tables and reporting views
- render the YEE audit workflow
- store frontend session state
- proxy browser requests to the backend

Current responsibilities of the backend:

- authentication
- authorization
- project/place/auditor/audit data
- YEE scoring
- YEE draft and submission persistence
- reporting and export payloads

## Layering

The app follows a lightweight layered model:

1. `src/app/*`
   - route entry points
   - page-level wiring
   - local Next.js API proxy handlers
   - URL-neutral route groups for public, auth, onboarding, and YEE fieldwork
   - canonical role URL folders for admin, manager, and auditor surfaces

2. `src/features/*`
   - feature-owned hooks, state machines, and domain-specific client logic
   - current slices are `auth`, `admin`, `manager`, `auditor`, `workspaces`,
     `reporting`, and `yee-audit`
   - the client-side report export pipeline lives under
     `src/features/reporting/export/` (branded PDFs, styled Excel, byte-compatible
     CSVs, per-chart PNG/SVG, bulk ZIP). Consumers import only from its
     `index.ts` (dynamic-import target) or the jsPDF-free `dashboard-charts.ts`;
     see [`docs/report-exports/`](report-exports/) for the catalog and plan.

3. `src/components/*`
   - shared UI primitives
   - brand presentation
   - shared layout shells
   - app-wide client providers under `src/components/providers`

4. `src/lib/*`
   - generic API primitives
   - CSV and formatting utilities
   - server cookie helpers used by route handlers and middleware

5. backend proxy layer
   - `src/app/api/auth/*`
   - `src/app/api/dashboard/*`
   - `src/app/api/yee/*`
   - shared proxy internals in `src/server/backend/*`

6. `src/types/*`
   - cross-cutting type contracts that are safe to import from server and
     client modules

## App Router organization

Route groups in parentheses organize public/auth/onboarding/fieldwork routes
without adding URL segments. Role dashboards use concrete URL folders because
their public URLs are now canonical:

```text
src/app/
  (public)/              -> /
  (auth)/                -> /login, /signup, password, email verification
  (onboarding)/          -> invites, approval, profile completion
  (fieldwork)/yee/       -> /yee/*
  admin/                  -> /admin/*
  manager/                -> /manager/*
  auditor/                -> /auditor/*
  api/                   -> /api/* frontend proxy routes
```

Keep `src/app` focused on routing, layouts, loading states, error boundaries,
and route handlers. Feature UI and client providers should live outside `app`
unless a component is intentionally colocated with a single route.

## Feature-folder policy

Use `src/features/*` for code owned by one product workflow or role surface.
Feature folders contain route-facing components, hooks, state machines,
feature-local API adapters, and domain helpers.

Keep these folders shared:

- `src/components/ui` for design-system primitives
- `src/components/brand` for brand assets and presentation
- `src/components/layouts` for shared layout shells
- `src/components/providers` for app-wide client providers

Keep `src/lib` reserved for generic utilities, formatting, CSV helpers, generic
API primitives, and the server cookie helper used by route handlers and
middleware. Keep backend proxy internals in `src/server/backend`; do not import
them into client feature modules, and do not import feature implementation code
from `src/app/api/**`.

Import boundaries:

- `src/app/**` imports feature entrypoints, shared layouts, and route handlers.
- `src/features/**` may import shared UI/layout/provider primitives and generic
  `src/lib` utilities.
- `src/components/**` must not import feature-owned UI or domain helpers.
- `src/lib/**` must not import feature code.
- `src/server/backend/**` is server-only infrastructure for route handlers.
- `src/types/**` must stay browser-safe and avoid runtime side effects.

## Why the proxy layer exists

The browser UI does not call the backend directly in most cases.

Instead it calls frontend routes like:

- `/api/auth/login`
- `/api/dashboard/overview`
- `/api/yee/audits`

Those route handlers forward the request to the FastAPI backend using `API_BASE_URL`.

Benefits:

- backend base URL is centralized
- auth headers can be forwarded in one place
- browser components stay simpler
- frontend can show consistent `502 Could not reach backend` errors

## Auth architecture

Session flow:

1. user submits login/signup from UI
2. frontend calls `/api/auth/*`
3. backend returns user + token
4. Next.js route handlers store the token in an HttpOnly cookie
5. `AuthProvider` restores the session on page load using `/api/auth/session`

Key files:

- [`src/features/auth/components/auth-provider.tsx`](yee-frontend/src/features/auth/components/auth-provider.tsx)
- [`src/features/auth/api.ts`](yee-frontend/src/features/auth/api.ts)
- [`src/features/auth/session.ts`](yee-frontend/src/features/auth/session.ts)

## Dashboard architecture

There are three dashboard families:

- admin: `/admin/*`
- manager: `/manager/*`
- auditor: `/auditor/*`

The layouts are shared at the shell level, but the visible navigation and data are role-specific.

Important files:

- [`src/components/layouts/dashboard/dashboard-shell.tsx`](yee-frontend/src/components/layouts/dashboard/dashboard-shell.tsx)
- [`src/components/layouts/dashboard/dashboard-sidebar.tsx`](yee-frontend/src/components/layouts/dashboard/dashboard-sidebar.tsx)
- [`src/features/admin/components/live-dashboard.ts`](yee-frontend/src/features/admin/components/live-dashboard.ts)
- [`src/features/manager/components/live-dashboard.ts`](yee-frontend/src/features/manager/components/live-dashboard.ts)
- [`src/features/auditor/components/auditor-overview.tsx`](yee-frontend/src/features/auditor/components/auditor-overview.tsx)

## YEE architecture

The YEE workflow has three distinct states:

1. not started
2. draft / in progress
3. submitted / locked

### Current source of truth

The current YEE implementation is backend-backed.

Draft and submitted state are fetched from:

- `/api/yee/places/[placeId]/audit-state`
- `/api/yee/audits/[submissionId]`

The wizard no longer treats browser local storage as the canonical record for review/submitted pages.

### Draft flow

Routes:

- `/yee/audit/[placeId]/page/[step]`
- `/yee/audit/[placeId]/review`

Behavior:

- loads current audit state from backend
- persists draft updates back to backend
- uses backend-backed values on review
- uses backend score preview contract

### Submitted flow

Routes:

- `/yee/audit/[placeId]/submitted`
- `/yee/submissions/[submissionId]`

Behavior:

- submitted confirmation page shows the real backend timestamp and submission id
- read-only results page loads by `submissionId`
- submitted audits should not reopen editable review flow

Key files:

- [`src/features/yee-audit/components/yee-audit-wizard.tsx`](yee-frontend/src/features/yee-audit/components/yee-audit-wizard.tsx)
- [`src/features/yee-audit/components/yee-submission-report.tsx`](yee-frontend/src/features/yee-audit/components/yee-submission-report.tsx)
- [`src/features/yee-audit/api/yee-audit-api.ts`](yee-frontend/src/features/yee-audit/api/yee-audit-api.ts)
- [`src/features/yee-audit/scoring/yee-scoring.ts`](yee-frontend/src/features/yee-audit/scoring/yee-scoring.ts)

## Data-fetching style

The codebase currently uses plain `fetch` in most feature helpers rather than a full centralized query layer.

That means future maintainers should watch for:

- repeated request patterns
- duplicated response parsing
- duplicated auth header handling

If the app grows, this is a good candidate for gradual consolidation.

## Caching policy

Authenticated dashboard, audit, reporting, and session data is role-scoped and
must remain dynamic/private. The backend proxy helpers and client API helpers
use `cache: "no-store"` for these requests, and new role-scoped data paths
should follow that policy unless an explicit caching ADR changes it.

The repo is on Next.js 16 with Cache Components enabled
(`cacheComponents: true` in `next.config.ts`). `use cache` is applied only to
public, non-role-scoped data:

- `/api/site-copy` — cached via `fetchPublicCached` in
  `src/server/backend/cached.ts` under the `site-copy` tag; admin site-copy
  mutation routes expire it with `revalidateTag("site-copy", { expire: 0 })`.
- `/api/yee/instrument` — same helper, `yee-instrument` tag; admin instrument
  mutation routes expire it.
- `/api/google-maps/static-map` — the upstream Google Static Maps image fetch
  is cached with `cacheLife("days")` (keyed by the full request URL).

Never route authenticated data through `fetchPublicCached`; role-scoped paths
stay on `proxyRequest`/`no-store`.

## Extending the app safely

Preferred approach:

1. add or update backend endpoint
2. add or update frontend proxy route under `src/app/api`
3. add or update a feature-local helper in `src/features`
4. consume that helper from the UI

Avoid:

- hardcoding backend URLs inside feature components
- scattering role checks inside many unrelated components
- introducing new frontend-only state for data that already lives in the backend

## Current architectural gaps

- there is no global typed API client abstraction across all feature areas yet
- the YEE draft model is functional but simpler than the Playspace audit-session model
- several behavior-heavy feature modules remain large and should be split along
  existing export boundaries in later refactor passes
- some older helper files still reflect earlier scaffold assumptions and may need cleanup later
