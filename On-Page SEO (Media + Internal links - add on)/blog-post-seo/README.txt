BLOG POST CREATION - Setup Instructions
========================================

The F: drive is read-only for this process. You need to manually copy/move/edit 4 files.

All files are located in:
  C:\Users\Abhishek Bolar\AppData\Local\Temp\opencode\blog-post-seo\

---

STEP 1: Copy the handler file
-----------------------------
Source: C:\Users\Abhishek Bolar\AppData\Local\Temp\opencode\blog_post_handler.js
Target: F:\Opencode Projects\On page SEO\webhook-service\handlers\blog-post-creation.js

---

STEP 2: Copy the n8n workflow
-----------------------------
Source: C:\Users\Abhishek Bolar\AppData\Local\Temp\opencode\blog-post-seo\blog-post-creation-workflow.json  
Target: F:\Opencode Projects\On page SEO\blog-post-creation-workflow.json

---

STEP 3: Edit server.js
----------------------
File: F:\Opencode Projects\On page SEO\webhook-service\server.js

A) Find this line (near the top, after the nicheResearch require):
    const nicheResearch = require('./handlers/niche-research');

   Add this line AFTER it:
    const blogPostCreation = require('./handlers/blog-post-creation');

B) Find this block (at the bottom, after the niche-research route):
    app.post('/webhook/niche-research', (req, res) => {
      nicheResearch.handle(req, res).catch((err) => {
        res.status(500).json({ error: String(err), stack: err && err.stack ? err.stack.slice(0, 800) : '' });
      });
    });

   Add this block AFTER it:
    app.post('/webhook/blog-post-outline', (req, res) => {
      blogPostCreation.handleOutline(req, res).catch((err) => {
        res.status(500).json({ error: String(err), stack: err && err.stack ? err.stack.slice(0, 800) : '' });
      });
    });

    app.post('/webhook/blog-post-content', (req, res) => {
      blogPostCreation.handleContent(req, res).catch((err) => {
        res.status(500).json({ error: String(err), stack: err && err.stack ? err.stack.slice(0, 800) : '' });
      });
    });

---

STEP 4: Edit on-page-app.html (4 separate edits)
------------------------------------------------
File: F:\Opencode Projects\On page SEO\on-page-app.html

EDIT 4a — Add sidebar nav item:

Find:
    <div class="nav-label">Creation</div>
    <a class="nav-item" data-tool="content-optimizer">
      <span class="icon">&#128221;</span>
      Service Page Creation
    </a>

Replace with:
    <div class="nav-label">Creation</div>
    <a class="nav-item" data-tool="blog-post">
      <span class="icon">&#128221;</span>
      Blog Post Creation
    </a>
    <a class="nav-item" data-tool="content-optimizer">
      <span class="icon">&#128221;</span>
      Service Page Creation
    </a>

EDIT 4b — Add tool panel HTML:

Find:
    </div><!-- /.tool-panel content-optimizer -->

    <div class="tool-panel" data-panel="salience">

Replace with:
    </div><!-- /.tool-panel content-optimizer -->

   <div class="tool-panel" data-panel="blog-post">
    <h1>Blog Post Creation</h1>
    <p class="page-sub">Turn a topic + voice guidance + supporting evidence into a ranking-ready blog-post outline, then expand it into final content optimized for Google and AI search.</p>

    <div class="card">
      <div class="field-label">n8n Webhook URLs</div>
      <div class="field">
        <label>Outline Webhook <small>(POST /blog-post-outline)</small></label>
        <input type="url" id="bp-outline-webhook" placeholder="https://your-n8n.example/webhook/blog-post-outline" autocomplete="off" />
      </div>
      <div class="field">
        <label>Content Webhook <small>(POST /blog-post-content)</small></label>
        <input type="url" id="bp-content-webhook" placeholder="https://your-n8n.example/webhook/blog-post-content" autocomplete="off" />
      </div>
      <div class="button-row">
        <button class="secondary save-webhook-btn" id="bp-save-btn" data-save-multi="bp-outline-webhook:bp_outline_webhook,bp-content-webhook:bp_content_webhook">Save webhooks</button>
        <button class="secondary" id="bp-test-btn">Test both webhooks</button>
        <span class="pill" id="bp-test-status"><span class="dot"></span> not tested</span>
      </div>
    </div>

    <div class="card">
      <div class="co-step-head">
        <span class="co-step-num">1</span>
        <h2 class="co-step-title">Step 1 &middot; Inputs</h2>
      </div>

      <div class="co-grid-2">
        <div>
          <div class="field-label">Content inputs</div>

          <div class="field">
            <label>Topic</label>
            <input type="text" id="bp-topic" placeholder="e.g. How AI Is Changing Content Marketing in 2026" />
          </div>

          <div class="field">
            <label>Voice <small>(tone, style, perspective &mdash; who&rsquo;s writing and how they sound)</small></label>
            <textarea id="bp-voice" rows="3" placeholder="e.g. Conversational but authoritative, first-person, suitable for a SaaS founder audience. Avoid jargon, use short paragraphs."></textarea>
          </div>

          <div class="field">
            <label>Anecdotes <small>(personal stories, examples, case studies to include)</small></label>
            <textarea id="bp-anecdotes" rows="3" placeholder="e.g. When we first launched our AI content tool, we saw a 40% drop in bounce rate within 2 weeks..."></textarea>
          </div>

          <div class="field">
            <label>Opinions <small>(unique takes, contrarian views, hot takes to stand out)</small></label>
            <textarea id="bp-opinions" rows="3" placeholder="e.g. Most &rsquo;AI content tools&rsquo; are just GPT wrappers &mdash; the real value is in the editing workflow, not the generation."></textarea>
          </div>

          <div class="field">
            <label class="bp-stats-check">
              <input type="checkbox" id="bp-stats-enabled" />
              <span>Statistics <small>(scrape Exa + Firecrawl + Gemini for stats, studies, and data points related to this topic)</small></span>
            </label>
          </div>

          <div class="field">
            <label>
              Search intent insights
              <small>(auto-filled when you click &ldquo;Send to Blog Post Creation&rdquo; in Search Intent &mdash; or paste / edit by hand)</small>
            </label>
            <textarea id="bp-intent-text" rows="4" placeholder="Primary intent: ...&#10;Sub-intents:&#10;- ... (X%)&#10;Recommended page archetype: ..."></textarea>
          </div>

          <div class="field">
            <label>
              Salience insights
              <small>(paste a summary from the Salience Brief tab &mdash; must-cover entities, H2 candidates, etc.)</small>
            </label>
            <textarea id="bp-salience-text" rows="4" placeholder="Must-cover entities: ...&#10;Supporting topics: ...&#10;H2 candidates: ...&#10;Target word count: ..."></textarea>
          </div>

          <div class="field">
            <label>
              Audience research
              <small>(auto-filled when you click &ldquo;Send to Blog Post Creation&rdquo; in Research Questions &mdash; problem clusters and FAQ candidates)</small>
            </label>
            <textarea id="bp-audience-text" rows="4" placeholder="Audience summary: ...&#10;&#10;Problem clusters:&#10;1. ... (X%)&#10;   Content angle: ...&#10;   Representative questions:&#10;   - ...&#10;&#10;People Also Ask:&#10;- ..."></textarea>
          </div>
        </div>

        <div>
          <div class="field-label">Keywords</div>
          <div class="field">
            <label>Focus Keyword</label>
            <input type="text" id="bp-focus-keyword" placeholder="e.g. AI content marketing trends" />
          </div>
          <div class="field">
            <label>Header Keywords <small>(one per line, or comma-separated)</small></label>
            <textarea id="bp-header-keywords" rows="3" placeholder="AI-generated content&#10;content marketing strategy 2026&#10;SEO and AI"></textarea>
          </div>
          <div class="field">
            <label>Entities <small>(one per line, or comma-separated)</small></label>
            <textarea id="bp-entities" rows="3" placeholder="ChatGPT&#10;Gemini&#10;Claude&#10;Perplexity"></textarea>
          </div>
          <div class="field">
            <label>Common Keywords <small>(one per line, or comma-separated)</small></label>
            <textarea id="bp-common-keywords" rows="3" placeholder="content automation&#10;AI writing tools&#10;content personalization"></textarea>
          </div>
          <div class="field">
            <label>Extra Keywords <small>(one per line, or comma-separated, optional)</small></label>
            <textarea id="bp-extra-keywords" rows="3" placeholder="NLP content optimization&#10;LLM-based search&#10;AI SERP features"></textarea>
          </div>
        </div>
      </div>

      <div class="button-row" style="margin-top: 10px">
        <button id="bp-generate-outline-btn">Generate Outline</button>
        <span class="helper" id="bp-outline-helper">Typically 15&ndash;40s. Statistics scraping adds ~15&ndash;30s.</span>
      </div>
    </div>

    <div id="bp-outline-container"></div>
    <div id="bp-content-container"></div>

   </div><!-- /.tool-panel blog-post -->

    <div class="tool-panel" data-panel="salience">

EDIT 4c — Add JS logic:

Find:
    })();


    // ============================================================================
    // Search Intent Finder
    // ============================================================================

Replace with:
    })();

    // ============================================================================
    // Blog Post Creation
    // ============================================================================
    (() => {
      const $ = (id) => document.getElementById(id);

      const KEY_OUT_WH = 'bp_outline_webhook';
      const KEY_CON_WH = 'bp_content_webhook';
      const KEY_TOPIC = 'bp_topic';
      const KEY_VOICE = 'bp_voice';
      const KEY_ANECDOTES = 'bp_anecdotes';
      const KEY_OPINIONS = 'bp_opinions';
      const KEY_STATS = 'bp_stats_enabled';
      const KEY_FK = 'bp_focus_keyword';
      const KEY_HK = 'bp_header_keywords';
      const KEY_EN = 'bp_entities';
      const KEY_CK = 'bp_common_keywords';
      const KEY_XK = 'bp_extra_keywords';

      const outlineWh = $('bp-outline-webhook');
      const contentWh = $('bp-content-webhook');
      const topicInput = $('bp-topic');
      const voiceInput = $('bp-voice');
      const anecdotesInput = $('bp-anecdotes');
      const opinionsInput = $('bp-opinions');
      const statsCheckbox = $('bp-stats-enabled');
      const fkInput = $('bp-focus-keyword');
      const hkInput = $('bp-header-keywords');
      const enInput = $('bp-entities');
      const ckInput = $('bp-common-keywords');
      const xkInput = $('bp-extra-keywords');
      const generateOutlineBtn = $('bp-generate-outline-btn');
      const outlineContainer = $('bp-outline-container');
      const contentContainer = $('bp-content-container');
      const testBtn = $('bp-test-btn');
      const testStatus = $('bp-test-status');

      const restore = (input, key) => {
        const v = localStorage.getItem(key);
        if (v) input.value = v;
        input.addEventListener('input', () => localStorage.setItem(key, input.value));
      };
      const restoreBool = (checkbox, key) => {
        const v = localStorage.getItem(key);
        if (v === 'true') checkbox.checked = true;
        checkbox.addEventListener('change', () => localStorage.setItem(key, String(checkbox.checked)));
      };
      restore(outlineWh, KEY_OUT_WH);
      restore(contentWh, KEY_CON_WH);
      restore(topicInput, KEY_TOPIC);
      restore(voiceInput, KEY_VOICE);
      restore(anecdotesInput, KEY_ANECDOTES);
      restore(opinionsInput, KEY_OPINIONS);
      restoreBool(statsCheckbox, KEY_STATS);
      restore(fkInput, KEY_FK);
      restore(hkInput, KEY_HK);
      restore(enInput, KEY_EN);
      restore(ckInput, KEY_CK);
      restore(xkInput, KEY_XK);

      const intentTextEl   = $('bp-intent-text');
      const salienceTextEl = $('bp-salience-text');
      const audienceTextEl = $('bp-audience-text');

      function persistField(el, key) {
        const v = localStorage.getItem(key);
        if (v) el.value = v;
        el.addEventListener('input', () => localStorage.setItem(key, el.value));
      }
      persistField(intentTextEl, 'bp_intent_text');
      persistField(salienceTextEl, 'bp_salience_text');
      persistField(audienceTextEl, 'bp_audience_text');

      window.addEventListener('bp:intent-context-updated', () => {
        const fresh = localStorage.getItem('bp_intent_text');
        if (fresh) intentTextEl.value = fresh;
      });
      window.addEventListener('bp:salience-context-updated', () => {
        const fresh = localStorage.getItem('bp_salience_text');
        if (fresh) salienceTextEl.value = fresh;
      });
      window.addEventListener('bp:audience-context-updated', () => {
        const fresh = localStorage.getItem('bp_audience_text');
        if (fresh) audienceTextEl.value = fresh;
      });

      function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      }

      async function copyText(text) {
        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
          }
        } catch (e) {}
        try {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          const ok = document.execCommand('copy');
          document.body.removeChild(ta);
          return ok;
        } catch (e) { return false; }
      }

      function flashCopied(btn) {
        const original = btn.textContent;
        btn.classList.add('copied');
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.classList.remove('copied'); btn.textContent = original; }, 1200);
      }

      function setTestStatus(kind, label) {
        testStatus.className = 'pill ' + (kind === 'ok' ? 'ok' : kind === 'fail' ? 'fail' : kind === 'loading' ? 'loading' : '');
        testStatus.innerHTML = '<span class="dot"></span> ' + escapeHtml(label);
      }

      function normalizeKeywordList(raw) {
        return (raw || '').split(/[\n,]+/).map(s => s.trim()).filter(Boolean).join(', ');
      }

      function getKeywordsPayload() {
        return {
          focus_keyword: fkInput.value.trim(),
          header_keywords: normalizeKeywordList(hkInput.value),
          entities: normalizeKeywordList(enInput.value),
          common_keywords: normalizeKeywordList(ckInput.value),
          extra_keywords: normalizeKeywordList(xkInput.value)
        };
      }

      function validUrl(u) { try { new URL(u); return true; } catch { return false; } }

      testBtn.addEventListener('click', async () => {
        const o = (outlineWh.value || '').trim();
        const c = (contentWh.value || '').trim();
        if (!o || !c) { setTestStatus('fail', 'enter both URLs'); return; }
        if (!validUrl(o) || !validUrl(c)) { setTestStatus('fail', 'invalid URL'); return; }
        setTestStatus('loading', 'testing...');
        try {
          const opts = { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ test: true, ping: 'bp-test' }) };
          const [r1, r2] = await Promise.all([fetch(o, opts), fetch(c, opts)]);
          if (r1.ok && r2.ok) setTestStatus('ok', 'both reachable');
          else setTestStatus('fail', 'HTTP ' + r1.status + ' / ' + r2.status);
        } catch (e) {
          setTestStatus('fail', e.message || 'unreachable');
        }
      });

      generateOutlineBtn.addEventListener('click', async () => {
        try {
          const url = (outlineWh.value || '').trim();
          if (!url) throw new Error('Enter the Outline Webhook URL first.');
          if (!validUrl(url)) throw new Error('Outline Webhook URL is invalid.');

          const kw = getKeywordsPayload();
          const topic = topicInput.value.trim();
          if (!topic && !kw.focus_keyword) throw new Error('Topic or Focus Keyword is required.');

          const body = {
            ...kw, topic,
            voice: voiceInput.value.trim(),
            anecdotes: anecdotesInput.value.trim(),
            opinions: opinionsInput.value.trim(),
            stats_enabled: statsCheckbox.checked,
          };
          const intentText = (intentTextEl.value || '').trim();
          const salienceText = (salienceTextEl.value || '').trim();
          const audienceText = (audienceTextEl.value || '').trim();
          if (intentText) body.intent_context_text = intentText;
          if (salienceText) body.salience_context_text = salienceText;
          if (audienceText) body.audience_context_text = audienceText;

          generateOutlineBtn.disabled = true;
          const label = statsCheckbox.checked ? 'Scraping stats + generating outline...' : 'Generating outline...';
          outlineContainer.innerHTML = '<div class="card loading-card"><div class="spinner"></div><div>' + label + '</div></div>';
          contentContainer.innerHTML = '';

          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          const raw = await res.text();
          let payload;
          try { payload = JSON.parse(raw); }
          catch { showOutlineError('Webhook did not return JSON (HTTP ' + res.status + ').', raw); return; }

          if (!res.ok || payload.error) {
            showOutlineError(payload.error || 'HTTP ' + res.status, payload.detail || payload.raw_text || JSON.stringify(payload, null, 2));
            return;
          }

          renderOutline(payload);
        } catch (e) {
          showOutlineError(e.message || 'Unknown error', e.stack || '');
        } finally {
          generateOutlineBtn.disabled = false;
        }
      });

      function showOutlineError(msg, detail) {
        outlineContainer.innerHTML = '<div class="error"><strong>Error:</strong> ' + escapeHtml(msg) + (detail ? '<pre style="margin-top:10px;max-height:260px">' + escapeHtml(detail) + '</pre>' : '') + '</div>';
      }

      function renderOutline(payload) {
        const outlineMd = payload.outline || '';
        const meta = [];
        if (payload.model) meta.push('model: ' + payload.model);
        if (payload.generated_at) meta.push(new Date(payload.generated_at).toLocaleString());
        if (payload.stats) {
          if (payload.stats.source_count > 0) meta.push('stats: ' + payload.stats.source_count + ' sources scraped');
          if (payload.stats.error) meta.push('stats warning: ' + payload.stats.error);
        }

        outlineContainer.innerHTML = '<div class="card"><div class="co-output-head"><div><h3 class="co-output-title">Step 2 &middot; Outline</h3><div class="co-output-meta">' + escapeHtml(meta.join(' \u00B7 ')) + '</div></div><div class="co-output-actions"><button class="copy-btn" id="bp-outline-copy">Copy</button><button class="copy-btn" id="bp-outline-download" title="Download as .md">Download</button></div></div><textarea id="bp-outline-editor" class="co-textarea outline" spellcheck="false">' + escapeHtml(outlineMd) + '</textarea><p class="helper">Edit freely &mdash; whatever you submit below is what the content generator will expand.</p><div class="button-row"><button id="bp-generate-content-btn">Step 3 &middot; Generate Content</button><span class="helper">Typically 30&ndash;90s depending on outline length and model.</span></div>' + (payload.stats && payload.stats.stats_block ? '<details class="raw-toggle" style="margin-top: 14px"><summary>Stats scraped (' + payload.stats.source_count + ' sources)</summary><pre style="background:#f8fafc;color:var(--text);border:1px solid var(--border)">' + escapeHtml(payload.stats.stats_block) + '</pre></details>' : '') + '</div>';

        const editor = $('bp-outline-editor');
        $('bp-outline-copy').addEventListener('click', async (e) => {
          const ok = await copyText(editor.value);
          if (ok) flashCopied(e.currentTarget);
        });
        $('bp-outline-download').addEventListener('click', () => {
          const blob = new Blob([editor.value], { type: 'text/markdown' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'blog-outline-' + ((getKeywordsPayload().focus_keyword || topicInput.value || 'blog-post').replace(/[^a-z0-9]+/gi,'-')) + '.md';
          document.body.appendChild(a);
          a.click();
          setTimeout(() => { URL.revokeObjectURL(a.href); document.body.removeChild(a); }, 100);
        });

        $('bp-generate-content-btn').addEventListener('click', () => generateContent(editor.value));
        outlineContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      async function generateContent(editedOutline) {
        try {
          const url = (contentWh.value || '').trim();
          if (!url) throw new Error('Enter the Content Webhook URL first.');
          if (!validUrl(url)) throw new Error('Content Webhook URL is invalid.');
          if (!editedOutline.trim()) throw new Error('Outline is empty.');

          const body = { ...getKeywordsPayload(), edited_outline: editedOutline };
          const intentText = (intentTextEl.value || '').trim();
          const salienceText = (salienceTextEl.value || '').trim();
          const audienceText = (audienceTextEl.value || '').trim();
          if (intentText) body.intent_context_text = intentText;
          if (salienceText) body.salience_context_text = salienceText;
          if (audienceText) body.audience_context_text = audienceText;
          const btn = $('bp-generate-content-btn');
          btn.disabled = true;
          contentContainer.innerHTML = '<div class="card loading-card"><div class="spinner"></div><div>Expanding outline into final blog content...</div></div>';

          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          const raw = await res.text();
          let payload;
          try { payload = JSON.parse(raw); }
          catch { showContentError('Webhook did not return JSON (HTTP ' + res.status + ').', raw); return; }

          if (!res.ok || payload.error) {
            showContentError(payload.error || 'HTTP ' + res.status, payload.detail || JSON.stringify(payload, null, 2));
            return;
          }

          renderContent(payload);
          btn.disabled = false;
        } catch (e) {
          showContentError(e.message || 'Unknown error', e.stack || '');
          const btn = $('bp-generate-content-btn');
          if (btn) btn.disabled = false;
        }
      }

      function showContentError(msg, detail) {
        contentContainer.innerHTML = '<div class="error"><strong>Error:</strong> ' + escapeHtml(msg) + (detail ? '<pre style="margin-top:10px;max-height:260px">' + escapeHtml(detail) + '</pre>' : '') + '</div>';
      }

      function renderContent(payload) {
        const md = payload.content || '';
        const stats = payload.stats || {};
        const meta = [];
        if (payload.model) meta.push('model: ' + payload.model);
        if (stats.word_count != null) meta.push(stats.word_count + ' words');
        if (stats.h2 != null) meta.push((stats.h1 || 0) + ' H1 \u00B7 ' + (stats.h2 || 0) + ' H2 \u00B7 ' + (stats.h3 || 0) + ' H3');
        if (payload.generated_at) meta.push(new Date(payload.generated_at).toLocaleString());

        contentContainer.innerHTML = '<div class="card"><div class="co-output-head"><div><h3 class="co-output-title">Step 3 &middot; Final Content</h3><div class="co-output-meta">' + escapeHtml(meta.join(' \u00B7 ')) + '</div></div><div class="co-output-actions"><button class="copy-btn" id="bp-content-copy-md">Copy MD</button><button class="copy-btn" id="bp-content-copy-text">Copy plain</button><button class="copy-btn" id="bp-content-download">Download</button></div></div><textarea id="bp-content-editor" class="co-textarea outline" spellcheck="false">' + escapeHtml(md) + '</textarea></div>';

        const editor = $('bp-content-editor');
        $('bp-content-copy-md').addEventListener('click', async (e) => {
          const ok = await copyText(editor.value);
          if (ok) flashCopied(e.currentTarget);
        });
        $('bp-content-copy-text').addEventListener('click', async (e) => {
          const stripped = editor.value.replace(/^#{1,6}\s+/gm, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
          const ok = await copyText(stripped);
          if (ok) flashCopied(e.currentTarget);
        });
        $('bp-content-download').addEventListener('click', () => {
          const blob = new Blob([editor.value], { type: 'text/markdown' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'blog-content-' + ((getKeywordsPayload().focus_keyword || 'blog-post').replace(/[^a-z0-9]+/gi,'-')) + '.md';
          document.body.appendChild(a);
          a.click();
          setTimeout(() => { URL.revokeObjectURL(a.href); document.body.removeChild(a); }, 100);
        });

        contentContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    })();


    // ============================================================================
    // Search Intent Finder
    // ============================================================================

EDIT 4d — Add "Send to Blog Post Creation" cross-tool buttons:

Search Intent — find the si-actions div with .si-send-co button:
    '<button class="secondary si-send-co" data-kw="' + escapeAttr(r.keyword || '') + '">Send to Service Page Creation &rarr;</button>' +
  Add this line AFTER it:
    '<button class="secondary si-send-bp" data-kw="' + escapeAttr(r.keyword || '') + '">Send to Blog Post Creation &rarr;</button>' +

Search Intent — find the resultBox click handler:
    resultBox.addEventListener('click', (e) => {
      const btn = e.target.closest('.si-send-co');
      if (!btn) return;
  Replace with:
    resultBox.addEventListener('click', (e) => {
      const btnCo = e.target.closest('.si-send-co');
      const btnBp = e.target.closest('.si-send-bp');
      if (!btnCo && !btnBp) return;
      const kw = (btnCo || btnBp).getAttribute('data-kw') || '';
      const isBlog = !!btnBp;

  (Keep the rest of the handler, but replace the localStorage key and nav references with conditionals based on isBlog)

Research Questions — find the #qr-send-co button:
    '<button id="qr-send-co">Send to Service Page Creation &rarr;</button>' +
  Add this line AFTER it:
    '<button id="qr-send-bp">Send to Blog Post Creation &rarr;</button>' +

Research Questions — find the resultBox click handler for #qr-send-co. Inside, add similar conditional logic (see the full JS in the blog-post-seo directory for the complete handler).

Salience Brief — find the .sb-send-cc button:
    '<button class="secondary sb-send-cc" data-kw="' + escapeAttr(keyword) + '">Send to Service Page Creation &rarr;</button>' +
  Add this line AFTER it:
    '<button class="secondary sb-send-bp" data-kw="' + escapeAttr(keyword) + '">Send to Blog Post Creation &rarr;</button>' +

Salience Brief — find the resultBox click handler for .sb-send-cc. Add similar conditional logic.

---

For the complete, exact code for edit 4d, see the full HTML changes in:
  C:\Users\Abhishek Bolar\AppData\Local\Temp\opencode\blog-post-seo\html-changes.txt
