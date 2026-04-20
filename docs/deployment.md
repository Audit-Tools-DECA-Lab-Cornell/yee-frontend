# Deployment and Public Testing

## Purpose

This document explains how to run the frontend locally, connect it to the backend, and share it for stakeholder review.

## Local development

### Frontend

```bash
cd /Users/andishasafdariyan/auditTools/audit-tools-yee-frontend
npm install
npm run dev
```

Frontend local URL:

- `http://localhost:3000`

### Backend

```bash
cd /Users/andishasafdariyan/auditTools/audit-tools-backend
.venv/bin/uvicorn app.main:app --reload
```

Backend local URL:

- `http://127.0.0.1:8000`

## Required environment variables

Frontend `.env`:

```bash
API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

## Production-like build verification

Before sharing changes, run:

```bash
npm run build
```

This catches:

- type errors
- route generation errors
- missing imports
- some proxy route issues

## Sharing a public link

The team currently uses `ngrok` for temporary stakeholder previews.

### Start the frontend

```bash
npm run dev
```

### Start the backend

```bash
cd /Users/andishasafdariyan/auditTools/audit-tools-backend
.venv/bin/uvicorn app.main:app --reload
```

### Start ngrok

```bash
ngrok http 3000
```

### Find the public URL

You can usually read it from the terminal or from:

- `http://127.0.0.1:4040/api/tunnels`

## Important caveats for public sharing

The public preview is only as stable as the local machine serving it.

The link will stop working if:

- the frontend dev server stops
- the backend server stops
- the `ngrok` process stops
- the laptop sleeps or disconnects

## Typical public preview checklist

Before sharing:

1. confirm frontend responds locally
2. confirm backend responds locally
3. confirm login works
4. confirm a dashboard route loads
5. confirm any critical new flow loads
6. verify the ngrok URL externally

## Demo credentials for review

Common review accounts:

- Admin: `admin-demo@yee.local` / `DemoPass123!`
- Manager: `manager-demo@yee.local` / `DemoPass123!`
- Auditor: `auditor-demo-1@yee.local` / `DemoPass123!`

## Deployment notes for future engineers

This repo is currently optimized for local development and tunnel-based review.

Future production deployment work will likely include:

- hosting the Next.js app on a real deployment platform
- stable environment management
- stable domain and TLS handling
- production session strategy
- release pipeline and branch protections

## Troubleshooting

### `Could not reach backend`

Usually means:

- backend is not running
- backend URL in `.env` is wrong
- frontend server needs restart after `.env` changes

### public link loads but app errors

Check:

- frontend dev server logs
- backend logs
- whether the tunnel points to port `3000`

### public link works on same machine but not externally

Check:

- tunnel is still active
- backend is still reachable from the frontend server
- ngrok warning/interstitial was acknowledged by the reviewer
