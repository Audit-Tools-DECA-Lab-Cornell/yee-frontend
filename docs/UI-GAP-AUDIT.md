# YEE Frontend — UI/UX Gap Audit (2026-07-05)

Full per-page audit of the design-system rollout across **all** accounts. Read-only findings; nothing
fixed yet. Legend: ✅ done · ⚠️ partial · ❌ missing/old · — n/a.

Dimensions: **1** loader (skeleton, no double-loader) · **2** dotted banner (`DashboardHero`) ·
**3** control radius (`rounded-control`, `<Button>`) · **4** shared `DataTable` · **5** toolbar aligned
with Columns · **6** responsive (`mobileCard`/wrap) · **7** domain color tokens.

---

## A. Systemic issues (fix once → fixes many pages) — do these first

### A1. Sidebar "Overview" always highlighted — ALL 3 dashboards (HIGH)
`components/layouts/dashboard/dashboard-sidebar.tsx:17`
```ts
const isActive = (href) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
```
The `href !== "/"` guard protects the app root but NOT each workspace root (`/admin`, `/manager`, `/auditor`),
which is a prefix of every sub-route → Overview stays lit on every sub-page (and two items light at once).
**Fix (once):** longest-prefix-wins, or exact-match for the workspace root. Affects primary + secondary nav.

### A2. Double / triple loaders on essentially every data page (HIGH)
Every section has a route `loading.tsx` (skeleton ✅), but nearly every client component ALSO renders its own
`LoadingCard`/`LoadingState`/`InlineLoader` (spinner+text) while it fetches → **skeleton flashes, then swaps to a
spinner**. You prefer the skeleton. Worst: `/auditor` is a *triple* loader (route skeleton → `AuditorOverview`
InlineLoader → nested `AuditorAuditHistory` InlineLoader).
Client loader sites: `live-dashboard.tsx:165` (`LoadingCard`, called at :312,918,973,1044,1115,1253,1579,1735,1892),
`live-detail-pages.tsx:40` (`LoadingState`, :404,:688), `live-reports.tsx:892`, `auditor-overview.tsx:18`,
`auditor-audit-history.tsx:63`, `auditor-place-list.tsx:45`, `manager/projects/[id]/edit/page.tsx:75`,
`manager/places/[id]/edit/page.tsx:80`.
**Fix:** make each client `if (loading)` branch render a content-shaped `<Skeleton>` (or move fetch into
Suspense so the route skeleton stays). Reserve `InlineLoader` for small inline async only.

### A3. Check-access full-page loader looks weak
`components/ui/loading-screen.tsx:15` — tiny 48px logo + small spinner + caption stacked as 3 disconnected
small things. **Fix:** enlarge the mark (~w-20/24), integrate the spin into the mark (ring/pulse) instead of a
separate small spinner, tighten spacing (or drop the caption to `sr-only`).

### A4. Hand-rolled `<table>`s (not `DataTable`) — 4 files, 8 tables
- `live-detail-pages.tsx` — 5 tables: `LatestAuditTable` (:161), `ProjectPlacesTable` (:208), `ProjectAuditorsTable` (:278), `PlaceAuditorsTable` (:346), "Submitted reports" (:994). All strong `DataTable` candidates (+ get `mobileCard` for free).
- `place-comparison-panel.tsx` — audit comparison (:46) + pivoted domain comparison (:179). First is easy; second is a cross-tab (harder).
- `auditor-audit-history.tsx:120` — assigned-places table (same shape as manager `LivePlacesTable`).
- `yee-score-summary.tsx:169` — "Scores by section" (a **print/report** table; probably KEEP hand-rolled — confirm).

### A5. Audit-wizard domain colors bypass tokens for 4 of 6 domains (HIGH for token-centralization)
`yee-audit-wizard.tsx` `getSurfacePalette()` (:397-500): steps 3–4 (Access/Activity) correctly use
`getThemeByStep`/`yeeDomainThemes`, but **steps 5 (Amenities), 6 (Experience), 7 (Aesthetics), 8 (Use)** are
hardcoded amber/teal/rose/violet (:456-499). So editing `--domain-*` in globals.css updates only 2 of 6 domains
in the wizard. **Fix:** route steps 5–8 through `yeeDomainThemes` like 3–4. (Steps 1/2/9 aren't domains — fine.)
Also review/tune: the wizard is where these tints are most visible.

### A6. `rounded-md` overrides on `<Button>` + raw `<button>`s (control-radius drift)
`twMerge` makes `className="rounded-md"` win over the base 8px, so these all render wrong:
`live-detail-pages.tsx:308,376,464,472,478,772,778,786,794`, `place-profile-form.tsx:558,638`,
`assignment-panel.tsx:244`, `admin users Approve` `live-dashboard.tsx:1950`, `yee-audit-wizard.tsx:2125,2133`,
`password-field.tsx:44`. Raw `<button>`s bypassing `<Button>`: `logout-button.tsx:16` (sidebar — matches nav, low
pri), instrument tabs `admin/instruments/shared-components.tsx:136`, wizard step-nav `yee-audit-wizard.tsx:1671,1856`
+ `wizard/audit-step-nav.tsx:45` (two step-navs with different radii — reconcile), `place-profile-form.tsx:488,570`.

### A7. Status badges not using shared `StatusBadge`
`StatusBadge` is "the only status pill in the app" but auditor components reimplement hardcoded
`emerald-100/amber-100/sky-100`: `auditor-audit-history.tsx:152`, `auditor-place-list.tsx:110,114,118`
(+ inherited by `/yee/introduction`), and detail-page badges in `live-detail-pages.tsx:181,237,299`.

### A8. Housekeeping
- Stray `console.log(auditStates)` — `auditor-audit-history.tsx:69`.
- Dead file (unreferenced, pre-design-system) — `features/yee-audit/components/yee-audit-form.tsx` (candidate to delete).

---

## B. Per-page matrix

### Manager
| Page | 1 Load | 2 Banner | 3 Radius | 4 Table | 5 Toolbar | 6 Resp | 7 Domain | Top fix |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|---|
| /manager (overview) | ❌ | ✅ | ✅ | ✅ | — | ✅ | — | loader→skeleton |
| /manager/projects | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | — | loader |
| /manager/projects/new | — | ❌ | ✅ | — | — | — | — | add compact hero |
| /manager/projects/[id] (detail) | ❌ | ❌ old hero | ❌ | ❌ 3 tables | — | ❌ | ⚠️ | **rebuild: hero+DataTable+radius** |
| /manager/projects/[id]/edit | ❌ | ❌ | ✅ | — | — | — | — | hero + skeleton |
| /manager/places | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | — | loader |
| /manager/places/new | — | ❌ | ❌ select+trigger | — | — | — | — | fix PlaceProfileForm radii + hero |
| /manager/places/[id] (detail) | ❌ | ❌ old hero | ❌ | ❌ 2 tables+panel | — | ❌ | ⚠️ | **worst page: hero+DataTable+radius** |
| /manager/places/[id]/edit | ❌ | ❌ | ❌ (form) | — | — | — | — | hero+skeleton+form radii |
| /manager/auditors | ❌×2 | ✅ | ❌ panel | ✅ table | — | ✅ | — | AssignmentPanel loader+radii |
| /manager/auditors/invite | — | ❌ | ✅ | — | — | — | ✅ | add hero |
| /manager/managers/invite | ✅ | ❌ | ✅ | ❌ table | — | ❌ | ✅ | DataTable + hero |
| /manager/audits | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | — | loader |
| /manager/reports | ❌ | ✅ | ✅ | ✅ | ❌ filters in own card | ✅ | ✅ | move filters into `toolbar` prop; loader |
| /manager/raw-data | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | **reference page — none** |
| /manager/settings | ✅ | ❌ | ✅ | — | — | — | — | add hero |

### Admin
| Page | 1 | 2 | 3 | 4 | 5 | 6 | 7 | Top fix |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|---|
| /admin (overview) | ❌ | ✅ | ⚠️ | ✅ | ❌ users filters | ❌ Org-Summary no mobileCard | ⚠️ metricTone | toolbar+mobileCard+whitespace |
| /admin/projects | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | — | loader |
| /admin/places | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | — | loader |
| /admin/audits | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | — | loader (also reuses manager-scoped links) |
| /admin/users | ❌ | ✅ | ❌ Approve btn | ✅ | ❌ filters in own `<div>` | ✅ | — | **move filters into `toolbar`** (your report) |
| /admin/raw-data | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | reference page |
| /admin/content | ❌ text | ❌ | ⚠️ | — | — | ⚠️ | ❌ fully sky/slate hardcoded | biggest token-drift page |
| /admin/instruments | ⚠️ mixed | ❌ | ✅ | — | — | ✅ | ✅ | add hero + version-history skeleton |
| /admin/settings | — | ❌ | — | — | — | ✅ | — | hero (plain CardHeader now) |

**Admin overview whitespace (your report):** nested full `<Card>` chrome (`Card`=py-6 gap-6, header+content each px-6)
stacked twice inside `space-y-6` (`live-dashboard.tsx:1747,1787,2030`) → each sub-table gets full header padding.
Tighten to a compact card variant for at-a-glance tables.

### Auditor (least upgraded)
| Page | 1 | 2 | 3 | 4 | 5 | 6 | 7 | Top fix |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|---|
| /auditor (overview) | ❌ triple | ✅ | ✅ | ❌ hand table | ❌ | ⚠️ | ❌ badges | rebuild AuditorAuditHistory w/ DataTable; loaders; StatusBadge |
| /auditor/places (My Audits) | ❌ | ✅ (present at :149) | ✅ | ❌ card list | — | ✅ | ❌ badges | loader→skeleton; StatusBadge |
| /auditor/settings | — | ❌ | — | — | — | ✅ | — | add hero |

> Note: **My Audits DOES now have a compact banner** (`auditor-place-list.tsx:149`). If you're not seeing it, it's
> likely a stale build. But `/yee/introduction` has a **duplicate-header bug** (see below).

### Fieldwork / Report / Auth
| Page | 1 | 2 | 3 | 4 | 5 | 6 | 7 | Top fix |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|---|
| /yee/introduction | ❌ | ❌ **duplicate** header + hero | ⚠️ | ❌ (card list) | — | ✅ | ❌ | remove page's own header (AuditorPlaceList already renders hero) |
| /yee/audit/.../step | ⚠️ pulse | — (flow) | ⚠️ raw step-nav | — | — | ✅ | ❌ steps 5–8 | A5 + step-nav radius |
| /yee/audit/.../review | ⚠️ | — | ❌ raw jump cards | — | — | ✅ | ❌ hex fallbacks | A5/A6 |
| /yee/audit/.../submitted | ❌ text | — | ✅ | — | — | ✅ | ⚠️ | plain "Loading…" → skeleton |
| /yee/submissions/[id] (report) | ✅ | — (report chrome) | ⚠️ rounded-sm btns | ❌ score table | — | ✅ | ✅ | score table (keep? confirm); button radius |
| /login,/signup,/forgot,/reset,/verify | ✅ | — | ✅ | — | — | ✅ | ✅ | **clean** |
| /complete-profile,/waiting-approval | ✅/⚠️ | — | ✅ | — | — | ✅ | ⚠️ minor | mostly clean |
| /invite/[token], /manager-invite/[token] | ❌ text | — | ✅ | — | — | ✅ | ❌ slate/emerald | tokens + skeleton |
| /(public) landing | ✅ | — | ✅ | — | — | ✅ | ✅ | clean |

---

## C. Suggested priority order
1. **A1 sidebar active-state** (tiny, high visibility, all dashboards).
2. **A2 loaders** — convert client loaders to skeletons (kills every double/triple loader). Biggest UX win.
3. **A4 + detail pages** — migrate `live-detail-pages.tsx` (project + place detail) + `place-comparison-panel.tsx`
   to `DashboardHero` + `DataTable` (+mobileCard). Fixes banners, tables, responsiveness on the worst pages at once.
4. **Auditor area** — `AuditorAuditHistory`/`AuditorPlaceList` → DataTable + StatusBadge + skeletons.
5. **A5 wizard domain tokens** (steps 5–8) — completes token centralization.
6. **Toolbar alignment** — admin users + manager reports filters into `toolbar` prop; admin-overview whitespace.
7. **A6 radius sweep** + **A3 check-access loader** + missing heroes on form/settings pages + A7/A8 cleanup.
8. **A5 responsiveness** note: on mobile the inline filters+Columns wrap (they don't need to be inline);
   the real mobile requirement is `mobileCard` on every table — covered by the DataTable migrations above.
