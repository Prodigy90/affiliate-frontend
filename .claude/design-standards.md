# Affiliate Frontend — Design Standards

Reference for the affiliate dashboard UI. Tokens and class strings below are **derived
from the actual source** (`src/app/globals.css`, `src/components/**`, `src/app/affiliate/**`),
not invented. When in doubt, match an existing component rather than introducing a new pattern.

Tech: Next.js (App Router) + Tailwind v4 (`@theme inline`) + shadcn primitives + TanStack Query + lucide-react.

---

## 1. Brand & theme

- **Dark-only.** `:root` and `.dark` carry identical tokens; `.dark` exists only so shadcn `dark:` variants resolve. There is no light theme.
- **Base palette: slate. Primary: teal.** Slate-950 page bg, slate-900/60 cards, teal-500 primary/brand/ring.
- **WASBOT is always ALL CAPS** in any user-facing text, docs, or comments.
- Fonts (from `@theme inline`): `--font-sans: var(--font-inter)`, `--font-heading: var(--font-space-grotesk)`. Body defaults to `font-sans antialiased` (`globals.css` base layer).

---

## 2. Color tokens

CSS custom properties (`globals.css`, with literal hex/rgba values):

| Token | Value | Tailwind equiv |
|---|---|---|
| `--background` | `#020617` | slate-950 |
| `--foreground` | `#f8fafc` | slate-50 |
| `--card` | `rgba(15,23,42,0.6)` | slate-900/60 |
| `--popover` | `#0f172a` | slate-900 |
| `--primary` | `#14b8a6` | teal-500 (brand) |
| `--primary-foreground` | `#020617` | slate-950 |
| `--secondary` / `--muted` | `#1e293b` | slate-800 |
| `--muted-foreground` | `#94a3b8` | slate-400 |
| `--accent` | `rgba(20,184,166,0.1)` | teal-500/10 |
| `--accent-foreground` | `#2dd4bf` | teal-400 |
| `--destructive` | `#f43f5e` | rose-500 |
| `--border` / `--input` | `rgba(30,41,59,0.7)` | slate-800/70 |
| `--ring` | `#14b8a6` | teal-500 |

**Chart palette** (`--chart-1..5`): teal-500 `#14b8a6`, blue-500 `#3b82f6`, amber-500 `#f59e0b`, violet-500 `#8b5cf6`, rose-500 `#f43f5e`.

### Per-tile accent system

Stat tiles and rich empty states use a small named accent set, applied as a faint chip + a brighter icon color (and, for empty states, a ring + CTA bar). Keys: `teal | amber | violet | sky`.

```
icon chip:  bg-{accent}-500/10
icon color: text-{accent}-300
ring (EmptyState only):  ring-{accent}-500/30
CTA bar (EmptyState only): bg-{accent}-500 hover:bg-{accent}-400
```

> **House rule:** the dashboard is **teal-default**. Other accents (amber/violet/sky) are *contextual flair only* — used to differentiate tiles or to color an empty-state icon, never as an alternate theme. Don't reach for them as a default.

Status colors are semantic, not accent-keyed — see StatusBadge in §6.

---

## 3. Typography

- **Page h1:** `text-2xl font-semibold tracking-tight text-slate-50` (often `sm:text-3xl` or `md:text-3xl`).
- **Eyebrow (above h1):** uppercase, wide tracking, teal, dimmed. Two live spellings exist:
  - `text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-300/80` (dashboard)
  - `text-xs font-semibold uppercase tracking-[0.18em] text-teal-400/80` (commissions and other inner pages)

  Pick `text-teal-300/80` going forward to match the dashboard; both are in the tree today.
- **Section / tile / table-header label:** `text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400` (StatTiles, panel headers). Table column heads use `tracking-[0.16em]`; some section labels use `tracking-[0.18em]`.
- **Stat value:** `text-xl font-semibold text-slate-50 sm:text-2xl`.
- **Body / subtitle:** `text-sm text-slate-400` (muted) or `text-sm text-slate-300` (slightly brighter).
- **Hint / meta / fine print:** `text-[11px] text-slate-500` (hints) and `text-[11px] text-slate-400` (meta lines).
- Table body text: `text-xs text-slate-200`, secondary cell text `text-[11px] text-slate-400`. Highlighted commission amount: `text-xs font-semibold text-teal-300`.

---

## 4. Spacing & layout

- **App shell + page container:** authed routes render inside `shell/AppShell` — sticky top header (`sticky top-0 z-40 border-b border-slate-800/70 bg-slate-950/95 backdrop-blur-sm`, `h-16`, logo + TopNav + UserMenu) and a `<main id="main-content">` content frame: `mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 md:pb-10 lg:px-8`. The `pb-24` (→ `md:pb-10`) clears the fixed mobile BottomTabBar. Nav items are passed via `AppShell`'s `navigationItems` prop (see `app/affiliate/layout.tsx`).
- **Card padding:** `p-4` (dense table card), `p-5` (stat tile / side panel), `p-6` → `sm:p-8` (rich empty state).
- **Vertical section rhythm:** `space-y-6` (dashboard sections), `space-y-8` (taller inner pages e.g. commissions), `space-y-3`/`space-y-4` inside cards.
- **Stat grid:** `grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5` (5-tile dashboard). Generic 4-up skeleton uses `grid gap-3 sm:grid-cols-2 lg:grid-cols-4`.
- **Bento split (main + side stack):** `grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]` — ~2/3 content, 1/3 side column.
- Gaps are tight: `gap-3` for grids, `gap-2`/`gap-1.5` for inline element clusters.

---

## 5. Radii & borders

- **Radius base:** `--radius: 0.625rem` (10px); theme exposes `--radius-sm..-4xl` as offsets.
- **Usage:** `rounded-xl` cards/tiles/panels; `rounded-2xl` rich empty state; `rounded-lg` icon chips & CTA buttons; `rounded-md` small controls (page buttons, select); `rounded-full` pills/badges & the sign-in CTA.
- **Border:** `border border-slate-800/70` is the standard card border. Hover lift on tiles: `transition-colors hover:border-slate-700/70`.
- **Accent rings:** `ring-1` + `ring-{accent}-500/30` (empty-state icon chip); status badges use `ring-1 ring-{color}-500/40`.

---

## 6. Components

### Card
```
rounded-xl border border-slate-800/70 bg-slate-900/60 p-5
```
Optional hover: `transition-colors hover:border-slate-700/70`. Panel header = icon (`h-4 w-4`, accent text) + uppercase slate-400 label.

### Buttons
- **Primary (teal):** `bg-teal-500 text-slate-950 hover:bg-teal-400` — solid, dark text. Sign-in CTA variant is pill: `rounded-full bg-teal-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm transition-colors hover:bg-teal-400`. EmptyState primary CTA: `rounded-lg ... px-4 py-2 text-sm font-semibold text-slate-950` (bar color from the accent palette).
- **Secondary (bordered slate):** `rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-900`.
- **Retry pill** (`RetryButton`): destructive-tinted pill — `rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-[11px] font-medium text-red-200` (default label "Retry").

### Inputs / selects
Focus ring is teal: `outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500`. Select base (PaginationBar): `h-7 rounded-md border border-slate-700 bg-slate-950/80 px-2 text-[11px] text-slate-100`.

### StatusBadge (`status-badge.tsx`)
Pill: `rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize`. Semantic colors:
- success (`credited`,`completed`) → `bg-teal-500/10 text-teal-300 ring-1 ring-teal-500/40`
- pending (`pending`,`processing`) → `bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/40`
- error (`refunded`,`reversed`,`failed`,`rejected`) → `bg-red-500/10 text-red-300 ring-1 ring-red-500/40`
- default → `bg-slate-700/60 text-slate-200 ring-1 ring-slate-600/60`

### PaginationBar (`admin/PaginationBar.tsx`)
Standard paginator: "Showing X–Y of Z" line + per-page select (`[20,50,100,200]`) + prev / numbered-window / next. Active page button: `bg-teal-500 text-slate-950 shadow-sm shadow-teal-500/20`. Gracefully degrades to prev/next when `total` is undefined. Note: `commissions/page.tsx` still uses an ad-hoc "Showing page N of M" line instead of this component — prefer `PaginationBar` for new tables.

### TableSkeleton (`table-skeleton.tsx`)
`animate-pulse` header bar + N row blocks (`h-16 ... bg-slate-800/60`). Use while a table loads.

### Empty states — TWO components coexist (consolidation pending)
1. **Rich `shared/EmptyState`** (preferred): icon chip + ring, accent palette, title (`text-lg font-semibold tracking-tight text-slate-50`), body (`text-sm text-slate-400`), optional primary/secondary CTAs. `role="status"`. Container: `rounded-2xl border border-slate-800/70 bg-slate-900/50 p-6 sm:p-8 text-center`. **Currently only one consumer:** `affiliate/TopEarnersPanel.tsx`.
2. **Legacy Lottie `components/empty-state.tsx`**: animated Lottie + small `text-xs text-slate-300` message. **Still the majority** — 7 consumers: `affiliate/commissions`, `affiliate/payouts`, `affiliate/analytics`, and 4 admin pages (`admin/products`, `admin/affiliates`, `admin/affiliates/[id]`, `admin/payouts`).

> **Direction:** consolidate onto the rich `shared/EmptyState` and retire the Lottie variant. Known follow-up — don't add new consumers of the Lottie one. (Note: the rich pattern is currently the *less*-used one despite being preferred — the migration is still ahead of us.)

### Loaders
**Standard = skeletons that mirror the final layout** (see `dashboard/page.tsx`: pulsed header lines → tile grid → bento split, all matching real geometry). Centered-text loaders (`"Checking your session..."`) still exist for the auth gate and are **being retired** — prefer layout-matching skeletons.

---

## 7. States

- **Loading:** `animate-pulse` skeleton blocks shaped like the final content (`bg-slate-800/60`–`/70`, `rounded`/`rounded-xl`). Match the real grid so there's no layout shift on load.
- **Empty:** rich `shared/EmptyState` with an accent icon, one-line title, short body, and a CTA when there's a next action.
- **Error:** show a retry affordance — `RetryButton` (inline, in a card header) or a "Try again" teal button (full-page). For **non-critical embellishments** (leaderboard `TopEarnersPanel`, side cards, the funnel-style widgets), **fail soft**: `return null` on error/empty rather than rendering an error box. Queries that shouldn't thrash set `retry: 0` with a short `staleTime`.

---

## 8. Accessibility

Existing good practices to preserve:
- `aria-current="page"` on the active nav item (TopNav, BottomTabBar) and active paginator page button.
- `aria-hidden="true"` on every decorative icon (lucide icons, inline SVGs, pagination ellipsis, the BottomTabBar underline).
- `aria-label` on icon-only controls (pagination prev/next/page buttons, "Rows per page" select).
- `role="status"` on the rich EmptyState (announces empty/loaded result).
- Labelled inputs (`<label>` wrapping the per-page select).
- Nav landmarks: `<nav aria-label="Primary">` (desktop) and `aria-label="Primary mobile"` (BottomTabBar).
- Dark theme contrast: body text on `text-slate-200/300/400` over slate-950/900 meets AA; reserve `text-slate-500` for fine print, not primary content.

---

## 9. Responsive

- **Nav splits by breakpoint** (both rendered by `AppShell`): desktop `TopNav` is `hidden md:flex`; mobile `BottomTabBar` is `md:hidden`, fixed to the bottom with safe-area padding (`paddingBottom: max(0.375rem, env(safe-area-inset-bottom))`) and a blurred bar (`bg-[rgba(2,6,23,0.97)] backdrop-blur-xl`). The `<main>` adds `pb-24 md:pb-10` so content clears the fixed bar on mobile. BottomTabBar shows 5 tabs (Home/Commissions/Products/Payouts/More→Settings) with a custom animated underline indicator.
- Grids collapse mobile-first: `sm:grid-cols-2`, `lg:grid-cols-3/4`, `xl:grid-cols-5`; bento split is single-column until `lg`.
- **KNOWN GAP:** tables are wrapped in `overflow-x-auto` only — they scroll sideways on small screens. A **stacked card variant under `sm`** is a planned follow-up.

---

## 10. Currency & number formatting

From `src/lib/utils/format.ts` — use these, don't reimplement:

- `formatCurrency(amount, currency?)` — **`amount` is in the smallest unit (kobo / cents)**; the helper divides by 100 internally and renders via `Intl.NumberFormat` (`style: "currency"`, default `"USD"`). Pass raw kobo, e.g. `formatCurrency(data.total_earnings, "NGN")` → `₦4,000.00`. Falls back to `"<CODE> <amount>"` on an invalid currency code; coerces non-number/NaN to 0.
- `formatInteger(value)` — locale-grouped integer for counts (no fraction digits).
- `formatDate(value, formatStr?)` — `date-fns` format, default `"d MMM yyyy, HH:mm"`; returns the raw value on parse failure.
- `shortenId(id, prefix=6, suffix=4)` — ellipsized long IDs/UUIDs for display.

---

## Known follow-ups

- **EmptyState consolidation** — migrate `commissions/page.tsx` (and any future consumer) off the legacy Lottie `components/empty-state.tsx` onto the rich `shared/EmptyState`; then remove the Lottie component.
- **Mobile table variant** — add a stacked-card layout for tables under `sm` instead of `overflow-x-auto` horizontal scroll.
- **Eyebrow color drift** — standardize the page eyebrow on `text-teal-300/80` (dashboard spelling); inner pages currently use `text-teal-400/80`.
- **Pagination consistency** — replace the ad-hoc "Showing page N of M" line in `commissions/page.tsx` with the shared `PaginationBar`.
- **Retire centered-text loaders** — replace the `"Checking your session..."` text loaders with layout-matching skeletons.
