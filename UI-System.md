# UI System Rules

## Source of Truth

- `src/components/ui/` is the single source of truth for all UI primitives.
- Reuse existing components before creating new ones.
- Prefer composition of existing shadcn/ui Radix-based components over custom one-off implementations.

## Theme: Violet-Bloom

The project uses the `violet-bloom` theme. Primary color is ~258deg violet in HSL.

### Color Tokens (CSS Custom Properties)

All colors are defined as HSL values in `src/app/globals.css`. Use them via `hsl(var(--token))` in CSS or the Tailwind utility class.

#### Core Tokens

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--primary` | 258 100% 60% | 258 100% 68% | Brand violet — buttons, links, focus rings |
| `--background` | 0 0% 99% | 225 7% 11% | Page background |
| `--foreground` | 0 0% 0% | 0 0% 94% | Primary text |
| `--card` | 0 0% 99% | 228 7% 14% | Card/panel backgrounds |
| `--muted` | 0 0% 96% | 227 10% 18% | Subdued backgrounds |
| `--muted-foreground` | 0 0% 32% | 0 0% 63% | Secondary text |
| `--destructive` | 358 75% 60% | 0 91% 71% | Error/danger actions |
| `--border` | 240 17% 92% | 223 6% 21% | Default borders |

#### Semantic Surface Tokens

| Token | Usage |
|-------|-------|
| `--surface-base` | Page-level background (alias of `--background`) |
| `--surface-raised` | Cards, panels (alias of `--card`) |
| `--surface-overlay` | Popovers, dropdowns (alias of `--popover`) |
| `--surface-hover` | Interactive hover states |
| `--surface-warm` | Warm-tinted surfaces (diary, special sections) |
| `--surface-warm-2` | Stronger warm accent surface |

#### Semantic Text Tokens

| Token | Usage |
|-------|-------|
| `--text-primary` | Main text (alias of `--foreground`) |
| `--text-secondary` | Secondary/helper text (alias of `--muted-foreground`) |
| `--text-tertiary` | Tertiary/disabled text |

#### Semantic Accent Tokens

| Token | Usage |
|-------|-------|
| `--accent-primary` | Primary accent (alias of `--primary`) |
| `--accent-hover` | Hover state for accented elements |
| `--accent-muted` | Subdued accent background |
| `--link` | Link text color |

#### Status Tokens

| Token | Usage |
|-------|-------|
| `--success` | 142 76% 36% — positive states |
| `--warning` | 38 92% 50% — caution states |
| `--error` | Alias of `--destructive` |
| `--info` | 210 90% 60% — informational states |

#### Chart Tokens

`--chart-1` through `--chart-5` — used by Recharts. Consistent between light/dark modes.

### Radius Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 6px | Small elements (badges, chips) |
| `--radius-md` | 10px | Inputs, buttons |
| `--radius-lg` | 16px | Cards, panels |
| `--radius-xl` | 22px | Large containers, modals |

### Shadow Tokens

Shadows are defined as CSS custom properties (`--shadow-2xs` through `--shadow-2xl`). The `--shadow-diary` is a special warm shadow for the diary feature.

### Typography

| Variable | Font | Usage |
|----------|------|-------|
| `--font-sans` | Plus Jakarta Sans | Body text, UI elements |
| `--font-serif` | Lora | Article/review content, headings |
| `--font-mono` | IBM Plex Mono | Code blocks, technical content |

Weight tokens: `--weight-normal` (400), `--weight-medium` (500), `--weight-bold` (600).
Line-height tokens: `--leading-tight` (1.25), `--leading-normal` (1.5), `--leading-relaxed` (1.75).

### Timing Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-fast` | 150ms | Micro-interactions |
| `--duration-normal` | 200ms | Standard transitions |
| `--easing-default` | cubic-bezier(0.4, 0, 0.2, 1) | General transitions |
| `--easing-out` | cubic-bezier(0, 0, 0.2, 1) | Exit animations |

## Dark Mode

- Dark mode is the **default**.
- Theme is set via `data-theme` attribute on `<html>`, not a `class`.
- Tailwind dark mode selector: `['class', '[data-theme="dark"]']`.
- Theme state is managed by `ThemeContext` (React context) with cookie persistence (`theme` and `theme-preference` cookies).
- SSR: initial theme is resolved from cookies in the root layout to avoid flash.

## UI Primitive Inventory

Components in `src/components/ui/` (all shadcn/ui based):

accordion, alert, alert-dialog, aspect-ratio, avatar, avatar-image, badge, breadcrumb, breadcrumbs, button, calendar, card, carousel, chart, checkbox, collapsible, cover-image, dialog, dropdown-menu, empty, field, input, item, label, menubar, pagination, popover, progress, scroll-area, select, select-field, separator, sheet, sidebar, skeleton, slider, sonner, spinner, switch, table, tabs, textarea, tooltip

## Component Organization

- `src/components/ui/` — Shared UI primitives (shadcn/ui based)
- `src/components/article/` — Shared article components
- `src/components/profile/` — Shared profile components
- `src/app/components/` — App-specific components organized by domain (auth, backlog, dashboard, diary, editor, home, layout, media, navbar, settings, shell, support, etc.)
- Route-specific components use `_components/` directories within the route folder.

## Reusable CSS Classnames

`src/lib/constants/ui.ts` exports `UI_CLASSNAMES` with pre-composed Tailwind patterns:
- `pageShell` — full-height page base
- `pageBackdrop` — positioned overlay
- `pageGradient` — gradient background
- `panelCard` — standard card styling
- `tagPill` — rounded badge/tag styling
- `mutedInteractive` — hover text effect

Use these constants instead of duplicating the same Tailwind class combinations.

## Rules

- Do not introduce hardcoded colors if the same result can be achieved through existing theme tokens, semantic classes, or shared component variants.
- Maintain visual consistency across spacing, radius, borders, surfaces, shadows, and typography.
- Any new UI must feel native to the existing design system and branding.
- When in doubt, follow existing UI patterns and styles already present in the codebase.
- Minimum touch target: `--touch-min` (44px) for interactive elements on mobile.
