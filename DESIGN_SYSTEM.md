# ThreadLine Design System
## Codename: PHANTOM PROTOCOL

---

## 1. Design Philosophy

**Aesthetic:** Cyber-Noir Intelligence
**Mood:** Dark, commanding, minimal — like a classified terminal interface designed for elite operatives.
**Inspiration:** Military briefing screens, encrypted communication consoles, stealth UI.

### Principles
1. **Darkness is the canvas** — Content emerges from the void
2. **Information hierarchy through luminance** — Brighter = more important
3. **Uppercase tracking for system language** — Labels feel like classified stamps
4. **Generous negative space** — Every element breathes like it's the only thing on screen
5. **Subtle glass morphism** — Frosted surfaces for interactive elements only

---

## 2. Color Palette

### Backgrounds
| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-void` | `#0A0A0A` | Primary page background |
| `--bg-surface` | `#0F0F0F` | Card / elevated surfaces |
| `--bg-elevated` | `#141414` | Modals, popovers |
| `--bg-subtle` | `#1A1A1A` | Hover states, active items |

### Text
| Token | Hex | Usage |
|-------|-----|-------|
| `--text-primary` | `#E8E8E8` | Headlines, primary content |
| `--text-secondary` | `#888888` | Labels, descriptions |
| `--text-muted` | `#4A4A4A` | Placeholder text, hints |
| `--text-ghost` | `#2A2A2A` | System watermarks, decorative |

### Borders & Lines
| Token | Hex | Usage |
|-------|-----|-------|
| `--border-subtle` | `rgba(255,255,255,0.06)` | Card borders, dividers |
| `--border-hover` | `rgba(255,255,255,0.12)` | Hover state borders |
| `--border-active` | `rgba(255,255,255,0.20)` | Focus / active borders |

### Accent (Minimal Use)
| Token | Hex | Usage |
|-------|-----|-------|
| `--accent-ice` | `#7DD3FC` | Deep mode toggle ON |
| `--accent-ember` | `#F87171` | Risk / threat indicators |
| `--accent-signal` | `#34D399` | Success / operational status |
| `--accent-warn` | `#FBBF24` | Warning states |

### Glass Effects
| Token | Value | Usage |
|-------|-------|-------|
| `--glass-bg` | `rgba(255,255,255,0.03)` | Glass surface fill |
| `--glass-border` | `rgba(255,255,255,0.08)` | Glass border |
| `--glass-blur` | `blur(24px)` | Backdrop filter |

---

## 3. Typography

### Font Stack
```css
--font-display: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale
| Token | Size | Weight | Tracking | Usage |
|-------|------|--------|----------|-------|
| `--type-hero` | 48px / 3rem | 300 | -0.02em | "Who are you, agent?" |
| `--type-hero-bold` | 48px / 3rem | 700 italic | -0.02em | "agent?" emphasis |
| `--type-h1` | 32px / 2rem | 300 | -0.01em | Section headers |
| `--type-h2` | 20px / 1.25rem | 500 | 0 | Sub-headers |
| `--type-label` | 11px / 0.6875rem | 500 | 0.2em | AUTHENTICATION PROTOCOL |
| `--type-body` | 14px / 0.875rem | 400 | 0.01em | Body text |
| `--type-caption` | 12px / 0.75rem | 400 | 0.15em | SYSTEM STATUS text |
| `--type-micro` | 10px / 0.625rem | 400 | 0.25em | Encryption standard |

### Text Transform Rules
- **Labels/Categories:** `uppercase` + `letter-spacing: 0.2em`
- **System Status:** `uppercase` + `letter-spacing: 0.15em`
- **Buttons:** `uppercase` + `letter-spacing: 0.12em`
- **Body text:** Normal case

---

## 4. Spacing System

Base unit: `4px`

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | 4px | Tight gaps |
| `--space-sm` | 8px | Icon padding |
| `--space-md` | 16px | Component internal padding |
| `--space-lg` | 24px | Section gaps |
| `--space-xl` | 40px | Between major sections |
| `--space-2xl` | 64px | Page section breaks |
| `--space-3xl` | 96px | Hero vertical padding |

---

## 5. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-none` | 0px | Sharp panels |
| `--radius-sm` | 4px | Small chips, tags |
| `--radius-md` | 8px | Cards, inputs |
| `--radius-lg` | 12px | Modals |
| `--radius-pill` | 999px | Search bars, bottom nav |

---

## 6. Component Specs

### 6.1 Search Bar (Glass Pill)
```
Height: 56px
Border-radius: 999px (pill)
Background: rgba(255,255,255,0.03)
Border: 1px solid rgba(255,255,255,0.08)
Backdrop-filter: blur(24px)
Padding: 0 24px
Font: 16px Inter, weight 300
Placeholder color: var(--text-muted)
Icons: 20px, color var(--text-muted)
Focus: border → rgba(255,255,255,0.15)
```

### 6.2 Full-Width Button (CTA)
```
Height: 56px
Border-radius: 8px
Background: transparent
Border: 1px solid rgba(255,255,255,0.12)
Font: 13px uppercase, tracking 0.12em, weight 500
Color: var(--text-primary)
Arrow icon: 16px, right side
Hover: background rgba(255,255,255,0.04), border brightness increase
```

### 6.3 Bottom Navigation Bar
```
Height: 52px
Border-radius: 999px (pill)
Background: rgba(255,255,255,0.03)
Border: 1px solid rgba(255,255,255,0.06)
Backdrop-filter: blur(24px)
Position: fixed bottom, centered
Width: max-content (auto based on items)
Padding: 0 24px
Gap between items: 20px
Icons: 18px, color var(--text-muted)
Brand text: 14px, weight 600, tracking 0.1em
```

### 6.4 Avatar Selector
```
Size: 64px × 64px
Border-radius: 4px
Border: 1px solid rgba(255,255,255,0.06)
Selected: border → rgba(255,255,255,0.25), slight brightness boost
Gap between avatars: 8px
Filter: grayscale(30%) brightness(0.8) — default
Filter (selected): grayscale(0%) brightness(1)
```

### 6.5 Category Pill (ANALYZE / DEVELOP / MONITOR)
```
Font: 11px uppercase, tracking 0.2em, weight 500
Color: var(--text-muted)
Sub-text: 12px normal case, weight 400
Gap between label and sub-text: 4px
```

### 6.6 Deep Mode Toggle
```
Width: 44px, Height: 22px
Border-radius: pill
Background (off): rgba(255,255,255,0.08)
Background (on): var(--accent-ice) at 30% opacity
Knob: 18px circle, white
Label: "DEEP" — 11px uppercase tracking, placed right of toggle
```

---

## 7. Animation Specs

| Animation | Duration | Easing | Usage |
|-----------|----------|--------|-------|
| Page fade-in | 600ms | ease-out | Page entry |
| Element stagger | 80ms delay per item | ease-out | Lists, grid items |
| Hover glow | 200ms | ease | Buttons, interactive |
| Input focus | 150ms | ease | Search bar border |
| Toggle slide | 200ms | cubic-bezier(0.4, 0, 0.2, 1) | Deep mode |
| Text reveal | 400ms | ease-out | Hero text on load |
| Pulse | 2000ms | ease-in-out, infinite | Status indicator |

### Entrance Animation Sequence (Landing Page)
1. `0ms` — Background fade from black
2. `200ms` — "THREADLINE" logo fades in
3. `400ms` — "AUTHENTICATION PROTOCOL" label slides up
4. `500ms` — "Who are you," text reveals
5. `650ms` — "agent?" bold italic reveals
6. `800ms` — Input + label fade in
7. `1000ms` — Avatar row staggers in (80ms each)
8. `1200ms` — Button fades in
9. `1400ms` — Footer fades in

---

## 8. Layout

### Page Container
```
Max-width: 640px (content area)
Center aligned
Padding: 0 24px (mobile), 0 (desktop)
```

### Vertical Rhythm
- Hero section: centered vertically on viewport
- Content flows from center outward
- Footer anchored to bottom

---

## 9. Iconography

- **Style:** Outlined, 1.5px stroke
- **Size:** 18-20px default, 24px for primary actions
- **Color:** var(--text-muted) default, var(--text-secondary) on hover
- **Source:** Lucide React (lightweight, consistent)

---

## 10. Responsive Breakpoints

| Token | Width | Target |
|-------|-------|--------|
| `--bp-mobile` | < 640px | Phones |
| `--bp-tablet` | 640-1024px | Tablets |
| `--bp-desktop` | > 1024px | Desktop |

---

## 11. Dark-Only Policy

ThreadLine is **dark-only**. There is no light mode.
The interface exists in perpetual darkness — as all intelligence platforms should.
