# Haircare Theme - Project Context

## Overview
A WordPress theme for the Hair Restoration site, translated from the existing static HTML site at `hair-restoration-site/dist/`.

## Design System

### Colors
| Token                  | Hex       | Usage                            |
|------------------------|-----------|----------------------------------|
| `--color-primary`      | `#002444` | Dark navy — nav, footer, headings |
| `--color-primary-container` | `#1b3a5c` | Lighter navy — badges, hover states |
| `--color-on-primary`   | `#ffffff` | Text on primary backgrounds      |
| `--color-on-primary-container` | `#87a4cc` | Muted text on primary    |
| `--color-crimson-bold` | `#B91C1C` | Accent — CTAs, active states, tags |
| `--color-charcoal-ink` | `#1A1A1A` | Body text                        |
| `--color-muted-steel`  | `#6B7280` | Secondary/meta text              |
| `--color-canvas-white` | `#FFFFFF` | Card backgrounds                 |
| `--color-surface`      | `#faf9fc` | Page background                  |
| `--color-surface-container-low` | `#f4f3f6` | Light card/section bg    |
| `--color-whisper-border` | `#E5E7EB` | Borders, dividers              |
| `--color-background`   | `#faf9fc` | Body background                  |
| `--color-on-surface`   | `#1a1c1e` | Text on surface backgrounds      |

### Typography
| Token          | Font Family       | Weight | Size  | Line Height | Letter Spacing |
|----------------|-------------------|--------|-------|-------------|----------------|
| `--font-headline` | Plus Jakarta Sans | 700    | —     | —           | —              |
| `--font-body`  | Inter             | 400    | —     | —           | —              |
| `--font-label` | JetBrains Mono    | 500    | —     | —           | —              |

### Font Sizes
| Token             | Size  | Line Height | Weight | Letter Spacing |
|-------------------|-------|-------------|--------|----------------|
| `--text-headline-xl` | 48px | 1.1        | 700    | -0.02em        |
| `--text-headline-lg` | 32px | 1.2        | 700    | -0.01em        |
| `--text-headline-md` | 24px | 1.3        | 600    | —              |
| `--text-body-lg`  | 18px  | 1.6 (1.8 in article) | 400 | —          |
| `--text-body-md`  | 16px  | 1.6         | 400    | —              |
| `--text-label-sm` | 12px  | 1.0         | 500    | 0.05em         |

### Spacing
| Token                  | Value    |
|------------------------|----------|
| `--spacing-container-max` | 1200px |
| `--spacing-section-padding` | 6rem |
| `--spacing-gutter`     | 2rem     |
| `--spacing-sidebar-width` | 300px |

### Border Radius
| Token    | Value    |
|----------|----------|
| Default  | 0.25rem  |
| LG       | 0.5rem   |
| XL       | 0.75rem  |
| Full     | 9999px   |

### Components
- **Nav**: Sticky top, dark navy bg, logo (HR badge + site name), nav links, search icon, crimson CTA button
- **Hero**: Full-width, dark navy bg, 2-column grid (text + before/after slider)
- **Cards**: White bg, XL rounded, soft shadow (0 4px 20px -2px rgba(0,0,0,0.06)), hover shadow increase
- **Category Pills**: Rounded-full, border, crimson active state
- **TL;DR Box**: Surface-container-low bg, XL rounded, left 4px crimson border
- **Footer**: Dark navy bg, 4-column grid, social icons, copyright bar

### Existing Nav Structure
- Home (active: crimson bottom border)
- Treatments
- Transplants
- Tips
- Success Stories
- About
- Search icon (Material Symbols)
- Consultation button (crimson bg)

## File Structure
```
haircare-theme/
├── style.css              ← Theme metadata + CSS custom properties + base styles
├── functions.php          ← Enqueue styles/fonts, register nav menu, theme support
├── index.php              ← Main template (basic loop)
├── header.php             ← Site header + nav
├── footer.php             ← Site footer
├── sidebar.php            ← Sidebar
├── screenshot.png         ← (manual later)
├── assets/
│   ├── css/               ← Additional stylesheets
│   ├── js/                ← Scripts (mobile menu toggle)
│   └── images/            ← Theme images
├── template-parts/        ← Reusable template partials
├── inc/                   ← Custom functions
└── PROJECT_CONTEXT.md     ← This file
```

## Notes
- Theme uses vanilla CSS (no build step required)
- All design tokens are CSS custom properties in `style.css`
- Google Fonts loaded via `<link>` in header.php
- Material Symbols loaded via `<link>` in header.php
- WordPress `wp_head()` and `wp_footer()` hooks must be present
- Navigation registered via `register_nav_menus()` and rendered with `wp_nav_menu()`
