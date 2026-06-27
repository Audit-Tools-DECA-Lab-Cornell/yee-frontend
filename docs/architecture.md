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

2. `src/components/*`
   - shared UI
   - auth screens
   - dashboard layout and feature views
   - YEE audit and reporting components

3. `src/lib/*`
   - session helpers
   - frontend API clients
   - dashboard route configuration
   - YEE scoring and state helpers

4. backend proxy layer
   - `src/app/api/auth/*`
   - `src/app/api/dashboard/*`
   - `src/app/api/yee/*`

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
4. frontend stores the token and user in local storage
5. `AuthProvider` restores the session on page load using `/api/auth/me`

Key files:

- [`src/components/auth/auth-provider.tsx`](yee-frontend/src/components/auth/auth-provider.tsx)
- [`src/lib/auth/api.ts`](yee-frontend/src/lib/auth/api.ts)
- [`src/lib/auth/session.ts`](yee-frontend/src/lib/auth/session.ts)

## Dashboard architecture

There are three dashboard families:

- admin: `/admin/*`
- manager: `/dashboard/*`
- auditor: `/my-dashboard/*`

The layouts are shared at the shell level, but the visible navigation and data are role-specific.

Important files:

- [`src/components/dashboard/dashboard-shell.tsx`](yee-frontend/src/components/dashboard/dashboard-shell.tsx)
- [`src/components/dashboard/dashboard-sidebar.tsx`](yee-frontend/src/components/dashboard/dashboard-sidebar.tsx)
- [`src/components/dashboard/live-dashboard.tsx`](yee-frontend/src/components/dashboard/live-dashboard.tsx)
- [`src/components/dashboard/live-detail-pages.tsx`](yee-frontend/src/components/dashboard/live-detail-pages.tsx)

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

- [`src/components/yee/yee-audit-wizard.tsx`](yee-frontend/src/components/yee/yee-audit-wizard.tsx)
- [`src/components/yee/yee-submission-report.tsx`](yee-frontend/src/components/yee/yee-submission-report.tsx)
- [`src/lib/yee-audit-api.ts`](yee-frontend/src/lib/yee-audit-api.ts)
- [`src/lib/yee-scoring.ts`](yee-frontend/src/lib/yee-scoring.ts)

## Data-fetching style

The codebase currently uses plain `fetch` in most feature helpers rather than a full centralized query layer.

That means future maintainers should watch for:

- repeated request patterns
- duplicated response parsing
- duplicated auth header handling

If the app grows, this is a good candidate for gradual consolidation.

## Extending the app safely

Preferred approach:

1. add or update backend endpoint
2. add or update frontend proxy route under `src/app/api`
3. add or update helper in `src/lib`
4. consume that helper from the UI

Avoid:

- hardcoding backend URLs inside feature components
- scattering role checks inside many unrelated components
- introducing new frontend-only state for data that already lives in the backend

## Current architectural gaps

- session storage is local-storage based, not cookie/session middleware based
- there is no global typed API client abstraction across all feature areas yet
- the YEE draft model is functional but simpler than the Playspace audit-session model
- some older helper files still reflect earlier scaffold assumptions and may need cleanup later
