/**
 * @NApiVersion 2.1
 * Shared rendering logic for the public Support Page. Has no @NScriptType,
 * so it's a plain library that any script type can safely require.
 *
 * Keeps all HTML generation out of the Suitelet entry point so the page
 * markup can be unit-tested and reused. NEVER read sensitive records here —
 * everything this library produces is world-readable to anyone with the URL.
 */
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.escapeHtml = escapeHtml;
    exports.renderRecentTicketsCard = renderRecentTicketsCard;
    exports.renderPage = renderPage;
    exports.renderTicketsPage = renderTicketsPage;
    const MSG_MAX = 2000;
    const SHARED_STYLES = [
        "    :root {",
        "      --brand: #4f46e5; --brand-2: #7c3aed; --brand-hover: #4338ca; --brand-ring: rgba(79,70,229,.18);",
        "      --bg: #f7f8fb; --bg-2: #eef0f6; --ink: #0f172a; --ink-2: #334155;",
        "      --card: #ffffff; --card-border: #e6e8ef;",
        "      --shadow-sm: 0 1px 2px rgba(15,23,42,.04);",
        "      --shadow: 0 1px 2px rgba(15,23,42,.04), 0 8px 24px -8px rgba(15,23,42,.10);",
        "      --shadow-hover: 0 1px 2px rgba(15,23,42,.05), 0 14px 32px -10px rgba(15,23,42,.14);",
        "      --border: #d8dbe5; --input-bg: #fff; --input-focus-bg: #fff;",
        "      --muted: #64748b; --line: #eef0f5; --code-bg: #f1f4fa; --th: #475569;",
        "      --banner-success-bg: #ecfdf5; --banner-success-border: #a7f3d0; --banner-success-color: #047857;",
        "      --badge-open-bg: #eef2ff; --badge-open-color: #4338ca;",
        "      --neutral-btn: #475569; --neutral-btn-hover: #334155;",
        "      --header-grad-from: #4f46e5; --header-grad-via: #6d28d9; --header-grad-to: #7c3aed;",
        "      --header-pattern: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='1' cy='1' r='1' fill='%23ffffff' fill-opacity='0.08'/%3E%3C/svg%3E\");",
        "    }",
        "    [data-theme=\"dark\"] {",
        "      --brand: #818cf8; --brand-2: #a78bfa; --brand-hover: #a5b4fc; --brand-ring: rgba(129,140,248,.25);",
        "      --bg: #0b0e1a; --bg-2: #111527; --ink: #e2e8f0; --ink-2: #cbd5e1;",
        "      --card: #141a2c; --card-border: #232a44;",
        "      --shadow-sm: 0 1px 2px rgba(0,0,0,.35);",
        "      --shadow: 0 1px 2px rgba(0,0,0,.35), 0 12px 32px -8px rgba(0,0,0,.55);",
        "      --shadow-hover: 0 1px 2px rgba(0,0,0,.4), 0 18px 42px -10px rgba(0,0,0,.7);",
        "      --border: #2a3251; --input-bg: #0f1426; --input-focus-bg: #131a30;",
        "      --muted: #94a3b8; --line: #1f263e; --code-bg: #1c2340; --th: #cbd5e1;",
        "      --banner-success-bg: #0e2a1f; --banner-success-border: #1f5a3c; --banner-success-color: #86efac;",
        "      --badge-open-bg: #1e2547; --badge-open-color: #c7d2fe;",
        "      --neutral-btn: #475569; --neutral-btn-hover: #64748b;",
        "      --header-grad-from: #312e81; --header-grad-via: #4c1d95; --header-grad-to: #6d28d9;",
        "      --header-pattern: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='1' cy='1' r='1' fill='%23ffffff' fill-opacity='0.07'/%3E%3C/svg%3E\");",
        "    }",
        "    * { box-sizing: border-box; }",
        "    html, body { height: 100%; }",
        "    body { margin: 0; min-height: 100%;",
        "           font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;",
        "           -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;",
        "           font-feature-settings: 'cv11', 'ss01', 'ss03';",
        "           background: var(--bg); color: var(--ink);",
        "           display: flex; flex-direction: column; }",
        "    header { position: relative; overflow: hidden; color: #fff;",
        "             padding: 56px 20px 64px; text-align: center;",
        "             background: linear-gradient(135deg, var(--header-grad-from) 0%, var(--header-grad-via) 55%, var(--header-grad-to) 100%); }",
        "    header::before { content: ''; position: absolute; inset: 0;",
        "             background-image: var(--header-pattern);",
        "             background-size: 32px 32px; pointer-events: none; opacity: .9; }",
        "    header::after { content: ''; position: absolute; inset: auto 0 0 0; height: 1px;",
        "             background: linear-gradient(90deg, transparent, rgba(255,255,255,.25), transparent); }",
        "    header > * { position: relative; z-index: 1; }",
        "    header h1 { margin: 0 0 10px; font-size: 36px; font-weight: 700;",
        "                letter-spacing: -0.025em; line-height: 1.15; }",
        "    header p { margin: 0 auto; max-width: 560px; font-size: 16px;",
        "               line-height: 1.55; opacity: .85; font-weight: 400; }",
        "    .theme-toggle { position: absolute; top: 18px; right: 20px; z-index: 2;",
        "             background: rgba(255,255,255,.12); color: #fff;",
        "             border: 1px solid rgba(255,255,255,.18);",
        "             border-radius: 999px; width: 38px; height: 38px; padding: 0;",
        "             font-size: 17px; line-height: 1; cursor: pointer; margin: 0;",
        "             backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);",
        "             transition: background .15s ease, transform .15s ease, border-color .15s ease; }",
        "    .theme-toggle:hover { background: rgba(255,255,255,.22); border-color: rgba(255,255,255,.32); }",
        "    .theme-toggle:active { transform: scale(.95); }",
        "    main { width: 100%; max-width: 760px; margin: -28px auto 56px;",
        "           padding: 0 20px; flex: 1; position: relative; z-index: 1; }",
        "    .card { background: var(--card); border: 1px solid var(--card-border);",
        "            border-radius: 14px; padding: 28px; margin-top: 20px;",
        "            box-shadow: var(--shadow);",
        "            transition: box-shadow .2s ease, border-color .2s ease, transform .2s ease; }",
        "    .card:hover { box-shadow: var(--shadow-hover); border-color: var(--border); }",
        "    h2 { font-size: 18px; margin: 0 0 4px; font-weight: 600;",
        "         letter-spacing: -0.01em; color: var(--ink); }",
        "    .card > h2 + form, .card > h2 + table { margin-top: 18px; }",
        "    label { display: block; font-weight: 500; font-size: 13px;",
        "            color: var(--ink-2); margin: 18px 0 6px; letter-spacing: .005em; }",
        "    input, textarea, select { width: 100%; padding: 11px 13px;",
        "            border: 1px solid var(--border); border-radius: 9px;",
        "            font-size: 14px; font-family: inherit; color: var(--ink);",
        "            background-color: var(--input-bg); line-height: 1.4;",
        "            transition: border-color .15s ease, box-shadow .15s ease, background-color .15s ease; }",
        "    input::placeholder, textarea::placeholder { color: var(--muted); opacity: .75; }",
        "    input:hover, textarea:hover, select:hover { border-color: #b8bdca; }",
        "    [data-theme=\"dark\"] input:hover, [data-theme=\"dark\"] textarea:hover, [data-theme=\"dark\"] select:hover { border-color: #3a4365; }",
        "    input:focus, textarea:focus, select:focus { outline: none;",
        "            border-color: var(--brand); background-color: var(--input-focus-bg);",
        "            box-shadow: 0 0 0 4px var(--brand-ring); }",
        "    textarea { min-height: 132px; resize: vertical; }",
        "    select { -webkit-appearance: none; -moz-appearance: none; appearance: none;",
        "             padding-right: 40px; cursor: pointer;",
        "             background-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='none' stroke='%2364748b' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round' d='M1 1.5 6 6.5 11 1.5'/%3E%3C/svg%3E\");",
        "             background-repeat: no-repeat; background-position: right 14px center; }",
        "    [data-theme=\"dark\"] select { background-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='none' stroke='%2394a3b8' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round' d='M1 1.5 6 6.5 11 1.5'/%3E%3C/svg%3E\"); }",
        "    .char-counter { text-align: right; font-size: 12px; color: var(--muted);",
        "                    margin-top: 6px; font-variant-numeric: tabular-nums; letter-spacing: .01em; }",
        "    .char-counter.near { color: #b45309; }",
        "    .char-counter.over { color: #b91c1c; font-weight: 600; }",
        "    button { margin-top: 22px;",
        "             background-image: linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%);",
        "             background-color: var(--brand); color: #fff; border: 0;",
        "             padding: 11px 20px; border-radius: 9px; font-size: 14px;",
        "             font-weight: 600; font-family: inherit; cursor: pointer;",
        "             letter-spacing: .005em;",
        "             box-shadow: 0 1px 2px rgba(15,23,42,.08), inset 0 1px 0 rgba(255,255,255,.12);",
        "             transition: transform .12s ease, box-shadow .15s ease, filter .15s ease; }",
        "    button:hover { filter: brightness(1.05);",
        "                   box-shadow: 0 4px 14px -2px var(--brand-ring), inset 0 1px 0 rgba(255,255,255,.18); }",
        "    button:active { transform: translateY(1px); }",
        "    button:focus-visible { outline: none; box-shadow: 0 0 0 4px var(--brand-ring); }",
        "    .form-actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }",
        "    .btn-secondary { background-image: none; background-color: transparent;",
        "             color: var(--ink-2); border: 1px solid var(--border);",
        "             box-shadow: var(--shadow-sm); font-weight: 500; }",
        "    .btn-secondary:hover { background-color: var(--bg-2); color: var(--ink);",
        "             border-color: #b8bdca; filter: none; }",
        "    [data-theme=\"dark\"] .btn-secondary:hover { border-color: #3a4365; background-color: var(--input-bg); }",
        "    .urgency-group { display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap; }",
        "    .urgency-group label { margin: 0; font-weight: 500; font-size: 13px;",
        "             display: inline-flex; align-items: center; gap: 6px; cursor: pointer;",
        "             padding: 8px 12px; border: 1px solid var(--border); border-radius: 8px;",
        "             background: var(--input-bg); color: var(--ink-2);",
        "             transition: border-color .15s ease, background-color .15s ease, color .15s ease; }",
        "    .urgency-group label:hover { border-color: var(--brand); color: var(--ink); }",
        "    .urgency-group input[type=radio] { width: auto; margin: 0;",
        "             accent-color: var(--brand); }",
        "    .urgency-group input[type=radio]:focus { box-shadow: none; }",
        "    .banner { border-radius: 12px; padding: 16px 18px; margin-top: 4px;",
        "              border: 1px solid var(--card-border); box-shadow: var(--shadow);",
        "              line-height: 1.55; }",
        "    .banner.success { background: var(--banner-success-bg);",
        "              border-color: var(--banner-success-border); color: var(--banner-success-color); }",
        "    .banner.success strong { color: var(--banner-success-color); }",
        "    .btn-again { display: inline-block; color: #fff; text-decoration: none;",
        "                 background-image: linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%);",
        "                 background-color: var(--brand);",
        "                 padding: 10px 18px; border-radius: 9px; font-size: 13px; font-weight: 600;",
        "                 box-shadow: 0 1px 2px rgba(15,23,42,.08), inset 0 1px 0 rgba(255,255,255,.12);",
        "                 transition: filter .15s ease, box-shadow .15s ease, transform .12s ease; }",
        "    .btn-again:hover { filter: brightness(1.05);",
        "                       box-shadow: 0 4px 14px -2px var(--brand-ring), inset 0 1px 0 rgba(255,255,255,.18); }",
        "    .btn-again:active { transform: translateY(1px); }",
        "    .btn-again.neutral { background-image: none; background-color: var(--neutral-btn); }",
        "    .btn-again.neutral:hover { background-color: var(--neutral-btn-hover); filter: none; }",
        "    a.link { color: var(--brand); text-decoration: none; font-weight: 500;",
        "             border-bottom: 1px solid transparent; transition: border-color .15s ease, color .15s ease; }",
        "    a.link:hover { color: var(--brand-hover); border-bottom-color: currentColor; }",
        "    code { background: var(--code-bg); padding: 2px 6px; border-radius: 5px;",
        "           font-size: 12.5px; font-family: ui-monospace, 'SF Mono', 'Cascadia Mono', Menlo, Consolas, monospace;",
        "           color: var(--ink); }",
        "    table { width: 100%; border-collapse: collapse; font-size: 14px; }",
        "    thead th { font-size: 11px; font-weight: 600; letter-spacing: .06em;",
        "               text-transform: uppercase; color: var(--th);",
        "               text-align: left; padding: 12px 14px;",
        "               border-bottom: 1px solid var(--line); background: transparent; }",
        "    tbody td { padding: 14px; border-bottom: 1px solid var(--line);",
        "               vertical-align: top; word-break: break-word; color: var(--ink-2); }",
        "    tbody tr { transition: background-color .12s ease; }",
        "    tbody tr:hover td { background-color: var(--bg-2); color: var(--ink); }",
        "    [data-theme=\"dark\"] tbody tr:hover td { background-color: rgba(255,255,255,.025); }",
        "    tbody tr:last-child td { border-bottom: none; }",
        "    tbody td:first-child { color: var(--ink); font-weight: 500; }",
        "    .badge { display: inline-block; padding: 3px 9px; border-radius: 999px;",
        "             font-size: 11px; font-weight: 600; letter-spacing: .03em;",
        "             text-transform: uppercase; }",
        "    .badge-open { background: var(--badge-open-bg); color: var(--badge-open-color); }",
        "    .empty { color: var(--muted); text-align: center; padding: 40px 0;",
        "             font-size: 14px; }",
        "    footer { position: relative; text-align: center; color: var(--muted);",
        "             font-size: 12px; padding: 24px 20px 28px; margin-top: 16px;",
        "             border-top: 1px solid var(--line); letter-spacing: .01em; }",
        "    footer .brand-dot { display: inline-block; width: 6px; height: 6px;",
        "             border-radius: 999px; vertical-align: middle; margin: 0 8px 2px;",
        "             background-image: linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%); }",
        "    @media (max-width: 600px) {",
        "      header { padding: 44px 18px 56px; }",
        "      header h1 { font-size: 28px; }",
        "      header p { font-size: 15px; }",
        "      .card { padding: 22px; border-radius: 12px; }",
        "      main { margin-top: -24px; }",
        "    }",
        "    /* Animations */",
        "    @keyframes card-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }",
        "    @keyframes field-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }",
        "    @keyframes banner-in { from { opacity: 0; transform: translateY(-12px); max-height: 0; } to { opacity: 1; transform: translateY(0); max-height: 400px; } }",
        "    @keyframes pulse-pop { 0% { transform: scale(1); } 40% { transform: scale(1.18); } 100% { transform: scale(1); } }",
        "    .card { animation: card-in .5s cubic-bezier(.22,.61,.36,1) both; }",
        "    .card + .card { animation-delay: .12s; }",
        "    form .field-row { animation: field-in .45s cubic-bezier(.22,.61,.36,1) both; opacity: 0; }",
        "    form .field-row:nth-of-type(1) { animation-delay: .08s; }",
        "    form .field-row:nth-of-type(2) { animation-delay: .16s; }",
        "    form .field-row:nth-of-type(3) { animation-delay: .24s; }",
        "    form .field-row:nth-of-type(4) { animation-delay: .32s; }",
        "    form .field-row:nth-of-type(5) { animation-delay: .40s; }",
        "    form .field-row:nth-of-type(6) { animation-delay: .48s; }",
        "    .banner.success { animation: banner-in .5s cubic-bezier(.22,.61,.36,1) both; overflow: hidden; }",
        "    .urgency-group label.pulse { animation: pulse-pop .35s ease-out; }",
        "    @media (prefers-reduced-motion: reduce) {",
        "      .card, form .field-row, .banner.success, .urgency-group label.pulse { animation: none !important; opacity: 1 !important; transform: none !important; }",
        "      input, textarea, select, button, .btn-again, .theme-toggle, tbody tr, a.link { transition: none !important; }",
        "      button:hover, .btn-again:hover { transform: none !important; }",
        "      .toast { transition: none !important; }",
        "    }",
        "    /* Sonner-style toast */",
        "    .toast { position: fixed; top: 20px; right: 20px; z-index: 9999;",
        "             display: flex; align-items: flex-start; gap: 12px;",
        "             min-width: 280px; max-width: 380px; padding: 14px 14px 14px 16px;",
        "             background: var(--card); color: var(--ink);",
        "             border: 1px solid var(--border); border-radius: 12px;",
        "             box-shadow: var(--shadow); font-size: 14px;",
        "             transform: translateX(120%); opacity: 0;",
        "             transition: transform .35s cubic-bezier(.21,1.02,.73,1), opacity .35s ease; }",
        "    .toast.toast-in { transform: translateX(0); opacity: 1; }",
        "    .toast.toast-out { transform: translateX(120%); opacity: 0; }",
        "    .toast-icon { flex: 0 0 auto; width: 20px; height: 20px; margin-top: 1px;",
        "                  color: #1c6b35; }",
        "    [data-theme=\"dark\"] .toast-icon { color: #6fd28a; }",
        "    .toast-body { flex: 1 1 auto; min-width: 0; }",
        "    .toast-title { font-weight: 600; margin: 0 0 2px; line-height: 1.3; }",
        "    .toast-desc { margin: 0; color: var(--muted); line-height: 1.4; word-break: break-word; }",
        "    .toast-close { flex: 0 0 auto; margin: -4px -4px 0 4px; padding: 0;",
        "                   width: 24px; height: 24px; border: 0; border-radius: 6px;",
        "                   background: transparent; color: var(--muted); cursor: pointer;",
        "                   font-size: 18px; line-height: 1; }",
        "    .toast-close:hover { background: var(--line); color: var(--ink); }"
    ].join("\n");
    // Runs before <body> renders so the page never flashes light when the user
    // has previously chosen dark (or has no preference — dark is the default).
    const THEME_INIT_SCRIPT = [
        "  <script>",
        "    (function () {",
        "      try {",
        "        var saved = localStorage.getItem('support-theme');",
        "        document.documentElement.setAttribute('data-theme', saved || 'dark');",
        "      } catch (e) {",
        "        document.documentElement.setAttribute('data-theme', 'dark');",
        "      }",
        "    })();",
        "  </script>"
    ].join("\n");
    const THEME_TOGGLE_BUTTON = '    <button id="theme-toggle" class="theme-toggle" type="button" aria-label="Toggle dark mode">\u{1F319}</button>';
    const THEME_TOGGLE_SCRIPT = [
        "  <script>",
        "    (function () {",
        "      var btn = document.getElementById('theme-toggle');",
        "      if (!btn) return;",
        "      function refresh() {",
        "        var t = document.documentElement.getAttribute('data-theme') || 'dark';",
        "        btn.textContent = t === 'dark' ? '☀️' : '🌙';",
        "      }",
        "      refresh();",
        "      btn.addEventListener('click', function () {",
        "        var cur = document.documentElement.getAttribute('data-theme') || 'dark';",
        "        var next = cur === 'dark' ? 'light' : 'dark';",
        "        document.documentElement.setAttribute('data-theme', next);",
        "        try { localStorage.setItem('support-theme', next); } catch (e) {}",
        "        refresh();",
        "      });",
        "    })();",
        "  </script>"
    ].join("\n");
    const TOAST_SCRIPT = [
        "  <script>",
        "    (function () {",
        "      var t = document.getElementById('sonner-toast');",
        "      if (!t) return;",
        "      var closeBtn = t.querySelector('.toast-close');",
        "      var dismissTimer = null;",
        "      function dismiss() {",
        "        if (!t.classList.contains('toast-in')) return;",
        "        t.classList.remove('toast-in');",
        "        t.classList.add('toast-out');",
        "        setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 400);",
        "      }",
        "      requestAnimationFrame(function () {",
        "        requestAnimationFrame(function () { t.classList.add('toast-in'); });",
        "      });",
        "      dismissTimer = setTimeout(dismiss, 5000);",
        "      if (closeBtn) closeBtn.addEventListener('click', function () {",
        "        if (dismissTimer) clearTimeout(dismissTimer);",
        "        dismiss();",
        "      });",
        "    })();",
        "  </script>"
    ].join("\n");
    function escapeHtml(value) {
        return String(value !== null && value !== void 0 ? value : "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }
    /**
     * Renders a compact "Recent tickets" card showing the most recent few
     * submissions. Returns an empty string when there are none, so the card
     * never appears before the first ticket is created.
     */
    function renderRecentTicketsCard(tickets, ticketsUrl) {
        if (!tickets || tickets.length === 0)
            return "";
        const rows = tickets.map(t => {
            var _a, _b, _c;
            return [
                "<tr>",
                `  <td><code>${escapeHtml(t.ticketId)}</code></td>`,
                `  <td>${escapeHtml((_a = t.name) !== null && _a !== void 0 ? _a : "—")}</td>`,
                `  <td>${escapeHtml((_b = t.topic) !== null && _b !== void 0 ? _b : "—")}</td>`,
                `  <td>${escapeHtml((_c = t.date) !== null && _c !== void 0 ? _c : "—")}</td>`,
                "</tr>"
            ].join("\n");
        }).join("\n");
        return [
            '    <section class="card">',
            '      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap;">',
            `        <h2>Latest tickets</h2>`,
            `        <a class="link" href="${ticketsUrl}">View all &rarr;</a>`,
            "      </div>",
            "      <table>",
            "        <thead>",
            "          <tr><th>Ticket ID</th><th>Name</th><th>Topic</th><th>Submitted</th></tr>",
            "        </thead>",
            `        <tbody>${rows}</tbody>`,
            "      </table>",
            "    </section>"
        ].join("\n");
    }
    /**
     * Renders the full support page. `state` controls the optional banner
     * shown after a form submission.
     */
    function renderPage(state = {}) {
        var _a, _b, _c;
        const base = escapeHtml((_a = state.baseUrl) !== null && _a !== void 0 ? _a : "");
        const ticketsUrl = base + "&view=tickets";
        const recentCard = renderRecentTicketsCard((_b = state.recentTickets) !== null && _b !== void 0 ? _b : [], ticketsUrl);
        let toast = "";
        if (state.submitted) {
            toast = [
                '  <div id="sonner-toast" class="toast" role="status" aria-live="polite">',
                '    <svg class="toast-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
                '      <path d="M20 6 9 17l-5-5"/>',
                "    </svg>",
                '    <div class="toast-body">',
                '      <p class="toast-title">Ticket created</p>',
                `      <p class="toast-desc">Ref: ${escapeHtml(state.ticketId)}</p>`,
                "    </div>",
                '    <button type="button" class="toast-close" aria-label="Dismiss notification">&times;</button>',
                "  </div>"
            ].join("\n");
        }
        let banner = "";
        if (state.submitted) {
            banner = [
                '<div class="banner success">',
                `  <strong>Thanks, ${escapeHtml((_c = state.name) !== null && _c !== void 0 ? _c : "there")}!</strong>`,
                `  Your request was received. Reference: <code>${escapeHtml(state.ticketId)}</code>.`,
                `  We'll reply to <strong>${escapeHtml(state.email)}</strong>.`,
                '  <div style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap;">',
                `    <a class="btn-again" href="${base}">Submit another request</a>`,
                `    <a class="btn-again neutral" href="${ticketsUrl}">View all tickets</a>`,
                "  </div>",
                "</div>"
            ].join("\n");
        }
        const formSection = state.submitted ? "" : [
            '    <section class="card">',
            "      <h2>Submit a support request</h2>",
            `      <form method="POST" action="${base}">`,
            '        <div class="field-row">',
            '          <label for="name">Your name</label>',
            '          <input id="name" name="name" type="text" required>',
            '        </div>',
            '        <div class="field-row">',
            '          <label for="email">Email</label>',
            '          <input id="email" name="email" type="email" required>',
            '        </div>',
            '        <div class="field-row">',
            '          <label for="category">Topic</label>',
            '          <select id="category" name="category">',
            "            <option>General question</option>",
            "            <option>Billing</option>",
            "            <option>Technical issue</option>",
            "            <option>Other</option>",
            "          </select>",
            '        </div>',
            '        <div class="field-row">',
            "          <label>Urgency</label>",
            '          <div class="urgency-group">',
            '            <label><input type="radio" name="urgency" value="low" checked> Low</label>',
            '            <label><input type="radio" name="urgency" value="medium"> Medium</label>',
            '            <label><input type="radio" name="urgency" value="high"> High</label>',
            "          </div>",
            '        </div>',
            '        <div class="field-row">',
            '          <label for="message">How can we help?</label>',
            `          <textarea id="message" name="message" required maxlength="${MSG_MAX}"></textarea>`,
            `          <div class="char-counter" id="char-counter">0 / ${MSG_MAX}</div>`,
            '        </div>',
            '        <div class="field-row">',
            '          <div class="form-actions">',
            '            <button type="submit">Send request</button>',
            '            <button type="reset" class="btn-secondary">Clear form</button>',
            "          </div>",
            '        </div>',
            "      </form>",
            "    </section>",
            recentCard || [
                '    <section class="card" style="text-align:center;padding:18px 24px;">',
                `      <a class="link" href="${ticketsUrl}">View all submitted tickets &rarr;</a>`,
                "    </section>"
            ].join("\n")
        ].join("\n");
        const charCounterScript = state.submitted ? "" : [
            "  <script>",
            "    (function () {",
            "      var ta = document.getElementById('message');",
            "      var counter = document.getElementById('char-counter');",
            "      if (!ta || !counter) return;",
            `      var max = ${MSG_MAX};`,
            "      function update() {",
            "        var len = ta.value.length;",
            "        counter.textContent = len + ' / ' + max;",
            "        counter.className = 'char-counter' + (len >= max ? ' over' : len >= max * 0.9 ? ' near' : '');",
            "      }",
            "      ta.addEventListener('input', update);",
            "      var form = ta.form;",
            "      if (form) form.addEventListener('reset', function () { setTimeout(update, 0); });",
            "    })();",
            "  </script>"
        ].join("\n");
        const urgencyPulseScript = state.submitted ? "" : [
            "  <script>",
            "    (function () {",
            "      var group = document.querySelector('.urgency-group');",
            "      if (!group) return;",
            "      var labels = group.querySelectorAll('label');",
            "      labels.forEach(function (lbl) {",
            "        lbl.addEventListener('click', function () {",
            "          lbl.classList.remove('pulse');",
            "          void lbl.offsetWidth;",
            "          lbl.classList.add('pulse');",
            "        });",
            "        lbl.addEventListener('animationend', function () { lbl.classList.remove('pulse'); });",
            "      });",
            "    })();",
            "  </script>"
        ].join("\n");
        return [
            "<!DOCTYPE html>",
            '<html lang="en">',
            "<head>",
            '  <meta charset="utf-8">',
            '  <meta name="viewport" content="width=device-width, initial-scale=1">',
            "  <title>Support Center</title>",
            THEME_INIT_SCRIPT,
            "  <style>",
            SHARED_STYLES,
            "  </style>",
            "</head>",
            "<body>",
            "  <header>",
            THEME_TOGGLE_BUTTON,
            "    <h1>Support Center</h1>",
            "    <p>We're here to help. Submit a request below and our team will get back to you.</p>",
            "  </header>",
            "  <main>",
            "    " + banner,
            formSection,
            state.submitted ? recentCard : "",
            "  </main>",
            toast,
            '  <footer>Deployed by Midware<span class="brand-dot" aria-hidden="true"></span>using Cycle</footer>',
            THEME_TOGGLE_SCRIPT,
            charCounterScript,
            urgencyPulseScript,
            state.submitted ? TOAST_SCRIPT : "",
            "</body>",
            "</html>"
        ].join("\n");
    }
    /**
     * Renders the all-tickets list page.
     */
    function renderTicketsPage(state = {}) {
        var _a, _b;
        const base = escapeHtml((_a = state.baseUrl) !== null && _a !== void 0 ? _a : "");
        const tickets = (_b = state.tickets) !== null && _b !== void 0 ? _b : [];
        let rows;
        if (tickets.length === 0) {
            rows = '<tr><td colspan="5" class="empty">No tickets have been submitted yet.</td></tr>';
        }
        else {
            rows = tickets.map(t => {
                var _a, _b, _c, _d;
                return [
                    "<tr>",
                    `  <td><code>${escapeHtml(t.ticketId)}</code></td>`,
                    `  <td>${escapeHtml((_a = t.name) !== null && _a !== void 0 ? _a : "—")}</td>`,
                    `  <td>${escapeHtml((_b = t.email) !== null && _b !== void 0 ? _b : "—")}</td>`,
                    `  <td>${escapeHtml((_c = t.topic) !== null && _c !== void 0 ? _c : "—")}</td>`,
                    `  <td>${escapeHtml((_d = t.date) !== null && _d !== void 0 ? _d : "—")}</td>`,
                    "</tr>"
                ].join("\n");
            }).join("\n");
        }
        const body = [
            '    <section class="card">',
            `      <h2>All Support Tickets (${tickets.length})</h2>`,
            "      <table>",
            "        <thead>",
            "          <tr><th>Ticket ID</th><th>Name</th><th>Email</th><th>Topic</th><th>Submitted</th></tr>",
            "        </thead>",
            `        <tbody>${rows}</tbody>`,
            "      </table>",
            "    </section>",
            `    <p style="margin-top:20px;text-align:center;"><a class="link" href="${base}">&larr; Back to Support Center</a></p>`
        ].join("\n");
        return [
            "<!DOCTYPE html>",
            '<html lang="en">',
            "<head>",
            '  <meta charset="utf-8">',
            '  <meta name="viewport" content="width=device-width, initial-scale=1">',
            "  <title>All Tickets — Support Center</title>",
            THEME_INIT_SCRIPT,
            "  <style>",
            SHARED_STYLES,
            "  </style>",
            "</head>",
            "<body>",
            "  <header>",
            THEME_TOGGLE_BUTTON,
            "    <h1>All Tickets</h1>",
            "    <p>All support requests submitted through this page.</p>",
            "  </header>",
            "  <main>",
            body,
            "  </main>",
            '  <footer>Deployed by Midware<span class="brand-dot" aria-hidden="true"></span>using Cycle</footer>',
            THEME_TOGGLE_SCRIPT,
            "</body>",
            "</html>"
        ].join("\n");
    }
});
