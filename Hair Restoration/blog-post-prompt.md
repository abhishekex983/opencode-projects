# Blog Post Prompt & Linking Rules

**Site:** thinhairgrowthguide.com
**Purpose:** Reference doc for blog post creation and linking standards.
**Context:** Author is a personal blogger sharing hair loss experience. NOT a doctor, dermatologist, or medical professional.

**Writing Model:** Grok 4.3 (xAI via OpenRouter) — $1.25/$2.5 per M tokens, no watermark

---

## Article Structure

```
# [H1 - Target Keyword]

## TL;DR
A research-based straight answer to the target keyword. NOT a teaser or summary.

**Format:**
- First sentence must directly answer the topic/question
- Mirror the target keyword in the opening clause
- Ground in research findings (use Exa/Firecrawl data when available)
- Set realistic expectations
- 2-4 sentences max

**Pattern:** "To [verb] [target keyword]..."

**Examples:**
| Target Keyword | TL;DR Opening |
|---|---|
| "How to slow hair thinning" | "To slow hair thinning, research suggests..." |
| "What to do for thinning hair on top of head" | "To resolve thinning hair on top of your head,..." |
| "Best treatment for hair loss" | "The best treatment for hair loss depends on..." |
| "Does minoxidil work" | "Minoxidil works for many people, though..." |
| "How to regrow hair on bald spot" | "To regrow hair on a bald spot, early intervention..." |

**Disclaimer:** [standard disclaimer]

## [H2 - Section 1]
[body paragraphs]

## [H2 - Section 2]
[body paragraphs]

## [H2 - Section 3]
[body paragraphs]

## Conclusion
[summary, no new info]

### Key Takeaways
- [3-5 bullet points summarizing main points]
- Each bullet: bold key phrase + short explanation
- No links in key takeaways
```

---

## Research Step (Before Writing)

Before writing the TL;DR and article, use Exa and Firecrawl APIs to gather research-backed data.

### Exa API
- **Purpose:** Search for authoritative, evidence-based content on the topic
- **Use when:** Topic requires research citations, medical claims, or expert consensus
- **Search queries:** Combine target keyword with terms like "evidence-based", "research", "clinical", "study"
- **Filter:** Prioritize results from approved outbound domains (Mayo Clinic, Cleveland Clinic, PubMed, AAD, NHS, Healthline)

### Firecrawl API
- **Purpose:** Scrape specific pages found via Exa for detailed data points
- **Use when:** Need specific study findings, efficacy rates, expert quotes, or clinical data
- **Scrape targets:** Top 3-5 Exa results from authoritative sources

### When to Use
- **Always for TL;DR** — TL;DR must be a research-based straight answer, not a teaser
- **Medical topics** — Any article discussing treatments, medications, or clinical outcomes
- **Skip for:** Purely personal/style topics (e.g., "best hairstyles for thin hair")

---

## Linking Rules

### Internal Links (4 per article)

- **Source:** `Internal URLs.txt` only
- **HTML:** `<a href="URL" target="_blank">anchor text</a>`
- **Placement:** Body paragraphs only (NOT intro/TL;DR)
- **Proximity:** Min 2-3 paragraphs between any two links
- **Same paragraph:** No two links in same paragraph
- **Anchor text:** 50/50 mix exact-match vs natural phrase

### Outbound Links (2 per article)

- **Sources:** See Outbound Source Pool below
- **HTML:** `<a href="URL" target="_blank" rel="nofollow">anchor text</a>`
- **Placement:** Body paragraphs only (NOT intro/TL;DR)
- **Proximity:** Min 2-3 paragraphs between any two links
- **Same paragraph:** No two links in same paragraph
- **Anchor text:** 50/50 mix exact-match vs natural phrase

### Inline Images

- **HTML:** `<img src="URL" alt="descriptive alt text" />`
- **Placement:** Body paragraphs only (NOT intro/TL;DR)
- **Frequency:** One image per section recommended
- **Alt text:** Must describe image content accurately
- **Source:** Use image URLs from `Media URLS.md`; video URLs from `YouTube URLs.md`

### YouTube Embeds (Required — Min 1 per Article)

- **HTML:** `<iframe width="560" height="315" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allowfullscreen></iframe>`
  - For Shorts: `<iframe width="315" height="560" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allowfullscreen></iframe>`
- **Placement:** Body paragraphs only (NOT intro/TL;DR)
- **Frequency:** Minimum 1 per article; max 2 if relevant
- **Source:** Use URLs from `YouTube URLs.md`
- **Relevance:** Video must directly relate to the section topic — match video title to article context

### Link Distribution Rule

Total links per article: 6 (4 internal + 2 outbound)

Recommended placement across body sections:
- Section 1: 1 internal link
- Section 2: 1 internal + 1 outbound
- Section 3: 1 internal link
- Section 4: 1 internal + 1 outbound

This ensures natural distribution with proper proximity.

---

## Internal URL Pool

Source: `F:\Opencode Projects\Hair Restoration\Internal URLs.txt`

| # | URL | Topic |
|---|-----|-------|
| 1 | https://thinhairgrowthguide.com/benefits-of-finasteride-for-hair-loss/ | Finasteride benefits |
| 2 | https://thinhairgrowthguide.com/effectiveness-of-minoxidil-for-hair-loss/ | Minoxidil effectiveness |
| 3 | https://thinhairgrowthguide.com/which-hair-restoration-is-the-best/ | Best hair restoration |
| 4 | https://thinhairgrowthguide.com/does-hair-regrowth-make-your-scalp-itch/ | Scalp itching from regrowth |
| 5 | https://thinhairgrowthguide.com/is-it-possible-to-regrow-hair-on-bald-spot/ | Regrowing hair on bald spots |
| 6 | https://thinhairgrowthguide.com/how-to-know-if-hair-loss-is-from-stress/ | Stress-related hair loss |
| 7 | https://thinhairgrowthguide.com/how-to-make-thin-hair-thicker/ | Making thin hair thicker |
| 8 | https://thinhairgrowthguide.com/the-best-hairstyles-for-men-with-thin-hair/ | Hairstyles for thin hair |
| 9 | https://thinhairgrowthguide.com/is-short-hair-better-for-thin-hair/ | Short hair for thin hair |
| 10 | https://thinhairgrowthguide.com/make-mens-thinning-hair-look-thicker/ | Making thinning hair look thicker |
| 11 | https://thinhairgrowthguide.com/best-anti-dandruff-shampoo-thinning-hair/ | Anti-dandruff shampoo for thinning |
| 12 | https://thinhairgrowthguide.com/does-dandruff-cause-thinning-hair/ | Dandruff causing thinning |
| 13 | https://thinhairgrowthguide.com/first-hair-wash-with-nioxin/ | First Nioxin wash |
| 14 | https://thinhairgrowthguide.com/does-low-vitamin-d-cause-hair-thinning/ | Vitamin D and hair thinning |
| 15 | https://thinhairgrowthguide.com/what-does-it-mean-when-your-hair-thinning/ | What hair thinning means |
| 16 | https://thinhairgrowthguide.com/how-long-does-nizoral-take-work-fungal-acne/ | Nizoral for fungal acne |
| 17 | https://thinhairgrowthguide.com/is-nizoral-better-than-nioxin/ | Nizoral vs Nioxin |
| 18 | https://thinhairgrowthguide.com/can-dry-scalp-cause-thinning-hair/ | Dry scalp causing thinning |
| 19 | https://thinhairgrowthguide.com/when-does-mens-hair-start-thinning/ | When men's hair starts thinning |
| 20 | https://thinhairgrowthguide.com/what-causes-thinning-hair/ | Causes of thinning hair |

---

## Outbound Source Pool

Use these domains for outbound links. Prefer authoritative health/medical sources.

| Source | Domain | Best For |
|--------|--------|----------|
| Mayo Clinic | mayoclinic.org | General medical info |
| Healthline | healthline.com | Health articles, treatments |
| PubMed | pubmed.ncbi.nlm.nih.gov | Research studies |
| WebMD | webmd.com | Condition overviews |
| NHS | nhs.uk | UK health guidance |
| ISHRS | ishrs.org | Hair restoration research |
| AAD | aad.org | Dermatology conditions |
| Cleveland Clinic | clevelandclinic.org | Treatment explanations |

---

## Anchor Text Rules

### Exact-Match (50% of links)

Use the target keyword from the URL slug directly.

**Examples:**
- "benefits of finasteride"
- "minoxidil for hair loss"
- "which hair restoration is best"
- "hair thinning causes"
- "dandruff and hair thinning"

### Natural Phrase (50% of links)

Embed the link in a descriptive sentence.

**Examples:**
- "learn more about the [benefits of finasteride](URL) for hair loss"
- "[research on minoxidil](URL) suggests it may help with regrowth"
- "understanding [which hair restoration method](URL) works best"
- "the [connection between dandruff and hair thinning](URL) is worth exploring"
- "[stress-related hair loss](URL) is more common than people realize"

### Anchor Text Variety Rules

1. Never use the same anchor text twice in one article
2. Alternate between exact-match and natural phrase
3. Make anchor text descriptive and relevant to the linked content
4. Avoid generic anchors like "click here" or "read more"

---

## Link Placement Map

```
# Article Title

## TL;DR
[NO LINKS]

**Disclaimer:** [NO LINKS]

## Section 1 (Body)
[Paragraph 1 - NO LINKS]
[Paragraph 2 - INTERNAL LINK 1]
[Paragraph 3 - NO LINKS]
[Paragraph 4 - NO LINKS]

## Section 2 (Body)
[Paragraph 1 - NO LINKS]
[Paragraph 2 - INTERNAL LINK 2]
[Paragraph 3 - YOUTUBE EMBED]
[Paragraph 4 - OUTBOUND LINK 1]

## Section 3 (Body)
[Paragraph 1 - NO LINKS]
[Paragraph 2 - INTERNAL LINK 3]
[Paragraph 3 - NO LINKS]
[Paragraph 4 - NO LINKS]

## Section 4 (Body)
[Paragraph 1 - NO LINKS]
[Paragraph 2 - INTERNAL LINK 4]
[Paragraph 3 - NO LINKS]
[Paragraph 4 - OUTBOUND LINK 2]

## Conclusion
[NO LINKS]
```

---

## HTML Templates

### Internal Link
```html
<a href="https://thinhairgrowthguide.com/example-page/" target="_blank">anchor text</a>
```

### Outbound Link
```html
<a href="https://www.mayoclinic.org/example-page" target="_blank" rel="nofollow">anchor text</a>
```

### Inline Image
```html
<img src="https://thinhairgrowthguide.com/wp-content/uploads/image.png" alt="Descriptive alt text about the image" />
```

### YouTube Embed (Shorts)
```html
<iframe width="315" height="560" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allowfullscreen></iframe>
```

### YouTube Embed (Regular)
```html
<iframe width="560" height="315" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allowfullscreen></iframe>
```

---

## Guardrails Summary

See `GUARDRAILS.md` for full YMYL/E-E-A-T rules. Key points:

- Write as personal blogger, NOT medical professional
- Frame treatments as personal experience, not recommendations
- Include "consult your doctor" for medical topics
- Cite studies with "research suggests" not "proven"
- No dosage instructions
- No medical claims stated as fact
- Include disclaimers per GUARDRAILS.md

---

*This document is the single source of truth for blog post creation and linking standards.*
