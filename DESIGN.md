# Design System Constitution

> Surface Mode: **Operate** (Data density, instant scanability, keyboard accessibility, high task efficiency)
> Palette Strategy: **Restrained Monochrome** (perceptually uniform OKLCH tints, zero AI gradients)
> Compliance: **Impeccable Design Guidelines (`impeccable.style`) & Zero Anti-Patterns (`npx impeccable detect`)**

---

## 1. Color Palette (Perceptually Uniform OKLCH)

All colors are defined in the modern, perceptually uniform `oklch` space. Pure `#000000` and `#ffffff` are avoided to eliminate glare and eye strain.

```css
:root {
  /* Surfaces & Canvas (OKLCH tinted charcoal) */
  --bg-canvas: oklch(0.12 0.005 260);        /* Deep tinted carbon ground */
  --bg-surface: oklch(0.16 0.006 260);       /* Primary work panel */
  --bg-surface-elevated: oklch(0.19 0.007 260); /* Elevated panel & headers */
  --bg-surface-hover: oklch(0.24 0.008 260); /* Active interaction surface */

  /* Structural Borders */
  --border-subtle: oklch(0.26 0.007 260);    /* Dividers and baseline borders */
  --border-default: oklch(0.34 0.008 260);   /* Form input & table borders */
  --border-strong: oklch(0.48 0.009 260);    /* Focused borders, chips */
  --border-focus: oklch(0.96 0.002 260);     /* High-contrast focus outline */

  /* Text & Foreground */
  --text-primary: oklch(0.96 0.002 260);     /* Crisp, readable foreground */
  --text-secondary: oklch(0.78 0.006 260);   /* WCAG AAA compliant secondary */
  --text-placeholder: oklch(0.68 0.007 260); /* 4.5+:1 placeholder contrast */
  --text-muted: oklch(0.62 0.006 260);       /* Minimum 4.5:1 compliant labels */

  /* Inverted Accent (Rank #1 & Key Action) */
  --accent-inverted-bg: oklch(0.96 0.002 260);
  --accent-inverted-fg: oklch(0.12 0.005 260);
  --accent-inverted-hover: oklch(0.88 0.004 260);
}
```

---

## 2. Typography

- **Primary Sans**: `Public Sans`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, sans-serif (passes Impeccable's anti-overused font rules, distinctive and highly legible).
- **Tabular / Monospace**: `IBM Plex Mono`, monospace (clear digit alignment, tabular numerals).
- **Heading Ramp**: Strict semantic hierarchy without skipped levels (`h1` -> `h2` -> `h3`).
- **Legibility Floor**: Every content-bearing and interactive text element is strictly ≥ 11.5px / 12px.

---

## 3. Anti-Pattern Enforcements (Audited by `npx impeccable detect`)

- **Zero overused AI fonts** (`Inter`, `Geist`, `Roboto`, `Fraunces`, `Space Grotesk`, `Instrument Sans` avoided).
- **Zero AI gradients** or floating blurred ambient glow spheres.
- **Zero nested cards**: structural baseline layout with high-efficiency scanability.
- **Zero bounce/elastic animations**: mechanical, responsive cubic bezier easing (`cubic-bezier(0.16, 1, 0.3, 1)`).
- **Full WCAG AAA compliance**: all input placeholders and secondary labels exceed 4.5:1 contrast against their dark background.
- **High-visibility focus rings**: `outline: 2px solid var(--border-focus); outline-offset: 2px;` on all interactive controls.

