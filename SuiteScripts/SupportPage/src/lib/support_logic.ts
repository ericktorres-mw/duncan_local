/**
 * @NApiVersion 2.1
 * Shared rendering logic for the public Support Page. Has no @NScriptType,
 * so it's a plain library that any script type can safely require.
 *
 * Keeps all HTML generation out of the Suitelet entry point so the page
 * markup can be unit-tested and reused. NEVER read sensitive records here —
 * everything this library produces is world-readable to anyone with the URL.
 */

export interface PageState {
  submitted?: boolean;
  name?: string;
  email?: string;
  ticketId?: string;
  baseUrl?: string;
}

export interface Ticket {
  ticketId: string | null;
  name: string | null;
  email: string | null;
  topic: string | null;
  date: string | null;
}

export interface TicketsState {
  tickets?: Ticket[];
  baseUrl?: string;
}

const MSG_MAX = 2000;

const SHARED_STYLES = [
  "    :root { --brand: #2f6fed; --bg: #f5f7fb; --ink: #1b1f2a; }",
  "    * { box-sizing: border-box; }",
  "    body { margin: 0; font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;",
  "           background: var(--bg); color: var(--ink); }",
  "    header { background: var(--brand); color: #fff; padding: 32px 20px; text-align: center; }",
  "    header h1 { margin: 0 0 6px; font-size: 28px; }",
  "    header p { margin: 0; opacity: .9; }",
  "    main { max-width: 860px; margin: 32px auto 48px; padding: 0 20px; }",
  "    .card { background: #fff; border-radius: 12px; padding: 24px; margin-top: 20px;",
  "            box-shadow: 0 6px 24px rgba(20,30,60,.08); }",
  "    h2 { font-size: 18px; margin-top: 0; }",
  "    label { display: block; font-weight: 600; margin: 14px 0 6px; }",
  "    input, textarea, select { width: 100%; padding: 10px 12px; border: 1px solid #d4d9e3;",
  "            border-radius: 8px; font-size: 14px; font-family: inherit; color: var(--ink);",
  "            background-color: #fff; }",
  "    textarea { min-height: 120px; resize: vertical; }",
  "    select { -webkit-appearance: none; -moz-appearance: none; appearance: none;",
  "             padding-right: 40px; cursor: pointer;",
  "             background-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='none' stroke='%234a5163' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round' d='M1 1.5 6 6.5 11 1.5'/%3E%3C/svg%3E\");",
  "             background-repeat: no-repeat; background-position: right 14px center; }",
  "    .char-counter { text-align: right; font-size: 12px; color: #8a90a0; margin-top: 4px; }",
  "    .char-counter.near { color: #c07000; }",
  "    .char-counter.over { color: #c0392b; font-weight: 600; }",
  "    button { margin-top: 18px; background: var(--brand); color: #fff; border: 0;",
  "             padding: 12px 20px; border-radius: 8px; font-size: 15px; cursor: pointer; }",
  "    button:hover { background: #2659c4; }",
  "    .urgency-group { display: flex; gap: 10px; margin-top: 6px; }",
  "    .urgency-group label { margin: 0; font-weight: 400; display: flex; align-items: center; gap: 6px; cursor: pointer; }",
  "    .urgency-group input[type=radio] { width: auto; }",
  "    .banner { border-radius: 10px; padding: 14px 16px; margin-top: 20px; }",
  "    .banner.success { background: #e7f7ec; border: 1px solid #b6e6c4; color: #1c6b35; }",
  "    .btn-again { display: inline-block; background: var(--brand); color: #fff; text-decoration: none;",
  "                 padding: 10px 18px; border-radius: 8px; font-size: 14px; }",
  "    .btn-again:hover { background: #2659c4; }",
  "    a.link { color: var(--brand); }",
  "    code { background: #eef1f6; padding: 2px 6px; border-radius: 4px; font-size: 13px; }",
  "    table { width: 100%; border-collapse: collapse; font-size: 14px; }",
  "    th { text-align: left; font-weight: 600; padding: 10px 12px; border-bottom: 2px solid #eef1f6; color: #4a5163; }",
  "    td { padding: 10px 12px; border-bottom: 1px solid #eef1f6; vertical-align: top; word-break: break-word; }",
  "    tr:last-child td { border-bottom: none; }",
  "    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; }",
  "    .badge-open { background: #e8f0fe; color: #1a56c4; }",
  "    .empty { color: #8a90a0; text-align: center; padding: 32px 0; }",
  "    footer { text-align: center; color: #8a90a0; font-size: 12px; padding: 20px; }"
].join("\n");

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Renders the full support page. `state` controls the optional banner
 * shown after a form submission.
 */
export function renderPage(state: PageState = {}): string {
  const base       = escapeHtml(state.baseUrl ?? "");
  const ticketsUrl = base + "&view=tickets";

  let banner = "";
  if (state.submitted) {
    banner = [
      '<div class="banner success">',
      `  <strong>Thanks, ${escapeHtml(state.name ?? "there")}!</strong>`,
      `  Your request was received. Reference: <code>${escapeHtml(state.ticketId)}</code>.`,
      `  We'll reply to <strong>${escapeHtml(state.email)}</strong>.`,
      '  <div style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap;">',
      `    <a class="btn-again" href="${base}">Submit another request</a>`,
      `    <a class="btn-again" style="background:#4a5163" href="${ticketsUrl}">View all tickets</a>`,
      "  </div>",
      "</div>"
    ].join("\n");
  }

  const formSection = state.submitted ? "" : [
    '    <section class="card">',
    "      <h2>Submit a support request</h2>",
    `      <form method="POST" action="${base}">`,
    '        <label for="name">Your name</label>',
    '        <input id="name" name="name" type="text" required>',
    '        <label for="email">Email</label>',
    '        <input id="email" name="email" type="email" required>',
    '        <label for="category">Topic</label>',
    '        <select id="category" name="category">',
    "          <option>General question</option>",
    "          <option>Billing</option>",
    "          <option>Technical issue</option>",
    "          <option>Other</option>",
    "        </select>",
    "        <label>Urgency</label>",
    '        <div class="urgency-group">',
    '          <label><input type="radio" name="urgency" value="low" checked> Low</label>',
    '          <label><input type="radio" name="urgency" value="medium"> Medium</label>',
    '          <label><input type="radio" name="urgency" value="high"> High</label>',
    "        </div>",
    '        <label for="message">How can we help?</label>',
    `        <textarea id="message" name="message" required maxlength="${MSG_MAX}"></textarea>`,
    `        <div class="char-counter" id="char-counter">0 / ${MSG_MAX}</div>`,
    '        <button type="submit">Send request</button>',
    "      </form>",
    "    </section>",
    '    <section class="card" style="text-align:center;padding:16px 24px;">',
    `      <a class="link" href="${ticketsUrl}">View all submitted tickets &rarr;</a>`,
    "    </section>"
  ].join("\n");

  const charCounterScript = state.submitted ? "" : [
    "  <script>",
    "    (function () {",
    "      var ta = document.getElementById('message');",
    "      var counter = document.getElementById('char-counter');",
    "      if (!ta || !counter) return;",
    `      var max = ${MSG_MAX};`,
    "      ta.addEventListener('input', function () {",
    "        var len = ta.value.length;",
    "        counter.textContent = len + ' / ' + max;",
    "        counter.className = 'char-counter' + (len >= max ? ' over' : len >= max * 0.9 ? ' near' : '');",
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
    "  <style>",
    SHARED_STYLES,
    "  </style>",
    "</head>",
    "<body>",
    "  <header>",
    "    <h1>Support Center</h1>",
    "    <p>We're here to help. Submit a request below and our team will get back to you.</p>",
    "  </header>",
    "  <main>",
    "    " + banner,
    formSection,
    "  </main>",
    "  <footer>Deployed by Midware using Cycle</footer>",
    charCounterScript,
    "</body>",
    "</html>"
  ].join("\n");
}

/**
 * Renders the all-tickets list page.
 */
export function renderTicketsPage(state: TicketsState = {}): string {
  const base    = escapeHtml(state.baseUrl ?? "");
  const tickets = state.tickets ?? [];

  let rows: string;
  if (tickets.length === 0) {
    rows = '<tr><td colspan="5" class="empty">No tickets have been submitted yet.</td></tr>';
  } else {
    rows = tickets.map(t => [
      "<tr>",
      `  <td><code>${escapeHtml(t.ticketId)}</code></td>`,
      `  <td>${escapeHtml(t.name ?? "—")}</td>`,
      `  <td>${escapeHtml(t.email ?? "—")}</td>`,
      `  <td>${escapeHtml(t.topic ?? "—")}</td>`,
      `  <td>${escapeHtml(t.date ?? "—")}</td>`,
      "</tr>"
    ].join("\n")).join("\n");
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
    "  <style>",
    SHARED_STYLES,
    "  </style>",
    "</head>",
    "<body>",
    "  <header>",
    "    <h1>All Tickets</h1>",
    "    <p>All support requests submitted through this page.</p>",
    "  </header>",
    "  <main>",
    body,
    "  </main>",
    "  <footer>Deployed by Midware using Cycle</footer>",
    "</body>",
    "</html>"
  ].join("\n");
}
