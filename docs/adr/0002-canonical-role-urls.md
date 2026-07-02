# ADR-0002: Use canonical role URLs

## Status
Accepted

## Context
The first routing refactor used route groups to clarify ownership without
changing public URLs. After that cleanup, the remaining browser routes were
still harder to understand than the product model.

## Decision
Use explicit role URLs:

- admin: `/admin/*`
- manager: `/manager/*`
- auditor: `/auditor/*`
- YEE fieldwork: `/yee/*`

Do not keep legacy browser redirects for the old role paths. Update the
frontend route tree, frontend links, route guards, e2e tests, YEE testing docs,
and backend-auth `dashboard_path` / `auditor_dashboard_path` values together.

Keep backend REST and frontend BFF routes stable:

- `/yee/dashboard/*` remains the backend dashboard API namespace.
- `/api/dashboard/*` remains the frontend proxy API namespace.

## Consequences
- Browser URLs now match account types and feature ownership.
- Role route groups are no longer needed for admin, manager, or auditor.
- Existing bookmarks to old browser role paths are not preserved by redirects.
- API clients are unaffected because API paths are unchanged.

## Alternatives Considered

**Use one shared dashboard URL for all roles**
- Rejected because it hides role ownership in routing, tests, docs, and access
  policy.

**Keep old role URLs with redirects**
- Rejected because the project intentionally wants canonical URLs without a
  legacy browser-route compatibility layer.
