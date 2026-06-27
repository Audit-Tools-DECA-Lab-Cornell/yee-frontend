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

The frontend uses those values to decide where a user should go next after login or session restore.

Key file:

- [`src/lib/auth/session.ts`](yee-frontend/src/lib/auth/session.ts)

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
- manager -> `/dashboard`
- auditor -> `/my-dashboard`

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

- `/dashboard`
- `/dashboard/projects`
- `/dashboard/projects/new`
- `/dashboard/projects/[projectId]`
- `/dashboard/places`
- `/dashboard/places/new`
- `/dashboard/places/[placeId]`
- `/dashboard/auditors`
- `/dashboard/auditors/invite`
- `/dashboard/audits`
- `/dashboard/reports`
- `/dashboard/raw-data`
- `/dashboard/settings`

### Current manager capabilities

- view organization-scoped projects
- view and create places
- assign auditors to project/place scope
- review submitted audits
- export raw data
- view comparison reports

## Auditor

### Scope

Auditors are restricted to their own assigned places and their own YEE submissions.

### Frontend routes

- `/my-dashboard`
- `/my-dashboard/places`
- `/my-dashboard/audits`
- `/my-dashboard/settings`
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
