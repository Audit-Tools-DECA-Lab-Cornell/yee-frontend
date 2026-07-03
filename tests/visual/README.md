# Visual screenshots

YEE keeps two separate Playwright visual flows:

```bash
pnpm test:visual
pnpm screenshots:web
```

`pnpm test:visual` keeps the existing pixel-baseline coverage for public auth
pages. `pnpm screenshots:web` is the YEE counterpart to the Playspace web
screenshot script, but tailored to YEE's route map, seeded demo roles, and
interaction states.

It:

- builds the app, then boots or reuses a local Next.js production server on `127.0.0.1:3100`
- signs in as admin, manager, and auditor through the real backend auth contract
- captures a curated catalog of public, admin, manager, auditor, and YEE pages
- captures non-destructive UI states such as mobile navigation, filters, and confirmation dialogs
- writes a `public/screenshots/manifest.json` index alongside the PNGs

## Output shape

Everything is captured at the MacBook Pro 16" scaled desktop viewport
`1728 x 1117` at `2x`.

- A page that fits on screen becomes `01-overview.png`
- A taller page becomes `01-overview/01.png`, `02.png`, and so on

The folders mirror the route area:

```text
public/screenshots/
  public/landing/01-overview.png
  auth/login/01-overview.png
  manager/projects/01-overview.png
  manager/raw-data/01-overview/01.png
  manager/settings/02-remove-manager-confirm-open.png
  admin/instruments/01-overview.png
  auditor/dashboard/01-overview.png
  yee/introduction/01-overview.png
  manifest.json
```

## Next.js 16 note

YEE already has Cache Components enabled. The screenshot flow does not need its
own cache logic, but it does need stable navigation behavior:

- local capture runs `next start` after a build so Cache Components render through the production path instead of a watch-heavy dev server
- the catalog waits for route-specific ready text instead of trusting network-idle alone
- capture mode force-disables smooth scrolling so scroll-frame screenshots stay deterministic under the Next.js 16 navigation model
