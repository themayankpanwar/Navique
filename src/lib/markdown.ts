// Lightweight markdown -> HTML renderer (no external deps).
// Supports headings, bold, italic, lists, tables, hr, blockquote, inline code, links.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderInline(text: string): string {
  let out = escapeHtml(text);
  // inline code
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  // bold
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // italic
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  // links [text](url)
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, url) => {
    // AI-generated markdown is untrusted. Only render ordinary web links;
    // rejecting other schemes prevents javascript: URLs in injected HTML.
    const href = /^(https?:\/\/)/i.test(url) ? url : '#';
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });
  return out;
}

export function renderMarkdown(md: string): string {
  const lines = md.split('\n');
  const html: string[] = [];
  let i = 0;
  let inUl = false;
  let inOl = false;
  let inTable = false;
  let tableRows: string[][] = [];

  const closeLists = () => {
    if (inUl) { html.push('</ul>'); inUl = false; }
    if (inOl) { html.push('</ol>'); inOl = false; }
  };
  const flushTable = () => {
    if (!inTable || tableRows.length === 0) return;
    const [head, ...rest] = tableRows;
    html.push('<table><thead><tr>');
    head.forEach((c) => html.push(`<th>${renderInline(c)}</th>`));
    html.push('</tr></thead><tbody>');
    rest.forEach((row) => {
      // skip separator rows like |---|---|
      if (row.every((c) => /^[\s-:]+$/.test(c))) return;
      html.push('<tr>');
      row.forEach((c) => html.push(`<td>${renderInline(c)}</td>`));
      html.push('</tr>');
    });
    html.push('</tbody></table>');
    inTable = false;
    tableRows = [];
  };

  while (i < lines.length) {
    const line = lines[i];

    // table row
    if (/^\s*\|.*\|\s*$/.test(line)) {
      closeLists();
      inTable = true;
      const cells = line.trim().slice(1, -1).split('|').map((c) => c.trim());
      tableRows.push(cells);
      i++;
      continue;
    } else if (inTable) {
      flushTable();
    }

    // headings
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      closeLists();
      const level = h[1].length;
      html.push(`<h${level}>${renderInline(h[2])}</h${level}>`);
      i++;
      continue;
    }

    // hr
    if (/^(\s*[-*_]){3,}\s*$/.test(line)) {
      closeLists();
      html.push('<hr/>');
      i++;
      continue;
    }

    // blockquote
    if (/^>\s?/.test(line)) {
      closeLists();
      html.push(`<blockquote>${renderInline(line.replace(/^>\s?/, ''))}</blockquote>`);
      i++;
      continue;
    }

    // unordered list
    if (/^\s*[-*+]\s+/.test(line)) {
      if (inOl) { html.push('</ol>'); inOl = false; }
      if (!inUl) { html.push('<ul>'); inUl = true; }
      html.push(`<li>${renderInline(line.replace(/^\s*[-*+]\s+/, ''))}</li>`);
      i++;
      continue;
    }

    // ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      if (inUl) { html.push('</ul>'); inUl = false; }
      if (!inOl) { html.push('<ol>'); inOl = true; }
      html.push(`<li>${renderInline(line.replace(/^\s*\d+\.\s+/, ''))}</li>`);
      i++;
      continue;
    }

    // blank line
    if (line.trim() === '') {
      closeLists();
      i++;
      continue;
    }

    // paragraph
    closeLists();
    html.push(`<p>${renderInline(line)}</p>`);
    i++;
  }

  closeLists();
  flushTable();
  return html.join('\n');
}
