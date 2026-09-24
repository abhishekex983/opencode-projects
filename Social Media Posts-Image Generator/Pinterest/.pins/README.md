# Pinterest Pins Output

Daily Pinterest pins generated from blog posts.

## Directory Structure

```
.pins/
└── {date}/
    └── {blog-slug}/
        ├── analysis.md              # Blog post analysis
        ├── infographics/
        │   ├── infographic-1-{topic}.png
        │   ├── infographic-2-{topic}.png
        │   └── infographic-3-{topic}.png
        ├── title-pin.png            # Title + featured image
        ├── before-after-pin.png     # Before/after comparison
        └── routine-pin.png          # Routine/methodology steps
```

## Pin Types

| Type | Description | Template |
|------|-------------|----------|
| Infographic | Bento grid with 7 cells | `baoyu-pinterest-infographic` |
| Title Pin | Editorial magazine cover | `Prompt to create a title enticing pin.txt` |
| Before/After | Split comparison layout | `Prompt to create Before-After pin.txt` |
| Routine | Step-by-step flow | `Prompt to create Routine pin.txt` |

## Usage

```bash
# Generate pins for a blog post
# 1. Provide blog URL and hero image
# 2. Run workflow: workflows/daily-pins.md
# 3. Output saved to .pins/{date}/{blog-slug}/
```

## Brand Guidelines

- **Primary Color**: #002444 (dark navy)
- **Secondary Color**: #b91c1c (red)
- **Aspect Ratio**: 2:3 (1080x1620px)
- **Style**: Medical-trust, clean, authoritative
