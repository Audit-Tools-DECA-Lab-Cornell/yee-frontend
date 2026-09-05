# YEE Audit Tools - Design Reference

_Living document. Updated alongside codebase changes._

---

## Color Tokens

All colors are defined in `src/app/globals.css` using OKLCH, which gives perceptually uniform lightness across hues.

### YEE Brand Greens

| Token | Value | Usage |
|---|---|---|
| `--yee-green-950` | `oklch(0.16 0.055 162)` | Sidebar background, darkest brand surface |
| `--yee-green-900` | `oklch(0.21 0.052 161)` | Primary action color, CTA buttons |
| `--yee-green-800` | `oklch(0.28 0.048 161)` | Hover on dark surfaces |
| `--yee-green-700` | `oklch(0.38 0.06 160)` | Focus rings |
| `--yee-green-600` | `oklch(0.50 0.07 159)` | Active border emphasis |
| `--yee-green-500` | `oklch(0.60 0.08 158)` | Sidebar primary (lighter on dark) |
| `--yee-green-200` | `oklch(0.84 0.04 158)` | Subtle tint backgrounds |
| `--yee-green-100` | `oklch(0.93 0.02 158)` | Very light tint for hover states |
| `--yee-green-50` | `oklch(0.97 0.01 158)` | Faintest green wash, accent background |

### Surfaces

| Token | Value | Usage |
|---|---|---|
| `--yee-surface-app` | `oklch(0.975 0.003 240)` | App background - nearly white with cool tint |
| `--yee-surface-card` | `oklch(1 0 0)` | Card surface - pure white |
| `--yee-surface-muted` | `oklch(0.965 0.004 240)` | Muted inputs, secondary panels |
| `--yee-surface-hover` | `oklch(0.955 0.006 240)` | Hover state background |

### Semantic Tokens (shadcn-compatible)

These are the tokens used throughout all components via Tailwind utility classes.

| CSS var | Maps to |
|---|---|
| `--background` | `--yee-surface-app` |
| `--foreground` | `oklch(0.14 0.006 240)` |
| `--card` | `--yee-surface-card` |
| `--primary` | `--yee-green-900` |
| `--primary-foreground` | `oklch(0.98 0 0)` |
| `--muted` | `--yee-surface-muted` |
| `--muted-foreground` | `oklch(0.52 0.012 240)` |
| `--accent` | `--yee-green-50` |
| `--accent-foreground` | `--yee-green-900` |
| `--destructive` | `oklch(0.58 0.24 27)` |
| `--border` | `oklch(0.88 0.006 240)` |
| `--ring` | `--yee-green-700` |

### Sidebar Tokens

| CSS var | Value | Note |
|---|---|---|
| `--sidebar` | `--yee-green-950` | Dark green panel |
| `--sidebar-foreground` | `oklch(0.95 0.006 158)` | Off-white with green tint |
| `--sidebar-primary` | `--yee-green-500` | Active nav items (lighter on dark) |
| `--sidebar-accent` | `--yee-green-900` | Selected nav item background |
| `--sidebar-border` | `oklch(1 0 0 / 0.08)` | Subtle white rule |

---

## Typography

**Font stack:**
- Body/UI: Inter (loaded via `next/font/google`, variable: `--font-sans`)
- Monospace: JetBrains Mono, Menlo (variable: `--font-mono`)

**Type scale rules:**
- Body text minimum contrast: 4.5:1 against background
- Prose max line length: 65–75ch
- `text-wrap: balance` on h1–h3
- `text-wrap: pretty` on p, li

**Section labels:** Use `text-sm font-medium text-muted-foreground` at normal tracking. Reserve uppercase tracking for one deliberate instance per page max.

---

## Spacing & Density

- Default content padding: `px-4 py-6 sm:px-6 lg:px-8`
- Max content width: `max-w-7xl` centered
- Card gap between sections: `gap-6` (24px)
- Form field spacing: `space-y-4` between fields, `space-y-2` within a field group

---

## Radius Scale

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `0.375rem` (6px) | Menu items, dropdown rows, small chips |
| `--radius-control` | `0.5rem` (8px) | **Buttons, inputs, textareas, filters, segmented controls** |
| `--radius-md` | `0.625rem` (10px) | Cards, tiles, table container, dropdown/popover panels, sidebar |
| `--radius-lg` | `0.875rem` (14px) | Modals, sheets, large/outer cards |
| `--radius-xl` | `1.25rem` (20px) | Major surfaces (auth panel) |

**Roundedness hierarchy (keep these in sync - this is the whole point):**
menu items/chips `rounded-sm` (6) ≤ controls `rounded-control` (8) ≤ cards / table / popovers / sidebar
`rounded-md` (10) ≤ modals / large cards `rounded-lg` (14). Pills & status dots use `rounded-full`.
A control nested in a card should be one step less round than its container - never dramatically sharper.
Never put `rounded-lg`/`rounded-xl` on a plain button. (Exception: the tall multi-select field triggers
sit at `rounded-md` so text inputs at `rounded-control` read as one notch tighter.)

**Control density:** default button `h-8`, `px-3`.

---

## Elevation / Shadow

| Token | Usage |
|---|---|
| `--shadow-card` | Default card elevation |
| `--shadow-elevated` | Dropdowns, popovers |
| `--shadow-panel` | Major floating panels |

**Rule:** Never combine `border: 1px solid` with `box-shadow` using blur ≥ 16px on the same element.

---

## Card Component

Three elevations:
- `flat` - border only, no shadow (tables, embedded panels)
- `raised` (default) - `--shadow-card`
- `panel` - `--shadow-elevated` (feature panels, modals)

---

## Motion

- All animations use exponential ease-out curves - `--ease-emphasized`, i.e. `cubic-bezier(0.16, 1, 0.3, 1)`
- Every animation has a `prefers-reduced-motion: reduce` alternative in `globals.css`
- Keep transitions under 300ms for state changes; 500ms max for page entrances

---

## Data Visualization

All charts are hand-drawn SVG/CSS (no chart library). Colors come from tokens in
`globals.css` - **never hardcode hex in a chart.**

**Domain palette** - **single source of truth** is `src/styles/domain-palette.json`, committed with
identical contents in **yee-mobile** (`lib/domain-palette.json`). Everything else is derived from it:

| Consumer | How it reads the palette |
|---|---|
| `globals.css` `--domain-*` tokens | **generated** - `node scripts/generate-domain-tokens.mjs` |
| Tailwind `domain-*` utilities | generated into `@theme` from the same run |
| Components / SVG charts | `yeeDomainThemes` (`features/yee-audit/config/yee-domain-theme.ts`), which holds nothing but `var(--domain-*)` strings |
| PDF / Excel / SVG exports | `getExportPalette()` reads the JSON directly (`export/export-palette.ts`) |
| yee-mobile | `designSystem.domains`, read from its copy of the same JSON |

Four roles per domain, each tuned to the job it does - this is why one hue is not enough:

| Role | Used for | Floor (enforced) |
|---|---|---|
| `text` | labels, headings, any small text | ≥ 7:1 on the card, the app bg **and** its own tint |
| `strong` | borders, dots, rails; also safe for small text | ≥ 4.5:1 on the same three |
| `fill` | chart bars, score strips | ≥ 3:1 on the card (WCAG 1.4.11 non-text) |
| `light` | tint backgrounds | the surface the two above are measured against |

The six `fill` steps additionally clear categorical separation - OKLab ΔE ≥ 15 in full colour and
≥ 8 under simulated protanopia and deuteranopia - so adjacent domains stay tellable apart. Domain
colour is never the *only* signal: every domain mark ships beside its name (WCAG 1.4.1).

**To change a domain colour:** edit the JSON in **both** repos, run `pnpm tokens:domains`, update
`DOMAIN_PALETTE_CHECKSUM` in both, then run the guard tests on both sides.
`tests/unit/domain-palette.spec.ts` re-runs the generator in `--check` mode, re-measures every
contrast floor and separation gate, and **fails if any domain hex appears anywhere in `src/` outside
the spec**. Its checksum test catches the spec being edited without the checksum being refreshed -
it cannot read yee-mobile, so keeping the two in step still relies on landing both PRs together. Never hardcode a domain colour (no `emerald-*`,
`blue-*`, no raw hex) - go through the tokens.

**Series palette** (`--chart-1 … --chart-5`): categorical colors for comparing N places/audits
(radar, trend lines). Brand green leads; the rest are harmonized to the same muted envelope.

**Score bands** (`--score-{high,mid,low}` + `-fill` / `-bg`): vivid traffic-light green (high),
yellow (mid), and red (low). Solid fills are intentionally brighter than the paired text colors so
bars and dots stand out without reducing label contrast. Use the single `scoreBand()` helper
(`lib/score-band.ts`); never re-derive red/yellow/green inline.

**Chart neutrals** (`--chart-grid`, `--chart-axis`): hairline grid rules and axis text.

**Chart style:** editorial - oversized `tabular-nums` numerals, hairline grids, generous whitespace,
one accent per chart. Reusable primitives live in `components/ui/charts/`.

---

## Component Conventions

**Buttons:**
- Radius `rounded-control` (4px), tight density (default `h-8`, `px-3`) - crisp, not bulky
- `default`/`primary` - brand green, white text
- `outline` - white bg, border, dark text
- `quiet` - ghost-like, no border at rest
- `danger` - destructive red (AlertDialog confirms only)
- All buttons support `isLoading` prop (spinner + disabled)

**Badges:**
- Use `rounded-full` (pill shape) - always
- Status colors: `success` (green), `warning` (amber), `destructive` (red), `secondary` (muted)
- `dot` prop adds a colored status indicator before the label

**Forms (Field component):**
- Always wrap inputs in `<Field>` which provides: Label, optional description, children, inline error
- Error text uses `role="alert"` and `aria-live="polite"`
- All inputs need `name` and `autocomplete` attributes

**Empty states:**
- Use `<EmptyState>` component with icon, title, description, and optional action
- Never use raw "No data" text strings

---

## Dashboard Rules

**Sidebar:**
- Background: `var(--sidebar)` (deep green)
- Nav links: `rounded-md`, 44px tall, solid `bg-sidebar-accent` for selected state (no gradient)
- Selected state also gets a 3px `--sidebar-primary` marker on its left edge. `--sidebar-accent`
  sits only 0.05L above `--sidebar`, so the tint alone is not a sufficient "you are here" -
  and once collapsed there is no label weight left to carry it either.
- Icons: `size-4.5` (18px) expanded, `size-5` (20px) collapsed - an icon with no label beside it
  has to carry the row on its own.
- Section labels: `text-xs text-sidebar-foreground/45 font-medium` at normal tracking
- CTA card: `border-sidebar-border bg-sidebar-accent`, no glassmorphism
- Focus rings on the dark panel use `ring-sidebar-ring` on `ring-offset-sidebar`. The global
  `*:focus-visible` offset is the app background, which reads as a white halo here.

**Collapsible rail (lg and up):**

| | Expanded | Collapsed |
|---|---|---|
| Width token | `--dashboard-sidebar-width-expanded` (292px) | `--dashboard-sidebar-width-collapsed` (72px) |
| Row | icon + label, 44px tall | 44×44 square, icon centred |
| Label | visible | `sr-only` + tooltip on the right |
| Brand | wordmark + workspace blurb | mark only, in a 57px block that lines up with the header rule |
| CTA card | full card | its action alone, as a rail button |

- **State lives on `<html>`, not in React.** `SidebarCollapseScript` writes
  `data-sidebar-collapsed` before first paint and every collapsed style is a CSS descendant of
  it (`rail-collapsed:` / `sidebar-collapsed:` variants in `globals.css`). Server and client
  render identical markup, so there is no hydration mismatch and no wide-then-narrow flash.
  React reads the attribute through `useSyncExternalStore` for the parts CSS cannot do -
  `aria-expanded` and whether the rail's tooltips are live.
- **`rail-collapsed:` is scoped to `[data-dashboard-rail]`**, the persistent desktop aside. The
  mobile sheet renders the same `DashboardSidebar` and must always be full width with visible
  labels; `tests/unit/dashboard-sidebar-collapse.spec.ts` guards that scope, and `collapsible`
  (opt-in, rail only) gates the tooltips the same way.
- **Labels collapse to `sr-only`, never `hidden`.** An icon-only link whose label is
  `display: none` has no accessible name at all.
- Toggle: header, leading slot - the same position the sheet trigger holds below `lg`. Bound to
  ⌘/Ctrl+B, ignored while the user is typing.
- Preference persists in `localStorage` under `yee:sidebar-collapsed`; blocked storage degrades
  to session-only, never to a broken toggle.
- The grid animates `grid-template-columns` for 200ms on `--ease-emphasized`; the global
  `prefers-reduced-motion` rule removes it.

**Header:**
- Sticky top, `bg-background/90 backdrop-blur`
- No presentational search input - command palette button (`⌘K`) placeholder
- User avatar: `AvatarFallback` with `bg-green-100 text-green-700`

**Main content:**
- `id="main-content"` for skip-link target
- `bg-background` (not hardcoded hex)

---

## Audit Wizard

**Domain color rule:** Each YEE domain (Access, Activity Spaces, etc.) uses its own color family as a border/accent on option cards. The card background is a very light tint, not a solid domain fill.

**Non-domain steps stay neutral.** Steps 1 (context), 2 (weighting) and 9 (final comments) are not domains, so they wear the brand-neutral base - the same rule yee-mobile's `getSurveyPalette()` follows. Colour on screen answers "which domain am I in"; spending hues on the steps that have no domain would make that signal meaningless. The one exception: inside the weighting step each *card* is a domain, so each card wears its own.

**Selected state:** Solid `2px border` in domain color + `bg-{domain}-50` tint. No stacked shadows/rings/gradients.

**Progress nav:** Use `aria-label` and `aria-live="polite"` for step announcements.

**Option cards:** Wrap a native `<input type="radio">` or `<input type="checkbox">`. The card is the visual, the input is the semantic.

---

## Accessibility Targets

- WCAG 2.1 AA for all text and interactive elements
- Skip link targeting `#main-content`
- All icon-only buttons require `aria-label`
- Focus visible ring: `ring-2 ring-ring ring-offset-2`
- Loading indicators: use `…` (ellipsis), not `...` (three dots)
- `aria-live="polite"` on all async status regions
