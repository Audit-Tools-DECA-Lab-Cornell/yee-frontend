# YEE Web App — UI/UX Review (screenshot-based)

**Date:** 2026-07-04
**Reviewer perspective:** designer / PM / first-time user of a single role (admin *or* manager *or* auditor)
**Scope:** Review only — no code, no implementation plan. Observations to be translated into dev work later.
**Source:** `public/screenshots/**` (automated captures) + `MANUAL_SCREENSHOTS/**` (manual captures incl. error states).

---

## 0. TL;DR

The **bones are good**. The brand system, the sidebar, the login/landing pages, a couple of hero banners, and the entire Reports engine are genuinely solid — some of it is production quality already. But as a *whole*, the app currently reads like a **well-structured internal prototype**, not a shipped product. Three things drag it down the hardest, in order:

1. **Pages that visibly break.** Real users *will* hit raw JavaScript errors ("Cannot read properties of undefined") on the auditor dashboard, the report viewer, and inside the audit flow. Admin deep-links reportedly bounce back to the dashboard. This is the single biggest "not production ready" signal.
2. **Developer-voice copy everywhere.** The interface keeps describing itself *about* the user in the third person ("Managers can define consistent Place naming…") and leaks internal notes ("without dead summary cards", "Placeholder for…", "manager-scoped Project"). It should speak *to* the user, in their words, about their world.
3. **Inconsistency that reads as "assembled, not designed."** Especially tables — there are at least three different action patterns, several different filter bars, and status logic that disagrees between admin and manager. Buttons, metric cards, and score formatting also drift page to page.

Everything below expands on these with specific, quoted evidence.

**Dashboard scorecard (my gut read as a user):**

| Surface | Grade | One-line |
| --- | --- | --- |
| Public landing | A- | Confident, on-brand, sells the product well. |
| Auth (login / signup) | A- | Clean split-screen, clear, trustworthy. |
| Manager dashboard & detail pages | B / B+ | The strongest logged-in area; banners carry it. |
| Manager Reports | A- | The crown jewel — filters, KPIs, radar/trend/stacked charts, exports. |
| Admin | C+ | Good tooling (Instruments, Website Copy) undermined by broken links & generic overview. |
| Auditor | C- / D+ | Thinnest and most broken — and it's the field user's primary tool. |
| Mobile / responsive | D | Only nav-drawer captures exist; the drawer already clips content. Tables are unaddressed. |

---

## 1. What's already working (keep / protect this)

Credit where due — don't redesign these to death, just harmonize around them:

- **Brand & identity.** The YEE pin-leaf logo, the deep-green palette, and the white lockup on dark are distinctive and consistent. The logo reads well at every size seen.
- **The sidebar.** Agreed with your own read: it's the spine of the app. Clear sections ("Workspace"), sensible icons, obvious active state, role-specific footers ("Quick start / Launch manager actions", "Fieldwork / Continue assigned work", "Admin tools / Review all accounts"). This is the most finished component in the product.
- **Login, signup, landing.** Split-screen auth with the "For auditors / For managers" value props is polished and reassuring. The landing hero ("Youth-led audits for better public spaces") with the sample audit-report card and the stats band ("6 audit domains · 2× score views · ∞ exportable") is genuinely good marketing UI.
- **Two hero banners.** The manager dashboard's dark-green banner and the place/project **detail** gradient banners (navy→green) with the floating "Place actions / Project actions" card are the best-looking surfaces in the logged-in app. They give a sense of place and hierarchy.
- **The Reports engine (manager).** Filter row (project/place/auditor + date-range chips), KPI summary cards (Average Raw Score, Highest/Lowest scoring place, Total audits), three comparison modes (Compare Places / Over Time / Individual Audits), and real charts — a **radar/spider** chart, a **trend-over-time** line chart, and **stacked section bars** — plus a full **export bar**. This is legitimately strong and should be the visual/interaction benchmark the rest of the app is pulled up to.
- **The audit-taking chooser** ("Choose a place to evaluate" / auditor "My Audits"). Status pills (`Submitted / Locked`, `Ready to start`, `Draft in progress`) paired with the *correct contextual action* (View Submission / Start Audit / Continue In Progress) is exactly right, and it's consistent between the public flow and the auditor dashboard.
- **The auditor-assignment dual-panel** (Auditors × Places with select-all and "All places in project"). Good, purpose-built interaction.
- **Empty / "coming soon" states.** The admin & auditor Settings placeholders (icon + "System settings coming soon" + explanation) are handled gracefully — better than a blank page.
- **Admin Instruments & Website Copy.** These two admin tools are the most *designed* pages in the admin area — clear versioning model ("Currently live" / "Create new draft" / version history), good explanatory cards. They feel intentional. (Consistent with the recent instruments-admin redesign work.)

---

## 2. Critical / blocking issues (breaks trust; "not production ready")

These are not polish items — they are "the page does not work." A user hitting any of these will conclude the product is broken.

- **Raw JavaScript errors shown to end users.** Confirmed in screenshots:
  - Auditor **Overview**: *"Auditor dashboard error — Cannot read properties of undefined (reading 'toFixed')"*.
  - **Report viewer** (manager *and* admin): *"YEE audit error — Something went wrong in the audit flow. Cannot read properties of undefined (reading 'access')"*.
  - **Audit flow / review** (`audit/page-3`, and the auditor "Review" step off the final-comments page): same `'access'` error.
  These are stack-trace strings in the UI. Even once the underlying bug is fixed, the *error experience* itself needs to become a human, branded, reassuring state (see §7). Right now the auditor's **home screen** is a crash — that's the worst possible place for it.
- **Dead-end navigation on Admin.** Per your report (and consistent with what I can see): place details, open project, open reports, open audits, etc. either bounce back to the dashboard or lead nowhere. Every one of those is a broken promise — the row *looks* actionable ("Open ↗", "View Report") but doesn't deliver. This is a trust-killer at the exact moment an admin tries to do their core job (drill in).
- **Report deep-link the user can't view.** "Open report" / "View Report" sends admin/manager to a YEE submission URL that then errors out on access. So the *one* place the whole reporting funnel points to is a wall. This makes the otherwise-excellent Reports/Audits tables feel like they lead nowhere.
- **The audit flow breaks mid-flow.** If the survey errors at page 3 / review for a real auditor, the product's *core value action* (completing an audit) is at risk. This is arguably more important than any cosmetic issue.

> These likely need backend/logic work as you noted; I'm flagging them here for completeness because from a *user's* standpoint they dominate the entire impression — no amount of visual polish matters if the auditor's dashboard greets them with a crash.

---

## 3. Content & voice — "user-oriented, not developer-oriented"

This is the theme you called out, and it's pervasive enough to deserve its own workstream. The pattern: the UI describes **the system** or talks **about the role in third person**, instead of speaking **to the user about their own work**. Your own example — "View the places under this manager" → "View all places under all your ongoing projects" — is exactly the fix pattern.

**Principle to adopt:** second person, present tense, the user's vocabulary, lead with *their* value — not the data model, not the role abstraction, not the roadmap.

### 3a. Internal / developer notes leaking into the UI (fix immediately — these are embarrassing)

| Where | Current copy | Problem |
| --- | --- | --- |
| Manager dashboard banner | "…move into projects, places, auditors, reports, and audit records **without dead summary cards**." | "without dead summary cards" is a *developer's changelog note*. Users have no idea what a "dead summary card" is. |
| Admin Settings (subtitle) | "**Placeholder for** system-wide configuration, exports, and admin tools." | "Placeholder" is a build-status word, not user copy. |
| Manager Settings (subtitle) | "**Placeholder for** account, notification, and project-scoped settings." | Same. |
| Auditor Settings (subtitle) | "**Placeholder for** personal profile and preferences." | Same. |
| Admin Raw Data (subtitle) | "Export system-wide audit records **and future comparative datasets**." | "future … datasets" is a roadmap promise leaking into shipped UI. |
| Add Place (subtitle) | "Create a richer Place profile … for this **manager-scoped Project**." | "manager-scoped Project" is data-model jargon. |
| Admin Places (subtitle) | "System-wide **place rows** with … filters that **narrow the visible records** directly." | "place rows", "narrow the visible records" = describing the table implementation, not the user's task. |

### 3b. Third-person "documentation voice" (should address the user directly)

| Where | Current (about the user) | Direction (to the user) |
| --- | --- | --- |
| Place detail → "Place setup details" | "**Managers can** define consistent Place naming, location details, timing, and Place Type before assigning Auditor access." | "Keep naming, location, timing, and type consistent here before you assign auditors." |
| Place detail → "Auditor setup details" | "**Auditors can be** assigned at the Project level or narrowed to select Places…" | "Assign auditors to a whole project, or to specific places." |
| Project detail → "Project setup details" | "**Managers can** set up as many Projects as they need and keep Project and Place naming consistent…" | "Add as many projects as you need. Consistent naming keeps places easy to find later." |
| Manager Settings → "Manager profile" | "**Every manager belongs to** one organization. **Primary managers can** update the organization name…; **secondary managers can** update their own profile only." | "You're a **primary** manager, so you can rename the organization and invite other managers." (State *their* capability, not the whole permission matrix.) |
| Manager Settings → "Manager and auditor access" | "**Managers can also act as** auditors inside the same organization." | "Want to run audits yourself? Create your auditor profile and switch views anytime." |
| Auditor sidebar footer | "**Auditors see** only their own places, active audits, and personal history rather than management tools." | (This is meta-explanation the auditor doesn't need — either drop it or turn it into "Here's everything assigned to you.") |

### 3c. Test/seed copy showing as if it were real content

- Project summaries like **"Scoring-calibration pilot exercising raw, weighted, and combined report outputs."** read as QA fixtures, not something a real manager wrote. Fine for demo data, but the *field itself* should be presented so that real summaries look intentional (and empty ones get a graceful placeholder, not this).

### 3d. Capitalization is inconsistent (small thing, reads as sloppy)

Common nouns are Capitalized like proper nouns mid-sentence, inconsistently: "**Place**", "**Places**", "**Project**", "**Auditor**", "**Place Type**", sometimes lowercase in the same view. Pick one convention (recommended: lowercase — "place", "project", "auditor" — unless it's a literal UI label) and enforce it in a copy pass. It's minor individually but it's *everywhere*, so it compounds into "unpolished".

### 3e. Unexplained jargon / numbers that look broken

- **"Youth Weighted Average 1.16"**, **"Cap Score Percentage 0.00%"**, **"Max Score — raw / dynamic Youth Weighted"** (manager dashboard metric cards). To a first-time manager these are opaque, and "0.00%" / "— raw / dynamic" literally look like something failed to load. Every specialist metric needs (a) a plain-language label, (b) a unit/scale, and (c) a tooltip or "?" for the definition.
- **Scores over 100%** — "Youth Weighted: 1.94 / 1.76 (**110%**)", "2.24 / 1.76 (**127%**)". These may be mathematically valid (achieved vs. an *average* cap), but to a user a percentage above 100 reads as a bug. Needs labeling/explanation, or a visual convention that signals "above target" on purpose.

---

## 4. Consistency & design-system gaps (your "shared components" ask)

You're right that tables need to be unified — it's the most visible inconsistency in the product. Here's the concrete evidence.

### 4a. Tables: at least three different action patterns

| Table | Row actions | Selection | Filter bar |
| --- | --- | --- | --- |
| Admin **Audits** / Manager **Audits** | Three separate **pill buttons**: `View Report` · `Edit Audit` · `View Raw Data` | Checkboxes + "Compare Selected / Export Selected" | Project · Place · Export All/Filtered/Selected |
| Manager **Places** | **Green inline text links** w/ ↗: `Open` · `Edit` · `Assign Auditors` · `View Audits` | none | Project only |
| Admin **Places** | Single **`Open ↗`** text link | none | Organization · Project |
| Admin / Manager **Projects** | Single **`Open ↗`** text link | none | Org · Project (admin) / none (manager) |
| Admin **Raw Data** | none (row = data) | Checkboxes | Org · Project · Place |
| Admin **Users** | Status text ("No action needed") | none | Org · Role · Project |

So a user moving between two lists in the *same* dashboard meets a different interaction model each time — buttons vs. green links vs. a lone "Open", different filter bars, checkboxes on some and not others. This is the core argument for a **single shared table system** (base table + optional filter toolbar + optional row-selection + a standardized "row actions" slot with one convention — e.g., a primary "Open" + an overflow "⋯" menu for the rest). Group/collapsible rows (your idea) fits naturally as a feature of that base component.

### 4b. Status pills disagree between dashboards (an actual logic bug, not just visual)

- **Admin Places** shows **"Up to date"** for a place whose Last Audit is **"Not yet"** — i.e., a never-audited place is labeled "up to date."
- **Manager Places** correctly shows **"Pending first audit"** for the 0-audit place (Eastside Community Green).
Same concept, two different (and one wrong) behaviors. Status vocabulary + logic should be defined once and shared.

### 4c. Score/data density

- The Audits tables jam two metrics into one cell: *"Raw: 106 / 125 (85%)"* on line 1 and *"Youth Weighted: 1.94 / 1.76 (110%)"* on line 2. It's hard to scan a column when each cell is a two-line paragraph. Consider separate columns, or a compact "score chip" component with consistent formatting used everywhere scores appear (tables, cards, detail pages, reports).

### 4d. Other drift

- **Buttons**: filled-dark, filled-white, ghost/outline, and very-rounded "Try again" (error) buttons coexist without an obvious hierarchy rule. Define primary/secondary/tertiary + destructive and their shapes/radii once. (The error "Try again" button in particular looks like a different design language.)
- **Metric cards**: the manager dashboard's in-banner stat cards, the below-banner metric cards, the reports KPI cards, and the detail-page stat cards are four slightly different card treatments for the same job ("a number + a label + a hint"). One card component, please.
- **Redundant actions on one screen**: the place-detail page surfaces "View Audits" / "Open Audits" **three times** (banner action card, a dedicated stat card, and the stat-card link), plus "Open project", "Open reports dashboard". Lots of overlapping CTAs competing for the same click — thin these to a clear primary + secondary.

---

## 5. Per-surface notes

### Public / Auth — *strong*
- Landing hero, sample-report card, and stats band are convincing. Minor: the sample card and the real in-app score components use different visual languages — a chance to reuse one "score card" everywhere (marketing + product).
- Auth pages are clean. Nits: the login password field shows pre-filled dots (demo), and the same left-panel value props repeat on login & signup (fine). Consider a hint on password requirements at signup ("Create a strong password" is the only guidance).

### Admin — *good tooling, broken spine*
- **Overview**: functional but the most generic page in the app — four pastel accent cards (blue/amber/green/purple) that don't match the calm green system elsewhere, "Admin view / Open" repeated on each, then an org-summary table and a users table. It doesn't feel like the "one control surface" the copy promises.
- **Broken deep-links are the headline problem** (see §2).
- **Instruments / Website Copy**: the bright spots — keep as the model for admin.
- **Settings**: not implemented ("coming soon").

### Manager — *the strongest logged-in role*
- Dashboard banner is great; the **metric cards under it are the weak point** (jargon + "0.00%" + "— raw / dynamic", see §3e).
- Detail pages (place/project) look good but are carrying **third-person setup copy** and lots of **"Not specified yet."** repeated in the setup fields — an empty-state opportunity (one graceful "Add these details" prompt rather than four identical "Not specified yet." lines).
- Reports = benchmark (see §1).
- Add Place form is clean and sensible (Google-address autofill is a nice touch); just fix the subtitle jargon and the date inputs' native styling to match the rest.

### Auditor — *thinnest and most broken; ironic, because this is the field user*
- Overview **crashes** (see §2). My Audits is good and consistent. Settings is a placeholder. That's the entire role — 1 good page, 1 crash, 1 placeholder. The person actually *doing the audits* has the least finished experience. I'd argue the auditor surface deserves the **most** attention, not the least, because it's used in the field, probably on mobile, possibly on flaky connections.

---

## 6. Navigation & flow (the "moving through the site" experience)

- **The sidebar anchors everything** and is the reason the app feels coherent at all — good.
- **Dead ends break "user control & freedom".** Broken admin links and the un-viewable report leave users stranded with no clear recovery except the browser back button. Every actionable-looking element must either work or not look actionable.
- **No breadcrumbs / weak "where am I".** On detail pages (place/project) there's no breadcrumb trail back to the parent list vs. the dashboard. The page title is just "Places" even when you're on *one* place's profile ("Westside Youth Hub"), so the header doesn't tell you your depth. A breadcrumb (Places → Westside Youth Hub) would fix orientation and back-tracking.
- **Competing CTAs** (see §4d) make the "what do I do next" less obvious than it should be on detail pages.
- **Global search (⌘K) and the notification bell** appear in every header — it's unclear from stills whether they function. If they don't yet, they're implied-but-dead affordances (same trust issue as broken links). Track them as "does this actually work?" items.
- **Report funnel is a cul-de-sac.** Audits/Reports → "View Report" → error. The single most important navigational path in the product currently dead-ends.

---

## 7. Error, empty & loading states

- **Error states must become human.** Replace stack-trace strings with: a plain sentence ("We couldn't load this report."), a likely cause if known ("You may not have access", "This audit is still processing"), and a real next step (Retry / Go to audits / Contact). The current red "Something went wrong… Cannot read properties of undefined ('access')" is the opposite of reassuring. The auditor's crashed *home* screen is the top priority.
- **Empty states**: the "coming soon" placeholders are good; extend that same care to *data* empty states (a place with no audits, a project with no places, a filtered table with no matches) so they never look like a broken/blank page.
- **Loading**: not visible in stills, but with this much tabular + chart data, skeletons/loaders are worth confirming exist (a blank flash before data reads as a bug).

---

## 8. Responsive / mobile

- Only mobile **nav-drawer** captures exist, and they already show a problem: the drawer is nearly full-width and the **"Quick start / Launch manager actions" (and admin "Review all accounts") card at the bottom is clipped/cut off**. So even the *navigation* isn't clean on mobile yet.
- **Tables are the real mobile risk** and aren't addressed at all: an 8-column audits table with three button-columns cannot survive a 375px screen as-is. A mobile table strategy is needed (stacked cards, priority columns, or horizontal scroll with a pinned first column) — and it should be part of the shared table system in §4a.
- Given auditors work **in the field**, the auditor surface + audit form need a genuine mobile-first pass, not a desktop-shrunk one.

---

## 9. Accessibility (quick heuristic read from visuals — needs a real audit later)

- **Contrast**: a lot of light-gray secondary text on near-white backgrounds (subtitles, hints, "Not specified yet.") is borderline; the green inline action links on white (manager Places) should be contrast-checked. Verify against WCAG AA.
- **Status by color**: pills pair color *with a text label* (good — not color-only). Keep that discipline everywhere.
- **Targets/labels**: most actions are text-labeled; confirm the icon-only header controls (search, bell) have accessible names, and that native date inputs, checkboxes, and the ⌘K flow are keyboard-navigable.
- **Error text**: red-on-pink is legible, but see §7 — the *content* is the problem more than the contrast.

---

## 10. Not-yet-implemented / needs tracking

A running list of "this isn't real yet" surfaces so they don't get mistaken for done:

- **Admin Settings** — "System settings coming soon."
- **Auditor Settings** — "Profile settings coming soon."
- **Manager Settings** — partially built (profile + auditor-access + team sections exist), but subtitle still says "Placeholder", so treat as *in progress*.
- **Global search (⌘K)** — present in every header; confirm whether it's wired up.
- **Notification bell** — present everywhere; confirm behavior.
- **"Future comparative datasets"** (admin Raw Data) — implies unbuilt export/analytics; either build or remove the promise.
- Anything the broken admin links *should* reach (place detail, reports, audits from admin) — effectively unimplemented from the user's side until the links work.

### Implementation status — UI/UX pass (2026-07-05)

**Done this pass (frontend-only):**

- **Design-system foundations** — new shared primitives under `src/components/ui/`: `table.tsx`, `stat-card.tsx`, `score-cell.tsx` (null-safe), `status-badge.tsx` + `lib/status.ts` (single status source; fixes the "Up to date" vs "Pending first audit" bug), `error-state.tsx`, `tooltip.tsx`.
- **Shared DataTable** (`src/components/ui/data-table/`, TanStack Table under styled shadcn primitives) with sorting, optional grouping, selection-friendly columns, and a stacked-card mobile variant.
- **All hand-rolled dashboard/report tables migrated** onto `DataTable`: manager+admin Projects, manager+admin Places, Auditors, Audits (selection + score + row-action overflow), Org Summary, Users (inline approve control preserved), the "latest audits" summary card, Raw Data, and both Reports tables (Compare Places + Compare individual audits). No raw `<table>` remains in `live-dashboard.tsx`, `live-reports.tsx`, or `live-raw-data-table.tsx`.
- **Crash guards** — auditor Overview `toFixed`, submission-report `participant_info`/`.access` null-safety, and humane `ErrorState` on all role error boundaries.
- **Copy pass** — second person, lowercase domain nouns, no dev notes: manager Settings, manager Raw Data, add/edit Place, edit Project subtitles; the 15× "Not specified yet." replaced with muted, field-specific placeholders (`emptyHint`).
- **Admin dead-links** — admin Projects/Places render identifiers as plain text with `TODO(admin-detail-routes)` markers and no `/manager/*` row actions; admin metric cards verified to point at real `/admin/*` routes.

**Still open / deferred (flagged, not built this pass):**

- **Backend follow-up:** submission-viewer authorization/data completeness for admin & manager (the `.access` 403 root cause). Frontend now degrades gracefully instead of crashing.
- **Admin detail routes** (`/admin/{places,projects,audits}/[id]`) — not built; admin identifiers stay plain text until they exist. Note `app/admin/audits` currently re-exports the **manager** audits page, so its "Edit audit" links point into `/manager/*` (bounce for admins) — resolve when the admin detail routes land.
- **Two detail-page mini-tables** (`LatestAuditTable`, `ProjectPlacesTable` in `live-detail-pages.tsx`) were out of the original migration scope and remain hand-rolled — candidates for a later `DataTable` sweep.
- **Admin Settings / Auditor Settings** — still "coming soon" stubs (copy only).
- **⌘K search + notification bell** — still confirm whether wired.

---

## 11. How I'd sequence it (priority read, not a dev plan)

Framed as *user-impact* priority, matching your two-phase instinct (broken-first, then polish):

- **P0 — Stop the bleeding (mostly the "phase 1" you flagged; may need backend):** kill the raw-error screens (esp. auditor Overview), fix admin dead-links, fix the report-view access path, fix the audit-flow crash. Wrap all of it in humane error states.
- **P1 — The two themes you care about most (pure UI/UX, this session's lane):** (a) a **content/voice pass** across every subtitle, banner, and helper line — second person, no dev notes, consistent capitalization; (b) a **shared table system** (base + filter toolbar + selection + one row-action convention + groupable rows) and roll all six tables onto it.
- **P2 — Clarity:** metric-card component + plain-language labels/tooltips for the specialist scores; unify status vocabulary & logic (fix the "Up to date" bug); one score-chip format everywhere; thin the competing CTAs; add breadcrumbs.
- **P3 — Reach & finish:** real responsive/mobile pass (nav clip + table strategy + auditor field UX), accessibility audit, button/card/spacing harmonization, then build out the unimplemented Settings pages.

---

## 12. One-paragraph honest summary

YEE doesn't need to be *reinvented* — it needs to be **finished and harmonized**. You already have a strong brand, a great sidebar, a lovely landing/auth front door, two hero banners worth copying, and a Reports module that's genuinely good. The gap between "prototype" and "product" here is concrete and closeable: make the broken pages stop breaking, rewrite the copy so it talks to the user instead of about the system, and pull the tables (and cards, buttons, statuses, scores) onto one shared, consistent kit. Do those three things and the manager-dashboard level of quality you already like will spread to the whole app.
