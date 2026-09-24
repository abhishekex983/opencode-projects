# 6-Pin Daily Strategy - Quick Reference

## Overview

Generate 6 Pinterest pins daily from one blog post for maximum reach and engagement.

## Daily Output

| # | Pin Type | Purpose | Template |
|---|----------|---------|----------|
| 1 | Infographic: Sub-topic A | Educational content | `baoyu-pinterest-infographic` |
| 2 | Infographic: Sub-topic B | Educational content | `baoyu-pinterest-infographic` |
| 3 | Infographic: Sub-topic C | Educational content | `baoyu-pinterest-infographic` |
| 4 | Title + Featured Image | Click-through driver | `Prompt to create a title enticing pin.txt` |
| 5 | Before/After Comparison | Transformation proof | `Prompt to create Before-After pin.txt` |
| 6 | Routine/Methodology | Actionable steps | `Prompt to create Routine pin.txt` |

## Quick Start

### Input Requirements

```
Blog URL: https://thinhairgrowthguide.com/...
Hero Image: URL or local path
Before/After Images: URLs (optional, can use hero image)
Audience: male / female / general
```

### Output Location

```
.pins/{YYYY-MM-DD}/{blog-slug}/
```

## Pin Templates

### 1. Infographic Pins (3x)

**Skill**: `baoyu-pinterest-infographic`

**Process**:
1. Analyze blog for 3 distinct sub-topics
2. Create content structure for each
3. Generate via baoyu-image-gen

**Example Sub-topics** for "How to Stop Hair Thinning":
- Causes of Hair Thinning
- Medical Treatments
- Home Remedies

### 2. Title + Featured Image Pin

**Template**: `Prompt to create a title enticing pin.txt`

**Process**:
1. Use blog hero image as reference
2. Add curiosity-driven headline
3. Generate editorial magazine style

**Headline Patterns**:
- "Why Your Hair Is Thinning (And What To Do)"
- "The Truth About [Topic]"
- "[Number] Signs You're Losing Your Hair"

### 3. Before/After Pin

**Template**: `Prompt to create Before-After pin.txt`

**Process**:
1. Identify transformation content in blog
2. Use before/after images (or hero image)
3. Generate split comparison layout

**Title Patterns**:
- "Before vs After: [Topic]"
- "See the Difference: [Treatment]"
- "3 Months Later: [Result]"

### 4. Routine/Methodology Pin

**Template**: `Prompt to create Routine pin.txt`

**Process**:
1. Extract 3-5 steps from blog
2. Create concise step descriptions
3. Generate step-by-step layout

**Title Patterns**:
- "The [X]-Step [Topic] Method"
- "How to [Goal]: [X] Simple Steps"
- "[Topic] Routine That Actually Works"

## Workflow

```
1. Provide blog URL + hero image
   ↓
2. Analyze blog post
   - Extract 3 sub-topics
   - Identify before/after content
   - Extract routine steps
   ↓
3. Generate 3 infographic pins
   ↓
4. Generate title + featured image pin
   ↓
5. Generate before/after pin
   ↓
6. Generate routine/methodology pin
   ↓
7. Verify all 6 pins
   ↓
8. Output to .pins/{date}/{blog-slug}/
```

## Brand Guidelines

| Element | Value |
|---------|-------|
| Primary Color | #002444 (dark navy) |
| Secondary Color | #b91c1c (red) |
| Background | #FFFFFF (white) |
| Typography | Sans-serif, bold headlines |
| Aspect Ratio | 2:3 (1080x1620px) |
| Style | Medical-trust, clean, authoritative |

## API Configuration (Kie.ai)

```json
{
  "endpoint": "POST https://api.kie.ai/api/v1/jobs/createTask",
  "model": "gpt-image-2-image-to-image",
  "resolution": "2K",
  "aspect_ratio": "2:3"
}
```

## Tips

1. **Sub-topic Selection**: Pick 3 distinct angles from the blog
2. **Headlines**: Use curiosity-driven, benefit-focused language
3. **Before/After**: Focus on transformation narrative
4. **Routine Steps**: Keep to 2-4 words per step
5. **Consistency**: Maintain brand colors and style across all pins
6. **Testing**: Track which pin types perform best

## File Locations

| File | Purpose |
|------|---------|
| `workflows/daily-pins.md` | Full workflow documentation |
| `Prompt to create a title enticing pin.txt` | Title pin template |
| `Prompt to create Before-After pin.txt` | Before/after pin template |
| `Prompt to create Routine pin.txt` | Routine pin template |
| `Thin Hair Growth Guide Brand Colors.txt` | Brand color definitions |
| `.pins/` | Output directory |
