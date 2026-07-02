# ADR-0001: Use route groups before canonical URL migration

## Status
Superseded by ADR-0002

## Context
YEE supports three authenticated account types: admin, manager, and auditor.
Before canonical role URLs were chosen, the frontend needed a lower-risk
structural cleanup that kept every public URL unchanged. Auth, onboarding, role
dashboards, and fieldwork routes previously lived as siblings under `src/app`,
which made product boundaries harder to see.

## Decision
Organize `src/app` with Next.js route groups that do not change public URLs:

- `(public)` for `/`
- `(auth)` for login, signup, password, and email verification
- `(onboarding)` for invites, approval, and profile completion
- role route groups for the then-current role dashboard URLs
- `(fieldwork)` for `/yee/*`

Keep `/api/**` route handlers in place. They are browser-facing BFF endpoints
and should not be renamed as part of filesystem cleanup.

## Consequences

### Positive
- Product ownership is visible in the route tree.
- Public URLs and e2e route paths remain stable.
- Role layouts, loading states, and error boundaries stay close to their route
  families.
- The codebase is prepared for a later feature-folder migration.

### Negative
- Canonical role URLs were still deferred.
- The role route tree temporarily had an extra route-group layer in file paths.

### Neutral
- Canonical role URLs remained a future product decision.
- Next.js 16 Cache Components, `proxy.ts`, and next-forge/Turborepo migration
  remain out of scope for this refactor.

## Alternatives Considered

**Rename URLs immediately to `/manager` and `/auditor`**
- Rejected for this pass because it would require redirects, route-policy
  updates, and broader e2e churn.

**Migrate to next-forge/Turborepo**
- Rejected because this is an existing single Next.js app and the requested
  change is internal organization, not a monorepo migration.

**Leave the route tree unchanged**
- Rejected because the current `src/app` shape hides the public/auth/onboarding
  and role-workspace boundaries.

## References
- `README.md` route map
- `docs/architecture.md`
