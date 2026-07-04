# Roles and Permissions

## Purpose

This document describes the role model implemented in the frontend and how it maps to route access and UI behavior.

## Roles

The current product supports three roles:

- `ADMIN`
- `MANAGER`
- `AUDITOR`

The backend is the authority for role and account state. The frontend reads that from the authenticated session payload.

## Shared auth state

The frontend session user shape includes:

- `account_type`
- `email_verified`
- `approved`
- `profile_completed`
- `next_step`
- `dashboard_path`
- `has_auditor_profile`
- `auditor_dashboard_path`

The frontend uses those values to decide where a user should go next after login or session restore.

Key file:

- [`src/features/auth/session.ts`](yee-frontend/src/features/auth/session.ts)

## Route behavior by user state

### Unverified user

Frontend route target:

- `/verify-email`

### Not approved user

Frontend route target:

- `/waiting-approval`

### Approved but incomplete profile

Frontend route target:

- `/complete-profile`

### Fully onboarded user

Frontend route target depends on role:

- admin -> `/admin`
- manager -> `/manager`
- auditor -> `/auditor`

## Admin

### Scope

Admins are intended to have system-wide visibility.

### Frontend routes

- `/admin`
- `/admin/users`
- `/admin/projects`
- `/admin/places`
- `/admin/audits`
- `/admin/raw-data`
- `/admin/settings`

### Current admin UI expectations

- user overview
- organization-level summaries
- access to all users
- raw-data and reporting access

### Data characteristics

Admin pages use backend-scoped endpoints that are not restricted to one manager organization.

## Manager

### Scope

Managers are scoped to their organization/account.

### Frontend routes

- `/manager`
- `/manager/projects`
- `/manager/projects/new`
- `/manager/projects/[projectId]`
- `/manager/places`
- `/manager/places/new`
- `/manager/places/[placeId]`
- `/manager/auditors`
- `/manager/auditors/invite`
- `/manager/audits`
- `/manager/reports`
- `/manager/raw-data`
- `/manager/settings`

### Current manager capabilities

- view organization-scoped projects
- view and create places
- assign auditors to project/place scope
- review submitted audits
- export raw data
- view comparison reports
- open any individual submitted report in their org's projects at
  `/yee/submissions/[submissionId]` (backend `GET /yee/audits/{submission_id}`
  grants project-scoped read access; no auditor profile required)

## Dual-role manager (self auditor profile)

Managers can also act as auditors inside their own organization.

- A manager creates their auditor profile once from `/manager/settings`
  (backend `POST /yee/dashboard/my-auditor-profile`, idempotent). The profile
  is a standard auditor profile row on the same user and account.
- The session then carries `has_auditor_profile: true` and
  `auditor_dashboard_path: "/auditor"`; the dashboard header shows an
  "Auditor view" / "Manager view" switch.
- Middleware (`src/proxy.ts`) lets a MANAGER with `has_auditor_profile` open
  AUDITOR routes.
- Field work still requires assignments: the manager must assign their own
  auditor profile to places from Manager View (`/manager/auditors`). The
  auditor-view empty state links there when the signed-in user is a manager.
- Viewing reports does NOT require an auditor profile — the profile is only
  for submitting audits yourself.
- Mobile: the Expo app accepts AUDITOR accounts and MANAGER accounts that
  already own a self auditor profile. A manager without one is signed out
  with an explanatory message and must create the profile on the web first.

## Auditor

### Scope

Auditors are restricted to their own assigned places and their own YEE submissions.

### Frontend routes

- `/auditor`
- `/auditor/places`
- `/auditor/settings`
- `/yee/introduction`
- `/yee/audit/[placeId]/page/[step]`
- `/yee/audit/[placeId]/review`
- `/yee/audit/[placeId]/submitted`
- `/yee/submissions/[submissionId]`

### Current auditor capabilities

- view assigned places only
- start or continue YEE draft for an assigned place
- review and submit one YEE audit per place
- view locked submitted results for their own submissions

### Important auditor restriction

One submitted audit per place per auditor must remain enforced by the backend.

## Frontend permission pattern

The frontend does not try to fully reimplement backend authorization.

Instead:

- it uses the session role to render the correct navigation and user flow
- it calls role-scoped backend endpoints
- it relies on backend `403` responses for hard enforcement

This is the correct model for a role-based product where data protection matters.

## Auditor privacy

The frontend should use generated public auditor identifiers rather than personal names in results and reporting surfaces.

Current public-facing identifier pattern:

- `AUD-001`
- `AUD-002`
- `AUD-003`

Use these in:

- read-only submitted results
- comparison/reporting pages
- raw-data export surfaces intended for analysis

Avoid showing full personal identity in comparative/reporting contexts unless explicitly required for an internal restricted view.

## Current implementation notes

- signup currently allows manager and auditor role selection
- admin is expected through seeded/demo or managed backend provisioning rather than public signup
- frontend role navigation is implemented, but backend remains the final authority
