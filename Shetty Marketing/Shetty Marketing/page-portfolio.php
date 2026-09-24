<?php
/**
 * Template Name: Portfolio Canvas
 * Template Post Type: page
 * Description: Clean canvas template for the Shetty Marketing portfolio page. No theme header/footer wrappers.
 */
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php wp_head(); ?>
<style>
  /* ---- Template-scoped overrides ----------------------------------------
     Kept inline (in the .php) so the template is self-contained: any time
     this file is the active page template, these rules apply without
     needing a matching tweak in the Custom CSS plugin. */

  /* 1. Suppress any parent-theme or Elementor Theme Builder header that
        leaks above our own .nav. Hello Elementor / Astra / Elementor Pro
        all inject a header outside this template's control; we hide it. */
  body > header,
  body > .site-header,
  body > #masthead,
  body > .ehf-header,
  body > .elementor-location-header,
  .elementor-location-header,
  body > div[data-elementor-type="header"] {
    display: none !important;
  }

  /* 2. Outer gutter on the whole page so content doesn't kiss the screen
        edges on wide monitors. Bumped per feedback ("looks unnatural") —
        roughly 7% of viewport, capped at 160px on ultra-wide displays,
        floor of 16px on phones so content never glues to the bezel. */
  .portfolio-root {
    padding-left: clamp(16px, 7vw, 160px);
    padding-right: clamp(16px, 7vw, 160px);
  }

  /* 3. Kill the yellow drop-shadow that something (Custom CSS plugin /
        parent theme) attaches to every <button> on the page via a bare
        `button { box-shadow: rgba(255,220,39,...) }` rule. We can't
        edit that source, so we override here for every button-like
        element inside the portfolio. The intentional yellow on
        .jd-fit-btn / .nav-cta is preserved by follow-up rules. */
  .portfolio-root button,
  .portfolio-root button:hover,
  .portfolio-root button:focus,
  .portfolio-root button:active,
  .portfolio-root button:focus-visible,
  .xp-header,
  .xp-header:hover,
  .xp-header:focus,
  .xp-header:active,
  .xp-header:focus-visible,
  .native-tab,
  .native-tab:hover,
  .native-tab:focus,
  .native-tab:active,
  .native-tab:focus-visible,
  .nav-hamburger,
  .nav-hamburger:hover,
  .nav-hamburger:focus,
  .nav-hamburger:focus-visible,
  .case-thumb,
  .case-thumb:hover,
  .case-thumb:focus,
  .case-thumb:focus-visible {
    box-shadow: none !important;
    filter: none !important;
  }
  /* Re-establish the intentional shadows */
  .xp-row:hover { box-shadow: 0 14px 28px rgba(14, 31, 58, 0.12) !important; }
  .case-thumb { box-shadow: 0 4px 14px rgba(14, 31, 58, 0.08) !important; }
  .case-thumb:hover { box-shadow: 0 10px 24px rgba(14, 31, 58, 0.14) !important; }
  .xp-row::before,
  .xp-row::after,
  .xp-accordion::before,
  .xp-accordion::after {
    display: none !important;
  }

  /* 3b. Kill the off-white background on the Tech Stack section.
        Old rule was `.stack-section { background: var(--bg-soft) }` which
        rendered as a thin grey band above and below the section. We force
        it transparent so the section sits flush on the page's white. */
  .stack-section,
  #stack {
    background: transparent !important;
  }

  /* 4. Footer (21.dev-style: white card with washi-tape corners on a
        light surface, legal/social row below). Replaces the old dark
        navy footer. */
  .sm-footer {
    margin-top: 96px;
    padding: 8px 0 32px;
    background: transparent;
  }
  .sm-footer-card {
    position: relative;
    background: #fff;
    border-radius: 28px;
    padding: 56px 56px 48px;
    box-shadow: 0 8px 28px rgba(14, 31, 58, 0.06);
    border: 1px solid var(--gray-100);
  }
  .sm-footer-tape {
    position: absolute;
    width: 80px;
    height: 36px;
    display: block;
    pointer-events: none;
    z-index: 2;
  }
  .sm-footer-tape svg { width: 100%; height: 100%; display: block; }
  .sm-footer-tape--left  { top: -14px; left: -16px;  transform: scale(0.75); transform-origin: top left; }
  .sm-footer-tape--right { top: -14px; right: -16px; transform: scale(0.75) rotate(90deg); transform-origin: top right; }

  .sm-footer-card-inner {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 48px;
    align-items: flex-start;
  }
  .sm-footer-brand { flex: 0 0 auto; max-width: 320px; }
  .sm-footer-brand-logo { display: inline-block; }
  .sm-footer-brand-logo img { height: 32px; display: block; }
  .sm-footer-tagline {
    margin: 14px 0 0;
    font-size: 14px;
    line-height: 1.55;
    color: var(--gray-500);
    text-wrap: pretty;
  }

  .sm-footer-cols {
    display: flex;
    flex-direction: row;
    gap: 56px;
    flex: 1;
    justify-content: flex-end;
  }
  .sm-footer-col { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
  .sm-footer-col-title {
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--gray-400);
    margin: 0 0 8px;
  }
  .sm-footer-link {
    font-size: 14px;
    font-weight: 500;
    color: var(--gray-700);
    text-decoration: none;
    white-space: nowrap;
    transition: color .2s var(--ease-out);
  }
  .sm-footer-link:hover { color: var(--brand-sky); text-decoration: none; }

  /* Bottom row: copyright + legal links + social icons */
  .sm-footer-bottom {
    margin-top: 18px;
    padding: 0 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 14px;
  }
  .sm-footer-legal {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 24px;
    flex-wrap: wrap;
    font-size: 13px;
    color: var(--gray-500);
  }
  .sm-footer-legal p { margin: 0; font-size: 13px; color: var(--gray-500); white-space: nowrap; }
  .sm-footer-legal-links { display: flex; gap: 16px; flex-wrap: wrap; }
  .sm-footer-legal-links a {
    font-size: 13px;
    color: var(--gray-500);
    text-decoration: none;
    transition: color .2s var(--ease-out);
  }
  .sm-footer-legal-links a:hover { color: var(--brand-sky); text-decoration: underline; }

  .sm-footer-social { display: flex; gap: 10px; align-items: center; }
  .sm-footer-social a {
    display: inline-flex;
    width: 32px;
    height: 32px;
    align-items: center;
    justify-content: center;
    color: var(--gray-500);
    text-decoration: none;
    border-radius: 999px;
    transition: color .2s var(--ease-out), background .2s var(--ease-out);
  }
  .sm-footer-social a:hover { color: var(--brand-sky); background: var(--sky-100); }

  @media (max-width: 1024px) {
    .sm-footer-card { padding: 48px 36px 40px; }
    .sm-footer-cols { gap: 36px; }
  }
  @media (max-width: 760px) {
    .sm-footer { margin-top: 56px; padding-bottom: 24px; }
    .sm-footer-card { padding: 40px 22px 32px; border-radius: 22px; }
    .sm-footer-tape--left  { top: -10px; left: -8px; }
    .sm-footer-tape--right { top: -10px; right: -8px; }
    .sm-footer-card-inner { flex-direction: column; gap: 32px; align-items: stretch; }
    .sm-footer-brand { max-width: 100%; }
    .sm-footer-cols { flex-direction: row; flex-wrap: wrap; gap: 28px 36px; justify-content: flex-start; }
    .sm-footer-col { flex: 1 1 calc(50% - 36px); }
    .sm-footer-bottom { flex-direction: column; align-items: flex-start; padding: 0 8px; }
  }
</style>
</head>
<body <?php body_class(); ?>>
<div class="portfolio-root">

<!-- ============================================================
     NAV
     ============================================================ -->
<nav class="nav">
  <div class="nav-inner">
    <a class="nav-logo" href="#" data-jump="top">
      <img src="https://shettymarketing.com/wp-content/uploads/2026/04/Shetty-Marketing-Logo.png" alt="Shetty Marketing">
    </a>
    <div class="nav-links">
      <a class="nav-link" href="#skills"        data-jump="skills">Skills &amp; Exp</a>
      <a class="nav-link" href="#apps"          data-jump="apps">Apps I Built</a>
      <a class="nav-link" href="#achievements"  data-jump="achievements">Achievements</a>
      <a class="nav-link" href="#case-studies"  data-jump="case-studies">Case Studies</a>
    </div>
    <div class="nav-actions" style="display:flex; align-items:center; gap:8px;">
      <a class="nav-icon" href="https://www.linkedin.com/in/abhishekdigimarketing/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 11.01-4.12 2.06 2.06 0 010 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>
      </a>
      <a class="nav-icon" href="mailto:abhishekbolarshetty@gmail.com" aria-label="Email">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>
      </a>
      <a class="nav-cta" href="https://www.linkedin.com/in/abhishekdigimarketing/" target="_blank" rel="noopener noreferrer" style="margin-left:10px;">Let's Talk &#8599;</a>
    </div>

    <!-- Hamburger button (mobile only) -->
    <button class="nav-hamburger" aria-label="Toggle menu" aria-expanded="false" aria-controls="mobile-menu">
      <span></span><span></span><span></span>
    </button>
  </div>
</nav>

<!-- Mobile menu (slides down from top, mobile only).
     Lives outside <nav> because .nav uses backdrop-filter, which creates a
     containing block that would trap this fixed-positioned overlay inside
     the nav bar height. -->
<div id="mobile-menu" class="mobile-menu" aria-hidden="true">
  <a class="mobile-link" href="#skills"        data-jump="skills">Skills &amp; Exp</a>
  <a class="mobile-link" href="#apps"          data-jump="apps">Apps I Built</a>
  <a class="mobile-link" href="#achievements"  data-jump="achievements">Achievements</a>
  <a class="mobile-link" href="#case-studies"  data-jump="case-studies">Case Studies</a>
  <div class="mobile-menu-icons">
    <a class="nav-icon" href="https://www.linkedin.com/in/abhishekdigimarketing/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 11.01-4.12 2.06 2.06 0 010 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>
    </a>
    <a class="nav-icon" href="mailto:abhishekbolarshetty@gmail.com" aria-label="Email">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>
    </a>
  </div>
  <a class="nav-cta" href="https://www.linkedin.com/in/abhishekdigimarketing/" target="_blank" rel="noopener noreferrer">Let's Talk &#8599;</a>
</div>


<!-- ============================================================
     HERO
     ============================================================ -->
<section class="section hero-section" style="padding-top:80px;">
  <!-- Subtle grid background with radial fade-edges mask -->
  <div class="bg-pattern bg-pattern--grid bg-pattern--fade-edges" aria-hidden="true"></div>
  <div class="container" style="display:grid; grid-template-columns:1fr 1fr; gap:64px; align-items:center; position:relative; z-index:1;">

    <!-- Portrait -->
    <div class="hero-portrait" style="position:relative; max-width:440px; width:100%;">
      <div style="position:relative; z-index:1; border-radius:14px; overflow:hidden; aspect-ratio:4/5; background:#eef2f6;">
        <img src="https://shettymarketing.com/wp-content/uploads/2026/04/Hero-Section-image.png" alt="Abhishek Bolar"
             style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:center top;">
      </div>
      <div style="position:absolute; left:28px; top:28px; right:-28px; bottom:-28px; background:var(--brand-sky); border-radius:14px; z-index:0;"></div>
      <div style="position:absolute; right:-30px; bottom:-20px; z-index:3; display:inline-flex; align-items:center; gap:12px; padding:10px 22px 10px 10px; background:#fff; border-radius:999px; box-shadow:0 12px 32px rgba(31,58,104,0.18); border:1px solid #f0f0ee;">
        <span style="width:46px; height:46px; border-radius:50%; background:var(--brand-navy); color:#fff; font-weight:800; display:inline-flex; align-items:center; justify-content:center; font-size:18px;">5</span>
        <span style="display:flex; flex-direction:column; line-height:1.05; font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase;">
          <span>YEARS OF</span><span>Experience</span>
        </span>
      </div>
    </div>

    <!-- Copy -->
    <div>
      <h1 style="font-family:var(--font-display); font-size:56px; font-weight:800; line-height:1.05; letter-spacing:-0.02em; margin-top:18px;">
        Abhishek Bolar
      </h1>

      <p class="hero-tagline" style="margin-top:14px; font-size:22px; font-weight:600; line-height:1.3; color:var(--brand-sky); letter-spacing:-0.01em;">
        Navigating the Web, One Ranking at a Time
      </p>

      <p style="margin-top:20px; font-size:16px; line-height:1.7; color:var(--gray-600); max-width:560px; text-wrap:pretty;">
        AI-powered digital marketing specialist with 5+ years of experience in
        B2B and local business marketing. I automate systems and standard
        operating procedures of businesses and streamline their operations.
        In the B2B space, I have run demand generation campaigns, optimizing
        them to simplify the buyer journey and improve revenue growth across
        various marketing channels. I specialize in search engine optimization,
        email automation, AI-powered workflows, CRM-driven segmentation, and
        data-driven analytics.
      </p>

      <!-- JD Fit Check (replaces the 2x2 cards) -->
      <section class="jd-fit-card" aria-label="Job description fit check">
        <div class="jd-fit-head">
          <span class="eyebrow-pill">JD Fit Check</span>
          <span class="jd-fit-badge">Beta</span>
        </div>
        <h3 class="jd-fit-title">Am I the right fit for your role?</h3>
        <p class="jd-fit-sub">Drop a job description below &mdash; I'll show you how my skills line up.</p>

        <label class="jd-fit-label" for="jd-fit-input">Job description</label>
        <textarea id="jd-fit-input" class="jd-fit-input" rows="5"
                  placeholder="Paste the role, responsibilities, and requirements here..."></textarea>

        <div class="jd-fit-actions">
          <button id="jd-fit-btn" class="jd-fit-btn" type="button">
            <span>Check Fit</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"/></svg>
          </button>
          <span class="jd-fit-hint">or press Ctrl/Cmd + Enter</span>
        </div>

        <div id="jd-fit-result" class="jd-fit-result" hidden>
          <div class="jd-fit-result-head">
            <div class="jd-fit-score-ring" style="--score:0;">
              <div class="jd-fit-score-inner">
                <span class="jd-fit-score-pct">0</span><i>%</i>
              </div>
            </div>
            <div class="jd-fit-result-meta">
              <div class="jd-fit-verdict" id="jd-fit-verdict">&mdash;</div>
              <p class="jd-fit-msg" id="jd-fit-msg">&mdash;</p>
            </div>
          </div>
          <div class="jd-fit-matched" id="jd-fit-matched-wrap" hidden>
            <span class="jd-fit-matched-label">Matched skills</span>
            <div class="jd-fit-chips" id="jd-fit-chips"></div>
          </div>
        </div>
      </section>
    </div>
  </div>

  <!-- Hero facts row (4 cards, replacing the stat ribbon) -->
  <div class="hero-facts">
    <div class="hero-card hero-card--row hero-card--highlight">
      <div class="hero-edge" style="background:var(--brand-yellow);"></div>
      <div class="hero-edge-thin" style="background:var(--brand-yellow);"></div>
      <div class="hero-card-eyebrow">2024</div>
      <div class="hero-card-title">Best Performer</div>
      <div class="hero-card-sub">InnoVyne &mdash; Annual Recognition</div>
    </div>

    <a href="#apps" data-jump="apps" class="hero-card hero-card--row hero-card--link" aria-label="Check out the AI-powered tools I have built">
      <div class="hero-edge" style="background:var(--brand-sky);"></div>
      <div class="hero-edge-thin" style="background:var(--brand-sky);"></div>
      <div class="hero-card-eyebrow">My Apps</div>
      <div class="hero-card-title">
        Check Out My AI-Powered Tools
        <span class="hero-card-arrow" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg>
        </span>
      </div>
      <div class="hero-card-logos">
        <img src="https://shettymarketing.com/wp-content/uploads/2026/04/logo-claude.png" alt="Claude" style="height:24px; width:auto; object-fit:contain;">
        <img src="https://shettymarketing.com/wp-content/uploads/2026/04/logo-n8n.png"    alt="n8n"    style="height:18px; width:auto; object-fit:contain;">
        <img src="https://shettymarketing.com/wp-content/uploads/2026/04/logo-comet.png"  alt="Comet"  style="height:26px; width:26px; object-fit:cover; border-radius:50%;">
      </div>
    </a>

    <a href="#case-studies" data-jump="case-studies" class="hero-card hero-card--row hero-card--link" aria-label="See the projects I have worked on">
      <div class="hero-edge" style="background:var(--brand-sky);"></div>
      <div class="hero-edge-thin" style="background:var(--brand-sky);"></div>
      <div class="hero-card-eyebrow">Case Studies</div>
      <div class="hero-card-title">
        Projects I Have Worked On
        <span class="hero-card-arrow" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg>
        </span>
      </div>
      <div class="hero-card-sub">Medspa &middot; Consultation &middot; Industrial &middot; Local SEO</div>
    </a>

    <div class="hero-card hero-card--row">
      <div class="hero-edge" style="background:var(--brand-sky);"></div>
      <div class="hero-edge-thin" style="background:var(--brand-sky);"></div>
      <div class="hero-card-eyebrow">2026 At Present</div>
      <div class="hero-card-title">SEO Specialist &amp; Marketing Coordinator</div>
      <div class="hero-card-sub">Coast2Coast First Aid and Aquatics</div>
    </div>
  </div>
</section>


<!-- ============================================================
     SKILLS
     ============================================================ -->
<section id="skills" class="section" style="background:#fff;">
  <div class="container" style="display:grid; grid-template-columns:4fr 6fr; gap:80px;">

    <!-- Left: skills -->
    <div>
      <h2 class="h-lg" style="font-family:var(--font-display); font-size:48px; font-weight:700; line-height:1.1; letter-spacing:-0.02em;">
        I Develop Skills Regularly to Keep Me Updated
      </h2>
      <p style="font-size:16px; color:var(--gray-500); margin-top:18px; line-height:1.6; max-width:480px;">
        Proven track record in driving organic traffic and improving search engine rankings.
      </p>
      <div style="display:flex; flex-direction:column; gap:24px; margin-top:36px;">

        <div>
          <div style="display:flex; justify-content:space-between; font-size:15px; margin-bottom:10px;">
            <span style="font-weight:700;">WordPress</span>
            <span style="font-weight:700; color:var(--brand-sky);">80%</span>
          </div>
          <div style="height:6px; border-radius:999px; background:var(--gray-100); overflow:hidden;">
            <div class="skill-fill" style="background:var(--brand-sky); width:80%;"></div>
          </div>
        </div>

        <div>
          <div style="display:flex; justify-content:space-between; font-size:15px; margin-bottom:10px;">
            <span style="font-weight:700;">Design &amp; Content</span>
            <span style="font-weight:700; color:var(--brand-yellow);">70%</span>
          </div>
          <div style="height:6px; border-radius:999px; background:var(--gray-100); overflow:hidden;">
            <div class="skill-fill" style="background:var(--brand-yellow); width:70%;"></div>
          </div>
        </div>

        <div>
          <div style="display:flex; justify-content:space-between; font-size:15px; margin-bottom:10px;">
            <span style="font-weight:700;">CRM &amp; Outreach</span>
            <span style="font-weight:700; color:var(--accent-black);">70%</span>
          </div>
          <div style="height:6px; border-radius:999px; background:var(--gray-100); overflow:hidden;">
            <div class="skill-fill" style="background:var(--accent-black); width:70%;"></div>
          </div>
        </div>

        <div>
          <div style="display:flex; justify-content:space-between; font-size:15px; margin-bottom:10px;">
            <span style="font-weight:700;">Reporting &amp; Analytics</span>
            <span style="font-weight:700; color:var(--brand-sky-2);">70%</span>
          </div>
          <div style="height:6px; border-radius:999px; background:var(--gray-100); overflow:hidden;">
            <div class="skill-fill" style="background:var(--brand-sky-2); width:70%;"></div>
          </div>
        </div>

      </div>
    </div>

    <!-- Right: experience timeline -->
    <div style="position:relative;">
      <div style="position:absolute; right:0; top:-10px; width:60px; height:60px; background:repeating-linear-gradient(45deg, var(--ink) 0 6px, transparent 6px 12px); opacity:0.85;"></div>

      <div style="text-align:center; margin-bottom:36px;">
        <div style="font-size:22px; color:var(--brand-yellow);">&#10022;</div>
        <h2 class="h-lg" style="font-family:var(--font-display); font-size:54px; font-weight:800; letter-spacing:-0.02em; text-transform:uppercase; margin-top:6px; position:relative; display:inline-block;">
          Experience
          <span style="position:absolute; left:50%; bottom:-8px; transform:translateX(-50%); width:60px; height:3px; background:var(--brand-sky);"></span>
        </h2>
        <p style="font-size:15px; color:var(--gray-500); margin-top:18px; max-width:460px; margin-left:auto; margin-right:auto; line-height:1.6;">
          A career built on shipping campaigns that rank, convert, and compound — from agency floors to in-house growth teams.
        </p>
      </div>

      <div class="xp-accordion" data-xp-accordion>

        <!-- Row 1: Active / current role -->
        <div class="xp-row xp-row--active is-open">
          <button class="xp-header" type="button" aria-expanded="true" aria-controls="xp-body-1">
            <span class="xp-num">1</span>
            <span class="xp-meta">
              <span class="xp-title">SEO Specialist &amp; Marketing Coordinator</span>
              <span class="xp-company">Coast2Coast First Aid and Aquatics</span>
            </span>
            <span class="xp-duration">Job Duration &middot; March 2026 &ndash; Present</span>
            <span class="xp-chev" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
          </button>
          <div class="xp-body" id="xp-body-1" role="region">
            <ul class="xp-bullets">
              <li>Increased organic search impressions by 63% (3.77M → 6.16M) and clicks by 23% (49.2K → 60.6K) YoY through SEO strategy and content optimization.</li>
              <li>Improved average Google Search position from 21 to 10, moving the site from Page 3 to Page 1 on average.</li>
              <li>Utilized Ahrefs to identify and audit suitable publisher websites for off-page SEO outreach based on relevant metrics. Coordinated and negotiated with publishers to create guest blogs aimed at increasing referral traffic and enhancing domain authority.</li>
              <li>Optimized content for both search engines and AI platforms using Surfer SEO to boost organic traffic and increase mentions on AI platforms. Applied keyword research, topical mapping, and internal linking strategies to improve search rankings.</li>
              <li>Designed and developed interactive and dynamic web pages using Claude AI, Codex, and Elementor, resulting in an increased conversion rate. Used Microsoft Clarity and Hotjar to track micro-conversions and user behaviour.</li>
              <li>Conducted technical SEO audits using Google Search Console and SEO PowerSuite to ensure seamless crawlability, indexation, page structure, and user experience.</li>
            </ul>
          </div>
        </div>

        <!-- Row 2 -->
        <div class="xp-row">
          <button class="xp-header" type="button" aria-expanded="false" aria-controls="xp-body-2">
            <span class="xp-num">2</span>
            <span class="xp-meta">
              <span class="xp-title">Digital Marketing Specialist</span>
              <span class="xp-company">InnoVyne Tech.</span>
            </span>
            <span class="xp-duration">Job Duration &middot; Jun 2021 &ndash; Oct 2025</span>
            <span class="xp-chev" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
          </button>
          <div class="xp-body" id="xp-body-2" role="region">
            <ul class="xp-bullets">
              <li>Designed and executed B2B lead generation campaigns leveraging SEO, email automation, and tailored content strategies to support pipeline growth.</li>
              <li>Built and optimized WordPress websites and event-specific landing pages (Elementor) to improve conversion rates and engagement.</li>
              <li>Developed segmented nurture sequences to guide prospects through customized buyer journeys and improve MQL-to-SQL progression.</li>
              <li>Leveraged GA4 and Google Search Console to analyze campaign performance, identify funnel bottlenecks, and implement data-driven optimizations.</li>
              <li>Created social media creatives using Canva &amp; Adobe tools and newsletter designs to support product launches, campaigns, and event promotions.</li>
              <li>Collaborated with sales teams to align messaging, improve lead quality, and strengthen campaign-to-pipeline conversion.</li>
            </ul>
          </div>
        </div>

        <!-- Row 3 -->
        <div class="xp-row">
          <button class="xp-header" type="button" aria-expanded="false" aria-controls="xp-body-3">
            <span class="xp-num">3</span>
            <span class="xp-meta">
              <span class="xp-title">Digital Marketing Analyst</span>
              <span class="xp-company">DotMappers Pvt. Ltd</span>
            </span>
            <span class="xp-duration">Job Duration &middot; Dec 2018 &ndash; Mar 2019</span>
            <span class="xp-chev" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
          </button>
          <div class="xp-body" id="xp-body-3" role="region">
            <ul class="xp-bullets">
              <li>Executed SEO and content strategies for in-house projects, including keyword research and on-page optimization.</li>
              <li>Supported social media marketing initiatives and content scheduling across digital platforms.</li>
              <li>Conducted link-building outreach to strengthen domain authority and improve organic visibility.</li>
              <li>Assisted in landing page optimization and performance reporting to support lead generation objectives.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  </div>
</section>


<!-- ============================================================
     TECH STACK — 21st.dev-style integration showcase
     ============================================================ -->
<section id="stack" class="section stack-section">
  <div class="container">

    <!-- Header: two-column (copy left, illustration right) -->
    <div class="stack-header">
      <div class="stack-header-copy">
        <span class="eyebrow-pill">Tech Stack</span>
        <h2 class="stack-title">
          The tools I
          <span class="stack-highlight">build with<svg class="stack-squiggle" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true"><path d="M3 9 C 40 1, 80 13, 120 7 S 175 3, 197 8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg></span>
          every day
        </h2>
        <p class="stack-sub">Tools and technologies I reach for to deliver exceptional digital experiences &mdash; from SEO craft and content workflows to web development and marketing automation.</p>
      </div>

      <!-- Illustration: a tilted stack of "tool cards" -->
      <div class="stack-illustration" aria-hidden="true">
        <span class="stack-illus-halo"></span>
        <div class="stack-illus-cards">
          <div class="stack-illus-card stack-illus-card--3">
            <span class="stack-illus-mark">
              <img src="https://shettymarketing.com/wp-content/uploads/2026/05/Ahrefs-scaled.png" alt="" loading="lazy">
            </span>
            <span class="stack-illus-text">
              <span class="stack-illus-name">Ahrefs</span>
              <span class="stack-illus-sub">SEO Research</span>
            </span>
          </div>
          <div class="stack-illus-card stack-illus-card--2">
            <span class="stack-illus-mark">
              <img src="https://shettymarketing.com/wp-content/uploads/2026/05/Wordpress-scaled.png" alt="" loading="lazy">
            </span>
            <span class="stack-illus-text">
              <span class="stack-illus-name">WordPress</span>
              <span class="stack-illus-sub">CMS</span>
            </span>
          </div>
          <div class="stack-illus-card stack-illus-card--1">
            <span class="stack-illus-mark">
              <img src="https://shettymarketing.com/wp-content/uploads/2026/05/Claude-scaled.png" alt="" loading="lazy">
            </span>
            <span class="stack-illus-text">
              <span class="stack-illus-name">Claude Code</span>
              <span class="stack-illus-sub">AI Assistant</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Integration grid -->
    <div class="stack-grid">

      <div class="stack-item">
        <span class="stack-icon">
          <img src="https://shettymarketing.com/wp-content/uploads/2026/05/Claude-scaled.png" alt="" loading="lazy">
        </span>
        <div class="stack-meta">
          <h3>Claude Code</h3>
          <p>AI-powered development assistant for faster, sharper shipping.</p>
        </div>
      </div>

      <div class="stack-item">
        <span class="stack-icon">
          <img src="https://shettymarketing.com/wp-content/uploads/2026/05/Wordpress-scaled.png" alt="" loading="lazy">
        </span>
        <div class="stack-meta">
          <h3>WordPress</h3>
          <p>CMS of choice for client sites, content workflows, and infrastructure.</p>
        </div>
      </div>

      <div class="stack-item">
        <span class="stack-icon">
          <img src="https://shettymarketing.com/wp-content/uploads/2026/05/Ahrefs-scaled.png" alt="" loading="lazy">
        </span>
        <div class="stack-meta">
          <h3>Ahrefs</h3>
          <p>Backlink analysis, keyword research, and rank tracking for SEO campaigns.</p>
        </div>
      </div>

      <div class="stack-item">
        <span class="stack-icon">
          <img src="https://shettymarketing.com/wp-content/uploads/2026/05/HTML-scaled.png" alt="" loading="lazy">
        </span>
        <div class="stack-meta">
          <h3>HTML</h3>
          <p>Semantic structure for accessible, search-engine-friendly markup.</p>
        </div>
      </div>

      <div class="stack-item">
        <span class="stack-icon">
          <img src="https://shettymarketing.com/wp-content/uploads/2026/05/CSS-scaled.png" alt="" loading="lazy">
        </span>
        <div class="stack-meta">
          <h3>CSS</h3>
          <p>Custom styling and responsive layout for polished, on-brand interfaces.</p>
        </div>
      </div>

      <div class="stack-item">
        <span class="stack-icon">
          <img src="https://shettymarketing.com/wp-content/uploads/2026/05/PHP-scaled.png" alt="" loading="lazy">
        </span>
        <div class="stack-meta">
          <h3>PHP</h3>
          <p>Server-side scripting for WordPress customization and integrations.</p>
        </div>
      </div>

      <div class="stack-item">
        <span class="stack-icon">
          <img src="https://shettymarketing.com/wp-content/uploads/2026/05/Google-analytics-scaled.png" alt="" loading="lazy">
        </span>
        <div class="stack-meta">
          <h3>Google Analytics</h3>
          <p>Audience, conversion, and funnel measurement across campaigns.</p>
        </div>
      </div>

      <div class="stack-item">
        <span class="stack-icon">
          <img src="https://shettymarketing.com/wp-content/uploads/2026/05/Search-Console-scaled.png" alt="" loading="lazy">
        </span>
        <div class="stack-meta">
          <h3>Search Console</h3>
          <p>Indexing, query insights, and technical SEO monitoring from Google.</p>
        </div>
      </div>

      <div class="stack-item">
        <span class="stack-icon">
          <img src="https://shettymarketing.com/wp-content/uploads/2026/05/Canva-scaled.png" alt="" loading="lazy">
        </span>
        <div class="stack-meta">
          <h3>Canva</h3>
          <p>Quick design for social, landing pages, and marketing collateral.</p>
        </div>
      </div>

      <div class="stack-item">
        <span class="stack-icon">
          <img src="https://shettymarketing.com/wp-content/uploads/2026/04/logo-n8n.png" alt="" loading="lazy">
        </span>
        <div class="stack-meta">
          <h3>n8n</h3>
          <p>Visual workflow automation for marketing ops, scraping, and AI agents.</p>
        </div>
      </div>

      <div class="stack-item">
        <span class="stack-icon">
          <img src="https://shettymarketing.com/wp-content/uploads/2026/05/DataforSEO.png" alt="" loading="lazy">
        </span>
        <div class="stack-meta">
          <h3>DataforSEO</h3>
          <p>SERP, keyword, and backlink data APIs powering custom SEO tools.</p>
        </div>
      </div>

      <div class="stack-item">
        <span class="stack-icon">
          <img src="https://shettymarketing.com/wp-content/uploads/2026/05/Gemini.png" alt="" loading="lazy">
        </span>
        <div class="stack-meta">
          <h3>Gemini</h3>
          <p>Multimodal AI for research, content drafting, and reasoning tasks.</p>
        </div>
      </div>

    </div>
  </div>
</section>


<!-- ============================================================
     TOOLS — sticky stacking product cards
     ============================================================ -->
<section id="apps" class="section">
  <div class="container" style="text-align:center; margin-bottom:64px;">
    <h2 class="h-xl" style="font-family:var(--font-display); font-size:88px; font-weight:800; letter-spacing:-0.03em; line-height:1; margin:0;">
      Marketing Apps I Have Built
    </h2>
  </div>

  <div class="container">

    <!-- Card 1: Personal Gantt Chart (dark) -->
    <div style="position:sticky; top:80px; margin-top:0; z-index:10;">
      <div style="position:relative; background:radial-gradient(ellipse at 70% 30%, #1a3260 0%, #0d1a35 60%, #050a1a 100%); border-radius:32px; padding:56px 64px; box-shadow:0 -10px 40px rgba(14,31,58,0.12); color:#fff; overflow:hidden;">
        <div style="position:absolute; inset:0; opacity:0.6; pointer-events:none; background:radial-gradient(1px 1px at 20% 30%, #fff, transparent), radial-gradient(1px 1px at 80% 60%, #fff, transparent), radial-gradient(2px 2px at 40% 80%, #fff, transparent), radial-gradient(1px 1px at 65% 20%, #fff, transparent); background-size:200px 200px;"></div>
        <div style="display:grid; grid-template-columns:4fr 6fr; gap:48px; align-items:center; position:relative;">
          <div style="color:#fff;">
            <h3 class="h-md" style="font-family:var(--font-display); font-size:44px; font-weight:800; line-height:1.1; letter-spacing:-0.02em; margin:0; color:#fff;">Personal Gantt Chart</h3>
            <p style="font-size:16px; line-height:1.65; margin-top:20px; opacity:0.85; max-width:520px; color:#fff;">
              I created a personal Gantt chart to provide a comprehensive view of all my tasks for the month. It allows me to monitor my daily chores, reminders, and more. Additionally, I have linked it to my Google Calendar for notifications. I also built a reliable time-tracking system inside the tool that helps with time management and task prioritization.
            </p>
          </div>
          <div>
            <div class="zoom-card" data-lightbox="https://shettymarketing.com/wp-content/uploads/2026/04/gantt-chart.png" data-lightbox-alt="Personal Gantt Chart"
                 title="Click to expand"
                 style="position:relative; background:#fff; border-radius:14px; overflow:hidden; cursor:zoom-in; box-shadow:0 24px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06);">
              <img src="https://shettymarketing.com/wp-content/uploads/2026/04/gantt-chart.png" alt="Personal Gantt Chart" style="display:block; width:100%; height:auto;">
              <div style="position:absolute; right:12px; top:12px; width:36px; height:36px; border-radius:50%; background:rgba(13,26,53,0.85); color:#fff; display:flex; align-items:center; justify-content:center; font-size:18px; backdrop-filter:blur(4px);">&#x2922;</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Card 2: SEO Tools (blue) -->
    <div style="position:sticky; top:112px; margin-top:32px; z-index:11;">
      <div style="position:relative; background:var(--brand-sky); border-radius:32px; padding:56px 64px; box-shadow:0 -10px 40px rgba(14,31,58,0.12); color:#fff; overflow:hidden;">
        <div style="display:grid; grid-template-columns:4fr 6fr; gap:48px; align-items:center; position:relative;">
          <div style="color:#fff;">
            <h3 class="h-md" style="font-family:var(--font-display); font-size:44px; font-weight:800; line-height:1.1; letter-spacing:-0.02em; margin:0; color:#fff;">SEO Tools</h3>
            <p style="font-size:16px; line-height:1.65; margin-top:20px; opacity:0.95; max-width:520px; color:#fff;">
              I developed an SEO tool designed to assist with link analysis for off-page and on-page content optimization. I created this tool to streamline certain office tasks, allowing me to concentrate more on the strategic aspects of my work.
            </p>
          </div>
          <div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
              <div class="zoom-card-sm" data-lightbox="https://shettymarketing.com/wp-content/uploads/2026/04/seo-1.png" data-lightbox-alt="Off-Page SEO — Domain Analysis"
                   style="position:relative; background:#fff; border-radius:12px; overflow:hidden; cursor:zoom-in; aspect-ratio:16/10; box-shadow:0 14px 36px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06);">
                <img src="https://shettymarketing.com/wp-content/uploads/2026/04/seo-1.png" alt="Off-Page SEO — Domain Analysis" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:top left;">
                <div style="position:absolute; right:8px; top:8px; width:26px; height:26px; border-radius:50%; background:rgba(13,26,53,0.85); color:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; backdrop-filter:blur(4px);">&#x2922;</div>
              </div>
              <div class="zoom-card-sm" data-lightbox="https://shettymarketing.com/wp-content/uploads/2026/04/seo-2.png" data-lightbox-alt="Off-Page SEO — Backlink Results"
                   style="position:relative; background:#fff; border-radius:12px; overflow:hidden; cursor:zoom-in; aspect-ratio:16/10; box-shadow:0 14px 36px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06);">
                <img src="https://shettymarketing.com/wp-content/uploads/2026/04/seo-2.png" alt="Off-Page SEO — Backlink Results" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:top left;">
                <div style="position:absolute; right:8px; top:8px; width:26px; height:26px; border-radius:50%; background:rgba(13,26,53,0.85); color:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; backdrop-filter:blur(4px);">&#x2922;</div>
              </div>
              <div class="zoom-card-sm" data-lightbox="https://shettymarketing.com/wp-content/uploads/2026/04/seo-3.png" data-lightbox-alt="Anchor Text Distribution"
                   style="position:relative; background:#fff; border-radius:12px; overflow:hidden; cursor:zoom-in; aspect-ratio:16/10; box-shadow:0 14px 36px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06);">
                <img src="https://shettymarketing.com/wp-content/uploads/2026/04/seo-3.png" alt="Anchor Text Distribution" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:top left;">
                <div style="position:absolute; right:8px; top:8px; width:26px; height:26px; border-radius:50%; background:rgba(13,26,53,0.85); color:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; backdrop-filter:blur(4px);">&#x2922;</div>
              </div>
              <div class="zoom-card-sm" data-lightbox="https://shettymarketing.com/wp-content/uploads/2026/04/seo-4.png" data-lightbox-alt="On-Page SEO — Entity Presence"
                   style="position:relative; background:#fff; border-radius:12px; overflow:hidden; cursor:zoom-in; aspect-ratio:16/10; box-shadow:0 14px 36px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06);">
                <img src="https://shettymarketing.com/wp-content/uploads/2026/04/seo-4.png" alt="On-Page SEO — Entity Presence" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:top left;">
                <div style="position:absolute; right:8px; top:8px; width:26px; height:26px; border-radius:50%; background:rgba(13,26,53,0.85); color:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; backdrop-filter:blur(4px);">&#x2922;</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</section>


<!-- ============================================================
     ACHIEVEMENTS
     ============================================================ -->
<section id="achievements" class="section">
  <div class="container">
    <div style="text-align:center; max-width:680px; margin:0 auto 56px;">
      <h2 class="h-lg" style="font-family:var(--font-display); font-size:54px; font-weight:800; letter-spacing:-0.02em; display:inline-block; position:relative;">
        Achievements
        <span style="position:absolute; left:50%; bottom:-10px; transform:translateX(-50%); width:60px; height:3px; background:var(--brand-sky);"></span>
      </h2>
      <p style="font-size:16px; color:var(--gray-500); margin-top:28px; line-height:1.65;">
        A snapshot of milestones earned alongside operators, founders, and design teams across SEO, paid acquisition, and product growth.
      </p>
    </div>

    <div class="achievements-grid" style="display:grid; grid-template-columns:repeat(3,1fr); grid-template-rows:minmax(220px,auto) minmax(220px,auto); gap:18px;">

      <div class="photo-tile" style="--gloss-delay:0s; grid-row:span 2; border-radius:14px; overflow:hidden; background:#eef2f6; min-height:200px; position:relative;">
        <img src="https://shettymarketing.com/wp-content/uploads/2026/04/team-3.jpeg" alt="Team Brainstorm" style="width:100%; height:100%; object-fit:cover; object-position:left center;">
      </div>

      <div style="grid-row:span 2; background:#1a4a8c; color:#fff; border-radius:14px; padding:28px 26px; display:flex; flex-direction:column; justify-content:space-between; min-height:200px; height:100%;">
        <div style="font-size:14px; line-height:1.6; font-weight:500; font-family:var(--font-sans);">
          <p style="margin:0 0 12px; color:#fff;">
            Had the privilege of managing Abhishek at InnoVyne, where he started as a Marketing Coordinator and quickly grew into the role of <span style="color:var(--brand-sky); font-weight:700;">Digital Marketing Specialist</span>. His growth was a natural progression driven by his curiosity, technical expertise, and constant desire to learn.
          </p>
          <p style="margin:0 0 12px; color:#fff;">
            Abhishek is one of those rare professionals whose knowledge spans across multiple fields — from web development and digital marketing to email campaigns and AI. He not only understands the tools but also knows how to evaluate and select the best ones to achieve results.
          </p>
          <p style="margin:0 0 12px; color:#fff;">
            What truly sets him apart is his <span style="color:var(--brand-sky); font-weight:700;">reliability and attitude</span>. He never misses a deadline, carries a "can-do" mindset, and approaches every challenge with positivity. He is also a supportive and kind teammate, always ready to help, collaborate, and contribute to the success of those around him.
          </p>
          <p style="margin:0; color:#fff;">
            I couldn't have been happier to work side by side with Abhishek over the past four years, and I sincerely hope our paths cross again. Any team would be lucky to have him.
          </p>
        </div>
        <div style="margin-top:18px; font-size:12px; opacity:0.85; font-weight:600;">– Manager, InnoVyne</div>
      </div>

      <div class="photo-tile" style="--gloss-delay:2s; border-radius:14px; overflow:hidden; background:#eef2f6; min-height:200px; position:relative;">
        <img src="https://shettymarketing.com/wp-content/uploads/2026/04/team-1.jpeg" alt="Award Night" style="width:100%; height:100%; object-fit:cover; object-position:center;">
      </div>

      <div class="photo-tile" style="--gloss-delay:4s; border-radius:14px; overflow:hidden; background:#eef2f6; min-height:200px; position:relative;">
        <img src="https://shettymarketing.com/wp-content/uploads/2026/04/team-presentation.jpg" alt="Team Presentation" style="width:100%; height:100%; object-fit:cover; object-position:right center;">
      </div>
    </div>

  </div>
</section>


<!-- ============================================================
     CASE STUDIES
     ============================================================ -->
<section id="case-studies" class="section" style="background:#fff;">
  <div class="container">
    <div style="text-align:center; max-width:560px; margin:0 auto 48px;">
      <span class="eyebrow-pill">Case Studies</span>
      <h2 class="h-lg" style="font-family:var(--font-display); font-size:48px; font-weight:800; letter-spacing:-0.02em; margin-top:18px;">
        Where I've moved the needle
      </h2>
    </div>

    <div class="native-tabs" data-native-tabs>
      <!-- Pill tab bar with animated sliding indicator -->
      <div class="native-tabs-list" data-case-tabs role="tablist">
        <span class="native-tabs-indicator" aria-hidden="true"></span>
        <button class="native-tab is-active" data-tab="medspa"  role="tab" aria-selected="true">Medspa</button>
        <button class="native-tab"            data-tab="consult" role="tab" aria-selected="false">Consultation</button>
        <button class="native-tab"            data-tab="aeroex"  role="tab" aria-selected="false">Air Purification</button>
        <button class="native-tab"            data-tab="carpet"  role="tab" aria-selected="false">Carpet Cleaning</button>
      </div>

      <!-- Content panel: rounded card with fade/slide-in on tab change -->
      <div class="native-tabs-panel case-panel"
           style="display:grid; grid-template-columns:1fr 1.05fr; gap:32px;">

          <!-- MEDSPA -->
          <div class="case-content" data-content="medspa">
            <div style="display:flex; flex-direction:column; gap:22px; margin-top:4px;">
              <div style="display:flex; gap:16px; align-items:flex-start;">
                <div style="width:42px; height:42px; border-radius:10px; flex-shrink:0; background:var(--sky-100); color:var(--brand-sky); display:inline-flex; align-items:center; justify-content:center;">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-5 4 4 8-8"/><path d="M14 8h7v7"/></svg>
                </div>
                <div>
                  <div style="font-weight:700; font-size:17px;">Let Them Notice</div>
                  <div style="font-size:14px; color:var(--gray-500); line-height:1.6; margin-top:4px; max-width:420px;">Developed and executed local SEO and social media campaigns, increasing monthly website traffic from 2,100 to 6,323 visitors — a 211.57% year-over-year growth achieved through keyword optimization, local map rankings, and targeted content improvements. I have ranked informational blogs on AEO (Answer Engine Optimization) as well with the use of semantic SEO. Blogs like these help service pages gain visibility.</div>
                </div>
              </div>
            </div>
          </div>

          <!-- CONSULT -->
          <div class="case-content" data-content="consult" hidden>
            <div style="display:flex; flex-direction:column; gap:22px; margin-top:4px;">
              <div style="display:flex; gap:16px; align-items:flex-start;">
                <div style="width:42px; height:42px; border-radius:10px; flex-shrink:0; background:var(--sky-100); color:var(--brand-sky); display:inline-flex; align-items:center; justify-content:center;">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-5 4 4 8-8"/><path d="M14 8h7v7"/></svg>
                </div>
                <div>
                  <div style="font-weight:700; font-size:17px;">InnoVyne Website Traffic</div>
                  <div style="font-size:14px; color:var(--gray-500); line-height:1.6; margin-top:4px; max-width:420px;">I increased website traffic by optimizing both the bottom of the funnel (BOFU) and top of the funnel (TOFU) content for search engines. The TOFU primarily consisted of informational blogs, while the BOFU content included service pages. Before the optimization, these pages contained irrelevant keywords that attracted the wrong audience. After conducting thorough keyword research and developing a coherent page structure with the necessary components, we were able to boost traffic by 200% over the course of six months.</div>
                </div>
              </div>
            </div>
          </div>
          <!-- AEROEX -->
          <div class="case-content" data-content="aeroex" hidden>
            <div style="display:flex; flex-direction:column; gap:22px; margin-top:4px;">
              <div style="display:flex; gap:16px; align-items:flex-start;">
                <div style="width:42px; height:42px; border-radius:10px; flex-shrink:0; background:var(--sky-100); color:var(--brand-sky); display:inline-flex; align-items:center; justify-content:center;">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-5 4 4 8-8"/><path d="M14 8h7v7"/></svg>
                </div>
                <div>
                  <div style="font-weight:700; font-size:17px;">Aeroex</div>
                  <div style="font-size:14px; color:var(--gray-500); line-height:1.6; margin-top:4px; max-width:420px;">I partnered with Aeroex, an industrial air purification company specializing in mist collection systems for CNC machinery. Their website needed technical improvements to enhance visibility and performance. I conducted a comprehensive technical audit to identify critical issues affecting their online presence. My work included fixing numerous broken links and images that were hampering user experience, implementing schema markup to improve search engine understanding of their content, resolving indexing issues to ensure their pages appeared in search results, strengthening their internal linking structure, and optimizing their service pages for relevant keywords. These technical SEO improvements helped Aeroex better showcase their specialized industrial air purification solutions to potential clients searching for mist collection systems for their CNC operations.</div>
                </div>
              </div>
            </div>
          </div>
          <!-- CARPET -->
          <div class="case-content" data-content="carpet" hidden>
            <div style="display:flex; flex-direction:column; gap:22px; margin-top:4px;">
              <div style="display:flex; gap:16px; align-items:flex-start;">
                <div style="width:42px; height:42px; border-radius:10px; flex-shrink:0; background:var(--sky-100); color:var(--brand-sky); display:inline-flex; align-items:center; justify-content:center;">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-5 4 4 8-8"/><path d="M14 8h7v7"/></svg>
                </div>
                <div>
                  <div style="font-weight:700; font-size:17px;">Fresh Carpet Cleaning</div>
                  <div style="font-size:14px; color:var(--gray-500); line-height:1.6; margin-top:4px; max-width:420px;">I created profitable lead generation sites by starting with thorough marketing research to identify cities with optimal population sizes and lucrative service niches. For one project, I built a carpet cleaning website from the ground up, which I successfully monetized by renting it to a window cleaning company seeking to expand their customer base. My approach centered on developing highly search-engine optimized content and establishing topical authority through strategic informational blogs. By positioning the website as an industry expert with valuable, relevant content, I was able to secure first-page Google rankings for key search terms. This strategic content development not only improved visibility but also attracted qualified leads actively searching for these specific services, creating a valuable digital asset that generated consistent revenue through the rental arrangement.</div>
                </div>
              </div>
            </div>
          </div>

      </div>
    </div>
  </div>
</section>


<!-- ============================================================
     FOOTER — 21.dev-style white card with washi-tape corners
     ============================================================ -->
<footer id="contact" class="sm-footer">
  <div class="container">

    <div class="sm-footer-card">
      <!-- Washi-tape decoration: dark torn-tape SVG, one piece at each top corner.
           Right piece is rotated 90deg so it reads vertical, matching the 21.dev
           original. aria-hidden because purely decorative. -->
      <span class="sm-footer-tape sm-footer-tape--left" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 95 80" fill="none">
          <path d="M1 45L70.282 5L88.282 36.1769L19 76.1769L1 45Z" fill="#1c1b1b"/>
          <path d="M69.6829 39.997C74.772 36.9233 80.2799 35.022 85.4464 32.0415C85.5584 31.9769 85.6703 31.912 85.782 31.8468L83.9519 38.6769C80.2833 32.3886 75.7064 26.4975 72.2275 20.0846C70.0007 15.9783 67.7966 11.8425 65.6183 7.69261L72.9746 9.66373C70.566 10.9281 68.1526 12.1837 65.7375 13.4301C59.1543 16.828 52.5477 20.1634 45.9059 23.4675C39.2779 26.7637 32.6138 30.0293 25.946 33.2683C21.417 35.4683 16.8774 37.6611 12.3408 39.8468C10.3494 40.8065 8.36335 41.7623 6.37228 42.7203C4.88674 43.4348 3.40117 44.1492 1.91563 44.8637C1.70897 44.9628 1.48389 45.0108 1.28779 44.994C1.0916 44.977 0.940536 44.8975 0.866099 44.7681C0.791689 44.6386 0.798739 44.4674 0.882816 44.289C0.966978 44.111 1.12195 43.9408 1.31146 43.8119C2.68692 42.8791 4.06239 41.9462 5.43785 41.0134C6.96571 39.9774 8.49068 38.9427 10.0185 37.9078C10.5758 38.2934 11.1526 38.4968 11.9006 38.3019C12.2823 38.2024 12.7844 37.9628 13.0812 37.66C13.3477 37.388 13.4958 37.092 13.6361 36.8103C13.7828 36.5157 13.922 36.236 14.1819 36.0157C14.6227 35.6416 14.9608 35.1461 15.3159 34.6256C15.4451 34.4362 15.5766 34.2432 15.7162 34.0517C17.1755 33.0653 18.6355 32.0797 20.0958 31.0952C20.7161 30.8123 21.2829 30.546 21.7287 30.2596C22.1286 30.0027 22.4405 29.6732 22.7349 29.3173C22.9611 29.1651 23.1873 29.0128 23.4135 28.8606C24.8734 27.8785 26.3349 26.8977 27.7969 25.9178C29.0653 25.3742 30.3884 24.7936 32.0404 23.9203C32.7524 23.544 33.4842 23.2235 34.1877 22.9153C35.2267 22.4601 36.204 22.0318 36.9653 21.4906C37.4742 21.1289 38.0837 20.8769 38.6916 20.6256C39.507 20.2886 40.3209 19.9521 40.8884 19.3523C41.2452 18.9751 41.5509 18.5904 41.8339 18.234C42.2841 17.6669 42.6773 17.1712 43.1308 16.8909C43.9827 16.3643 44.6366 15.763 45.2128 15.2329C45.9058 14.5954 46.4871 14.0607 47.1661 13.8832C47.2691 13.8563 47.3895 13.83 47.5253 13.8008C48.2409 13.6467 49.3854 13.4004 50.6721 12.4297C51.1302 12.084 51.5022 11.6584 51.8663 11.2413C52.3964 10.634 52.9113 10.0444 53.6546 9.74536C53.7656 9.70072 53.9081 9.70004 54.0379 9.69961C54.203 9.69906 54.3472 9.69852 54.3802 9.60751C54.4771 9.34055 54.6749 8.99305 54.8896 8.61527C55.0473 8.33772 55.2144 8.04348 55.3576 7.75325C57.0866 6.63773 58.8181 5.52571 60.5527 4.41789C61.3473 3.91034 62.1427 3.40353 62.9389 2.89753C63.4939 2.89483 64.0449 2.86301 64.5895 2.76514C65.3015 2.63711 66.1031 2.26098 67.1366 1.7766C67.4515 1.62902 67.788 1.47135 68.1502 1.30751C70.2985 0.211054 72.8781 0.719848 73.9745 2.86814C74.2063 3.38051 74.4505 3.94413 74.6959 4.57024C75.4715 6.54841 76.6121 8.38172 77.451 9.4943C77.6285 9.72958 77.8088 9.965 78.0022 10.2164C78.7359 11.1701 79.6521 12.3598 81.2553 14.6987C82.7718 16.9111 83.9554 18.8538 84.8446 20.3132C85.2985 21.0581 85.6753 21.6776 85.981 22.1424C86.5039 22.9378 87.13 23.9238 87.7583 24.9138C88.7415 26.463 89.7306 28.0221 90.3417 28.8752C90.5592 29.1788 90.7935 29.4941 91.046 29.8348C91.6954 30.711 92.4701 31.7564 93.4198 33.2106C94.9454 36.1998 94.2374 39.789 91.2483 41.3146C91.1356 41.3882 91.0205 41.4628 90.9029 41.5385C89.1849 42.6436 88.0561 43.2181 86.8458 43.7492C86.3539 43.965 85.8291 43.9984 85.2883 44.0321C84.5207 44.08 83.72 44.1298 82.9316 44.7081C82.7476 44.8431 82.5657 45.0123 82.3757 45.1895C82.0265 45.5149 81.649 45.8671 81.1774 46.0805C81.0129 46.1549 80.8442 46.1792 80.6788 46.2029C80.4969 46.229 80.3186 46.2548 80.1526 46.3463C79.5326 46.6883 78.9438 47.0464 78.4208 47.3647C77.7463 47.7753 77.1806 48.1194 76.7972 48.2768C76.1137 48.5573 75.4647 49.0342 74.8076 49.5175C74.3056 49.8867 73.7989 50.2601 73.2678 50.5517C71.7504 51.3848 69.7735 52.7209 67.7901 54.1904C67.0396 54.7464 66.2862 55.0138 65.3207 55.3561C64.7201 55.569 64.0372 55.8105 63.2221 56.1693C62.76 56.3726 62.4565 56.6971 62.1754 56.9973C61.9165 57.2738 61.6763 57.5299 61.3489 57.6526C61.0599 57.7608 60.7846 57.6688 60.5231 57.5815C60.2321 57.4843 59.9583 57.3929 59.702 57.5895C59.5657 57.6942 59.4406 57.8919 59.2918 58.1269C59.233 58.2198 59.1699 58.3187 59.1013 58.4201C59.0842 58.3791 59.0657 58.3442 59.0508 58.3184C58.9457 58.1356 58.6072 58.2028 58.2752 58.2689C58.1427 58.2953 58.0108 58.3219 57.8957 58.3319C57.4719 58.3686 56.8253 58.708 56.3466 58.9941C56.144 59.1151 55.9262 59.1653 55.672 59.224C55.4463 59.2761 55.1919 59.3347 54.894 59.4553C54.7241 59.5242 54.5728 59.541 54.4474 59.5545C54.3567 59.5642 54.2794 59.5724 54.2182 59.5982C54.1652 59.6205 54.1556 59.6959 54.1448 59.7807C54.137 59.8418 54.1285 59.908 54.1028 59.9628C54.0412 60.0939 53.9214 60.1919 53.8153 60.2225C53.7663 60.2366 53.7206 60.2358 53.6753 60.2349C53.6225 60.234 53.5698 60.2326 53.5113 60.2553C53.2429 60.3595 53.0377 60.5575 52.8246 60.7633C52.5903 60.9894 52.3457 61.225 51.9975 61.3556C51.8879 61.3967 51.7593 61.42 51.6348 61.4426C51.5045 61.4661 51.378 61.4893 51.2831 61.5308C50.8977 61.6994 50.6327 62.0265 50.389 62.3273C50.2269 62.5274 50.0737 62.716 49.9013 62.8385C49.5852 63.063 49.4962 63.3233 49.4307 63.5155C49.3967 63.615 49.3692 63.6966 49.3191 63.7453C49.2628 63.772 49.2053 63.7983 49.1487 63.8235C49.093 63.8403 49.0355 63.8576 48.9902 63.8888C48.9867 63.8912 48.9836 63.8939 48.9802 63.8963C48.6593 64.0309 48.3345 64.1466 48.0116 64.2613C47.2865 64.519 46.5701 64.7733 45.9244 65.2359C45.7853 65.3355 45.6724 65.487 45.5575 65.641C45.4167 65.8297 45.2727 66.0228 45.0741 66.1295C44.6008 66.3839 44.0696 66.5483 43.5464 66.7102C42.7594 66.9536 41.9904 67.1916 41.4633 67.722C41.2894 67.897 41.142 68.1064 40.9944 68.3169C40.9122 68.4342 40.8296 68.5523 40.7422 68.6643C40.7169 68.5646 40.6833 68.4767 40.652 68.3947C40.5875 68.2257 40.5324 68.081 40.5769 67.9054C40.6823 67.4901 40.7644 66.9549 40.5779 66.7069C40.5272 66.6396 40.4878 66.5548 40.4487 66.4691C40.3507 66.254 40.2505 66.0344 39.9558 66.0791C39.7572 66.1092 39.2569 66.204 39.082 66.5127C39.044 66.5799 39.0478 66.6675 39.0518 66.7648C39.0592 66.9397 39.0675 67.1471 38.838 67.329C38.7994 67.3596 38.7566 67.3917 38.7122 67.4244C38.5349 67.5546 38.3363 67.7 38.3194 67.8538C38.3 68.0309 38.4017 68.1621 38.5204 68.3152C38.6749 68.5145 38.8585 68.7512 38.8407 69.1745C38.8371 69.2583 38.7749 69.3221 38.728 69.3705C38.695 69.4045 38.6699 69.4309 38.6775 69.4511C38.6864 69.4742 38.7244 69.511 38.7726 69.5575C38.9428 69.7213 39.2396 70.008 38.8369 70.2599C38.7279 70.328 38.5912 70.3851 38.4686 70.4362C38.2879 70.5115 38.1379 70.5742 38.1516 70.6412C38.1569 70.6665 38.1652 70.6925 38.175 70.7189C38.0372 70.7894 37.8994 70.8599 37.7617 70.9305C37.5513 70.9626 37.3136 71.1075 37.017 71.2886C36.9451 71.3326 36.8691 71.3787 36.7896 71.4258C36.5175 71.5644 36.2453 71.7032 35.973 71.8416C35.7472 71.9341 35.4976 72.0165 35.2199 72.0788C34.6635 72.2038 34.1132 72.1978 33.5754 72.1917C33.3488 72.1891 33.1241 72.1864 32.9021 72.1937C32.9618 72.1444 33.0138 72.0968 33.0493 72.0522C33.292 71.7467 33.2773 71.4299 33.2636 71.1383C33.2545 70.9444 33.246 70.7614 33.3141 70.6009C33.4387 70.3069 33.3041 70.125 33.2048 69.9903C33.1532 69.9205 33.1115 69.863 33.1199 69.8097C33.1268 69.7669 33.1736 69.7216 33.2219 69.6748C33.264 69.6341 33.3074 69.5918 33.3263 69.5495C33.5565 69.0365 33.3423 68.9396 33.0306 68.7984C32.8587 68.7205 32.6575 68.6289 32.4843 68.4469C32.3112 68.2483 32.2881 68.1742 32.4435 67.9656C32.2185 67.9481 31.9934 67.9305 31.7683 67.913C31.7092 67.9567 31.7012 68.0535 31.7002 68.2073C31.6983 68.482 31.3496 68.7833 31.0772 69.0187C30.951 69.1277 30.8413 69.2227 30.7898 69.2944C30.5158 69.6756 30.7581 69.8463 30.9714 69.9966C31.0888 70.0793 31.1972 70.1559 31.206 70.2579C31.2099 70.3014 31.2524 70.3223 31.2955 70.3438C31.3288 70.3604 31.3629 70.3772 31.3798 70.4049C31.5026 70.6062 31.3709 70.8843 31.2487 71.1425C31.1788 71.2903 31.1123 71.4317 31.098 71.5486C31.0936 71.5842 31.0933 71.6181 31.0936 71.6508C31.0939 71.6984 31.0938 71.7441 31.0797 71.7913C31.0475 71.899 30.9277 72.0281 30.7962 72.1694C30.7288 72.2419 30.6585 72.3175 30.5954 72.3951C30.5137 72.4957 30.5226 72.5982 30.5314 72.7056C30.5377 72.7814 30.5436 72.8599 30.5186 72.9418C30.4732 73.0899 30.294 73.2374 30.1276 73.3743C30.0552 73.434 29.9853 73.492 29.9298 73.5468C29.9072 73.5691 29.9025 73.5904 29.9107 73.611C29.6455 73.8494 29.3946 74.0812 29.1507 74.3073C27.928 75.4406 26.8699 76.422 24.9338 77.2712C24.5678 77.4317 24.2027 77.6527 23.847 77.8987C22.8466 78.3902 21.8448 78.8802 20.8427 79.3685C18.9858 80.3162 16.7561 79.8764 15.8084 78.0196C15.6912 77.779 15.5741 77.5385 15.4571 77.2979C15.5046 76.9554 15.4922 76.5771 15.4159 76.1649C15.2724 75.3908 14.9393 74.7016 14.5464 73.8883C14.2558 73.287 13.9326 72.6178 13.6287 71.7959C13.1181 70.415 12.555 69.0197 11.8089 67.5091C11.066 66.0051 10.1771 64.3053 9.52376 63.1169C9.16763 62.469 8.944 61.7017 8.73537 60.9866C8.44191 59.9808 8.17835 59.0784 7.61958 58.7572C7.44108 58.6546 7.19967 58.5953 6.96499 58.5373C6.79786 58.496 6.63406 58.4547 6.49825 58.4001C6.36908 58.1203 6.23948 57.8403 6.11042 57.5602C6.02416 56.9799 5.8002 56.13 5.18227 55.5402C5.04958 55.251 4.91666 54.9617 4.78958 54.6817C4.50993 54.0719 4.23819 53.4743 3.96388 52.8713C3.87458 52.6744 3.78424 52.4755 3.69373 52.2762C3.69291 52.2743 3.69208 52.2724 3.69126 52.2705C3.50907 51.8692 3.32548 51.4649 3.14577 51.0668C3.06874 50.8964 2.99171 50.7259 2.91467 50.5554C2.71886 50.1222 2.52147 49.686 2.32862 49.2567C2.22665 49.0294 2.12332 48.8001 2.02011 48.5702C1.85267 48.1974 1.68389 47.8217 1.5164 47.4477C1.2455 46.843 0.976827 46.2405 0.707979 45.6366C0.664122 45.5378 0.643515 45.4304 0.652618 45.3375C0.661818 45.2445 0.699512 45.1734 0.760479 45.1383C0.821487 45.1032 0.902318 45.1064 0.987373 45.1452C1.07223 45.1841 1.15414 45.256 1.21749 45.3435C1.60461 45.8796 1.99066 46.4153 2.37757 46.9536C2.6167 47.2863 2.85707 47.6205 3.09529 47.9526C3.24216 48.1573 3.38828 48.3616 3.53359 48.564C3.80784 48.9465 4.08653 49.3367 4.3626 49.7236C4.47129 49.8757 4.57998 50.0279 4.68867 50.1801C4.94315 50.5364 5.20093 50.8992 5.4569 51.2592C5.45844 51.2614 5.45998 51.2636 5.46152 51.2658C5.58745 51.4429 5.71324 51.6197 5.83773 51.7946C6.22127 52.3348 6.60139 52.8703 6.98805 53.4185C7.18905 53.7011 7.39667 53.9966 7.60327 54.2896C7.7183 54.4528 7.83322 54.6155 7.94616 54.7753C8.00768 54.8628 8.06986 54.9515 8.13237 55.0408C9.57264 57.0858 10.9968 59.12 12.4247 61.1784C13.848 63.2287 15.2661 65.2871 16.6737 67.3431C18.0842 69.4042 19.4854 71.4657 20.8812 73.5327C21.1336 73.9063 21.3858 74.2801 21.6379 74.6539L17.477 73.539C30.2295 64.9403 43.1287 56.4797 56.1947 48.2951C58.1128 47.093 60.086 45.8684 62.0158 44.6777C63.9671 43.4745 65.8814 42.3014 67.8458 41.1091C68.4422 40.7466 69.0543 40.3763 69.6829 39.997Z" fill="#1c1b1b"/>
        </svg>
      </span>
      <span class="sm-footer-tape sm-footer-tape--right" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 95 80" fill="none">
          <path d="M1 45L70.282 5L88.282 36.1769L19 76.1769L1 45Z" fill="#1c1b1b"/>
          <path d="M69.6829 39.997C74.772 36.9233 80.2799 35.022 85.4464 32.0415C85.5584 31.9769 85.6703 31.912 85.782 31.8468L83.9519 38.6769C80.2833 32.3886 75.7064 26.4975 72.2275 20.0846C70.0007 15.9783 67.7966 11.8425 65.6183 7.69261L72.9746 9.66373C70.566 10.9281 68.1526 12.1837 65.7375 13.4301C59.1543 16.828 52.5477 20.1634 45.9059 23.4675C39.2779 26.7637 32.6138 30.0293 25.946 33.2683C21.417 35.4683 16.8774 37.6611 12.3408 39.8468C10.3494 40.8065 8.36335 41.7623 6.37228 42.7203C4.88674 43.4348 3.40117 44.1492 1.91563 44.8637C1.70897 44.9628 1.48389 45.0108 1.28779 44.994C1.0916 44.977 0.940536 44.8975 0.866099 44.7681C0.791689 44.6386 0.798739 44.4674 0.882816 44.289C0.966978 44.111 1.12195 43.9408 1.31146 43.8119C2.68692 42.8791 4.06239 41.9462 5.43785 41.0134C6.96571 39.9774 8.49068 38.9427 10.0185 37.9078C10.5758 38.2934 11.1526 38.4968 11.9006 38.3019C12.2823 38.2024 12.7844 37.9628 13.0812 37.66C13.3477 37.388 13.4958 37.092 13.6361 36.8103C13.7828 36.5157 13.922 36.236 14.1819 36.0157C14.6227 35.6416 14.9608 35.1461 15.3159 34.6256C15.4451 34.4362 15.5766 34.2432 15.7162 34.0517C17.1755 33.0653 18.6355 32.0797 20.0958 31.0952C20.7161 30.8123 21.2829 30.546 21.7287 30.2596C22.1286 30.0027 22.4405 29.6732 22.7349 29.3173C22.9611 29.1651 23.1873 29.0128 23.4135 28.8606C24.8734 27.8785 26.3349 26.8977 27.7969 25.9178C29.0653 25.3742 30.3884 24.7936 32.0404 23.9203C32.7524 23.544 33.4842 23.2235 34.1877 22.9153C35.2267 22.4601 36.204 22.0318 36.9653 21.4906C37.4742 21.1289 38.0837 20.8769 38.6916 20.6256C39.507 20.2886 40.3209 19.9521 40.8884 19.3523C41.2452 18.9751 41.5509 18.5904 41.8339 18.234C42.2841 17.6669 42.6773 17.1712 43.1308 16.8909C43.9827 16.3643 44.6366 15.763 45.2128 15.2329C45.9058 14.5954 46.4871 14.0607 47.1661 13.8832C47.2691 13.8563 47.3895 13.83 47.5253 13.8008C48.2409 13.6467 49.3854 13.4004 50.6721 12.4297C51.1302 12.084 51.5022 11.6584 51.8663 11.2413C52.3964 10.634 52.9113 10.0444 53.6546 9.74536C53.7656 9.70072 53.9081 9.70004 54.0379 9.69961C54.203 9.69906 54.3472 9.69852 54.3802 9.60751C54.4771 9.34055 54.6749 8.99305 54.8896 8.61527C55.0473 8.33772 55.2144 8.04348 55.3576 7.75325C57.0866 6.63773 58.8181 5.52571 60.5527 4.41789C61.3473 3.91034 62.1427 3.40353 62.9389 2.89753C63.4939 2.89483 64.0449 2.86301 64.5895 2.76514C65.3015 2.63711 66.1031 2.26098 67.1366 1.7766C67.4515 1.62902 67.788 1.47135 68.1502 1.30751C70.2985 0.211054 72.8781 0.719848 73.9745 2.86814C74.2063 3.38051 74.4505 3.94413 74.6959 4.57024C75.4715 6.54841 76.6121 8.38172 77.451 9.4943C77.6285 9.72958 77.8088 9.965 78.0022 10.2164C78.7359 11.1701 79.6521 12.3598 81.2553 14.6987C82.7718 16.9111 83.9554 18.8538 84.8446 20.3132C85.2985 21.0581 85.6753 21.6776 85.981 22.1424C86.5039 22.9378 87.13 23.9238 87.7583 24.9138C88.7415 26.463 89.7306 28.0221 90.3417 28.8752C90.5592 29.1788 90.7935 29.4941 91.046 29.8348C91.6954 30.711 92.4701 31.7564 93.4198 33.2106C94.9454 36.1998 94.2374 39.789 91.2483 41.3146C91.1356 41.3882 91.0205 41.4628 90.9029 41.5385C89.1849 42.6436 88.0561 43.2181 86.8458 43.7492C86.3539 43.965 85.8291 43.9984 85.2883 44.0321C84.5207 44.08 83.72 44.1298 82.9316 44.7081C82.7476 44.8431 82.5657 45.0123 82.3757 45.1895C82.0265 45.5149 81.649 45.8671 81.1774 46.0805C81.0129 46.1549 80.8442 46.1792 80.6788 46.2029C80.4969 46.229 80.3186 46.2548 80.1526 46.3463C79.5326 46.6883 78.9438 47.0464 78.4208 47.3647C77.7463 47.7753 77.1806 48.1194 76.7972 48.2768C76.1137 48.5573 75.4647 49.0342 74.8076 49.5175C74.3056 49.8867 73.7989 50.2601 73.2678 50.5517C71.7504 51.3848 69.7735 52.7209 67.7901 54.1904C67.0396 54.7464 66.2862 55.0138 65.3207 55.3561C64.7201 55.569 64.0372 55.8105 63.2221 56.1693C62.76 56.3726 62.4565 56.6971 62.1754 56.9973C61.9165 57.2738 61.6763 57.5299 61.3489 57.6526C61.0599 57.7608 60.7846 57.6688 60.5231 57.5815C60.2321 57.4843 59.9583 57.3929 59.702 57.5895C59.5657 57.6942 59.4406 57.8919 59.2918 58.1269C59.233 58.2198 59.1699 58.3187 59.1013 58.4201C59.0842 58.3791 59.0657 58.3442 59.0508 58.3184C58.9457 58.1356 58.6072 58.2028 58.2752 58.2689C58.1427 58.2953 58.0108 58.3219 57.8957 58.3319C57.4719 58.3686 56.8253 58.708 56.3466 58.9941C56.144 59.1151 55.9262 59.1653 55.672 59.224C55.4463 59.2761 55.1919 59.3347 54.894 59.4553C54.7241 59.5242 54.5728 59.541 54.4474 59.5545C54.3567 59.5642 54.2794 59.5724 54.2182 59.5982C54.1652 59.6205 54.1556 59.6959 54.1448 59.7807C54.137 59.8418 54.1285 59.908 54.1028 59.9628C54.0412 60.0939 53.9214 60.1919 53.8153 60.2225C53.7663 60.2366 53.7206 60.2358 53.6753 60.2349C53.6225 60.234 53.5698 60.2326 53.5113 60.2553C53.2429 60.3595 53.0377 60.5575 52.8246 60.7633C52.5903 60.9894 52.3457 61.225 51.9975 61.3556C51.8879 61.3967 51.7593 61.42 51.6348 61.4426C51.5045 61.4661 51.378 61.4893 51.2831 61.5308C50.8977 61.6994 50.6327 62.0265 50.389 62.3273C50.2269 62.5274 50.0737 62.716 49.9013 62.8385C49.5852 63.063 49.4962 63.3233 49.4307 63.5155C49.3967 63.615 49.3692 63.6966 49.3191 63.7453C49.2628 63.772 49.2053 63.7983 49.1487 63.8235C49.093 63.8403 49.0355 63.8576 48.9902 63.8888C48.9867 63.8912 48.9836 63.8939 48.9802 63.8963C48.6593 64.0309 48.3345 64.1466 48.0116 64.2613C47.2865 64.519 46.5701 64.7733 45.9244 65.2359C45.7853 65.3355 45.6724 65.487 45.5575 65.641C45.4167 65.8297 45.2727 66.0228 45.0741 66.1295C44.6008 66.3839 44.0696 66.5483 43.5464 66.7102C42.7594 66.9536 41.9904 67.1916 41.4633 67.722C41.2894 67.897 41.142 68.1064 40.9944 68.3169C40.9122 68.4342 40.8296 68.5523 40.7422 68.6643C40.7169 68.5646 40.6833 68.4767 40.652 68.3947C40.5875 68.2257 40.5324 68.081 40.5769 67.9054C40.6823 67.4901 40.7644 66.9549 40.5779 66.7069C40.5272 66.6396 40.4878 66.5548 40.4487 66.4691C40.3507 66.254 40.2505 66.0344 39.9558 66.0791C39.7572 66.1092 39.2569 66.204 39.082 66.5127C39.044 66.5799 39.0478 66.6675 39.0518 66.7648C39.0592 66.9397 39.0675 67.1471 38.838 67.329C38.7994 67.3596 38.7566 67.3917 38.7122 67.4244C38.5349 67.5546 38.3363 67.7 38.3194 67.8538C38.3 68.0309 38.4017 68.1621 38.5204 68.3152C38.6749 68.5145 38.8585 68.7512 38.8407 69.1745C38.8371 69.2583 38.7749 69.3221 38.728 69.3705C38.695 69.4045 38.6699 69.4309 38.6775 69.4511C38.6864 69.4742 38.7244 69.511 38.7726 69.5575C38.9428 69.7213 39.2396 70.008 38.8369 70.2599C38.7279 70.328 38.5912 70.3851 38.4686 70.4362C38.2879 70.5115 38.1379 70.5742 38.1516 70.6412C38.1569 70.6665 38.1652 70.6925 38.175 70.7189C38.0372 70.7894 37.8994 70.8599 37.7617 70.9305C37.5513 70.9626 37.3136 71.1075 37.017 71.2886C36.9451 71.3326 36.8691 71.3787 36.7896 71.4258C36.5175 71.5644 36.2453 71.7032 35.973 71.8416C35.7472 71.9341 35.4976 72.0165 35.2199 72.0788C34.6635 72.2038 34.1132 72.1978 33.5754 72.1917C33.3488 72.1891 33.1241 72.1864 32.9021 72.1937C32.9618 72.1444 33.0138 72.0968 33.0493 72.0522C33.292 71.7467 33.2773 71.4299 33.2636 71.1383C33.2545 70.9444 33.246 70.7614 33.3141 70.6009C33.4387 70.3069 33.3041 70.125 33.2048 69.9903C33.1532 69.9205 33.1115 69.863 33.1199 69.8097C33.1268 69.7669 33.1736 69.7216 33.2219 69.6748C33.264 69.6341 33.3074 69.5918 33.3263 69.5495C33.5565 69.0365 33.3423 68.9396 33.0306 68.7984C32.8587 68.7205 32.6575 68.6289 32.4843 68.4469C32.3112 68.2483 32.2881 68.1742 32.4435 67.9656C32.2185 67.9481 31.9934 67.9305 31.7683 67.913C31.7092 67.9567 31.7012 68.0535 31.7002 68.2073C31.6983 68.482 31.3496 68.7833 31.0772 69.0187C30.951 69.1277 30.8413 69.2227 30.7898 69.2944C30.5158 69.6756 30.7581 69.8463 30.9714 69.9966C31.0888 70.0793 31.1972 70.1559 31.206 70.2579C31.2099 70.3014 31.2524 70.3223 31.2955 70.3438C31.3288 70.3604 31.3629 70.3772 31.3798 70.4049C31.5026 70.6062 31.3709 70.8843 31.2487 71.1425C31.1788 71.2903 31.1123 71.4317 31.098 71.5486C31.0936 71.5842 31.0933 71.6181 31.0936 71.6508C31.0939 71.6984 31.0938 71.7441 31.0797 71.7913C31.0475 71.899 30.9277 72.0281 30.7962 72.1694C30.7288 72.2419 30.6585 72.3175 30.5954 72.3951C30.5137 72.4957 30.5226 72.5982 30.5314 72.7056C30.5377 72.7814 30.5436 72.8599 30.5186 72.9418C30.4732 73.0899 30.294 73.2374 30.1276 73.3743C30.0552 73.434 29.9853 73.492 29.9298 73.5468C29.9072 73.5691 29.9025 73.5904 29.9107 73.611C29.6455 73.8494 29.3946 74.0812 29.1507 74.3073C27.928 75.4406 26.8699 76.422 24.9338 77.2712C24.5678 77.4317 24.2027 77.6527 23.847 77.8987C22.8466 78.3902 21.8448 78.8802 20.8427 79.3685C18.9858 80.3162 16.7561 79.8764 15.8084 78.0196C15.6912 77.779 15.5741 77.5385 15.4571 77.2979C15.5046 76.9554 15.4922 76.5771 15.4159 76.1649C15.2724 75.3908 14.9393 74.7016 14.5464 73.8883C14.2558 73.287 13.9326 72.6178 13.6287 71.7959C13.1181 70.415 12.555 69.0197 11.8089 67.5091C11.066 66.0051 10.1771 64.3053 9.52376 63.1169C9.16763 62.469 8.944 61.7017 8.73537 60.9866C8.44191 59.9808 8.17835 59.0784 7.61958 58.7572C7.44108 58.6546 7.19967 58.5953 6.96499 58.5373C6.79786 58.496 6.63406 58.4547 6.49825 58.4001C6.36908 58.1203 6.23948 57.8403 6.11042 57.5602C6.02416 56.9799 5.8002 56.13 5.18227 55.5402C5.04958 55.251 4.91666 54.9617 4.78958 54.6817C4.50993 54.0719 4.23819 53.4743 3.96388 52.8713C3.87458 52.6744 3.78424 52.4755 3.69373 52.2762C3.69291 52.2743 3.69208 52.2724 3.69126 52.2705C3.50907 51.8692 3.32548 51.4649 3.14577 51.0668C3.06874 50.8964 2.99171 50.7259 2.91467 50.5554C2.71886 50.1222 2.52147 49.686 2.32862 49.2567C2.22665 49.0294 2.12332 48.8001 2.02011 48.5702C1.85267 48.1974 1.68389 47.8217 1.5164 47.4477C1.2455 46.843 0.976827 46.2405 0.707979 45.6366C0.664122 45.5378 0.643515 45.4304 0.652618 45.3375C0.661818 45.2445 0.699512 45.1734 0.760479 45.1383C0.821487 45.1032 0.902318 45.1064 0.987373 45.1452C1.07223 45.1841 1.15414 45.256 1.21749 45.3435C1.60461 45.8796 1.99066 46.4153 2.37757 46.9536C2.6167 47.2863 2.85707 47.6205 3.09529 47.9526C3.24216 48.1573 3.38828 48.3616 3.53359 48.564C3.80784 48.9465 4.08653 49.3367 4.3626 49.7236C4.47129 49.8757 4.57998 50.0279 4.68867 50.1801C4.94315 50.5364 5.20093 50.8992 5.4569 51.2592C5.45844 51.2614 5.45998 51.2636 5.46152 51.2658C5.58745 51.4429 5.71324 51.6197 5.83773 51.7946C6.22127 52.3348 6.60139 52.8703 6.98805 53.4185C7.18905 53.7011 7.39667 53.9966 7.60327 54.2896C7.7183 54.4528 7.83322 54.6155 7.94616 54.7753C8.00768 54.8628 8.06986 54.9515 8.13237 55.0408C9.57264 57.0858 10.9968 59.12 12.4247 61.1784C13.848 63.2287 15.2661 65.2871 16.6737 67.3431C18.0842 69.4042 19.4854 71.4657 20.8812 73.5327C21.1336 73.9063 21.3858 74.2801 21.6379 74.6539L17.477 73.539C30.2295 64.9403 43.1287 56.4797 56.1947 48.2951C58.1128 47.093 60.086 45.8684 62.0158 44.6777C63.9671 43.4745 65.8814 42.3014 67.8458 41.1091C68.4422 40.7466 69.0543 40.3763 69.6829 39.997Z" fill="#1c1b1b"/>
        </svg>
      </span>

      <div class="sm-footer-card-inner">
        <div class="sm-footer-brand">
          <a class="sm-footer-brand-logo" href="#" data-jump="top" aria-label="Shetty Marketing home">
            <img src="https://shettymarketing.com/wp-content/uploads/2026/04/Shetty-Marketing-Logo.png" alt="Shetty Marketing">
          </a>
          <p class="sm-footer-tagline">
            Inbound marketing rooted in SEO craft &mdash; for founders, operators, and teams who'd rather rank than ramble.
          </p>
        </div>

        <div class="sm-footer-cols">
          <div class="sm-footer-col">
            <h4 class="sm-footer-col-title">Services</h4>
            <a class="sm-footer-link" href="#">SEO</a>
            <a class="sm-footer-link" href="#">Web Design</a>
            <a class="sm-footer-link" href="#">Email Marketing</a>
            <a class="sm-footer-link" href="#">Search Ads</a>
          </div>

          <div class="sm-footer-col">
            <h4 class="sm-footer-col-title">Company</h4>
            <a class="sm-footer-link" href="#skills" data-jump="skills">About</a>
            <a class="sm-footer-link" href="#case-studies" data-jump="case-studies">Case Studies</a>
            <a class="sm-footer-link" href="#achievements" data-jump="achievements">Achievements</a>
          </div>

          <div class="sm-footer-col">
            <h4 class="sm-footer-col-title">Reach Out</h4>
            <a class="sm-footer-link" href="mailto:abhishekbolarshetty@gmail.com">Email</a>
            <a class="sm-footer-link" href="https://www.linkedin.com/in/abhishekdigimarketing/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          </div>
        </div>
      </div>
    </div>

    <div class="sm-footer-bottom">
      <div class="sm-footer-legal">
        <p>&copy; 2026 Shetty Marketing. All rights reserved.</p>
        <div class="sm-footer-legal-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms</a>
          <a href="https://www.linkedin.com/in/abhishekdigimarketing/" target="_blank" rel="noopener noreferrer">Abhishek Bolar</a>
        </div>
      </div>
      <div class="sm-footer-social">
        <a href="https://www.linkedin.com/in/abhishekdigimarketing/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 11.01-4.12 2.06 2.06 0 010 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>
        </a>
        <a href="mailto:abhishekbolarshetty@gmail.com" aria-label="Email">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>
        </a>
      </div>
    </div>

  </div>
</footer>


<!-- ============================================================
     INTERACTIVITY (vanilla JS — no framework)
     - Smooth-scroll + scroll-spy nav
     - Hero card click highlight
     - Skill bar fill animation on load
     - Image lightbox (Gantt, SEO grid, case-study thumbs)
     - Case-study tab switching
     ============================================================ -->
<script>
(function () {
  var NAV_OFFSET = 88;

  // ---------- Smooth scroll + scroll-spy ----------
  // Use document.scrollingElement so smooth scroll works whether the browser
  // is scrolling <html> or <body> (WordPress themes sometimes shift the
  // scroll container to body via overflow rules, which broke window.scrollTo).
  function getScrollEl() {
    return document.scrollingElement || document.documentElement;
  }
  function smoothScrollTo(top) {
    var scrollEl = getScrollEl();
    if (scrollEl && typeof scrollEl.scrollTo === 'function') {
      scrollEl.scrollTo({ top: top, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
  }

  var navLinks = document.querySelectorAll('.nav-link[data-jump]');
  // Smooth scroll covers BOTH desktop nav links AND mobile menu links.
  var allJumpLinks = document.querySelectorAll('[data-jump]');
  allJumpLinks.forEach(function (a) {
    if (a.classList.contains('nav-logo')) return; // logo handled separately
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var id = a.getAttribute('data-jump');
      var el = document.getElementById(id);
      if (!el) return;
      var scrollEl = getScrollEl();
      var top = el.getBoundingClientRect().top + scrollEl.scrollTop - NAV_OFFSET;
      smoothScrollTo(top);
    });
  });

  // ---------- Hamburger toggle ----------
  var hamburger = document.querySelector('.nav-hamburger');
  var mobileMenu = document.getElementById('mobile-menu');
  function closeMenu() {
    if (!hamburger || !mobileMenu) return;
    hamburger.classList.remove('is-open');
    mobileMenu.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      var isOpen = hamburger.classList.toggle('is-open');
      mobileMenu.classList.toggle('is-open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      mobileMenu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    // Close menu when any link inside it is tapped
    mobileMenu.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });
    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }
  var logoLink = document.querySelector('.nav-logo[data-jump]');
  if (logoLink) {
    logoLink.addEventListener('click', function (e) {
      e.preventDefault();
      smoothScrollTo(0);
    });
  }
  function spy() {
    var scrollEl = getScrollEl();
    var y = scrollEl.scrollTop + NAV_OFFSET + 1;
    var ids = ['skills', 'apps', 'achievements', 'case-studies'];
    var current = null;
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.offsetTop <= y) current = id;
    });
    navLinks.forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-jump') === current);
    });
  }
  window.addEventListener('scroll', spy, { passive: true });
  spy();

  // ---------- JD Fit Check ----------
  // Lightweight, frontend-only fit analyzer. Scans the JD text for skill
  // keywords from the profile below, then maps the unique-match count to a
  // score bucket. Designed to feel useful in seconds — no API call required.
  var JD_SKILLS = [
    { name: 'SEO',                   terms: ['seo', 'search engine optimization', 'organic search', 'serp', 'rank', 'rankings'] },
    { name: 'On-Page SEO',           terms: ['on-page', 'on page seo', 'meta tag', 'meta description', 'schema markup', 'internal link'] },
    { name: 'Technical SEO',         terms: ['technical seo', 'site speed', 'core web vitals', 'crawl', 'indexing', 'sitemap', 'robots.txt'] },
    { name: 'Local SEO',             terms: ['local seo', 'gmb', 'google business profile', 'map pack', 'local search'] },
    { name: 'Content Marketing',     terms: ['content marketing', 'blog', 'blog writing', 'content strategy', 'editorial', 'copywriting'] },
    { name: 'Keyword Research',      terms: ['keyword research', 'ahrefs', 'semrush', 'keyword planner', 'search volume'] },
    { name: 'WordPress',             terms: ['wordpress', 'wp-admin', 'elementor', 'gutenberg'] },
    { name: 'Web Development',       terms: ['html', 'css', 'php', 'web development', 'web design', 'frontend'] },
    { name: 'B2B Marketing',         terms: ['b2b', 'business-to-business', 'enterprise marketing', 'saas'] },
    { name: 'Healthcare Marketing',  terms: ['medspa', 'med spa', 'medical', 'healthcare', 'aesthetic', 'wellness', 'clinic'] },
    { name: 'AI & Automation',       terms: ['ai ', 'artificial intelligence', 'automation', 'n8n', 'agent', 'llm', 'claude', 'gpt', 'chatgpt'] },
    { name: 'Google Analytics',      terms: ['google analytics', 'ga4', ' analytics '] },
    { name: 'Search Console',        terms: ['search console', 'gsc'] },
    { name: 'Email Marketing',       terms: ['email marketing', 'mailchimp', 'klaviyo', 'newsletter', 'drip campaign'] },
    { name: 'Marketing Strategy',    terms: ['marketing strategy', 'icp', 'ideal customer', 'positioning', 'go-to-market', 'gtm'] },
    { name: 'Paid Search',           terms: ['ppc', 'paid search', 'google ads', 'sem ', 'paid media'] },
    { name: 'Lead Generation',       terms: ['lead gen', 'lead generation', 'demand gen', 'demand generation'] },
    { name: 'CRO',                   terms: ['cro', 'conversion rate optimization', 'a/b test', 'a-b test', 'split test'] },
    { name: 'Reporting & Analytics', terms: ['reporting', 'dashboards', 'kpi', 'metrics', 'attribution'] },
    { name: 'CRM & Outreach',        terms: ['crm', 'hubspot', 'salesforce', 'outreach', 'cold email'] }
  ];

  function classifyJdFit(matchCount) {
    if (matchCount === 0) return { score: 12, label: 'Limited fit', msg: 'Not seeing a clear overlap yet — share more context and let’s chat.' };
    if (matchCount <= 2)  return { score: 35 + matchCount * 8, label: 'Partial fit', msg: 'Some overlap. Worth a conversation to fill in the gaps.' };
    if (matchCount <= 4)  return { score: 55 + matchCount * 5, label: 'Good fit',    msg: 'Solid overlap with my core skills.' };
    if (matchCount <= 6)  return { score: 80 + matchCount * 2, label: 'Strong fit',  msg: 'Your role aligns closely with what I do daily.' };
    return { score: Math.min(100, 92 + matchCount), label: 'Excellent fit', msg: 'High alignment across the board — let’s talk.' };
  }

  var jdBtn        = document.getElementById('jd-fit-btn');
  var jdInput      = document.getElementById('jd-fit-input');
  var jdResult     = document.getElementById('jd-fit-result');
  var jdRing       = document.querySelector('.jd-fit-score-ring');
  var jdPct        = document.querySelector('.jd-fit-score-pct');
  var jdVerdict    = document.getElementById('jd-fit-verdict');
  var jdMsg        = document.getElementById('jd-fit-msg');
  var jdMatchedBox = document.getElementById('jd-fit-matched-wrap');
  var jdChips      = document.getElementById('jd-fit-chips');

  function runJdFit() {
    if (!jdInput || !jdBtn) return;
    var jd = (jdInput.value || '').toLowerCase().trim();
    if (jd.length < 20) {
      jdInput.classList.add('jd-fit-input--error');
      jdInput.focus();
      setTimeout(function () { jdInput.classList.remove('jd-fit-input--error'); }, 1500);
      return;
    }
    var paddedJd = ' ' + jd + ' '; // pad so " analytics " word-boundary terms match
    var matched = [];
    JD_SKILLS.forEach(function (s) {
      for (var i = 0; i < s.terms.length; i++) {
        if (paddedJd.indexOf(s.terms[i]) !== -1) {
          matched.push(s.name);
          return;
        }
      }
    });

    var result = classifyJdFit(matched.length);
    if (jdResult) jdResult.hidden = false;

    // Animate the score number + ring (count up)
    var startScore = parseInt(jdPct && jdPct.textContent, 10) || 0;
    var endScore = result.score;
    var stepCount = 28;
    var step = 0;
    if (window._jdAnim) clearInterval(window._jdAnim);
    window._jdAnim = setInterval(function () {
      step++;
      var v = Math.round(startScore + (endScore - startScore) * (step / stepCount));
      if (jdPct) jdPct.textContent = v;
      if (jdRing) jdRing.style.setProperty('--score', v);
      if (step >= stepCount) clearInterval(window._jdAnim);
    }, 18);

    if (jdVerdict) jdVerdict.textContent = result.label;
    if (jdMsg) jdMsg.textContent = result.msg;

    if (matched.length > 0) {
      if (jdMatchedBox) jdMatchedBox.hidden = false;
      if (jdChips) {
        jdChips.innerHTML = matched.map(function (n) {
          return '<span class="jd-fit-chip">' + n + '</span>';
        }).join('');
      }
    } else if (jdMatchedBox) {
      jdMatchedBox.hidden = true;
    }
  }

  if (jdBtn && jdInput) {
    jdBtn.addEventListener('click', runJdFit);
    jdInput.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runJdFit();
      }
    });
  }

  // ---------- Experience accordion ----------
  // Each .xp-row has a button header + collapsible body. We animate max-height
  // for a smooth open/close, syncing scrollHeight on resize so wrapped content
  // doesn't end up clipped.
  var xpAccordion = document.querySelector('[data-xp-accordion]');
  if (xpAccordion) {
    var xpRows = xpAccordion.querySelectorAll('.xp-row');

    function setXpRow(row, open) {
      var header = row.querySelector('.xp-header');
      var body = row.querySelector('.xp-body');
      if (!header || !body) return;
      row.classList.toggle('is-open', open);
      header.setAttribute('aria-expanded', open ? 'true' : 'false');
      body.style.maxHeight = open ? body.scrollHeight + 'px' : '0px';
    }

    xpRows.forEach(function (row) {
      var header = row.querySelector('.xp-header');
      if (!header) return;
      // Init: if rendered as open, sync max-height post-paint so transition
      // works on subsequent close.
      if (row.classList.contains('is-open')) {
        requestAnimationFrame(function () {
          var body = row.querySelector('.xp-body');
          if (body) body.style.maxHeight = body.scrollHeight + 'px';
        });
      }
      header.addEventListener('click', function () {
        setXpRow(row, !row.classList.contains('is-open'));
      });
    });

    // Recompute open-row heights on resize (content reflows at mobile widths)
    var xpResizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(xpResizeTimer);
      xpResizeTimer = setTimeout(function () {
        xpRows.forEach(function (row) {
          if (row.classList.contains('is-open')) {
            var body = row.querySelector('.xp-body');
            if (body) body.style.maxHeight = body.scrollHeight + 'px';
          }
        });
      }, 120);
    });
  }

  // ---------- Case-study tab switching (native-tabs style) ----------
  var tabList   = document.querySelector('.native-tabs-list');
  var indicator = document.querySelector('.native-tabs-indicator');
  var tabBtns   = document.querySelectorAll('.native-tabs-list .native-tab');
  var tabPanel  = document.querySelector('.native-tabs-panel');

  function moveIndicator(btn) {
    if (!indicator || !btn || !tabList) return;
    var listRect = tabList.getBoundingClientRect();
    var btnRect  = btn.getBoundingClientRect();
    indicator.style.width     = btnRect.width + 'px';
    indicator.style.transform = 'translateX(' + (btnRect.left - listRect.left - 4) + 'px)';
  }
  function activateTab(btn) {
    var tab = btn.getAttribute('data-tab');
    tabBtns.forEach(function (b) {
      var isActive = b === btn;
      b.classList.toggle('is-active', isActive);
      b.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    moveIndicator(btn);
    document.querySelectorAll('.case-content').forEach(function (c) {
      if (c.getAttribute('data-content') === tab) c.removeAttribute('hidden');
      else c.setAttribute('hidden', '');
    });
    document.querySelectorAll('.case-images').forEach(function (c) {
      if (c.getAttribute('data-images') === tab) c.removeAttribute('hidden');
      else c.setAttribute('hidden', '');
    });
    // Replay the fade/slide-in on the panel
    if (tabPanel) {
      tabPanel.classList.remove('is-anim');
      // Force reflow so the animation restarts
      void tabPanel.offsetWidth;
      tabPanel.classList.add('is-anim');
    }
  }
  tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () { activateTab(btn); });
  });
  // Position indicator under the active tab once on load + on resize
  function syncIndicator() {
    var active = document.querySelector('.native-tabs-list .native-tab.is-active');
    if (active) moveIndicator(active);
  }
  window.addEventListener('resize', syncIndicator);
  // Wait a frame so layout settles (font/image load can shift widths)
  requestAnimationFrame(syncIndicator);
  setTimeout(syncIndicator, 200);

  // ---------- Image lightbox ----------
  function openLightbox(src, alt) {
    var existing = document.querySelector('.lightbox');
    if (existing) existing.remove();

    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', alt || 'Expanded image');

    var img = document.createElement('img');
    img.src = src;
    img.alt = alt || '';

    var closeBtn = document.createElement('button');
    closeBtn.className = 'lightbox-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = '&times;';

    lb.appendChild(img);
    lb.appendChild(closeBtn);
    document.body.appendChild(lb);
    document.body.style.overflow = 'hidden';

    function close() {
      lb.remove();
      document.body.style.overflow = '';
      document.removeEventListener('keydown', escClose);
    }
    function escClose(e) { if (e.key === 'Escape') close(); }

    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target === closeBtn) close();
    });
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', escClose);
  }

  document.querySelectorAll('[data-lightbox]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      var src = el.getAttribute('data-lightbox');
      var alt = el.getAttribute('data-lightbox-alt') || '';
      if (src) openLightbox(src, alt);
    });
  });

  // ---------- Skills/Experience fade-slide in on scroll ----------
  var revealTargets = document.querySelectorAll('#skills .container > div');
  if (revealTargets.length) {
    if ('IntersectionObserver' in window) {
      var revealIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal');
            revealIO.unobserve(entry.target);
          }
        });
      }, { threshold: 0.18, rootMargin: '0px 0px -60px 0px' });
      revealTargets.forEach(function (el) { revealIO.observe(el); });
    } else {
      // Fallback for very old browsers — just show them
      revealTargets.forEach(function (el) { el.classList.add('reveal'); });
    }
  }
})();
</script>

</div>
<?php wp_footer(); ?>
</body>
</html>