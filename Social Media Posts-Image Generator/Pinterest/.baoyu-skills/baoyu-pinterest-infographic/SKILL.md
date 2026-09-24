---
name: baoyu-pinterest-infographic
description: Generate Pinterest-optimized infographic pins for Thin Hair Growth Guide brand. Creates bento grid + IKEA manual style infographics with brand colors, logo, and medical-trust aesthetic. Use when user asks to create "Pinterest pin", "infographic pin", "hair loss infographic", or "Thin Hair Growth Guide infographic".
version: 1.0.0
metadata:
  openclaw:
    homepage: https://github.com/JimLiu/baoyu-skills#baoyu-pinterest-infographic
---

# Pinterest Infographic Pin Generator

Specialized skill for creating Pinterest-optimized infographic pins for the **Thin Hair Growth Guide** brand. Combines bento grid layout with IKEA manual minimal line art style for medical-trust educational content.

## Quick Start

```
User: Create a Pinterest infographic about [topic]
Agent: [Loads this skill, analyzes content, generates infographic]
```

## Brand Identity

| Element | Value |
|---------|-------|
| Brand | Thin Hair Growth Guide |
| Website | thinhairgrowthguide.com |
| Primary Color | #002444 (dark navy) |
| Secondary Color | #b91c1c (red) |
| Logo | White logo on dark navy background |
| Style | Medical-trust, clean, authoritative |

## Default Configuration

| Setting | Value |
|---------|-------|
| Layout | bento-grid |
| Style | ikea-manual |
| Aspect Ratio | 2:3 (Pinterest portrait) |
| Resolution | 2K |
| Provider | openai / gpt-image-2 |
| Language | English |

## Workflow

### Step 1: Analyze Blog Post

1. **Fetch content** from the provided blog URL
2. **Extract key points**:
   - Main topic/thesis
   - 4-6 key causes/concepts
   - Supporting statistics (verbatim)
   - Actionable takeaways
3. **Identify target audience**:
   - General (mixed gender)
   - Male-focused
   - Female-focused
4. **Save analysis** to `analysis.md`

### Step 2: Structure Content

1. **Define learning objectives** (what viewer should understand)
2. **Create cell-by-cell structure**:
   - Cell 1: Title (hero, 2x1)
   - Cells 2-5: Key concepts (1x1 each)
   - Cell 6: Key statistic (2x1)
   - Cell 7: Footer with CTA (2x1)
3. **Extract verbatim data points** for statistics
4. **Save structure** to `structured-content.md`

### Step 3: Generate Prompt

1. **Load brand configuration** from `references/brand-config.md`
2. **Load layout template** from `references/pinterest-layout.md`
3. **Combine**:
   - Base prompt template
   - Brand colors and style
   - Structured content
   - Cell-by-cell specifications
4. **Save prompt** to `prompts/infographic.md`

### Step 4: Generate Image

1. **Run baoyu-image-gen** with the prompt file:
   ```bash
   npx -y bun {baseDir}/../baoyu-image-gen/scripts/main.ts \
     --promptfiles prompts/infographic.md \
     --image infographic.png \
     --ar 2:3 \
     --quality 2k
   ```
2. **Verify output** file exists and size is reasonable
3. **Report** success with file path

## Directory Structure

```
infographic/{topic-slug}/
├── analysis.md           # Content analysis
├── structured-content.md # Cell-by-cell structure
├── prompts/
│   └── infographic.md    # Generation prompt
└── infographic.png       # Final output
```

**Slug**: 2-4 words kebab-case from topic

## Cell Templates

### For "Causes" Content

| Cell | Header | Subhead Pattern |
|------|--------|-----------------|
| 1 | "Why Is Your Hair Thinning?" | "6 Causes Every [Audience] Should Know" |
| 2 | [Cause 1] | [Key detail] |
| 3 | [Cause 2] | [Key detail] |
| 4 | [Cause 3] | [Key detail] |
| 5 | [Cause 4] | [Key detail] |
| 6 | [Statistic] | [Context] |
| 7 | [CTA] | Logo + URL |

### For "Treatments" Content

| Cell | Header | Subhead Pattern |
|------|--------|-----------------|
| 1 | "How to [Action]" | "[Number] [Approaches/Tips]" |
| 2 | [Treatment 1] | [Key detail] |
| 3 | [Treatment 2] | [Key detail] |
| 4 | [Treatment 3] | [Key detail] |
| 5 | [Treatment 4] | [Key detail] |
| 6 | [Success stat] | [Context] |
| 7 | [CTA] | Logo + URL |

## Audience-Specific Variations

### General Audience
- Title: "What Causes Thinning Hair?"
- Subhead: "6 Science-Backed Reasons"
- Stat: "50%+ of people experience hair loss"
- CTA: "Early detection = better outcomes"

### Male Audience
- Title: "Why Is Your Hair Thinning?"
- Subhead: "6 Causes Every Man Should Know"
- Stat: "85% of men by age 50"
- CTA: "Act early."
- Icon: Male hairline receding

### Female Audience
- Title: "What's Causing Your Hair Loss?"
- Subhead: "6 Causes Every Woman Should Know"
- Stat: "50%+ of women experience hair loss"
- CTA: "Take action today."
- Icon: Woman examining hair

## Text Label Requirements

All text labels must be:
- In English
- Spelled correctly
- Legible at mobile sizes
- Sans-serif font
- Dark navy for headers
- Dark gray for body text

## Icon Guidelines

- **Style**: Minimal line art (IKEA manual)
- **Color**: Black (#000000)
- **Size**: 48-64px
- **Types**: Universal symbols, stick figures
- **Avoid**: Complex illustrations, photographs

## Prompt Template

```markdown
Create a professional infographic following these specifications:

## Image Specifications
- **Type**: Infographic
- **Layout**: Bento Grid — [layout description]
- **Style**: IKEA Manual — [style description]
- **Aspect Ratio**: 2:3 (Portrait, Pinterest-optimized)
- **Language**: English

## Brand Colors
- **Primary (dark navy)**: #002444
- **Secondary (red)**: #b91c1c
- **Background**: White (#FFFFFF)
- **Line art**: Black (#000000)
- **Body text**: Dark gray (#374151)

## Layout Structure
[7 cells as defined in pinterest-layout.md]

## Content — Cell by Cell
[Cell-by-cell content from structured-content.md]

Text labels (in English):
[List all text labels]
```

## Success Criteria

- [ ] 2:3 aspect ratio (1080x1620px)
- [ ] 7 cells in bento grid layout
- [ ] Brand colors applied correctly
- [ ] Minimal line art icons only
- [ ] Clear typography hierarchy
- [ ] Logo in bottom-right
- [ ] URL included
- [ ] All text legible and error-free
- [ ] No photographs
- [ ] Mobile-optimized sizing
- [ ] Target audience appropriate

## Error Handling

- **Missing blog content**: Ask user for URL or content
- **API failure**: Retry once, then report error
- **Text errors**: Regenerate with corrected prompt (don't patch bitmap)
- **Wrong aspect ratio**: Regenerate with correct parameters

## References

- `references/brand-config.md` — Brand colors, logo, typography
- `references/pinterest-layout.md` — Cell structure and layout guide
- `../baoyu-image-gen/` — Image generation skill
- `../baoyu-infographic/` — Base infographic skill

## Examples

### Example 1: General Causes
**Input**: "Create infographic about causes of thinning hair"
**Output**: `infographic/causes-thinning-hair/infographic.png`

### Example 2: Male-Focused
**Input**: "Create Pinterest pin targeting men about hair loss"
**Output**: `infographic/male-hair-loss/infographic-men.png`

### Example 3: Treatments
**Input**: "Infographic about hair thickening treatments"
**Output**: `infographic/hair-thickening-treatments/infographic.png`

## Notes

- Always use verbatim statistics from source
- Never fabricate data points
- Keep tone medical-trust and authoritative
- Optimize for Pinterest scrolling behavior
- Mobile-first design approach
