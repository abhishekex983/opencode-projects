<!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php wp_head(); ?>
<style>
  /* ---- Template-scoped overrides ---------------------------------------- */

  /* 1. Suppress any parent-theme or Elementor Theme Builder header that
        leaks above our own .nav. */
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
        edges on wide monitors. */
  .portfolio-root {
    padding-left: clamp(16px, 7vw, 160px);
    padding-right: clamp(16px, 7vw, 160px);
  }

  /* 3. Kill the yellow drop-shadow that something (Custom CSS plugin /
        parent theme) attaches to every <button> on the page. */
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
  .xp-row:hover { box-shadow: 0 14px 28px rgba(14, 31, 58, 0.12) !important; }
  .case-thumb { box-shadow: 0 4px 14px rgba(14, 31, 58, 0.08) !important; }
  .case-thumb:hover { box-shadow: 0 10px 24px rgba(14, 31, 58, 0.14) !important; }
  .xp-row::before,
  .xp-row::after,
  .xp-accordion::before,
  .xp-accordion::after {
    display: none !important;
  }

  /* 3b. Kill the off-white background on the Tech Stack section. */
  .stack-section,
  #stack {
    background: transparent !important;
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
      <img src="https://shettymarketing.com/wp-content/uploads/2026/06/S-Marketing-Final-Logo.png" alt="Shetty Marketing">
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

<!-- Mobile menu (slides down from top, mobile only). -->
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