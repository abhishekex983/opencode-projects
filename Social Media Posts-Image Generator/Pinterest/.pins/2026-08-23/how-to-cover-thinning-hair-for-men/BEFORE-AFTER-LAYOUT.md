# Before/After Pin Layout Standard

Standard layout for before/after comparison Pinterest pins.

## Canvas

- **Size**: 1080 x 1620px (2:3 ratio)
- **Background**: White (#FFFFFF)

## Layout Breakdown (Ultra Headline Focus)

| Section | Height | % | Content |
|---------|--------|---|---------|
| Navy Banner | 380px | 23% | Headline text |
| Red Bar | 6px | — | Accent divider |
| Labels | ~80px | 5% | BEFORE / AFTER boxes |
| Gap | 12px | — | — |
| Photos | ~850px | 52% | Original images side-by-side |
| Red Bar | 6px | — | Accent divider |
| Bottom CTA | 320px | 20% | Punchy closing text |

## Typography

| Element | Font | Size | Color | Style |
|---------|------|------|-------|-------|
| Headline line 1 | Arial Bold | 96px | White | "BEFORE vs AFTER:" |
| Headline line 2 | Arial Bold | 80px | White | "Covering Thinning Hair" (or topic) |
| BEFORE label | Arial Bold | 44px | White | On navy (#002444) rounded box |
| AFTER label | Arial Bold | 44px | White | On red (#b91c1c) rounded box |
| CTA line 1 | Arial Bold | 96px | Red (#b91c1c) | Punchy hook |
| CTA line 2 | Arial Bold | 52px | Navy (#002444) | Supporting line |

## Colors

| Element | Hex | Usage |
|---------|-----|-------|
| Navy | #002444 | Banner background, BEFORE label box, CTA line 2 |
| Red | #b91c1c | Accent bars, AFTER label box, CTA line 1 |
| White | #FFFFFF | Canvas background, label text, headline text |
| Light gray | #C8C8C8 | Photo divider line |

## Rules

1. **Headline is king** — it must dominate the top third of the pin
2. **Photos are supporting** — they prove the claim, not sell the click
3. **Original images only** — never AI-generate or modify before/after photos
4. **Use compositing** — Python/Pillow to place original photos as-is
5. **Red accent bars** — above and below photo section for visual punch
6. **Rounded label boxes** — radius 6px, padding 14px
7. **Bottom CTA** — punchy, curiosity-driven, large font
8. **Output formats** — JPEG (quality 88) for small file, PNG for lossless

## File Structure

```
pins/{date}/{topic}/
├── before-original.png    # Source before image (downloaded)
├── after-original.png     # Source after image (downloaded)
├── compose-pin.py         # Compositing script
├── before-after-pin.jpg   # Final output (JPEG, small)
└── before-after-pin.png   # Final output (PNG, lossless)
```

## Python Dependencies

- PIL (Pillow)
- os (stdlib)

## Compositing Script

Use `compose-pin.py` as template. Key functions:
- `load_font(names, size)` — font fallback chain
- `resize_fill(img, tw, th)` — resize + center crop to fill target dimensions
- Canvas built top-down: banner → bar → labels → gap → photos → bar → CTA
