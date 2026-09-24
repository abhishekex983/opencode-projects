# Pinterest Pin Prompt Templates

Reusable prompts for creating Pinterest pins via Kie.ai API (GPT Image 2).

---

## 1. Product Photo Pin (Image-to-Image)

Use when you have a product photo from a blog post.

**Model:** `gpt-image-2-image-to-image`

**Input URL:** Your blog's product image URL

**Prompt:**
```
Transform this product photo into a Pinterest pin, portrait 2:3 format. Keep the products visible in the lower portion of the image. Add a dark navy (#002444) semi-transparent overlay on the upper half. Place bold white title text on the overlay: [YOUR TITLE]. Add smaller light gray teaser text below: [YOUR TEASER]. Thin crimson red (#B91C1C) accent line between title and teaser. Clean modern typography. Text must be perfectly legible and correctly spelled.
```

**API call:**
```json
POST https://api.kie.ai/api/v1/jobs/createTask
{
  "model": "gpt-image-2-image-to-image",
  "input": {
    "prompt": "<filled prompt>",
    "input_urls": ["<image URL>"],
    "aspect_ratio": "2:3",
    "resolution": "2K"
  }
}
```

**Poll for result:**
```
GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId=<taskId>
```

---

## 2. Text-Only Pin (Text-to-Image)

Use when you don't have a product photo or want a clean typography-only design.

**Model:** `gpt-image-2-text-to-image`

**Prompt:**
```
Pinterest pin, portrait 2:3 format. Text-only design, no photos, no illustrations, no icons. Bold large title text centered: [YOUR TITLE]. Smaller teaser text below: [YOUR TEASER]. Color: deep navy (#002444) background, white bold title text, lighter gray teaser text, thin crimson red (#B91C1C) accent line separating title and teaser. Clean minimal modern typography. Strong visual hierarchy with title dominating the pin. No other elements. Text must be perfectly legible and correctly spelled.
```

**API call:**
```json
POST https://api.kie.ai/api/v1/jobs/createTask
{
  "model": "gpt-image-2-text-to-image",
  "input": {
    "prompt": "<filled prompt>",
    "aspect_ratio": "2:3",
    "resolution": "2K"
  }
}
```

---

## 3. Infographic (Text-to-Image)

Use for information-dense pins with multiple sections.

**Model:** `gpt-image-2-text-to-image`

### Clean Medical Style
```
Professional health infographic, portrait 2:3 Pinterest format. Title at top: [YOUR TITLE]. Subtitle: [YOUR SUBTITLE]. Website: [YOUR URL]. Color scheme: Dark navy (#002444) header and footer, crimson red (#B91C1C) accents and highlights, white card backgrounds, light gray (#faf9fc) page background. Clean modern medical-trust aesthetic. Layout sections top to bottom: 1) HEADER - dark navy background, bold white title, subtitle in lighter text, website URL small at bottom. 2) [SECTION NAME] with 3 white rounded cards showing: [Item 1 with description], [Item 2 with description], [Item 3 with description]. 3) [SECTION NAME] with numbered crimson circles: [Step 1], [Step 2], [Step 3]. 4) [SECTION NAME] with icon callouts: [Point 1], [Point 2], [Point 3], [Point 4]. 5) TIMELINE horizontal bar: [Stage 1], [Stage 2], [Stage 3]. 6) KEY TAKEAWAYS with crimson bullet points: [Takeaway 1], [Takeaway 2], [Takeaway 3], [Takeaway 4]. 7) FOOTER dark navy: [Tagline]. [Website]. Style: clean scannable professional health infographic with clear typography hierarchy. Minimal line icons. No photos. All text must be perfectly legible and correctly spelled.
```

### Bold Editorial Style
```
Bold graphic poster infographic, portrait 2:3 Pinterest format. Title: [YOUR TITLE]. Subtitle: [YOUR SUBTITLE]. Website: [YOUR URL]. Colors: deep navy (#002444) dominant, crimson red (#B91C1C) bold accents, pure white text on dark backgrounds, high contrast throughout. Modern editorial magazine aesthetic with oversized typography and strong geometric shapes. Layout: 1) HERO HEADER with massive bold title text taking up visual weight, navy background, crimson accent line. 2) [SECTION NAME] - 3 bold cards with large icons: [Item 1], [Item 2], [Item 3 with details]. 3) [SECTION NAME] in bold numbered steps with large crimson numbered circles: [Step 1], [Step 2], [Step 3]. 4) [SECTION NAME] with bold graphic callouts: [Point 1], [Point 2], [Point 3], [Point 4]. 5) TIMELINE with bold markers and arrows: [Stage 1], [Stage 2], [Stage 3]. 6) [SECTION NAME] in bold box: [Key point 1], [Key point 2], [Key point 3], [Key point 4]. 7) FOOTER: [Tagline]. [Website]. Style: bold high-contrast poster with strong visual hierarchy through dramatic font sizes. Geometric shapes, bold lines, graphic elements. All text perfectly legible and correctly spelled.
```

---

## Title Formulas

| Type | Formula | Example |
|------|---------|---------|
| Curiosity | What Actually Happens When You [X] | What Actually Happens When You Wash With Nioxin for the First Time |
| Benefit | How to [Result] in [Timeframe] With [Product] | How to Get More Volume in 30 Days With Nioxin |
| Personal | I Tried [X]. Here's What Nobody Tells You. | I Tried Nioxin for the First Time. Here's What Nobody Tells You. |

## Teaser Formulas

- The [unexpected thing], the [problem], and what changes [timeframe].
- A simple [frequency] routine that [benefit]. No [common fear], just [result].
- The honest reality of [experience] - from [bad part] to [good part].

---

## API Reference

**Base URL:** `https://api.kie.ai`

**Auth header:** `Authorization: Bearer <YOUR_API_KEY>`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/jobs/createTask` | POST | Submit a generation task |
| `/api/v1/jobs/recordInfo?taskId=<id>` | GET | Poll task status and get results |

**Task states:** `waiting` -> `queuing` -> `generating` -> `success` / `fail`

**Download result:** `data.resultJson` -> `resultUrls[0]`

**Models available:**
- `gpt-image-2-text-to-image` — generates from text prompt only
- `gpt-image-2-image-to-image` — transforms an existing image with text overlay

**Aspect ratios:** `2:3` (Pinterest portrait), `1:1` (square), `16:9` (landscape), `3:4`, `4:3`, `9:16`

**Resolutions:** `1K`, `2K`, `4K`

---

## Source Images

| Image | URL |
|-------|-----|
| Nioxin 3 products | `https://thinhairgrowthguide.com/wp-content/uploads/2026/08/All-three-products-from-the-Nioxin-kit.png` |
| Nioxin boxed kit | `https://thinhairgrowthguide.com/wp-content/uploads/2026/08/Picture-of-Nioxin-Scalp-Hair-Thickening-System-Kits-before-unboxing.jpeg` |
| Vitamin D - Bald spot regrowth | `https://thinhairgrowthguide.com/wp-content/uploads/2026/07/Is-It-Possible-to-Regrow-Hair-on-a-Bald-Spot.png` |
| Vitamin D - Hair regrowth itch | `https://thinhairgrowthguide.com/wp-content/uploads/2026/07/Does-Hair-Regrowth-Make-Your-Scalp-Itch.png` |
| Vitamin D - Hero image | `https://thinhairgrowthguide.com/wp-content/uploads/2026/07/Does-Low-Vitamin-D-Cause-Hair-Thinning.png` |
