# YEE Audit Tools — Design Reference

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
| `--yee-surface-app` | `oklch(0.975 0.003 240)` | App background — nearly white with cool tint |
| `--yee-surface-card` | `oklch(1 0 0)` | Card surface — pure white |
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

**Roundedness hierarchy (keep these in sync — this is the whole point):**
menu items/chips `rounded-sm` (6) ≤ controls `rounded-control` (8) ≤ cards / table / popovers / sidebar
`rounded-md` (10) ≤ modals / large cards `rounded-lg` (14). Pills & status dots use `rounded-full`.
A control nested in a card should be one step less round than its container — never dramatically sharper.
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
- `flat` — border only, no shadow (tables, embedded panels)
- `raised` (default) — `--shadow-card`
- `panel` — `--shadow-elevated` (feature panels, modals)

---

## Motion

- All animations use exponential ease-out curves (`cubic-bezier(0.16, 1, 0.3, 1)`)
- Every animation has a `prefers-reduced-motion: reduce` alternative in `globals.css`
- Keep transitions under 300ms for state changes; 500ms max for page entrances

---

## Data Visualization

All charts are hand-drawn SVG/CSS (no chart library). Colors come from tokens in
`globals.css` — **never hardcode hex in a chart.**

**Domain palette** — **single source of truth** in `globals.css`:
`--domain-{access,activity,amenities,experience,aesthetics,use}-{text,strong,fill,light}`.
The six YEE domains share one OKLCH lightness/chroma envelope anchored to the brand green, so they
read as a coordinated family; only hue varies. `text` = labels/headings (dark, AA on white),
`strong` = borders/lines/dots, `fill` = bars/areas, `light` = tint backgrounds.
**Adjust a domain here and it flows everywhere** — charts, the reports page, the individual report,
AND the audit wizard — because `yeeDomainThemes` (`features/yee-audit/config/yee-domain-theme.ts`) is
the only mapping and it references nothing but these tokens: `*Hex` fields as raw `var(--domain-*)`
(inline styles / SVG) and `*Class` fields as `domain-*` Tailwind utilities
(`border-domain-access-strong`, `bg-domain-access-light`, `text-domain-access-text`, …). Never hardcode
a domain color (no `emerald-*`/`blue-*`/etc.) — go through the theme.

**Series palette** (`--chart-1 … --chart-5`): categorical colors for comparing N places/audits
(radar, trend lines). Brand green leads; the rest are harmonized to the same muted envelope.

**Score bands** (`--score-{high,mid,low}` + `-bg`): brand-tuned — deep green (high), muted gold (mid),
restrained clay (low, not alarm-red). Use the single `scoreBand()` helper (`lib/score-band.ts`);
never re-derive rose/amber/emerald inline.

**Chart neutrals** (`--chart-grid`, `--chart-axis`): hairline grid rules and axis text.

**Chart style:** editorial — oversized `tabular-nums` numerals, hairline grids, generous whitespace,
one accent per chart. Reusable primitives live in `components/ui/charts/`.

---

## Component Conventions

**Buttons:**
- Radius `rounded-control` (4px), tight density (default `h-8`, `px-3`) — crisp, not bulky
- `default`/`primary` — brand green, white text
- `outline` — white bg, border, dark text
- `quiet` — ghost-like, no border at rest
- `danger` — destructive red (AlertDialog confirms only)
- All buttons support `isLoading` prop (spinner + disabled)

**Badges:**
- Use `rounded-full` (pill shape) — always
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
- Nav links: `rounded-lg`, solid `bg-sidebar-accent` for selected state (no gradient)
- Section labels: `text-xs text-sidebar-foreground/50 font-medium` at normal tracking
- CTA card: `border-sidebar-border bg-sidebar-accent`, no glassmorphism

**Header:**
- Sticky top, `bg-background/90 backdrop-blur`
- No presentational search input — command palette button (`⌘K`) placeholder
- User avatar: `AvatarFallback` with `bg-green-100 text-green-700`

**Main content:**
- `id="main-content"` for skip-link target
- `bg-background` (not hardcoded hex)

---

## Audit Wizard

**Domain color rule:** Each YEE domain (Access, Activity Spaces, etc.) uses its own color family as a border/accent on option cards. The card background is a very light tint, not a solid domain fill.

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
