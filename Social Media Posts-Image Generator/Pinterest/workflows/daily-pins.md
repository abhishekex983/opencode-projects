# Daily Pinterest Pins Workflow

Generate 6 Pinterest pins from a single blog post for the Thin Hair Growth Guide brand.

## Objective

Create 6 diverse Pinterest pins daily from one blog post:
- 3 infographic pins (different sub-topics)
- 1 title + featured image pin
- 1 before/after comparison pin
- 1 routine/methodology pin

## Inputs Required

| Input | Description | Example |
|-------|-------------|---------|
| Blog URL | Full URL to blog post | `https://thinhairgrowthguide.com/how-to-stop-hair-thinning` |
| Hero Image | Featured image from blog | URL or local path |
| Before/After Images | Comparison images (if available) | URLs or "use hero image" |
| Audience | Target audience | male / female / general |

## Output Structure

```
.pins/{date}/{blog-slug}/
├── infographics/
│   ├── infographic-1-{sub-topic}.png
│   ├── infographic-2-{sub-topic}.png
│   └── infographic-3-{sub-topic}.png
├── title-pin.png
├── before-after-pin.png
└── routine-pin.png
```

## Workflow Steps

### Step 1: Analyze Blog Post

1. Fetch blog content from URL
2. Extract:
   - Main topic/thesis
   - 3-4 sub-topics for infographics
   - Key statistics (verbatim)
   - Before/after scenarios (if any)
   - Step-by-step routines/methods
3. Save analysis to `{output-dir}/analysis.md`

### Step 2: Generate 3 Infographic Pins

For each of the 3 sub-topics:

1. Create sub-topic specific content structure
2. Use `baoyu-pinterest-infographic` skill
3. Generate infographic with:
   - Layout: bento-grid
   - Style: ikea-manual
   - Aspect ratio: 2:3
   - Resolution: 2K
4. Save to `{output-dir}/infographics/infographic-{n}-{sub-topic}.png`

**Sub-topic Selection Guide:**
- Pick 3 distinct angles from the blog
- Examples for "How to Stop Hair Thinning":
  1. "Causes of Hair Thinning"
  2. "Medical Treatments That Work"
  3. "Home Remedies for Thicker Hair"

### Step 3: Generate Title + Featured Image Pin

1. Load template: `Prompt to create a title enticing pin.txt`
2. Replace placeholders:
   - `{Add blog URL}` → actual blog URL
   - `{Add brand kit URL}` → brand colors file
3. Use hero image as reference
4. Generate via Kie.ai API or baoyu-image-gen
5. Save to `{output-dir}/title-pin.png`

### Step 4: Generate Before/After Pin

1. Load template: `Prompt to create Before-After pin.txt`
2. Identify before/after content from blog
3. Replace placeholders with actual URLs
4. Generate comparison pin
5. Save to `{output-dir}/before-after-pin.png`

**If no before/after images exist:**
- Use hero image as reference
- Generate conceptual comparison layout
- Focus on transformation narrative from blog

### Step 5: Generate Routine/Methodology Pin

1. Load template: `Prompt to create Routine pin.txt`
2. Extract 3-5 steps from blog post
3. Create step-by-step content:
   - Step 1: [Action] (2-4 words)
   - Step 2: [Action] (2-4 words)
   - Step 3: [Action] (2-4 words)
4. Generate routine pin
5. Save to `{output-dir}/routine-pin.png`

**Routine Title Patterns:**
- "The [X]-Step [Topic] Method"
- "How to [Goal]: [X] Simple Steps"
- "[Topic] Routine That Actually Works"

### Step 6: Verify Output

1. Check all 6 files exist
2. Verify file sizes are reasonable (>100KB)
3. Report success with file paths
4. Optional: Create summary with pin titles and descriptions

## Pin Templates Reference

| Pin Type | Template File | Key Elements |
|----------|---------------|--------------|
| Infographic | `baoyu-pinterest-infographic` skill | Bento grid, 7 cells, line art icons |
| Title + Image | `Prompt to create a title enticing pin.txt` | Editorial magazine cover style |
| Before/After | `Prompt to create Before-After pin.txt` | Split comparison layout |
| Routine | `Prompt to create Routine pin.txt` | Numbered steps, vertical flow |

## Brand Guidelines

- **Primary Color**: #002444 (dark navy)
- **Secondary Color**: #b91c1c (red)
- **Background**: #FFFFFF (white)
- **Typography**: Sans-serif, bold headlines
- **Style**: Medical-trust, clean, authoritative
- **Aspect Ratio**: 2:3 (1080x1620px)
- **Logo**: STRICTLY use only the official logo files. Do NOT generate or invent a logo.
  - Light backgrounds: `F:\Opencode Projects\Hair Restoration\Media\Thin Hair Growth Guide logo.png`
  - Dark backgrounds: `F:\Opencode Projects\Hair Restoration\Media\Thin Hair Growth Guide ( White logo).png`
  - Placement: Bottom-right corner, ~8-10% of image width, clear padding from edges

## API Configuration (Kie.ai)

```
Endpoint: POST https://api.kie.ai/api/v1/jobs/createTask
Authorization: Bearer <API_KEY>
Model: gpt-image-2-image-to-image
Resolution: 2K
Aspect Ratio: 2:3
```

## Error Handling

| Error | Action |
|-------|--------|
| Blog fetch fails | Ask user for content directly |
| API rate limit | Wait 60s, retry once |
| Image generation fails | Retry with simplified prompt |
| Missing before/after images | Use hero image, generate conceptual |
| Wrong aspect ratio | Regenerate with correct parameters |

## Quick Command Reference

### Generate All 6 Pins

```bash
# 1. Create output directory
mkdir -p .pins/$(date +%Y-%m-%d)/{blog-slug}/{infographics}

# 2. Generate infographics (run 3 times with different sub-topics)
npx -y bun .agents/skills/baoyu-image-gen/scripts/main.ts \
  --promptfiles prompts/infographic-1.md \
  --image .pins/{date}/{blog-slug}/infographics/infographic-1.png \
  --ar 2:3 --quality 2k

# 3. Generate title pin
# (Uses existing template with hero image reference)

# 4. Generate before/after pin
# (Uses new template with comparison layout)

# 5. Generate routine pin
# (Uses new template with step-by-step layout)
```

## Checklist

- [ ] Blog post analyzed
- [ ] 3 sub-topics identified for infographics
- [ ] 3 infographic pins generated
- [ ] 1 title + featured image pin generated
- [ ] 1 before/after pin generated
- [ ] 1 routine/methodology pin generated
- [ ] All 6 pins verified
- [ ] Output directory organized

## Notes

- Always use verbatim statistics from source
- Never fabricate data points
- Keep tone medical-trust and authoritative
- Optimize for Pinterest scrolling behavior
- Mobile-first design approach
- Logo: Use ONLY official Thin Hair Growth Guide logo (see Brand Guidelines)
