document.addEventListener('DOMContentLoaded', function () {
(function () {
  var NAV_OFFSET = 88;

  // ---------- Smooth scroll + scroll-spy ----------
  var navLinks = document.querySelectorAll('.nav-link[data-jump]');
  var allJumpLinks = document.querySelectorAll('[data-jump]');
  allJumpLinks.forEach(function (a) {
    if (a.classList.contains('nav-logo')) return;
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var id = a.getAttribute('data-jump');
      var el = document.getElementById(id);
      if (!el) return;
      var top = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
      window.scrollTo({ top: top, behavior: 'smooth' });
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
    mobileMenu.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }
  var logoLink = document.querySelector('.nav-logo[data-jump]');
  if (logoLink) {
    logoLink.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  function spy() {
    var y = window.scrollY + NAV_OFFSET + 1;
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
    if (matchCount === 0) return { score: 12, label: 'Limited fit', msg: 'Not seeing a clear overlap yet — share more context and let\u2019s chat.' };
    if (matchCount <= 2)  return { score: 35 + matchCount * 8, label: 'Partial fit', msg: 'Some overlap. Worth a conversation to fill in the gaps.' };
    if (matchCount <= 4)  return { score: 55 + matchCount * 5, label: 'Good fit',    msg: 'Solid overlap with my core skills.' };
    if (matchCount <= 6)  return { score: 80 + matchCount * 2, label: 'Strong fit',  msg: 'Your role aligns closely with what I do daily.' };
    return { score: Math.min(100, 92 + matchCount), label: 'Excellent fit', msg: 'High alignment across the board — let\u2019s talk.' };
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
    var paddedJd = ' ' + jd + ' ';
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

  // ---------- Case-study tab switching ----------
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
    if (tabPanel) {
      tabPanel.classList.remove('is-anim');
      void tabPanel.offsetWidth;
      tabPanel.classList.add('is-anim');
    }
  }
  tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () { activateTab(btn); });
  });
  function syncIndicator() {
    var active = document.querySelector('.native-tabs-list .native-tab.is-active');
    if (active) moveIndicator(active);
  }
  window.addEventListener('resize', syncIndicator);
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

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-lightbox]');
    if (!el) return;
    e.preventDefault();
    var src = el.getAttribute('data-lightbox');
    var alt = el.getAttribute('data-lightbox-alt') || '';
    if (src) openLightbox(src, alt);
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
      revealTargets.forEach(function (el) { el.classList.add('reveal'); });
    }
  }

  // ---------- Stack grid items stagger reveal ----------
  var stackItems = document.querySelectorAll('.stack-item');
  if (stackItems.length && 'IntersectionObserver' in window) {
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var stackEase = 'cubic-bezier(0.22,1,0.36,1)';
    if (!reducedMotion) {
      stackItems.forEach(function (el) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
      });
    }
    var stackIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var idx = Array.prototype.indexOf.call(stackItems, entry.target);
        var col = idx % 3;
        if (!reducedMotion) {
          entry.target.style.transition = 'opacity 0.55s ' + stackEase + ', transform 0.55s ' + stackEase;
          entry.target.style.transitionDelay = (col * 80) + 'ms';
        }
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        entry.target.addEventListener('transitionend', function cleanup(e) {
          if (e.propertyName !== 'opacity') return;
          entry.target.style.opacity = '';
          entry.target.style.transform = '';
          entry.target.style.transition = '';
          entry.target.style.transitionDelay = '';
          entry.target.removeEventListener('transitionend', cleanup);
        });
        stackIO.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    stackItems.forEach(function (el) { stackIO.observe(el); });
  }

  // ---------- Hero facts cards stagger reveal ----------
  var heroFactsCards = document.querySelectorAll('.hero-card--row');
  if (heroFactsCards.length && 'IntersectionObserver' in window) {
    heroFactsCards.forEach(function (el) { el.classList.add('will-reveal'); });
    var heroIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var idx = Array.prototype.indexOf.call(heroFactsCards, entry.target);
        entry.target.style.animationDelay = (idx * 75) + 'ms';
        entry.target.classList.add('reveal');
        entry.target.addEventListener('animationend', function () {
          entry.target.classList.remove('will-reveal', 'reveal');
          entry.target.style.animationDelay = '';
        }, { once: true });
        heroIO.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -20px 0px' });
    heroFactsCards.forEach(function (el) { heroIO.observe(el); });
  }

  // ---------- Achievements photo stack scatter animation ----------
  var photoStack = document.querySelector('.photo-stack');
  if (photoStack && 'IntersectionObserver' in window) {
    var stackPhotos = photoStack.querySelectorAll('.stack-photo');
    var reducedMotionPhoto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var easePhoto = 'cubic-bezier(0.25, 0.1, 0.25, 1)';

    stackPhotos.forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translate(0, 0) rotate(0deg) scale(0.9)';
    });

    var photoIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        photoIO.unobserve(entry.target);

        stackPhotos.forEach(function (el) {
          var tx = parseInt(el.getAttribute('data-target-x'), 10) || 0;
          var ty = parseInt(el.getAttribute('data-target-y'), 10) || 0;
          var rot = parseInt(el.getAttribute('data-rotate'), 10) || 0;
          var order = parseInt(el.getAttribute('data-order'), 10) || 0;
          var delay = order * 200;

          var hoverScale = 1.08;
          el.style.setProperty('--hover-transform',
            'translate(' + tx + 'px, ' + ty + 'px) rotate(' + rot + 'deg) scale(' + hoverScale + ')');

          setTimeout(function () {
            if (!reducedMotionPhoto) {
              el.style.transition = 'transform 1s ' + easePhoto + ' ' + delay + 'ms, opacity 0.8s ease ' + delay + 'ms, box-shadow 0.3s ease';
            }
            el.style.opacity = '1';
            el.style.transform = 'translate(' + tx + 'px, ' + ty + 'px) rotate(' + rot + 'deg) scale(1)';
            el.classList.add('is-revealed');
          }, 300);
        });
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -40px 0px' });

    photoIO.observe(photoStack);
  }
})();
});
