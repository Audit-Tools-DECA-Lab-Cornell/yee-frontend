# YEE Report Exports — Phase 2: Implementation Plan

Status: implemented (M0–M5 landed on `src/features/reporting/export/`)
Prerequisite: [`01-logistics.md`](./01-logistics.md) — report catalog R1–R5,
access matrix, button placement. This doc is the coding plan for Phase 3.

**Implementation note.** The pipeline shipped as described: the public surface is
`src/features/reporting/export/index.ts` (dynamic-import target), with chart
builders under `export/charts/`, PDF/Excel generators under `export/pdf/` and
`export/excel/`, byte-frozen CSVs in `csv-builders.ts`, the palette in
`export-palette.ts`, and the bulk ZIP in `batch.ts` + `zip-builder.ts`. The
on-screen dashboard imports only the pure pieces via `dashboard-charts.ts` so
jsPDF/xlsx stay out of the initial bundle. Coverage lives in `tests/unit/export-*`
(generators + CSV goldens) and `tests/e2e` (download + role specs).

## 1. Goal and acceptance criteria

Replace YEE's primitive exports (flat CSV, `window.print()`, raw SVG dump)
with a COPA-grade client-side export pipeline that produces branded,
chart-bearing PDFs, styled multi-sheet Excel workbooks, byte-compatible CSVs,
per-chart PNG/SVG downloads, and bulk ZIPs — per the R1–R5 catalog.

Done means:

1. Every capability in the logistics access matrix has a working control in
   the documented location, and no role can reach an export outside its row.
2. R1 PDF for a real submission renders cover, scores + radar + domain bars,
   weighting, domain-grouped responses, and comments in YEE branding.
3. R2/R3/R4 exports reproduce exactly what the active compare mode + filters
   show, with the scope printed on the cover.
4. Existing CSV outputs remain byte-compatible (same columns, same order,
   same formatting and escaping) — **except identity columns where a legacy
   CSV exposes a non-generated auditor identifier**; the privacy invariant
   (criterion 5) takes precedence, and any such intentional schema change
   gets an explicit golden-file update and a release note. Known instances
   today: the trend and individual-comparison CSVs emit `auditor_id`
   verbatim, and the single-submission CSV falls back to raw
   `submission.auditor_id` when `auditor_generated_id` is absent. M0
   includes verifying with the backend whether the comparison payload's
   `auditor_id` is already the generated ID; if it is, those CSVs stay
   byte-identical.

   **M0 finding (resolved).** The comparison/trend payload's `auditor_id`
   is populated by `_display_auditor_code(auditor_code)` in
   `audit-tools-backend/app/products/yee/services/dashboard.py`, i.e. it is
   already the `AUD###` generated code — so the trend and individual-comparison
   CSVs stay **byte-identical** (no privacy migration needed for them). The
   single-submission record is the sole leak: `services/audits.py` sets
   `auditor_id = submission.auditor_id` (the raw auditor-profile UUID) while
   `auditor_generated_id` carries the `AUD###` code. The legacy single-submission
   CSV's `auditor_generated_id || auditor_id` fallback is therefore replaced by a
   redaction placeholder when the generated ID is absent (criterion 5); when it is
   present — the normal case — the CSV bytes are unchanged.
5. Every export identifies auditors by `auditor_generated_id` only. When a
   payload lacks a generated ID, the export shows a redaction placeholder —
   never the raw identifier.
6. Playwright specs assert each download (filename pattern, magic bytes,
   parseable content) and pass in CI alongside `pnpm lint` and `pnpm build`.

Blast radius: **single-client, frontend-only.** No backend route changes, no
contract changes, no migrations, no i18n. All data comes from endpoints the
dashboard already calls (`/api/dashboard/reports/place-comparisons`,
`/api/dashboard/raw-data`, `/api/yee/audits/[id]`, `/api/yee/instrument`).

## 2. Architecture decisions

### D1 — Client-side generation (as COPA)

Exports are generated in the browser from data the session already holds or
can fetch through existing proxies. Zero new attack surface, zero new
endpoints, and the estimator (D6) guards the heavy tail. Server-side rendering
stays a future project (logistics §7).

### D2 — Libraries

| Concern | Library | Rationale |
|---|---|---|
| PDF | `jspdf` + `jspdf-autotable` | COPA-proven table styling, section banner pattern ports directly |
| Excel | `xlsx-js-style` | COPA-proven styled worksheets; we decided against embedded chart images in Excel (logistics §5), which removes the only reason to prefer exceljs |
| CSV | existing legacy CSV generators — `toCsv` in `src/features/reporting/reporting.ts` **and** the manual single-submission builder in `yee-submission-report.tsx` (its own header order, quoting, and escaping) | each report's current headers, ordering, value formatting, and escaping are preserved as-is unless the acceptance-criterion-4 privacy migration changes an identity column |
| ZIP | small local `zip-builder` ported from COPA (store-only ZIP writer, no dependency) | COPA already wrote and shipped this; PDFs/XLSX are already compressed |
| Charts | **no library** — pure functions emitting SVG strings (D3 below) | the dashboard's charts are already hand-rolled SVG; a charting dependency would be a second rendering system to keep in sync |

All export modules are loaded via dynamic `import()` from the click handlers
so `jspdf`/`xlsx-js-style` (~400 KB combined gzipped) never enter the initial
dashboard bundle.

### D3 — Charts as pure SVG builders, rasterized for PDF

The single hardest YEE-specific problem: the on-screen charts are React
components styled with CSS custom properties (`var(--chart-series-1)`,
`class="stroke-chart-grid"`), which serialize to meaningless strings outside
the DOM, and the tokens themselves are `oklch(...)` values jsPDF cannot use.

Plan:

- `src/features/reporting/export/charts/*.ts` — pure functions
  (`buildRadarSvg`, `buildTrendSvg`, `buildDomainBarsSvg`,
  `buildGroupedBarsSvg`) that take data + a resolved-hex palette and return a
  complete standalone SVG string (inline `fill="#2f6f4f"` attributes, explicit
  `font-family`, no classes, no CSS vars). Geometry is lifted from the
  existing `RadarComparisonChart` / `TrendLineChart` math in
  `live-reports.tsx` (that math moves; the React components become thin
  renderers of the same builders via `dangerouslySetInnerHTML`-free props —
  see M1 note — so screen and export can never drift).
- `svgToPngDataUrl(svg, scale=2)` util: `Blob` → `Image` → `<canvas>` →
  `toDataURL("image/png")`; the browser resolves fonts and any residual CSS
  colors during raster. The PNG goes into the PDF via `doc.addImage(...)` and
  is also the payload of the per-chart PNG download.
- Per-chart SVG download ships the builder's string directly (already
  standalone, unlike today's serialized-DOM export which silently loses its
  CSS-var colors — a live bug this work retires).

### D4 — Color pipeline

One palette module, `export-palette.ts`:

- `resolveCssColorToHex(cssValue)`: paint a 1×1 canvas, `getImageData`, format
  hex. Handles `oklch()` and any future token format; memoized per session.
- `getExportPalette()`: reads the domain/chart/score-band tokens off
  `document.documentElement` via `getComputedStyle`, resolves each to hex, and
  returns a typed `{ domains, chartSeries, bands, brand }` object. Falls back
  to a table of literal hexes (mirroring `globals.css`, with a pointer comment
  in both files) when `document` is unavailable (tests) or resolution fails.
- Everything downstream (SVG builders, autotable fills, XLSX cell styles)
  consumes only this object. `globals.css` stays the single source of truth;
  drift risk is confined to the fallback table.

### D5 — Module layout (mirrors COPA's acyclic split)

```
src/features/reporting/export/
├── index.ts              # ONLY public surface; dynamic-import target
├── types.ts              # report payload types, format unions; imports nothing local
├── export-palette.ts     # D4
├── file-utils.ts         # triggerBrowserDownload, buildExportFileName (naming per logistics §5)
├── charts/
│   ├── svg-primitives.ts # shared text/axis/legend helpers
│   ├── radar.ts, trend.ts, domain-bars.ts, grouped-bars.ts
│   └── raster.ts         # svgToPngDataUrl
├── row-builders.ts       # pure data→presentation rows for PDF/XLSX only
├── csv-builders.ts       # per-report legacy CSV rows: explicit ordered columns,
│                         #   formatting, and escaping frozen per generator (never
│                         #   derived from row-builders — CSV bytes must not move
│                         #   when a PDF/XLSX layout changes)
├── pdf/
│   ├── pdf-shared.ts     # brand header/footer, cover page, banner-row helpers
│   ├── audit-pdf.ts      # R1
│   ├── place-comparison-pdf.ts   # R2
│   ├── trend-pdf.ts      # R3
│   └── audit-comparison-pdf.ts   # R4
├── excel/
│   ├── excel-shared.ts   # styled-cell helpers, sheet-name sanitizer
│   ├── audit-xlsx.ts, comparison-xlsx.ts, raw-data-xlsx.ts (+ data dictionary sheet)
├── zip-builder.ts        # ported from COPA
├── batch.ts              # per-audit file generation for bulk ZIP (COPA audit-batch pattern)
└── export-estimator.ts   # ported thresholds: 25 entities / 60 files / 100 MB
```

Rule from COPA kept verbatim: consumers import from `index.ts` only;
`types.ts` imports from no sibling; a file inside a ZIP is generated by the
same function as the single download.

### D6 — Bulk ZIP data flow

Bulk export needs full submissions (`/api/yee/audits/[id]`) + the instrument
(`/api/yee/instrument`, fetched once). The comparison endpoint does not carry
item-level responses, so the ZIP path fan-outs N fetches: concurrency-capped
at 4, progress dialog (`k of N`), estimator warning above 25 audits, failed
fetches collected and reported ("3 audits could not be exported") rather than
aborting the archive.

### D7 — What existing code is kept / retired

| Today | Fate |
|---|---|
| `toCsv`, `downloadSingleSubmissionCsv`, existing CSV column layouts | kept — absorbed verbatim into `csv-builders.ts` (identical bytes, verified by goldens), re-exported via `index.ts` |
| `window.print()` + `(reports)` print stylesheet | kept as the free "Print" path on R1 (print CSS already invested; some users genuinely print) |
| "Export full PDF report" button that just calls `window.print()` | retired — replaced by real PDF |
| `exportCurrentChart` DOM-SVG serializer | retired (broken colors) — replaced by builder SVG/PNG |
| "Export options" card in `live-reports.tsx` | removed — replaced by toolbar split-button + selection bar (logistics §4) |
| `ExportCsvButton` on raw-data pages | generalized into a format-aware export control |

## 3. Milestones

Ordered so every milestone ships something visible and M2 (the auditor-facing
surface) lands before the manager-only complexity.

### M0 — Foundation (deps + scaffold) — small

- `pnpm add jspdf jspdf-autotable xlsx-js-style` (dev deps unchanged).
- Create `export/` scaffold: `types.ts`, `file-utils.ts`, `export-palette.ts`
  (+ fallback table), `index.ts`.
- Port `zip-builder.ts` and `export-estimator.ts` from COPA, retargeting
  names/thresholds.
- Capture golden CSV fixtures from the current generators **before any code
  moves**, and confirm with the backend whether the place-comparisons
  payload's `auditor_id` is already the generated ID (acceptance criterion
  4); record the answer in this doc.
- Playwright helper for download assertions (magic bytes `%PDF`, `PK`).

### M1 — Chart builders — medium

- Extract radar/trend geometry from `live-reports.tsx` into
  `charts/radar.ts` / `charts/trend.ts`; add `domain-bars.ts`,
  `grouped-bars.ts`, `raster.ts`.
- The React chart components keep rendering their own JSX for now but import
  the extracted geometry helpers (point/polygon math), so numbers can't
  drift; full convergence to one renderer is a follow-up, not a blocker.
- Visual sanity page under Playwright test fixtures rendering each builder
  output for the visual-regression suite.

### M2 — R1 individual audit export — large

- `row-builders.ts` (submission → overview/scores/weighting/responses/comment
  rows for PDF/XLSX; reuse `buildQuestionColumns` logic from
  `yee-submission-report.tsx`) and `csv-builders.ts` (the existing
  single-submission CSV moved as-is, goldens proving identical bytes).
- `pdf/pdf-shared.ts` + `pdf/audit-pdf.ts`; `excel/audit-xlsx.ts`.
- UI: `yee-submission-report.tsx` header/footer — Print + **Export ▾**
  (PDF / Excel / CSV) via a small `ExportMenuButton` component
  (`src/features/reporting/components/export-menu-button.tsx`), dynamic
  import, pending state on the button while generating.
- This alone completes the **auditor** story.

### M3 — R2/R3/R4 comparison exports + dashboard toolbar — large

- `pdf/place-comparison-pdf.ts`, `pdf/trend-pdf.ts`,
  `pdf/audit-comparison-pdf.ts`; `excel/comparison-xlsx.ts`; delta
  computation in `row-builders.ts` (first-vs-latest, pairwise Δ).
- `live-reports.tsx`: remove the export card; add the mode-aware split-button
  next to the `SegmentedControl` (label per mode, disabled with tooltip when
  the mode has no data / no selection); scope line (already rendered) is
  passed into the cover pages.
- Per-chart download control (PNG/SVG) on the three chart cards.
- R4 response-diff table: stretch, behind the open question in logistics §8.

### M4 — R5 raw data + bulk ZIP — medium

- `excel/raw-data-xlsx.ts` with Data Dictionary sheet (column metadata table
  maintained next to the row builder that emits the columns).
- Raw-data pages: format-aware control replacing `ExportCsvButton` usage;
  "Download audit PDFs (ZIP)" with estimator + progress + partial-failure
  report (D6); `batch.ts`.
- Selection bar in Compare Individual Audits mode (export comparison / ZIP /
  clear).
- Optional (open question): place-detail "Export trend report" shortcut.

### M5 — Hardening — medium

- Playwright: one spec per report type per format family (download event →
  magic bytes → for CSV parse and assert legacy columns; for ZIP list entries).
- Role tests: auditor session sees no comparison/raw exports.
- `pnpm lint`, `pnpm build`, visual suite green; update `docs/architecture.md`
  and `README.md` pointers; retire this plan's "proposed" status.

Suggested PR slicing: M0+M1 / M2 / M3 / M4+M5 — each independently shippable.

## 4. Risks and mitigations

| Risk | Mitigation |
|---|---|
| `oklch` tokens unresolvable in some browser (palette wrong in PDF) | D4 canvas-resolution is spec-stable in all evergreen browsers; hex fallback table; Playwright asserts a known pixel in a rastered chart |
| Palette fallback drifts from `globals.css` | pointer comments in both files + a Playwright check comparing runtime-resolved vs fallback values |
| Chart geometry drifts between screen and export | geometry helpers shared from M1 day one |
| Bulk ZIP memory / tab jank on big datasets | estimator thresholds, concurrency cap 4, progress dialog, partial-failure reporting |
| N submission fetches hammer the backend | cap 4 concurrent; threshold warning at 25; document as the one place a future batch endpoint would help |
| `jspdf` bundle weight | dynamic `import()` only from click handlers; verify with `pnpm build` output |
| CSV byte-compatibility silently broken | dedicated `csv-builders.ts` (never shared with PDF/XLSX row shaping) + Playwright golden assertions on every legacy CSV, captured in M0 before any code moves; the only sanctioned diff is the acceptance-criterion-4 identity-column migration |
| Long text (comments, question prompts) overflowing PDF cells | autotable wrapping + COPA's `stripPromptMarkup`/normalization ports; worst-case fixtures in tests |

## 5. Appendix — self-review (grill-me pass)

Questions asked against this plan, and the resolutions baked in above.

**Q: Why not render PDFs from the existing print stylesheet (headless/`window.print`) instead of a second rendering system?**
Print CSS can't produce a controlled multi-page artifact (no reliable page
headers/footers/TOC, browser-dependent output, no programmatic file for ZIP
batching). COPA already paid for the jsPDF learning curve; we inherit it.
Print stays as a free complement (D7).

**Q: Two chart renderers (React + SVG builders) — isn't that the drift you're warning about?**
Full convergence in M1 was considered and deliberately deferred: rewriting the
dashboard's chart components while also building the export pipeline couples a
visual-regression risk to every export PR. Sharing the geometry helpers
removes numeric drift (shapes/scales); only styling could diverge, which the
visual suite watches. Convergence is a named follow-up.

**Q: `xlsx` has known CVE history and `xlsx-js-style` is a fork — why keep it?**
It runs entirely client-side on data the user already has (no untrusted
workbook *parsing* — we only write), and it's the device COPA ships today, so
the org has accepted the posture. Swapping to exceljs later only touches
`excel/*` behind `index.ts`.

**Q: Radar limited to 3 places — what does R2's PDF do with 12 filtered places?**
Same as the screen: radar shows top 3 (labeled as such on the chart), while
the ranking table and domain matrix carry all filtered places. The PDF cover
states the full scope, so nothing is silently dropped.

**Q: What if a manager exports with zero audits in filter scope?**
Split-button disabled with tooltip ("No audits in the current scope") — M3
explicitly includes empty/disabled states. Same for R4 with <2 selected.

**Q: Auditor Excel export leaks anything CSV doesn't?**
No — same row builders feed both; the privacy invariant (generated IDs only)
is enforced in `row-builders.ts`, the single place identity fields enter any
export.

**Q: Why no backend batch endpoint for bulk ZIP now?**
It's the only place a contract change would buy something, and the estimator
keeps the client path honest below 25 audits — the realistic near-term
dataset size. Documented as the designated first optimization if usage grows
(risk table).

**Q: Fonts in rasterized SVG — will PDFs look different across OSes?**
Builders pin `font-family` to the same stack the app uses with generic
fallbacks; raster happens in the user's browser so charts match what they saw
on screen, which is the honest promise. jsPDF body text uses Helvetica —
consistent everywhere.
