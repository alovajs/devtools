import type { Change, ChangeSummary } from 'wormajs'
import { ViewColumn, window } from 'vscode'
import worma from '@/helper/worma'
import { displayName } from '@/meta'
import { Log } from '@/utils'
import { getWorkspacePaths } from '@/utils/vscode'

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString()
}

/** Human-readable one-line summary of a change record. */
export function formatChangeSummary(change: Change): string {
  let added = 0
  let removed = 0
  let modified = 0
  for (const gen of change.generators) {
    for (const row of gen.changes) {
      if (row.op === '+')
        added++
      else if (row.op === '-')
        removed++
      else
        modified++
    }
  }
  const parts: string[] = []
  if (added)
    parts.push(`${added} added`)
  if (removed)
    parts.push(`${removed} removed`)
  if (modified)
    parts.push(`${modified} modified`)
  return parts.length ? parts.join(', ') : 'no changes'
}

/** CSS class of a row, derived from its symbol. */
function rowClass(op: string): string {
  if (op === '+')
    return 'add'
  if (op === '-')
    return 'del'
  return 'mod'
}

/**
 * Colour of the `Level` cell.
 *
 * Mirrors `worma diff`: breaking is red, additive green, everything else dim —
 * the rest of the row keeps the default foreground.
 */
function levelClass(level: string): string {
  if (level === 'breaking')
    return 'breaking'
  if (level === 'additive')
    return 'additive'
  return 'doc'
}

function renderRows(change: Change | undefined, summaries: ChangeSummary[]): string {
  if (!change) {
    return `<p class="empty">No change records yet. Run <code>Worma: Generate APIs</code> after your spec changes.</p>`
  }

  const options = summaries
    .map(s => `<option value="${escapeHtml(s.id)}"${s.id === change.id ? ' selected' : ''}>${escapeHtml(s.id)} — ${escapeHtml(formatTime(s.createdAt))} (+${s.summary.added}/-${s.summary.removed}/~${s.summary.modified})</option>`)
    .join('')

  const groups = change.generators.map((gen) => {
    const rows = gen.changes.map((row) => {
      const cls = rowClass(row.op)
      // The affected operations of a component change are listed under the
      // change itself, one per line — the same shape the CLI prints.
      const affects = row.affects ?? []
      const changeHtml = [row.detail ? escapeHtml(row.detail) : '', ...affects.map(api => `<span class="affects">${escapeHtml(api)}</span>`)]
        .filter(Boolean)
        .join('<br>')
      const search = [row.op, row.kind, row.target, row.item, row.detail, row.level, ...affects].filter(Boolean).join(' ')
      // Only the symbol (per op) and the level (per severity) are coloured —
      // the other cells keep the default foreground, exactly like the CLI table.
      return `<tr class="row ${cls}" data-search="${escapeHtml(search)}">`
        + `<td class="badge ${cls}">${escapeHtml(row.op)}</td>`
        + `<td class="type">${escapeHtml(row.kind)}</td>`
        + `<td>${escapeHtml(row.target)}</td>`
        + `<td>${escapeHtml(row.item ?? '')}</td>`
        + `<td>${changeHtml}</td>`
        + `<td class="level ${levelClass(row.level)}">${escapeHtml(row.level)}</td>`
        + `</tr>`
    }).join('')

    return `
      <section class="group">
        <h3>${escapeHtml(gen.output)}${gen.serverName ? ` <span class="dim">(${escapeHtml(gen.serverName)})</span>` : ''}</h3>
        <table>
          <thead><tr><th></th><th>Type</th><th>Target</th><th>Item</th><th>Change</th><th>Level</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="6" class="dim">no changes</td></tr>'}</tbody>
        </table>
      </section>`
  }).join('')

  return `
    <div class="toolbar">
      <select id="record">${options}</select>
      <input id="search" type="text" placeholder="Search by type / target / item / change ..." />
      <span id="count" class="dim"></span>
    </div>
    <h2>${escapeHtml(change.id)} <span class="dim">${escapeHtml(formatTime(change.createdAt))}</span></h2>
    <p class="summary">${escapeHtml(formatChangeSummary(change))}</p>
    ${groups}`
}

function html(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';" />
<style>
  :root { --worma-border: var(--vscode-widget-border, var(--vscode-panel-border, rgba(128, 128, 128, 0.45))); }
  body { font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); color: var(--vscode-foreground); padding: 12px 16px; }
  h2 { font-size: 14px; margin: 8px 0 2px; }
  h3 { font-size: 13px; margin: 16px 0 6px; }
  /* full grid: every cell carries a border, so the table is wrapped on all sides */
  table { width: 100%; border-collapse: collapse; border: 1px solid var(--worma-border); }
  th, td { text-align: left; vertical-align: top; padding: 3px 8px; font-size: 12px; border: 1px solid var(--worma-border); }
  th { font-weight: 600; }
  tr.row:hover { background: var(--vscode-list-hoverBackground); }
  .dim { color: var(--vscode-descriptionForeground); }
  .empty { color: var(--vscode-descriptionForeground); }
  .badge { width: 16px; font-weight: 700; }
  /* Only the symbol (per op) and the level (per severity) are coloured, matching
     the worma diff table; every other cell stays on the default foreground. */
  .badge.add { color: var(--vscode-gitDecoration-addedResourceForeground, #81b88b); }
  .badge.del { color: var(--vscode-gitDecoration-deletedResourceForeground, #c74e39); }
  .badge.mod { color: var(--vscode-gitDecoration-modifiedResourceForeground, #e2c08d); }
  .type, .level.doc { color: var(--vscode-descriptionForeground); }
  .level.breaking { color: var(--vscode-gitDecoration-deletedResourceForeground, #c74e39); }
  .level.additive { color: var(--vscode-gitDecoration-addedResourceForeground, #81b88b); }
  .affects { padding-left: 10px; }
  .toolbar { display: flex; gap: 8px; align-items: center; margin-bottom: 10px; }
  select, input { background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border, transparent); padding: 3px 6px; }
  input { flex: 1; }
  .summary { margin: 0 0 8px; font-weight: 600; }
</style>
</head>
<body>
  <div id="root">${body}</div>
  <script>
    const vscode = acquireVsCodeApi();
    function bind() {
      const search = document.getElementById('search');
      const select = document.getElementById('record');
      const count = document.getElementById('count');
      if (select) select.addEventListener('change', () => vscode.postMessage({ type: 'select', id: select.value }));
      if (search) search.addEventListener('input', () => {
        const q = search.value.toLowerCase();
        let shown = 0, total = 0;
        document.querySelectorAll('tr.row').forEach((row) => {
          total++;
          const hit = !q || (row.dataset.search || '').toLowerCase().includes(q);
          row.style.display = hit ? '' : 'none';
          if (hit) shown++;
        });
        if (count) count.textContent = q ? shown + ' / ' + total : '';
      });
    }
    bind();
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'render') {
        document.getElementById('root').innerHTML = event.data.html;
        bind();
      }
    });
  </script>
</body>
</html>`
}

/**
 * "API Changes" webview — read-only view over the change records written by
 * `worma.generate()`.
 */
export class ChangesView {
  private static panel: import('vscode').WebviewPanel | undefined
  /** Project the panel is currently showing; re-pointed by every `open()`. */
  private static projectPath: string | undefined

  /** The currently open panel (used by tests). */
  static get current() {
    return ChangesView.panel
  }

  static async open(changeId = 'latest', projectPath?: string) {
    ChangesView.projectPath = projectPath ?? getWorkspacePaths()[0]
    if (!ChangesView.panel) {
      ChangesView.panel = window.createWebviewPanel(
        'worma.apiChanges',
        `${displayName}: API Changes`,
        ViewColumn.Active,
        { enableScripts: true, retainContextWhenHidden: true },
      )
      ChangesView.panel.onDidDispose(() => {
        ChangesView.panel = undefined
      })
      // Registered once per panel: re-registering on every `open()` would stack
      // listeners and re-render the panel once per previous open.
      ChangesView.panel.webview.onDidReceiveMessage(async (message) => {
        if (message?.type === 'select') {
          await ChangesView.render(String(message.id), ChangesView.projectPath)
        }
      })
    }
    else {
      ChangesView.panel.reveal()
    }

    await ChangesView.render(changeId, ChangesView.projectPath)
    return ChangesView.panel
  }

  static async render(changeId: string, projectPath?: string) {
    const panel = ChangesView.panel
    if (!panel)
      return
    const target = projectPath ?? getWorkspacePaths()[0]
    try {
      const [summaries, change] = await Promise.all([
        worma.listChanges(target),
        worma.getChange(target, changeId),
      ])
      panel.webview.html = html(renderRows(change, summaries as ChangeSummary[]))
    }
    catch (error) {
      Log.error(error)
      panel.webview.html = html(`<p class="empty">Failed to load change records: ${escapeHtml((error as Error)?.message ?? error)}</p>`)
    }
  }
}

export default ChangesView
