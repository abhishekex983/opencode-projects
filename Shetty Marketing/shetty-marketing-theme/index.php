<?php get_header(); ?>

<!-- ============================================================
     HERO
     ============================================================ -->
<section class="section hero-section" style="padding-top:80px;">
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
        In a nutshell, I'm an SEO-focused digital marketing specialist with 5+
        years in both B2B and B2C. I have experience working closely with the
        leadership team on various marketing activities pertaining to SEO, email
        marketing, WordPress management, and Google Business Profile optimization.
        I also carry out ancillary tasks such as creating designs, videos, and AI
        workflows. If you are looking to streamline your marketing operations and
        improve your ROI, you have found the right person.
      </p>

      <!-- JD Fit Check -->
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

  <!-- Hero facts row -->
  <div class="hero-facts">
    <div class="hero-card hero-card--row hero-card--highlight">
      <div class="hero-edge" style="background:var(--brand-yellow);"></div>
      <div class="hero-edge-thin" style="background:var(--brand-yellow);"></div>
      <div class="hero-card-eyebrow">2024</div>
      <div class="hero-card-title">Best Performer</div>
      <div class="hero-card-sub">InnoVyne &mdash; Annual Recognition</div>
      <div class="hero-bar-bottom" style="background:var(--brand-yellow);"></div>
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
      <div class="hero-bar-bottom" style="background:var(--brand-sky);"></div>
    </div>
  </div>
</section>


<!-- ============================================================
     SKILLS
     ============================================================ -->
<section id="skills" class="section" style="background:#fff;">
  <div class="container" style="display:grid; grid-template-columns:4fr 6fr; gap:80px;">
    <div>
      <h2 class="h-lg" style="font-family:var(--font-display); font-weight:700; line-height:1.1; letter-spacing:-0.02em;">
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
        <div class="xp-row xp-row--active is-open">
          <button class="xp-header" type="button" aria-expanded="true" aria-controls="xp-body-1">
            <span class="xp-num">1</span>
            <span class="xp-meta">
              <span class="xp-title">SEO Specialist &amp; Marketing Coordinator</span>
              <span class="xp-company">Coast2Coast First Aid and Aquatics</span>
            </span>
            <span class="xp-duration">Job Duration &middot; March 2026 &ndash; Present</span>
            <span class="xp-chev" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></span>
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
        <div class="xp-row xp-row--closed">
          <button class="xp-header" type="button" aria-expanded="false" aria-controls="xp-body-2">
            <span class="xp-num">2</span>
            <span class="xp-meta">
              <span class="xp-title">Digital Marketing Specialist</span>
              <span class="xp-company">InnoVyne Tech.</span>
            </span>
            <span class="xp-duration">Job Duration &middot; Jun 2021 &ndash; Oct 2025</span>
            <span class="xp-chev" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></span>
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
        <div class="xp-row xp-row--closed">
          <button class="xp-header" type="button" aria-expanded="false" aria-controls="xp-body-3">
            <span class="xp-num">3</span>
            <span class="xp-meta">
              <span class="xp-title">Digital Marketing Analyst</span>
              <span class="xp-company">DotMappers Pvt. Ltd</span>
            </span>
            <span class="xp-duration">Job Duration &middot; Dec 2018 &ndash; Mar 2019</span>
            <span class="xp-chev" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></span>
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
     TECH STACK
     ============================================================ -->
<section id="stack" class="section stack-section">
  <div class="container">
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
      <div class="stack-illustration" aria-hidden="true">
        <span class="stack-illus-halo"></span>
        <div class="stack-illus-cards">
          <div class="stack-illus-card stack-illus-card--3">
            <span class="stack-illus-mark"><img src="https://shettymarketing.com/wp-content/uploads/2026/05/Ahrefs-scaled.png" alt="" loading="lazy"></span>
            <span class="stack-illus-text"><span class="stack-illus-name">Ahrefs</span><span class="stack-illus-sub">SEO Research</span></span>
          </div>
          <div class="stack-illus-card stack-illus-card--2">
            <span class="stack-illus-mark"><img src="https://shettymarketing.com/wp-content/uploads/2026/05/Wordpress-scaled.png" alt="" loading="lazy"></span>
            <span class="stack-illus-text"><span class="stack-illus-name">WordPress</span><span class="stack-illus-sub">CMS</span></span>
          </div>
          <div class="stack-illus-card stack-illus-card--1">
            <span class="stack-illus-mark"><img src="https://shettymarketing.com/wp-content/uploads/2026/05/Claude-scaled.png" alt="" loading="lazy"></span>
            <span class="stack-illus-text"><span class="stack-illus-name">Claude Code</span><span class="stack-illus-sub">AI Assistant</span></span>
          </div>
        </div>
      </div>
    </div>
    <div class="stack-grid">
      <div class="stack-item"><span class="stack-icon"><img src="https://shettymarketing.com/wp-content/uploads/2026/05/Claude-scaled.png" alt="" loading="lazy"></span><div class="stack-meta"><h3>Claude Code</h3><p>AI-powered development assistant for faster, sharper shipping.</p></div></div>
      <div class="stack-item"><span class="stack-icon"><img src="https://shettymarketing.com/wp-content/uploads/2026/05/Wordpress-scaled.png" alt="" loading="lazy"></span><div class="stack-meta"><h3>WordPress</h3><p>CMS of choice for client sites, content workflows, and infrastructure.</p></div></div>
      <div class="stack-item"><span class="stack-icon"><img src="https://shettymarketing.com/wp-content/uploads/2026/05/Ahrefs-scaled.png" alt="" loading="lazy"></span><div class="stack-meta"><h3>Ahrefs</h3><p>Backlink analysis, keyword research, and rank tracking for SEO campaigns.</p></div></div>
      <div class="stack-item"><span class="stack-icon"><img src="https://shettymarketing.com/wp-content/uploads/2026/05/HTML-scaled.png" alt="" loading="lazy"></span><div class="stack-meta"><h3>HTML</h3><p>Semantic structure for accessible, search-engine-friendly markup.</p></div></div>
      <div class="stack-item"><span class="stack-icon"><img src="http://shettymarketing.com/wp-content/uploads/2026/06/Elementor-Icon.png" alt="" loading="lazy"></span><div class="stack-meta"><h3>Elementor</h3><p>Visual WordPress page builder for rapid prototyping and client-ready layouts.</p></div></div>
      <div class="stack-item"><span class="stack-icon"><img src="http://shettymarketing.com/wp-content/uploads/2026/06/Surfer-SEO.png" alt="" loading="lazy"></span><div class="stack-meta"><h3>Surfer SEO</h3><p>On-page optimization and content grading for higher SERP rankings.</p></div></div>
      <div class="stack-item"><span class="stack-icon"><img src="http://shettymarketing.com/wp-content/uploads/2026/06/Active-Campaign-Icon.png" alt="" loading="lazy"></span><div class="stack-meta"><h3>ActiveCampaign</h3><p>Email automation and CRM for segmented nurture sequences and lead scoring.</p></div></div>
      <div class="stack-item"><span class="stack-icon"><img src="http://shettymarketing.com/wp-content/uploads/2026/06/Adobe-Creative-Cloud.png" alt="" loading="lazy"></span><div class="stack-meta"><h3>Adobe Creative Cloud</h3><p>Professional design suite for social creatives, videos, and brand assets.</p></div></div>
      <div class="stack-item"><span class="stack-icon"><img src="https://shettymarketing.com/wp-content/uploads/2026/05/CSS-scaled.png" alt="" loading="lazy"></span><div class="stack-meta"><h3>CSS</h3><p>Custom styling and responsive layout for polished, on-brand interfaces.</p></div></div>
      <div class="stack-item"><span class="stack-icon"><img src="https://shettymarketing.com/wp-content/uploads/2026/05/PHP-scaled.png" alt="" loading="lazy"></span><div class="stack-meta"><h3>PHP</h3><p>Server-side scripting for WordPress customization and integrations.</p></div></div>
      <div class="stack-item"><span class="stack-icon"><img src="https://shettymarketing.com/wp-content/uploads/2026/05/Google-analytics-scaled.png" alt="" loading="lazy"></span><div class="stack-meta"><h3>Google Analytics</h3><p>Audience, conversion, and funnel measurement across campaigns.</p></div></div>
      <div class="stack-item"><span class="stack-icon"><img src="https://shettymarketing.com/wp-content/uploads/2026/05/Search-Console-scaled.png" alt="" loading="lazy"></span><div class="stack-meta"><h3>Search Console</h3><p>Indexing, query insights, and technical SEO monitoring from Google.</p></div></div>
      <div class="stack-item"><span class="stack-icon"><img src="https://shettymarketing.com/wp-content/uploads/2026/05/Canva-scaled.png" alt="" loading="lazy"></span><div class="stack-meta"><h3>Canva</h3><p>Quick design for social, landing pages, and marketing collateral.</p></div></div>
      <div class="stack-item"><span class="stack-icon"><img src="https://shettymarketing.com/wp-content/uploads/2026/04/logo-n8n.png" alt="" loading="lazy"></span><div class="stack-meta"><h3>n8n</h3><p>Visual workflow automation for marketing ops, scraping, and AI agents.</p></div></div>
      <div class="stack-item"><span class="stack-icon"><img src="https://shettymarketing.com/wp-content/uploads/2026/05/DataforSEO.png" alt="" loading="lazy"></span><div class="stack-meta"><h3>DataforSEO</h3><p>SERP, keyword, and backlink data APIs powering custom SEO tools.</p></div></div>
      <div class="stack-item"><span class="stack-icon"><img src="https://shettymarketing.com/wp-content/uploads/2026/05/Gemini.png" alt="" loading="lazy"></span><div class="stack-meta"><h3>Gemini</h3><p>Multimodal AI for research, content drafting, and reasoning tasks.</p></div></div>
    </div>
  </div>
</section>


<!-- ============================================================
     TOOLS — sticky stacking product cards
     ============================================================ -->
<section id="apps" class="section">
  <div class="container" style="text-align:center; margin-bottom:64px;">
    <h2 class="h-xl" style="font-family:var(--font-display); font-weight:800; letter-spacing:-0.03em; line-height:1; margin:0;">
      Marketing Apps I Have Built
    </h2>
  </div>
  <div class="container">
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
            <div class="zoom-card" data-lightbox="https://shettymarketing.com/wp-content/uploads/2026/04/gantt-chart.png" data-lightbox-alt="Personal Gantt Chart" title="Click to expand" style="position:relative; background:#fff; border-radius:14px; overflow:hidden; cursor:zoom-in; box-shadow:0 24px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06);">
              <img src="https://shettymarketing.com/wp-content/uploads/2026/04/gantt-chart.png" alt="Personal Gantt Chart" style="display:block; width:100%; height:auto;">
              <div style="position:absolute; right:12px; top:12px; width:36px; height:36px; border-radius:50%; background:rgba(13,26,53,0.85); color:#fff; display:flex; align-items:center; justify-content:center; font-size:18px; backdrop-filter:blur(4px);">&#x2922;</div>
            </div>
          </div>
        </div>
      </div>
    </div>
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
              <div class="zoom-card-sm" data-lightbox="https://shettymarketing.com/wp-content/uploads/2026/04/seo-1.png" data-lightbox-alt="Off-Page SEO — Domain Analysis" style="position:relative; background:#fff; border-radius:12px; overflow:hidden; cursor:zoom-in; aspect-ratio:16/10; box-shadow:0 14px 36px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06);">
                <img src="https://shettymarketing.com/wp-content/uploads/2026/04/seo-1.png" alt="Off-Page SEO — Domain Analysis" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:top left;">
                <div style="position:absolute; right:8px; top:8px; width:26px; height:26px; border-radius:50%; background:rgba(13,26,53,0.85); color:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; backdrop-filter:blur(4px);">&#x2922;</div>
              </div>
              <div class="zoom-card-sm" data-lightbox="https://shettymarketing.com/wp-content/uploads/2026/04/seo-2.png" data-lightbox-alt="Off-Page SEO — Backlink Results" style="position:relative; background:#fff; border-radius:12px; overflow:hidden; cursor:zoom-in; aspect-ratio:16/10; box-shadow:0 14px 36px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06);">
                <img src="https://shettymarketing.com/wp-content/uploads/2026/04/seo-2.png" alt="Off-Page SEO — Backlink Results" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:top left;">
                <div style="position:absolute; right:8px; top:8px; width:26px; height:26px; border-radius:50%; background:rgba(13,26,53,0.85); color:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; backdrop-filter:blur(4px);">&#x2922;</div>
              </div>
              <div class="zoom-card-sm" data-lightbox="https://shettymarketing.com/wp-content/uploads/2026/04/seo-3.png" data-lightbox-alt="Anchor Text Distribution" style="position:relative; background:#fff; border-radius:12px; overflow:hidden; cursor:zoom-in; aspect-ratio:16/10; box-shadow:0 14px 36px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06);">
                <img src="https://shettymarketing.com/wp-content/uploads/2026/04/seo-3.png" alt="Anchor Text Distribution" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:top left;">
                <div style="position:absolute; right:8px; top:8px; width:26px; height:26px; border-radius:50%; background:rgba(13,26,53,0.85); color:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; backdrop-filter:blur(4px);">&#x2922;</div>
              </div>
              <div class="zoom-card-sm" data-lightbox="https://shettymarketing.com/wp-content/uploads/2026/04/seo-4.png" data-lightbox-alt="On-Page SEO — Entity Presence" style="position:relative; background:#fff; border-radius:12px; overflow:hidden; cursor:zoom-in; aspect-ratio:16/10; box-shadow:0 14px 36px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06);">
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
          <p style="margin:0 0 12px; color:#fff;">Had the privilege of managing Abhishek at InnoVyne, where he started as a Marketing Coordinator and quickly grew into the role of <span style="color:var(--brand-sky); font-weight:700;">Digital Marketing Specialist</span>. His growth was a natural progression driven by his curiosity, technical expertise, and constant desire to learn.</p>
          <p style="margin:0 0 12px; color:#fff;">Abhishek is one of those rare professionals whose knowledge spans across multiple fields — from web development and digital marketing to email campaigns and AI. He not only understands the tools but also knows how to evaluate and select the best ones to achieve results.</p>
          <p style="margin:0 0 12px; color:#fff;">What truly sets him apart is his <span style="color:var(--brand-sky); font-weight:700;">reliability and attitude</span>. He never misses a deadline, carries a "can-do" mindset, and approaches every challenge with positivity. He is also a supportive and kind teammate, always ready to help, collaborate, and contribute to the success of those around him.</p>
          <p style="margin:0; color:#fff;">I couldn't have been happier to work side by side with Abhishek over the past four years, and I sincerely hope our paths cross again. Any team would be lucky to have him.</p>
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
      <h2 class="h-lg" style="font-family:var(--font-display); font-size:48px; font-weight:800; letter-spacing:-0.02em; margin-top:18px;">Where I've moved the needle</h2>
    </div>
    <div class="native-tabs" data-native-tabs>
      <div class="native-tabs-list" data-case-tabs role="tablist">
        <span class="native-tabs-indicator" aria-hidden="true"></span>
        <button class="native-tab is-active" data-tab="medspa"  role="tab" aria-selected="true">Medspa</button>
        <button class="native-tab"            data-tab="consult" role="tab" aria-selected="false">Consultation</button>
        <button class="native-tab"            data-tab="aeroex"  role="tab" aria-selected="false">Air Purification</button>
        <button class="native-tab"            data-tab="carpet"  role="tab" aria-selected="false">Carpet Cleaning</button>
      </div>
      <div class="native-tabs-panel case-panel" style="display:grid; grid-template-columns:1fr 1.05fr; gap:32px;">
          <div class="case-content" data-content="medspa">
            <div style="display:flex; flex-direction:column; gap:22px; margin-top:4px;">
              <div style="display:flex; gap:16px; align-items:flex-start;">
                <div style="width:42px; height:42px; border-radius:10px; flex-shrink:0; background:var(--sky-100); color:var(--brand-sky); display:inline-flex; align-items:center; justify-content:center;">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-5 4 4 8-8"/><path d="M14 8h7v7"/></svg>
                </div>
                <div>
                  <div style="font-weight:700; font-size:17px;">Let Them Notice</div>
                  <div style="font-size:14px; color:var(--gray-500); line-height:1.6; margin-top:4px; max-width:420px;">Developed and executed local SEO and social media campaigns, increasing monthly website traffic from 2,100 to 6,323 visitors — a 211.57% year-over-year growth achieved through keyword optimization, local map rankings, and targeted content improvements.</div>
                </div>
              </div>
            </div>
          </div>
          <div class="case-images" data-images="medspa" style="display:flex; flex-direction:column; gap:14px; justify-content:center;">
            <button class="case-thumb" data-lightbox="https://shettymarketing.com/wp-content/uploads/2026/04/Medspa-site-1.png" data-lightbox-alt="GA4 traffic growth — 2,100 to 6,323 monthly users (+211.57%)">
              <div style="position:relative;">
                <img src="https://shettymarketing.com/wp-content/uploads/2026/04/Medspa-site-1.png" alt="GA4 traffic growth" style="display:block; width:100%; height:auto;">
                <div style="position:absolute; top:8px; right:8px; width:28px; height:28px; border-radius:8px; background:rgba(14,31,58,0.78); color:#fff; display:inline-flex; align-items:center; justify-content:center; font-size:14px;" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
                </div>
              </div>
            </button>
            <button class="case-thumb" data-lightbox="https://shettymarketing.com/wp-content/uploads/2026/04/Medspa-Site.png" data-lightbox-alt="Google search visibility — Botox query SERP">
              <div style="position:relative;">
                <img src="https://shettymarketing.com/wp-content/uploads/2026/04/Medspa-Site.png" alt="Google search visibility" style="display:block; width:100%; height:auto;">
                <div style="position:absolute; top:8px; right:8px; width:28px; height:28px; border-radius:8px; background:rgba(14,31,58,0.78); color:#fff; display:inline-flex; align-items:center; justify-content:center; font-size:14px;" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
                </div>
              </div>
            </button>
          </div>
          <div class="case-content" data-content="consult" hidden>
            <div style="display:flex; flex-direction:column; gap:22px; margin-top:4px;">
              <div style="display:flex; gap:16px; align-items:flex-start;">
                <div style="width:42px; height:42px; border-radius:10px; flex-shrink:0; background:var(--sky-100); color:var(--brand-sky); display:inline-flex; align-items:center; justify-content:center;">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-5 4 4 8-8"/><path d="M14 8h7v7"/></svg>
                </div>
                <div>
                  <div style="font-weight:700; font-size:17px;">InnoVyne Website Traffic</div>
                  <div style="font-size:14px; color:var(--gray-500); line-height:1.6; margin-top:4px; max-width:420px;">I increased website traffic by optimizing both the bottom of the funnel (BOFU) and top of the funnel (TOFU) content for search engines. We were able to boost traffic by 200% over the course of six months.</div>
                </div>
              </div>
            </div>
          </div>
          <div class="case-images" data-images="consult" hidden style="display:flex; flex-direction:column; gap:14px; justify-content:center;">
            <button class="case-thumb" data-lightbox="https://shettymarketing.com/wp-content/uploads/2026/04/InnoVyne-Website-Traffic.png" data-lightbox-alt="InnoVyne website traffic — 200% growth over 6 months">
              <div style="position:relative;">
                <img src="https://shettymarketing.com/wp-content/uploads/2026/04/InnoVyne-Website-Traffic.png" alt="InnoVyne website traffic" style="display:block; width:100%; height:auto;">
                <div style="position:absolute; top:8px; right:8px; width:28px; height:28px; border-radius:8px; background:rgba(14,31,58,0.78); color:#fff; display:inline-flex; align-items:center; justify-content:center; font-size:14px;" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
                </div>
              </div>
            </button>
          </div>
          <div class="case-content" data-content="aeroex" hidden>
            <div style="display:flex; flex-direction:column; gap:22px; margin-top:4px;">
              <div style="display:flex; gap:16px; align-items:flex-start;">
                <div style="width:42px; height:42px; border-radius:10px; flex-shrink:0; background:var(--sky-100); color:var(--brand-sky); display:inline-flex; align-items:center; justify-content:center;">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-5 4 4 8-8"/><path d="M14 8h7v7"/></svg>
                </div>
                <div>
                  <div style="font-weight:700; font-size:17px;">Aeroex</div>
                  <div style="font-size:14px; color:var(--gray-500); line-height:1.6; margin-top:4px; max-width:420px;">I partnered with Aeroex, an industrial air purification company specializing in mist collection systems for CNC machinery. I conducted a comprehensive technical audit to identify critical issues affecting their online presence.</div>
                </div>
              </div>
            </div>
          </div>
          <div class="case-images" data-images="aeroex" hidden style="display:flex; flex-direction:column; gap:14px; justify-content:center;">
            <button class="case-thumb" data-lightbox="https://shettymarketing.com/wp-content/uploads/2026/04/Air-purification.png" data-lightbox-alt="Aeroex industrial air purification">
              <div style="position:relative;">
                <img src="https://shettymarketing.com/wp-content/uploads/2026/04/Air-purification.png" alt="Aeroex" style="display:block; width:100%; height:auto;">
                <div style="position:absolute; top:8px; right:8px; width:28px; height:28px; border-radius:8px; background:rgba(14,31,58,0.78); color:#fff; display:inline-flex; align-items:center; justify-content:center; font-size:14px;" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
                </div>
              </div>
            </button>
          </div>
          <div class="case-content" data-content="carpet" hidden>
            <div style="display:flex; flex-direction:column; gap:22px; margin-top:4px;">
              <div style="display:flex; gap:16px; align-items:flex-start;">
                <div style="width:42px; height:42px; border-radius:10px; flex-shrink:0; background:var(--sky-100); color:var(--brand-sky); display:inline-flex; align-items:center; justify-content:center;">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-5 4 4 8-8"/><path d="M14 8h7v7"/></svg>
                </div>
                <div>
                  <div style="font-weight:700; font-size:17px;">Fresh Carpet Cleaning</div>
                  <div style="font-size:14px; color:var(--gray-500); line-height:1.6; margin-top:4px; max-width:420px;">I created profitable lead generation sites by starting with thorough marketing research. I built a carpet cleaning website from the ground up, which I successfully monetized by renting it to a window cleaning company.</div>
                </div>
              </div>
            </div>
          </div>
          <div class="case-images" data-images="carpet" hidden style="display:flex; flex-direction:column; gap:14px; justify-content:center;">
            <button class="case-thumb" data-lightbox="https://shettymarketing.com/wp-content/uploads/2026/04/Fresh-Carpet-Cleaning.png" data-lightbox-alt="Fresh Carpet Cleaning — lead generation site">
              <div style="position:relative;">
                <img src="https://shettymarketing.com/wp-content/uploads/2026/04/Fresh-Carpet-Cleaning.png" alt="Fresh Carpet Cleaning" style="display:block; width:100%; height:auto;">
                <div style="position:absolute; top:8px; right:8px; width:28px; height:28px; border-radius:8px; background:rgba(14,31,58,0.78); color:#fff; display:inline-flex; align-items:center; justify-content:center; font-size:14px;" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
                </div>
              </div>
            </button>
          </div>
      </div>
    </div>
  </div>
</section>

<?php get_footer(); ?>
