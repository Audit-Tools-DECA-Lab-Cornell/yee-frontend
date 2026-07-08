# YEE Report Exports — Phase 1: Business Logistics

Status: implemented (R1–R5 shipped; see `src/features/reporting/export/`)
Owner: yee-frontend
Companion doc: [`02-implementation-plan.md`](./02-implementation-plan.md)

This document settles the **what**: which reports exist, what goes in each one,
which formats each supports, who can export what, and where the controls live in
the UI. The **how** (libraries, module layout, milestones) lives in the
implementation plan.

## 1. Context

### What YEE has today

- A reports dashboard (`/manager/reports`, `LiveReports`) with three compare
  modes — **Compare Places**, **Compare Over Time**, **Compare Individual
  Audits** — plus project/place/auditor/date filters, a radar chart, a trend
  line chart, and stacked domain bars.
- An individual submission report (`/yee/submissions/[submissionId]`) with
  overview, section weighting, score results, and auditor comments.
- Raw data tables at `/manager/raw-data` and `/admin/raw-data`.
- Exports are primitive: flat CSVs, `window.print()` standing in for PDF, and a
  raw SVG file dump for charts. There is no Excel output, no branded PDF, and
  the "Export options" card is five ambiguous buttons detached from what the
  user is looking at.

### What COPA proved out (and what we take from it)

COPA's export pipeline (`copa-frontend/src/lib/export/**`) is the quality
benchmark: client-side generation, one stable public module surface, styled
multi-sheet Excel, branded multi-page PDFs with section banners, bulk ZIP
exports where a file inside the archive is byte-identical to the single-page
download, and a size estimator that warns before heavy exports.

**We reuse the architecture and UX patterns, not the reports.** YEE differs in
three material ways:

1. **Charts are first-class.** COPA PDFs are tables only. YEE reports are
   chart-driven (radar, trend, domain bars) and the exports must carry those
   charts.
2. **Comparisons exist.** COPA exports describe one audit. YEE must export
   comparisons across places, across time, and between two specific audits.
3. **Different identity.** YEE is deep green + warm cream, six domains with
   dedicated domain colors, raw score + youth-weighted average as the two
   headline measures.

## 2. Report catalog

Five report types. Each is defined by audience, contents, charts, and formats.

### R1 — Individual Audit Report

One submitted audit, self-contained. This is the document a manager attaches to
an email or a site file; it must stand alone.

**Answer to the "charts in the same file?" question: yes.** Charts and audit
responses ship in the same PDF. A separate charts-only export exists for
people building slide decks (see R5), but the canonical report is one file —
splitting summary from responses forces recipients to juggle two attachments
and loses the "research-grade single document" feel.

| Section (PDF page order) | Contents |
|---|---|
| Cover / overview | YEE branding, place, project, auditor **generated ID**, audit date, submitted timestamp, season, weather, visit frequency, submission ID; headline Raw Score and Youth Weighted Average with color band (red < 34% ≤ amber < 67% ≤ green) |
| Score summary | Domain-by-domain table (raw + weighted, score and %), **domain profile radar** (single polygon), **per-domain horizontal bars** (raw vs weighted, domain-colored) |
| Section weighting | The participant's 1–3 weights per domain with normalized weight, weighting comments |
| Responses | Item-level question + recorded answer table, grouped by domain with domain-colored section banner rows (COPA pattern) |
| Comments | Overall + per-domain auditor comments |

Formats: **PDF** (canonical), **Excel** (multi-sheet workbook: Overview,
Scores, Responses, Comments — styled, no embedded charts; Excel is the
analysis surface, PDF is the presentation surface), **CSV** (single flat row,
same columns as today's `downloadSingleSubmissionCsv`, kept for tool
compatibility).

Audience: auditor (own submissions only), manager (in scope), admin (all).

### R2 — Place Comparison Report

Exports what the **Compare Places** mode shows, honoring the active filters
(projects, places, auditors, date range). The filter scope is printed on the
cover so the document is self-describing ("All Projects, 4 Places, Last 6
months").

| Section | Contents |
|---|---|
| Cover / scope | Filter scope, audit count, place count, date generated |
| Ranking table | Place, project, audit count, avg raw score + %, avg youth-weighted + % — sorted as on screen |
| Domain matrix | Places × six domains, % values, cells tinted by the same red/amber/green bands used on screen |
| Radar overlay | Top 3 places (same limit as the dashboard) |
| Stacked domain bars | Per-place raw and weighted section bars, domain-colored |

Formats: **PDF**, **Excel** (Summary sheet + Domain matrix sheet + one
audit-level rows sheet), **CSV** (the ranking table — today's
`yee-place-comparison.csv`, kept).

Audience: manager, admin. Never auditor.

### R3 — Trend Report (same place over time)

Exports what the **Compare Over Time** mode shows for one place.

| Section | Contents |
|---|---|
| Cover / scope | Place, project, filter scope, number of audits in range |
| Trend chart | Raw % and weighted % lines across audits (the existing chart, export-grade) |
| Audit timeline table | Date, auditor generated ID, raw score, weighted score per audit |
| Change summary | Per-domain first-vs-latest delta table with ▲/▼ markers — **new content not currently on screen**; this is the sentence a coordinator wants ("Amenities improved 18 points after the intervention") |

Formats: **PDF**, **Excel**, **CSV** (timeline rows — today's
`yee-audit-trend.csv`, kept).

Audience: manager, admin.

### R4 — Audit Comparison Report (two or more selected audits)

Exports what the **Compare Individual Audits** mode shows for the selected
audits (checkbox selection, 2–3 recommended, same cap as the radar).

| Section | Contents |
|---|---|
| Cover | The selected audits identified by place, auditor generated ID, date |
| Side-by-side summary | Raw + weighted totals per audit with color bands |
| Domain delta table | Six domains × selected audits; when exactly 2 audits are selected, an explicit Δ column |
| Radar overlay | One polygon per selected audit |
| Grouped domain bars | Per-domain grouped bars, one bar per audit |
| Response differences (2-audit case, optional) | Items where the two audits recorded different answers — flagged as a stretch goal, see open questions |

Formats: **PDF**, **Excel**, **CSV** (kept from today).

Audience: manager, admin.

### R5 — Raw Data & Bulk Exports

The dataset surface, not a designed document.

- **Raw data table export** (`/manager/raw-data`, `/admin/raw-data`, and the
  raw rows behind the reports dashboard): **CSV** (today's flat format, kept
  byte-compatible) and **Excel** — the Excel version adds a **Data Dictionary
  sheet** (column name → meaning → type → allowed values) so researchers can
  hand the file to a statistician without a call.
- **Bulk audit ZIP**: for a filtered/selected set of audits, a ZIP containing
  each audit's R1 PDF (+ optionally its Excel), built with the COPA batch
  pattern — a file inside the ZIP is identical to the one-off download. Guarded
  by the COPA-style size estimator (warn above ~25 audits).
- **Charts-only export**: every chart card on the reports dashboard gets a
  small download control exporting that chart as **PNG** (2× resolution, for
  slides/docs) or **SVG** (for designers). Replaces today's single hidden
  "Export charts only" SVG dump.

Audience: manager (scoped), admin (global). Auditor gets none of R5.

## 3. Access matrix

| Capability | Auditor | Manager | Admin |
|---|---|---|---|
| R1 own submission (PDF/Excel/CSV, print) | ✅ | ✅ | ✅ |
| R1 any submission in scope | — | ✅ | ✅ |
| R2 place comparison | — | ✅ | ✅ |
| R3 trend report | — | ✅ | ✅ |
| R4 audit comparison | — | ✅ | ✅ |
| R5 raw data CSV/Excel | — | ✅ | ✅ |
| R5 bulk audit ZIP | — | ✅ | ✅ |
| R5 per-chart PNG/SVG | — | ✅ | ✅ |

Rules:

- **Auditors see only their own single-audit report** — their export surface is
  exactly the buttons on `/yee/submissions/[id]`, nothing new to learn.
- Scope is enforced by the backend (the export pipeline only ever formats data
  the existing endpoints already returned to that session — exports grant zero
  new data access).
- **Privacy invariant:** every export identifies auditors by generated ID
  (`auditor_generated_id`), never by name or email, matching the raw-data page
  promise. No exceptions in any format.

## 4. Where the buttons live

Principle: **the export control sits on the thing it exports, and its label
names the artifact** ("Export place comparison", not "Export"). No global
export page.

1. **Individual submission report** (auditor + manager + admin): the header's
   current Print + "Export CSV" pair becomes **Print** + an **Export ▾** menu
   (PDF / Excel / CSV). Footer mirrors it, as today.
2. **Reports dashboard**: the detached "Export options" card (five ambiguous
   buttons) is **removed**. In its place, one **context-aware export
   split-button** sits in the toolbar row next to the compare-mode switcher.
   Its label follows the mode — "Export place comparison" / "Export trend
   report" / "Export audit comparison (N selected)" — and the dropdown offers
   PDF / Excel / CSV. It exports exactly what the current mode + filters show,
   so what-you-see-is-what-you-export.
3. **Per-chart download control**: an icon button in each chart card's corner
   (PNG / SVG). Discoverable where the user is already looking at the chart.
4. **Compare Individual Audits mode**: when rows are checked, a **selection
   bar** (COPA pattern) appears: "N selected — Export comparison ▾ | Download
   audit PDFs (ZIP) | Clear".
5. **Raw data pages**: the existing Download CSV button becomes a format-aware
   export control (CSV / Excel with data dictionary), plus **"Download audit
   PDFs (ZIP)"** for the filtered set, with the estimator warning above the
   threshold.
6. **Place detail page** (`/manager/places/[placeId]`) — optional, low cost:
   "Export trend report" shortcut that runs R3 pre-filtered to that place, the
   most natural place a coordinator looks for "this place's report".

## 5. Format policy

| Format | Role | Notes |
|---|---|---|
| PDF | Presentation / archival | Branded, chart-bearing, self-contained; the file that leaves the org |
| Excel (.xlsx) | Analysis | Styled multi-sheet workbooks; no embedded chart images (analysis surface — keeps us on the proven COPA styling stack) |
| CSV | Interoperability | Existing flat formats preserved byte-compatible where they exist today — except identity columns that expose a non-generated auditor identifier, which the privacy invariant (§3) overrides; R/SPSS/Sheets ingestion |
| PNG / SVG | Charts only | Per-chart, for decks and publications |
| ZIP | Bulk | Wraps per-audit R1 files |

Not offering: JSON (COPA has it; no YEE consumer asked — cheap to add later
behind the same menu if the backend team wants machine-readable dumps).

File naming: `yee-<report>-<scope-slug>-<yyyy-mm-dd>.<ext>` — e.g.
`yee-audit-riverside-park-2026-06-12.pdf`,
`yee-place-comparison-2026-07-07.xlsx`, `yee-audits-2026-07-07.zip`. Every PDF
footer carries "Generated <date> · YEE Audit Tools" + page numbers.

## 6. Chart set decision

Per the "more charts than we display now?" question — mostly the same charts,
export-hardened, plus two additions where the export genuinely needs them:

- **Kept**: radar (places overlay / audit overlay / single-audit domain
  profile), trend line (raw + weighted), stacked/section domain bars.
- **Added**: per-domain **delta table with ▲/▼** in R3 and R4 (the
  intervention story), and **grouped domain bars** in R4 (side-by-side is
  clearer than stacked when comparing 2–3 audits).
- **Not added**: score distributions, heatmap calendars, per-item charts —
  restraint is part of the brand ("research tools that respect the user's
  intelligence"); every chart in a report must answer a question a coordinator
  actually asks.

On-screen dashboard charts stay as they are for now; the delta content debuts
in exports and can be promoted to the screen later if users ask.

## 7. Non-goals (this effort)

- Mobile app exports (`yee-mobile`) — web only.
- Scheduled/emailed reports and server-side rendering — client-side generation
  like COPA; the estimator flags when a background path would be needed, and
  that path is a future project.
- Editable report templates / white-labeling.
- New backend endpoints — everything renders from data existing endpoints
  already return (one possible exception noted in the implementation plan risk
  list: bulk ZIP needs per-submission fetches).
- i18n of export strings — yee-frontend is English-only today (unlike COPA).

## 8. Open questions for stakeholder review

Defaults chosen so work can proceed; flag disagreement before Phase 3 ships.

1. **Org logo in PDF headers?** Default: YEE wordmark text treatment only (no
   raster logo asset is currently in the repo).
2. **R4 response-level diff table** (which answers changed between two
   audits): valuable but the costliest table to build well. Default: stretch
   goal, shipped only if M3 lands early.
3. **Bulk ZIP contents**: PDFs only, or PDF + Excel per audit (COPA ships
   both)? Default: user picks in the export dialog, PDF-only preselected.
4. **Should auditors get Excel** of their own audit, or only PDF/CSV? Default:
   yes to Excel — same generator, zero marginal cost, no privacy delta.
