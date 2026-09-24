# Website Structure & Layout

This document defines the page structure and section-by-section layout for the Shetty Marketing portfolio website. Each section below corresponds to one of the reference images in `./Website Structure images/`. Build the site in this order — each image represents one full-width section stacked vertically down the homepage.

---

## Section Order at a Glance

1. Hero / About — intro with portrait, experience tabs, and stats marquee
2. Skills & Experience — two-column split: skill bars + numbered job timeline
3. Marketing Tools I Have Built — overlapping stacked product cards
4. Achievements — mixed grid of photos and quote tiles
5. Case Studies / Use Cases — vertical-tab interactive panel

---

## 1. Hero / About Section

![Hero section](<./Website Structure images/1. Hero section.png>)

**Purpose:** Introduce who I am, anchor credibility with years of experience, and surface a quick career snapshot via tabs.

**Layout:** Two-column (≈50/50 on desktop), full-width stats ribbon below.

### Left column — Portrait
- Portrait photo, soft cool-gray duotone treatment
- Photo sits inside a **blue rounded-square frame** offset behind it (frame peeks out top-right and bottom-left)
- Floating **"15 Years of Experience"** badge: pill-shaped, white background, soft shadow, with a solid blue circle on the left containing the number "15" in white, and the label "YEAR OF EXPERIENCE" stacked in two lines on the right
- Badge is positioned overlapping the lower-right edge of the portrait

### Right column — Intro + Tabs
- **Eyebrow pill:** "ABOUT US" — small uppercase, blue text, light-blue rounded-rectangle outline
- **H1:** *"Navigating the Web, One Ranking at a Time"* — large bold serif/sans (two-line wrap)
- **Tab nav (4 tabs):** `My Self` (active — solid blue pill, white text) · `Education` · `Skills` · `Experience` (inactive tabs are plain text)
- **2×2 card grid** below the tabs (one card per role, currently showing the "My Self" / Experience view):
  - Card pattern: white background, light gray border, rounded corners (~12px), generous padding
  - Inside each card: blue uppercase date range (e.g. "2024 AT PRESENT") → bold black role title (e.g. "SEO Writing") → muted gray company name (e.g. "Google Inc.")
  - **Active card** (top-right "SEO Specialist / Upwork Inc.") gets a blue accent block on its right edge to indicate selection
- Cards shown:
  | Date Range | Role | Company |
  |---|---|---|
  | 2024 AT PRESENT | SEO Writing | Google Inc. |
  | 2022 TO 2021 | SEO Specialist | Upwork Inc. |
  | 2021 TO 2020 | IT Consultation | Envato Inc. |
  | 2020 TO 2017 | Cope Writing | Freelancer.com |

### Stats ribbon (full-width, below the two columns)
- Solid **medium-blue** banner, slightly tilted (subtle 1–2° rotation), full bleed
- White text in uppercase, with a small white sparkle/diamond icon between each item
- Items, left to right:
  - ✦ 1.5K SUCCESS PROJECT
  - ✦ 2.5+ HAPPY CLIENTS
  - ✦ 12+ AWARD WIN
  - ✦ 10+ COUNTRIES VISITED
  - ✦ PROBLEM SOLVING
- Treat this as a static ribbon (or optional slow horizontal marquee on hover/scroll)

---

## 2. Skills & Experience Section

![Skills and Experience section](<./Website Structure images/2. Skills a& Experience.png>)

**Purpose:** Show technical depth (skill bars) alongside career history (numbered timeline). Two distinct sub-sections sit side-by-side.

**Layout:** Two-column, roughly 40/60 split — skills left, experience right.

### Left column — Skills
- **Eyebrow:** "SEO IS KING" — blue, uppercase, bold, slightly larger than typical eyebrow
- **H2:** *"I Develop Skills Regularly to Keep Me Updated"* — large bold black, three-line wrap
- **Subhead:** *"Proven track record in driving organic traffic and improving search engine rankings"* — muted gray, regular weight
- **Skill bars** (stacked vertically, generous spacing between each):
  - Format per row: skill name on the left, percentage on the right (blue color), then a thin progress bar full-width below
  - Bar colors are intentionally varied per skill:
    | Skill | % | Bar color |
    |---|---|---|
    | Keyword Research | 98% | Vivid blue |
    | On Page SEO | 96% | Maroon / dark red |
    | Technical SEO | 96% | Black |
    | Off Page SEO | 90% | Cyan / sky blue |
  - Each bar has a faint light-gray track behind it showing the remaining %

### Right column — Experience
- **Small centered icon** above the heading (sun/star ornament)
- **H2:** "EXPERIENCE" — centered, large, bold, uppercase, with a tiny accent underline
- **Two-line description** below the heading, centered, muted gray (lorem-style placeholder for now)
- **Decorative diagonal-stripe square** in the top-right corner of the column
- **Numbered job list** — 4 stacked horizontal rows:
  - Each row is a wide bordered rectangle, rounded corners
  - Layout inside row (left → right):
    - Square black tile with a white **number** (1, 2, 3, 4)
    - Bold role title + smaller muted subtitle (company / location)
    - Right side, separated by a vertical divider: `JOB DURATION - X YEARS` in small uppercase
  - **Row 1 is the "active" / featured row**: entire row uses a solid black background with white text, while rows 2–4 are white with a light-gray border
  - Entries:
    | # | Role | Company / Location | Duration |
    |---|---|---|---|
    | 1 | Micro-interactions Awwwards Team | Focus Lab Agency · United States | 2 Years |
    | 2 | Senior UI Designer | User-Hub · Bangladesh | 1 Year |
    | 3 | Product Design | Zomato Digital Agency · India | 2 Years |
    | 4 | Webflow Team Manager | Google Team · UK | 2 Years |

---

## 3. Marketing Tools I Have Built

![Marketing tools section](<./Website Structure images/3. Marketing tools I have built.png>)

**Purpose:** Showcase products / tools I've built. Highlights two flagship cards with room to scroll/swipe to more.

**Layout:** Centered headline, then large overlapping stacked cards below.

### Heading
- **H1/H2:** *"Marketing Apps I Have Built"* — centered, very large, heavy bold, black

### Cards
- **Two large feature cards stacked vertically with overlap** (the lower card slides up over the bottom of the upper card by ~20%)
- Each card spans most of the page width with rounded top corners (~32–48px radius)
- Card 1 — *Technology Consulting*
  - Background: dark navy/black with subtle starfield glow
  - Heading: white "Technology Consulting"
  - Body: muted gray description — "Optimize IT strategies with consulting services focused on streamlining workflows, improving efficiency, and advancing digital transformation."
  - CTA: white text "Transform ↗" with up-right arrow
  - Right side: dark abstract UI/phone mockup with rounded skeleton bars (placeholder hint of a product screen)
- Card 2 — *Infrastructure Deployment*
  - Background: vivid blue (matches the brand blue from the Hero ribbon)
  - Heading: white "Infrastructure Deployment"
  - Body: lighter blue description — "Accelerate IT rollouts with end-to-end deployment services, covering everything from sourcing and licensing to networking and cabling."
  - CTA: white text "Deploy ↗"
  - Right side: column of soft-blue rounded tiles containing white outline icons (cloud, settings/gear, face-id, etc.)
- **Pattern:** every card uses the same internal layout — Title → 2-line description → underlined verb-CTA with arrow → product visual on the right
- This implies a scalable component: add more cards (Card 3, Card 4...) by repeating the same pattern with alternating dark / blue backgrounds

---

## 4. Achievements

![Achievements section](<./Website Structure images/4. Achievements.png>)

**Purpose:** Mix social-proof quotes with team/work photography to convey culture and credibility.

**Layout:** Centered intro, then a **3-column mixed media grid** with cards of varying spans.

### Heading block (centered)
- **H2:** "Achievements" — large, bold black, with a tiny accent underline beneath
- **3-line description** (lorem-style placeholder), centered, narrower max-width than the grid

### Grid (rough 3×2 with one tall photo)
- **Tile A — large team photo (spans 2 rows, leftmost column):** photo of a team brainstorm/whiteboard session
- **Tile B — quote card (top-right column):** solid **navy blue** background, white serif quote *"Beauty and brains, pleasure and usability – they should go hand in hand."* with attribution *"– Don Norman"* in smaller text below
- **Tile C — photo (middle-right):** candid of two team members laughing at a desk
- **Tile D — quote card (bottom-left, beside the team photo):** solid **navy blue**, white quote *"Your most unhappy customers are your greatest source of learning."* — *"– Bill Gates"*
- **Tile E — photo (bottom-middle):** team fist-bump/celebration shot
- **Tile F — quote card (bottom-right):** solid **orange** background, white quote *"It's kind of fun to do the impossible."* — *"– Walt Disney"*
- **Quote card style:** rounded corners (~8–12px), generous internal padding, sans-serif quote with **bold emphasis on a key word** (e.g. "usability", "learning", "fun"), attribution in smaller weight below
- Bold **navy blue horizontal divider bar** spans the full grid width at the bottom of the section

---

## 5. Case Studies / Use Cases

![Case studies section](<./Website Structure images/5. Case studies  Use cases.png>)

**Purpose:** Group services / verticals into categories with an interactive vertical-tab explorer.

**Layout:** A single rounded **container card** sitting on a pale-blue page background. Inside the container, a **left vertical tab list** + **right content panel**.

### Container
- Pale **light-blue** background (~`#EAF1F8`), large rounded corners (~24–32px), light shadow
- Inner padding generous on all sides

### Left vertical tabs (≈30% width)
- 5 stacked tab items, each as its own row with vertical spacing:
  1. Health Sustenance
  2. **Business Operations** *(active)*
  3. Digital & IT Solutions
  4. Sales & marketing
  5. Economic Guidance
- **Inactive tabs:** plain dark text, no background
- **Active tab:** filled solid blue pill, white text, with a small **up-right arrow** icon on the right edge of the pill
- Hover state should preview the active styling subtly

### Right content panel (≈70% width)
- White card, rounded corners, sits inside the container
- **H3:** "Business Operations" (matches the active tab name) — bold black, top-left
- **3 sub-items stacked vertically**, each with:
  - Small **colored icon** on the left (entrepreneurship shield, marketing-strategy bar chart, business-development lightbulb)
  - **Bold sub-title** (e.g. "Entrepreneurship", "Marketing Strategy", "Business Development")
  - 2-line muted gray description below
- **Right side:** 3D illustration character — a stylized figure standing next to oversized **"SEO"** letters with a magnifying glass prop. The illustration breaks out slightly past the card's right edge for visual energy.
- **Behavior:** clicking a left tab swaps the right content (heading + sub-items + illustration) for that category. Use a soft 200–300ms cross-fade.

---

## Implementation Notes

- **Section spacing:** ~96–128px vertical padding between sections on desktop, ~64px on mobile
- **Container width:** cap content at ~1280–1350px, center horizontally
- **Color thread:** the brand blue from the Hero ribbon repeats in (a) the active "My Self" tab, (b) at least one skill bar, (c) the Infrastructure Deployment card, (d) the Don Norman / Bill Gates quote tiles, and (e) the active "Business Operations" tab — that consistency ties the whole page together
- **Accent colors:** maroon (skill bar), black (skill bar + active job row + dark product card), orange (one quote tile) — used sparingly as punctuation
- **Typography hierarchy:** large bold black H1/H2 headings, blue uppercase eyebrows, muted gray body, blue percentages/dates as small numeric callouts
- **Responsive:** every two-column section (1, 2) collapses to single column on tablet/mobile; the achievements grid (4) collapses to a single-column stack with photos and quotes alternating
- **Reusable components to build:**
  - Eyebrow pill (small label, uppercase)
  - Stat ribbon (tilted blue bar with sparkle separators)
  - Experience card (date / title / company)
  - Skill bar (label + % + colored progress)
  - Numbered timeline row (number tile + title/subtitle + duration)
  - Stacked product card (dark or blue, with arrow CTA)
  - Quote tile (blue or orange, with bold-emphasis quote + attribution)
  - Vertical tab list + content panel
