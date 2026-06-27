# Production Deployment

## Goal

Publish the YEE website so it is available anytime without relying on a local
laptop, local backend process, or `ngrok`.

Recommended production topology:

- **Frontend:** Vercel
- **Backend:** Render
- **Databases:** Neon PostgreSQL

This keeps the web UI, API, and databases independently hosted and always
available.

## Final architecture

```text
Manager / Auditor / Admin browser
        |
        v
Vercel-hosted Next.js frontend
        |
        v
Render-hosted FastAPI backend
        |
        +--> Neon database: audit_tools_yee
        |
        +--> Neon database: audit_tools_playspace
```

## Why this works well here

- the frontend is already a standard Next.js 15 app
- the backend already includes a `render.yaml`
- the backend already supports separate YEE and Playspace databases
- the frontend already proxies backend requests through `API_BASE_URL`

## 1. Provision the databases

Create two PostgreSQL databases:

- `audit_tools_yee`
- `audit_tools_playspace`

Recommended: create both in the same Neon project.

You will need two connection strings:

- `DATABASE_URL_YEE`
- `DATABASE_URL_PLAYSPACE`

## 2. Deploy the backend on Render

Repo:

- `../audit-tools-backend`

The backend repo already includes:

- [`render.yaml`](../audit-tools-backend/render.yaml)

It now includes:

- automatic pre-deploy Alembic migrations for **both** product databases

### Required Render environment variables

- `DATABASE_URL_YEE`
- `DATABASE_URL_PLAYSPACE`
- `AUTH_TOKEN_SECRET_KEY`

### Strongly recommended backend variables

- `AUTH_ACCESS_TOKEN_TTL_DAYS=7`
- `AUTH_EMAIL_VERIFY_TTL_HOURS=24`
- `AUTH_VERIFY_URL_TEMPLATE=https://YOUR-FRONTEND-DOMAIN/verify-email?token={token}`
- `CORS_ALLOWED_ORIGINS=https://YOUR-FRONTEND-DOMAIN`

### Optional production email variables

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_FROM_EMAIL`
- `SMTP_USE_TLS=true`

### Backend verification

After deploy, verify:

- `GET /health`
- one login flow
- one dashboard route
- one YEE audit route

## 3. Deploy the frontend on Vercel

Repo:

- `yee-frontend`

The frontend is already ready for a normal Vercel deployment.

### Required Vercel environment variables

- `API_BASE_URL=https://YOUR-RENDER-BACKEND-DOMAIN`
- `NEXT_PUBLIC_API_BASE_URL=https://YOUR-RENDER-BACKEND-DOMAIN`

These are both important:

- `API_BASE_URL` is used by server-side Next.js API proxy routes
- `NEXT_PUBLIC_API_BASE_URL` is available to client-side helpers

### Frontend verification

After deploy, verify:

- `/login`
- manager login
- manager dashboard
- auditor dashboard
- one submitted report page
- one create/edit place flow

## 4. Update backend origin and verification settings

Once Vercel gives you the final production frontend domain:

- set `CORS_ALLOWED_ORIGINS` on Render to that domain
- set `AUTH_VERIFY_URL_TEMPLATE` to that domain

Example:

```env
CORS_ALLOWED_ORIGINS=https://your-project.vercel.app
AUTH_VERIFY_URL_TEMPLATE=https://your-project.vercel.app/verify-email?token={token}
```

## 5. Seed production/demo data if needed

If you want your employer to review seeded demo users and sample data, make sure
the target databases are seeded before review.

Typical local seed command:

```bash
./.venv/bin/python -m app.seed --product yee
./.venv/bin/python -m app.seed --product playspace
```

For hosted environments, run the equivalent seed step carefully against the
production/staging databases you intend to use for review.

## 6. Recommended release order

1. create both Neon databases
2. set Render backend environment variables
3. deploy backend on Render
4. verify backend `/health`
5. set Vercel frontend environment variables
6. deploy frontend on Vercel
7. update backend `CORS_ALLOWED_ORIGINS`
8. update backend `AUTH_VERIFY_URL_TEMPLATE`
9. verify login + manager dashboard + auditor flow

## What this replaces

This replaces the temporary `ngrok` workflow entirely.

With production hosting:

- the site stays available when the laptop is off
- the employer can review at any time
- the URL is stable
- HTTPS is handled by the hosting providers

## Current repo readiness

Prepared in this repo now:

- backend Render blueprint exists
- backend migrations run before deploy
- backend supports configurable production CORS origins
- frontend already supports a production backend URL through env vars

## Remaining external steps

Still needed outside the repo:

- Vercel project creation
- Render service creation
- Neon database creation
- production environment variable entry
- final deploy/authentication through those provider accounts
