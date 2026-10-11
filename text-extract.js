import * as WS from './word-styles.js';
// Text extraction (pdf.js) → structured blocks → HTML (editor) / .docx (JSZip) / JSON (internal).
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const xesc = s => esc(s).replace(/"/g, '&quot;');
const BULLET = /^\s*([•●▪◦‣■□►–—\-*])\s+/;
const NUMBERED = /^\s*(\d{1,2}|[a-zA-Z])[.)]\s+/;

function loadScript(src, globalName) {
  if (window[globalName]) return Promise.resolve(window[globalName]);
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = () => res(window[globalName]); s.onerror = rej; document.head.appendChild(s); });
}

async function pageLines(page) {
  const vp = page.getViewport({ scale: 1 }); const W = vp.width, H = vp.height;
  try { await page.getOperatorList(); } catch (e) {}
  const tc = await page.getTextContent();
  const boldOf = {};
  const isBold = fn => { if (fn in boldOf) return boldOf[fn]; let b = false; try { const f = page.commonObjs.has(fn) ? page.commonObjs.get(fn) : null; const n = String((f && (f.name || f.loadedName)) || '') + ' ' + String((tc.styles[fn] || {}).fontFamily || ''); b = /bold|black|heavy|semibold|demi|extrabold/i.test(n) || (f && f.bold) || false; } catch (e) {} return (boldOf[fn] = !!b); };
  const items = tc.items.filter(it => it.str && it.str.trim()).map(it => { const tr = it.transform; const size = Math.hypot(tr[2], tr[3]) || it.height || 10; return { str: it.str, x: tr[4], y: tr[5], w: it.width || it.str.length * size * 0.5, size, bold: isBold(it.fontName) }; });
  // column split: find an empty vertical gutter in the middle of the page
  let split = null;
  if (items.length > 30) {
    const bins = 120, cov = new Array(bins).fill(0);
    items.forEach(it => { const a = Math.max(0, Math.floor(it.x / W * bins)), b = Math.min(bins - 1, Math.floor((it.x + it.w) / W * bins)); for (let k = a; k <= b; k++) cov[k]++; });
    let best = null, run = null;
    for (let k = Math.floor(bins * 0.3); k <= Math.ceil(bins * 0.7); k++) { if (cov[k] <= 1) { run = run || { s: k, e: k }; run.e = k; if (!best || run.e - run.s > best.e - best.s) best = { ...run }; } else run = null; }
    if (best && best.e - best.s >= 2) { const sx = (best.s + best.e + 1) / 2 / bins * W; const left = items.filter(i => i.x + i.w <= sx).length, right = items.filter(i => i.x >= sx).length; if (left > items.length * 0.25 && right > items.length * 0.25) split = sx; }
  }
  const cols = split == null ? [items] : [items.filter(i => i.x < split), items.filter(i => i.x >= split)];
  const lines = [];
  cols.forEach((col, ci) => {
    const sorted = col.slice().sort((a, b) => b.y - a.y || a.x - b.x); const ls = [];
    sorted.forEach(it => { const l = ls.find(l => Math.abs(l.y - it.y) < Math.max(l.size, it.size) * 0.45); if (l) { l.items.push(it); l.size = Math.max(l.size, it.size); } else ls.push({ y: it.y, size: it.size, items: [it] }); });
    ls.sort((a, b) => b.y - a.y);
    ls.forEach(l => {
      l.items.sort((a, b) => a.x - b.x); const runs = []; let prevEnd = null, text = '';
      l.items.forEach(it => { let s = it.str; if (prevEnd != null && it.x - prevEnd > it.size * 0.18 && !/\s$/.test(text) && !/^\s/.test(s)) s = ' ' + s; text += s; prevEnd = it.x + it.w; const last = runs[runs.length - 1]; if (last && last.b === it.bold) last.text += s; else runs.push({ text: s, b: it.bold }); });
      const chars = l.items.reduce((n, i) => n + i.str.length, 0), boldChars = l.items.filter(i => i.bold).reduce((n, i) => n + i.str.length, 0);
      lines.push({ col: ci, y: l.y, x: l.items[0].x, size: l.size, text: text.replace(/\s+/g, ' ').trim(), runs, bold: boldChars > chars * 0.6, H, W });
    });
  });
  return lines.filter(l => l.text);
}

export async function extractPdf(data, pdfjsLib) {
  const pdf = await pdfjsLib.getDocument({ data }).promise; const pages = [];
  for (let p = 1; p <= pdf.numPages; p++) { try { pages.push(await pageLines(await pdf.getPage(p))); } catch (e) { pages.push([]); } }
  // repeating headers/footers + page numbers
  const norm = t => t.toLowerCase().replace(/\d+/g, '#').replace(/\s+/g, ' ').trim();
  const freq = {}; pages.forEach(ls => { const seen = new Set(); ls.forEach(l => { if (l.y > l.H * 0.9 || l.y < l.H * 0.1) { const k = norm(l.text); if (!seen.has(k)) { seen.add(k); freq[k] = (freq[k] || 0) + 1; } } }); });
  const rep = k => pages.length >= 3 && freq[k] >= Math.max(3, pages.length * 0.4);
  pages.forEach((ls, i) => { pages[i] = ls.filter(l => { const edge = l.y > l.H * 0.9 || l.y < l.H * 0.1; if (!edge) return true; if (/^(page\s*)?\d{1,4}(\s*(of|\/)\s*\d{1,4})?$/i.test(l.text)) return false; return !rep(norm(l.text)); }); });
  // body size = most common size weighted by characters
  const hist = {}; pages.flat().forEach(l => { const k = Math.round(l.size * 2) / 2; hist[k] = (hist[k] || 0) + l.text.length; });
  const body = Number(Object.entries(hist).sort((a, b) => b[1] - a[1])[0]?.[0] || 10);
  const blocks = [];
  pages.forEach((ls, pi) => {
    let cur = null, prev = null;
    const push = b => { if (b && b.runs.some(r => r.text.trim())) blocks.push(b); };
    ls.forEach(l => {
      const ratio = l.size / body; let type = 'p';
      if (BULLET.test(l.text)) type = 'li'; else if (NUMBERED.test(l.text) && l.text.length < 400) type = 'oli';
      else if (ratio >= 1.12 && l.text.length < 160) type = ratio >= 1.8 ? 'h1' : ratio >= 1.35 ? 'h2' : 'h3';
      else if (l.bold && l.text.length < 90 && ratio > 0.92) type = 'h3';
      const gap = prev && prev.col === l.col ? prev.y - l.y : Infinity;
      const close = gap < Math.max(prev ? prev.size : 0, l.size) * 1.75;
      const sameSize = prev && Math.abs(prev.size - l.size) < body * 0.12;
      let runs = l.runs.map(r => ({ ...r })); if (type === 'li') runs[0].text = runs[0].text.replace(BULLET, ''); if (type === 'oli') runs[0].text = runs[0].text.replace(NUMBERED, '');
      if (type === 'li' && runs.every(r => r.b)) runs.forEach(r => { r.b = false; });
      if (type === 'p' && runs.every(r => r.b) && l.text.length >= 90) runs.forEach(r => { r.b = false; });
      if (type.startsWith('h')) runs.forEach(r => { r.b = false; });
      const cont = cur && close && sameSize && ((type === 'p' && (cur.type === 'p' || cur.type === 'li' || cur.type === 'oli') && !(cur.type !== 'p' && l.x < cur.x - 2)) || (type === cur.type && type.startsWith('h')));
      if (cont) { const last = cur.runs[cur.runs.length - 1]; const t0 = runs[0]; if (/[A-Za-z]-$/.test(last.text) && /^[a-z]/.test(t0.text)) last.text = last.text.slice(0, -1); else last.text += ' '; runs.forEach(r => { const lr = cur.runs[cur.runs.length - 1]; if (lr.b === r.b) lr.text += r.text; else cur.runs.push(r); }); }
      else { push(cur); cur = { type, runs, page: pi + 1, size: Math.round(l.size * 10) / 10, x: l.x }; }
      prev = l;
    });
    push(cur);
  });
  blocks.forEach(b => { b.runs = b.runs.map(r => ({ text: r.text.replace(/\s+/g, ' '), b: !!r.b })).filter(r => r.text); if (b.runs.length) { b.runs[0].text = b.runs[0].text.replace(/^\s+/, ''); const l = b.runs[b.runs.length - 1]; l.text = l.text.replace(/\s+$/, ''); } b.text = b.runs.map(r => r.text).join(''); delete b.x; });
  const firstH = blocks.find(b => b.type.startsWith('h')); if (firstH && firstH.page === 1 && firstH.type === 'h1') firstH.type = 'title';
  return { version: 1, extractedAt: new Date().toISOString(), pageCount: pdf.numPages, bodySize: body, blocks: blocks.filter(b => b.text), pagesText: pages.map((ls, i) => ({ num: i + 1, text: ls.map(l => l.text).join('\n') })) };
}

const ST = {
  title: 'margin:0 0 14px;font-family:Manrope,sans-serif;font-size:30px;line-height:1.15;font-weight:800;color:#081A53;letter-spacing:-.02em;',
  h1: 'margin:22px 0 10px;font-family:Manrope,sans-serif;font-size:24px;line-height:1.2;font-weight:800;color:#081A53;',
  h2: 'margin:20px 0 8px;font-family:Manrope,sans-serif;font-size:19px;line-height:1.25;font-weight:800;color:#081A53;',
  h3: 'margin:16px 0 6px;font-family:Manrope,sans-serif;font-size:15.5px;line-height:1.3;font-weight:700;color:#1d2226;',
  p: 'margin:0 0 10px;font-family:Inter,sans-serif;font-size:14px;line-height:1.6;color:#2b3040;',
  ul: 'margin:0 0 10px;padding-left:24px;font-family:Inter,sans-serif;font-size:14px;line-height:1.6;color:#2b3040;',
  li: 'margin:0 0 4px;',
};
function _oldStyleEditor(root) {
  if (!root) return;
  root.querySelectorAll('h1,h2,h3,p,ul,ol,li,div').forEach(el => { const tag = el.tagName.toLowerCase(); const k = tag === 'h1' && el.getAttribute('data-title') ? 'title' : tag === 'ol' ? 'ul' : tag === 'div' ? 'p' : tag; if (ST[k] && el.getAttribute('style') !== ST[k]) el.setAttribute('style', ST[k]); });
}
const runsHtml = runs => runs.map(r => { const s = esc(r.text).replace(/\n/g, '<br>'); return r.b ? '<strong>' + s + '</strong>' : r.i ? '<em>' + s + '</em>' : s; }).join('');
function _oldBlocksToHtml(blocks) {
  let out = '', list = null;
  const close = () => { if (list) { out += '</' + list + '>'; list = null; } };
  blocks.forEach(b => {
    if (b.type === 'li' || b.type === 'oli') { const tag = b.type === 'li' ? 'ul' : 'ol'; if (list !== tag) { close(); out += '<' + tag + ' style="' + ST.ul + '">'; list = tag; } out += '<li style="' + ST.li + '">' + runsHtml(b.runs) + '</li>'; return; }
    close();
    if (b.type === 'title') out += '<h1 data-title="1" style="' + ST.title + '">' + runsHtml(b.runs) + '</h1>';
    else if (/^h[123]$/.test(b.type)) out += '<' + b.type + ' style="' + ST[b.type] + '">' + runsHtml(b.runs) + '</' + b.type + '>';
    else out += '<p style="' + ST.p + '">' + runsHtml(b.runs) + '</p>';
  });
  close(); return out || '<p style="' + ST.p + '"><br></p>';
}
function inlineRuns(node, fmt, out) {
  node.childNodes.forEach(n => {
    if (n.nodeType === 3) { if (n.nodeValue) out.push({ text: n.nodeValue.replace(/\s+/g, ' '), b: !!fmt.b, i: !!fmt.i }); return; }
    if (n.nodeType !== 1) return; const t = n.tagName.toLowerCase();
    if (t === 'br') { out.push({ text: '\n', b: !!fmt.b, i: !!fmt.i }); return; }
    const fw = n.style && n.style.fontWeight; const f = { b: fmt.b || t === 'b' || t === 'strong' || fw === 'bold' || Number(fw) >= 600, i: fmt.i || t === 'i' || t === 'em' || (n.style && n.style.fontStyle === 'italic') };
    inlineRuns(n, f, out);
  });
  return out;
}
function _oldHtmlToBlocks(html) {
  const root = document.createElement('div'); root.innerHTML = html; const blocks = [];
  const add = (type, el) => { const runs = inlineRuns(el, {}, []).filter(r => r.text); const text = runs.map(r => r.text).join('').trim(); if (text) blocks.push({ type, runs, text }); };
  const walk = parent => parent.childNodes.forEach(n => {
    if (n.nodeType === 3) { if (n.nodeValue.trim()) blocks.push({ type: 'p', runs: [{ text: n.nodeValue.trim(), b: false }], text: n.nodeValue.trim() }); return; }
    if (n.nodeType !== 1) return; const t = n.tagName.toLowerCase();
    if (t === 'h1') add(n.getAttribute('data-title') ? 'title' : 'h1', n); else if (t === 'h2' || t === 'h3') add(t, n); else if (t === 'h4' || t === 'h5' || t === 'h6') add('h3', n);
    else if (t === 'ul' || t === 'ol') n.querySelectorAll(':scope > li').forEach(li => add(t === 'ul' ? 'li' : 'oli', li));
    else if (t === 'div' || t === 'section' || t === 'article' || t === 'blockquote') { if (n.querySelector('p,h1,h2,h3,ul,ol,div')) walk(n); else add('p', n); }
    else add('p', n);
  });
  walk(root); return blocks;
}

// ---- .docx writer (WordprocessingML via JSZip) ----
function runXml(r) {
  const parts = String(r.text).split('\n');
  return parts.map((p, k) => '<w:r>' + ((r.b || r.i) ? '<w:rPr>' + (r.b ? '<w:b/>' : '') + (r.i ? '<w:i/>' : '') + '</w:rPr>' : '') + (k ? '<w:br/>' : '') + '<w:t xml:space="preserve">' + xesc(p) + '</w:t></w:r>').join('');
}
async function _oldBuildDocx(blocks, title) {
  const JSZip = await loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js', 'JSZip');
  const styleId = { title: 'Title', h1: 'Heading1', h2: 'Heading2', h3: 'Heading3' };
  const body = blocks.map(b => {
    let ppr = '';
    if (styleId[b.type]) ppr = '<w:pPr><w:pStyle w:val="' + styleId[b.type] + '"/></w:pPr>';
    else if (b.type === 'li' || b.type === 'oli') ppr = '<w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="' + (b.type === 'li' ? 1 : 2) + '"/></w:numPr></w:pPr>';
    return '<w:p>' + ppr + (b.runs || [{ text: b.text || '' }]).map(runXml).join('') + '</w:p>';
  }).join('');
  const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
  const doc = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ' + W + '><w:body>' + body + '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>';
  const font = '<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>';
  const hs = (id, name, sz, color, before, after, outline) => '<w:style w:type="paragraph" w:styleId="' + id + '"><w:name w:val="' + name + '"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="' + before + '" w:after="' + after + '"/>' + (outline != null ? '<w:outlineLvl w:val="' + outline + '"/>' : '') + '</w:pPr><w:rPr><w:b/><w:color w:val="' + color + '"/><w:sz w:val="' + sz + '"/></w:rPr></w:style>';
  const styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles ' + W + '><w:docDefaults><w:rPrDefault><w:rPr>' + font + '<w:sz w:val="22"/><w:color w:val="2B3040"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="300" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>'
    + '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>'
    + hs('Title', 'Title', 52, '081A53', 0, 240, null) + hs('Heading1', 'heading 1', 36, '081A53', 360, 120, 0) + hs('Heading2', 'heading 2', 28, '081A53', 280, 100, 1) + hs('Heading3', 'heading 3', 24, '1D2226', 220, 80, 2)
    + '<w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="80"/><w:ind w:left="720"/><w:contextualSpacing/></w:pPr></w:style></w:styles>';
  const lvl = (fmt, text) => '<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="' + fmt + '"/><w:lvlText w:val="' + text + '"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>' + (fmt === 'bullet' ? '<w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/></w:rPr>' : '') + '</w:lvl>';
  const numbering = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering ' + W + '><w:abstractNum w:abstractNumId="0">' + lvl('bullet', '\uF0B7') + '</w:abstractNum><w:abstractNum w:abstractNumId="1">' + lvl('decimal', '%1.') + '</w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num><w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num></w:numbering>';
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>');
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>');
  zip.file('docProps/core.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>' + xesc(title || 'Document') + '</dc:title><dc:creator>CatalystOS</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">' + new Date().toISOString() + '</dcterms:created></cp:coreProperties>');
  zip.file('word/document.xml', doc);
  zip.file('word/styles.xml', styles);
  zip.file('word/numbering.xml', numbering);
  zip.file('word/_rels/document.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/></Relationships>');
  return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

async function _oldDocxToHtml(file) {
  const mammoth = await loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js', 'mammoth');
  const r = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() }, { styleMap: ["p[style-name='Title'] => h1.title:fresh"] });
  return String(r.value || '').replace(/<h1 class="title">/g, '<h1 data-title="1">').replace(/<img[^>]*>/g, '');
}

export function wordCount(blocks) { return blocks.reduce((n, b) => n + (String(b.text || '').match(/\S+/g) || []).length, 0); }
export function snippet(blocks) { return blocks.slice(0, 6).map(b => b.text).join(' ').slice(0, 220); }

// Build document blocks from the builder's already-rebuilt text frames (pageBlocks[i].blocks).
export function blocksFromBuilt(pages) {
  const all = []; pages.forEach(pg => (pg.blocks || []).forEach(b => { if (b && String(b.text || '').trim()) all.push(b); }));
  if (!all.length) return [];
  const hist = {}; all.forEach(b => { const k = Math.round((b.fontSizePx || 10) * 2) / 2; hist[k] = (hist[k] || 0) + String(b.text).length; });
  const body = Number(Object.entries(hist).sort((a, b) => b[1] - a[1])[0][0]) || 10;
  const norm = t => String(t).toLowerCase().replace(/\d+/g, '#').replace(/\s+/g, ' ').trim();
  const edge = b => (b.topPct || 0) < 8 || (b.topPct || 0) > 90;
  const freq = {}; pages.forEach(pg => { const seen = new Set(); (pg.blocks || []).forEach(b => { if (b && edge(b)) { const k = norm(b.text); if (!seen.has(k)) { seen.add(k); freq[k] = (freq[k] || 0) + 1; } } }); });
  const n = pages.length; const isRep = b => edge(b) && n >= 3 && freq[norm(b.text)] >= Math.max(3, n * 0.4);
  const out = [];
  pages.forEach(pg => {
    let bs = (pg.blocks || []).filter(b => b && (String(b.text || '').trim() || (b.listItems && b.listItems.length)) && !(/^(page\s*)?\d{1,4}(\s*(of|\/)\s*\d{1,4})?$/i.test(String(b.text).trim()) && edge(b)) && !isRep(b));
    const L = bs.filter(b => (b.leftPct || 0) + (b.widthPct || 0) <= 53), R = bs.filter(b => (b.leftPct || 0) >= 47), S = bs.filter(b => !L.includes(b) && !R.includes(b));
    const byTop = (a, b) => (a.topPct || 0) - (b.topPct || 0) || (a.leftPct || 0) - (b.leftPct || 0);
    if (L.length >= 2 && R.length >= 2) {
      const colTop = Math.min(...L.concat(R).map(b => b.topPct || 0));
      bs = S.filter(b => (b.topPct || 0) <= colTop).sort(byTop).concat(L.sort(byTop), R.sort(byTop), S.filter(b => (b.topPct || 0) > colTop).sort(byTop));
    } else bs.sort(byTop);
    bs.forEach(b => {
      const size = b.fontSizePx || body, ratio = size / body, bold = Number(b.fontWeight) >= 600 || /bold/i.test(String(b.fontWeight || '')), ital = !!b.fontStyle && b.fontStyle !== 'normal';
      const text = String(b.text).replace(/[ \t]+/g, ' ').trim();
      if (b.listItems && b.listItems.length) { b.listItems.forEach(it => { const s = String(it && (it.text != null ? it.text : it) || '').replace(/^\s*[•●▪◦‣■□►–—\-*]\s*/, '').trim(); if (s) out.push({ type: 'li', runs: [{ text: s, b: false, i: ital }], text: s, page: pg.num, ref: b, li: b.listItems.indexOf(it) }); }); return; }
      let type = 'p';
      if (ratio >= 1.12 && text.length < 180) type = ratio >= 1.8 ? 'h1' : ratio >= 1.35 ? 'h2' : 'h3';
      else if (bold && text.length < 90 && (b.lineCount || 1) <= 2 && ratio > 0.92) type = 'h3';
      const flat = type === 'p' ? text : text.replace(/\s*\n\s*/g, ' ');
      out.push({ type, runs: [{ text: flat, b: type === 'p' && bold, i: ital }], text: flat.replace(/\n/g, ' '), page: pg.num, size: +size.toFixed(1), ref: b });
    });
  });
  const first = out.find(b => b.page === out[0].page && /^h[123]$/.test(b.type)); if (first && first.page === 1) first.type = 'title';
  return out;
}

// ---- Compare two block lists → side-by-side rows with word-level highlights ----
const tok = s => String(s || '').split(/(\s+)/).filter(x => x !== '');
function lcsTable(a, b, eq) { const n = a.length, m = b.length; const T = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1)); for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) T[i][j] = eq(a[i], b[j]) ? T[i + 1][j + 1] + 1 : Math.max(T[i + 1][j], T[i][j + 1]); return T; }
export function wordDiff(a, b) {
  const A = tok(a), B = tok(b);
  if (A.length * B.length > 250000) return { l: '<span style="background:#FDE2E1;">' + esc(a) + '</span>', r: '<span style="background:#DDF5E4;">' + esc(b) + '</span>' };
  const T = lcsTable(A, B, (x, y) => x === y); let i = 0, j = 0, l = '', r = '';
  const del = s => '<span style="background:#FDE2E1;color:#9B1C12;text-decoration:line-through;text-decoration-color:rgba(155,28,18,.5);border-radius:2px;">' + esc(s) + '</span>';
  const ins = s => '<span style="background:#CDEFD8;color:#0F5A2A;border-radius:2px;">' + esc(s) + '</span>';
  while (i < A.length && j < B.length) { if (A[i] === B[j]) { l += esc(A[i]); r += esc(B[j]); i++; j++; } else if (T[i + 1][j] >= T[i][j + 1]) { l += /^\s+$/.test(A[i]) ? esc(A[i]) : del(A[i]); i++; } else { r += /^\s+$/.test(B[j]) ? esc(B[j]) : ins(B[j]); j++; } }
  while (i < A.length) { l += /^\s+$/.test(A[i]) ? esc(A[i]) : del(A[i]); i++; } while (j < B.length) { r += /^\s+$/.test(B[j]) ? esc(B[j]) : ins(B[j]); j++; }
  return { l, r };
}
const words = s => new Set(String(s || '').toLowerCase().match(/[\w']+/g) || []);
function sim(a, b) { const A = words(a), B = words(b); if (!A.size && !B.size) return 1; let n = 0; A.forEach(w => { if (B.has(w)) n++; }); return n / Math.max(1, A.size + B.size - n); }
export function compareBlocks(oldB, newB) {
  const key = b => b.type.replace('title', 'h1') + '|' + String(b.text || '').replace(/\s+/g, ' ').trim();
  const T = lcsTable(oldB, newB, (x, y) => key(x) === key(y));
  const rows = []; let i = 0, j = 0; const gapL = [], gapR = [];
  const flush = () => {
    let jr = 0;
    gapL.forEach(lb => { let best = -1, bs = 0.28; for (let k = jr; k < gapR.length; k++) { const s = sim(lb.text, gapR[k].text); if (s > bs) { bs = s; best = k; } } if (best >= 0) { for (let k = jr; k < best; k++) rows.push({ kind: 'added', r: gapR[k] }); rows.push({ kind: 'changed', l: lb, r: gapR[best] }); jr = best + 1; } else rows.push({ kind: 'removed', l: lb }); });
    for (let k = jr; k < gapR.length; k++) rows.push({ kind: 'added', r: gapR[k] });
    gapL.length = 0; gapR.length = 0;
  };
  while (i < oldB.length && j < newB.length) { if (key(oldB[i]) === key(newB[j])) { flush(); rows.push({ kind: 'same', l: oldB[i], r: newB[j] }); i++; j++; } else if (T[i + 1][j] >= T[i][j + 1]) gapL.push(oldB[i++]); else gapR.push(newB[j++]); }
  while (i < oldB.length) gapL.push(oldB[i++]); while (j < newB.length) gapR.push(newB[j++]); flush();
  const stats = { changed: rows.filter(r => r.kind === 'changed').length, added: rows.filter(r => r.kind === 'added').length, removed: rows.filter(r => r.kind === 'removed').length };
  return { rows, stats };
}
const typeLabel = t => ({ title: 'Title', h1: 'H1', h2: 'H2', h3: 'H3', li: '• List', oli: '1. List', p: 'Body' })[t] || 'Body';
const blockStyle = t => ({ title: 'font-family:Manrope,sans-serif;font-size:18px;font-weight:800;color:#081A53;line-height:1.25;', h1: 'font-family:Manrope,sans-serif;font-size:16px;font-weight:800;color:#081A53;line-height:1.3;', h2: 'font-family:Manrope,sans-serif;font-size:14.5px;font-weight:800;color:#081A53;line-height:1.3;', h3: 'font-family:Manrope,sans-serif;font-size:13.5px;font-weight:700;color:#1d2226;line-height:1.35;' })[t] || 'font-family:Inter,sans-serif;font-size:12.5px;line-height:1.55;color:#2b3040;';
export function compareHtml(cmp, showSame) {
  const cell = (b, inner, bg, edge) => '<div style="padding:10px 14px;background:' + bg + ';border-left:3px solid ' + edge + ';min-width:0;">' + (b ? '<div style="font-family:Inter,sans-serif;font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8b909c;margin-bottom:3px;">' + typeLabel(b.type) + '</div><div style="' + blockStyle(b.type) + 'white-space:pre-wrap;overflow-wrap:anywhere;">' + (b.type === 'li' || b.type === 'oli' ? '• ' : '') + inner + '</div>' : '') + '</div>';
  const empty = '<div style="background:repeating-linear-gradient(135deg,#f5f6f8 0 6px,#eef0f5 6px 12px);"></div>';
  let out = '', hidden = 0;
  const flushHidden = () => { if (hidden) { out += '<div style="grid-column:1 / -1;padding:6px 14px;font-family:Inter,sans-serif;font-size:11px;font-weight:600;color:#8b909c;text-align:center;background:#f8f9fb;">' + hidden + ' unchanged block' + (hidden > 1 ? 's' : '') + '</div>'; hidden = 0; } };
  cmp.rows.forEach(r => {
    if (r.kind === 'same') { if (!showSame) { hidden++; return; } flushHidden(); out += cell(r.l, esc(r.l.text), '#fff', 'transparent') + cell(r.r, esc(r.r.text), '#fff', 'transparent'); return; }
    flushHidden();
    if (r.kind === 'changed') { const d = wordDiff(r.l.text, r.r.text); out += cell(r.l, d.l, '#FFF7F6', '#E5534B') + cell(r.r, d.r, '#F3FBF5', '#1E9E4A'); }
    else if (r.kind === 'removed') out += cell(r.l, '<span style="background:#FDE2E1;color:#9B1C12;text-decoration:line-through;">' + esc(r.l.text) + '</span>', '#FFF7F6', '#E5534B') + empty;
    else out += empty + cell(r.r, '<span style="background:#CDEFD8;color:#0F5A2A;">' + esc(r.r.text) + '</span>', '#F3FBF5', '#1E9E4A');
  });
  flushHidden();
  return '<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:1px;background:#e0e3ef;border:1px solid #e0e3ef;border-radius:10px;overflow:hidden;">' + out + '</div>';
}

// ---- plain text / markdown / rtf → blocks ----
function _oldTextToBlocks(text) {
  const out = []; const paras = String(text || '').replace(/\r\n?/g, '\n').split(/\n\s*\n/);
  paras.forEach(p => {
    const lines = p.split('\n').map(l => l.trimEnd()).filter(l => l.trim());
    if (!lines.length) return;
    if (lines.every(l => /^\s*([-*+•]|\d{1,2}[.)])\s+/.test(l))) { lines.forEach(l => { const num = /^\s*\d/.test(l); const s = l.replace(/^\s*([-*+•]|\d{1,2}[.)])\s+/, ''); out.push({ type: num ? 'oli' : 'li', runs: [{ text: s, b: false }], text: s }); }); return; }
    const m = lines[0].match(/^(#{1,6})\s+(.*)$/);
    if (m && lines.length === 1) { const lv = m[1].length; const type = lv === 1 ? 'h1' : lv === 2 ? 'h2' : 'h3'; out.push({ type, runs: [{ text: m[2], b: false }], text: m[2] }); return; }
    const s = lines.join(' ').replace(/\s+/g, ' ').trim();
    const allCaps = s.length < 80 && /[A-Z]/.test(s) && s === s.toUpperCase() && !/[.!?]$/.test(s);
    out.push({ type: allCaps ? 'h2' : 'p', runs: [{ text: s, b: false }], text: s });
  });
  return out;
}
export function rtfToText(rtf) {
  return String(rtf || '').replace(/\\par[d]?/g, '\n').replace(/\{\\\*[^{}]*\}/g, '').replace(/\\'([0-9a-f]{2})/gi, (m, x) => String.fromCharCode(parseInt(x, 16))).replace(/\\u(-?\d+)\??/g, (m, n) => String.fromCharCode(n < 0 ? 65536 + Number(n) : Number(n))).replace(/\\[a-z]+-?\d* ?/gi, '').replace(/[{}]/g, '').replace(/\n{3,}/g, '\n\n').trim();
}
export async function fileToBlocks(file, pdfjsLib) {
  const name = String(file.name || '').toLowerCase();
  if (/\.docx$/.test(name)) return WS.docxToBlocks(file);
  if (/\.pptx$/.test(name)) return WS.pptxToBlocks(file);
  if (/\.(txt|md|markdown|text)$/.test(name) || /^text\/plain/.test(file.type || '')) return WS.autoFormat(await file.text());
  if (/\.pdf$/.test(name) || file.type === 'application/pdf') { const j = await extractPdf(new Uint8Array(await file.arrayBuffer()), pdfjsLib); return j.blocks.map(b => ({ type: b.type, runs: b.runs, text: b.text })); }
  if (/\.(html?|xhtml)$/.test(name)) { const d = new DOMParser().parseFromString(await file.text(), 'text/html'); d.querySelectorAll('script,style,nav,footer').forEach(n => n.remove()); return htmlToBlocks(d.body ? d.body.innerHTML : ''); }
  if (/\.rtf$/.test(name)) return textToBlocks(rtfToText(await file.text()));
  if (/\.json$/.test(name)) { try { const j = JSON.parse(await file.text()); if (Array.isArray(j.blocks)) return j.blocks; } catch (e) {} }
  if (/\.doc$/.test(name)) return textToBlocks(docBinaryToText(new Uint8Array(await file.arrayBuffer())));
  if (/\.pages$/.test(name)) return pagesToBlocks(file, pdfjsLib);
  if (/\.(csv|tsv)$/.test(name)) return csvToBlocks(await file.text(), /\.tsv$/.test(name) ? '\t' : null);
  if (/\.gdoc$/.test(name)) { let u = ''; try { u = JSON.parse(await file.text()).url || ''; } catch (e) {} if (!u) throw new Error('This .gdoc shortcut has no link inside.'); return googleDocToBlocks(u); }
  return textToBlocks(await file.text());
}

// ---- two full documents, side by side, with inline highlights ----
export function compareDocsHtml(cmp, oldB, newB) {
  const ix = (arr, b) => arr ? arr.indexOf(b) : -1;
  const del = s => '<span data-hl="del" style="background:#FDE2E1;color:#9B1C12;text-decoration:line-through;text-decoration-color:rgba(155,28,18,.55);border-radius:2px;">' + s + '</span>';
  const ins = s => '<span data-hl="ins" style="background:#CDEFD8;color:#0F5A2A;border-radius:2px;">' + s + '</span>';
  const bstyle = t => ({ title: 'margin:0 0 12px;font-family:Manrope,sans-serif;font-size:22px;line-height:1.2;font-weight:800;color:#081A53;', h1: 'margin:18px 0 8px;font-family:Manrope,sans-serif;font-size:18px;line-height:1.25;font-weight:800;color:#081A53;', h2: 'margin:16px 0 6px;font-family:Manrope,sans-serif;font-size:15.5px;line-height:1.3;font-weight:800;color:#081A53;', h3: 'margin:14px 0 5px;font-family:Manrope,sans-serif;font-size:14px;line-height:1.35;font-weight:700;color:#1d2226;' })[t] || 'margin:0 0 9px;font-family:Inter,sans-serif;font-size:13px;line-height:1.6;color:#2b3040;';
  const wrap = (row, kind, b, inner) => { const li = b.type === 'li' || b.type === 'oli'; const edge = kind === 'same' ? 'transparent' : kind === 'removed' ? '#E5534B' : kind === 'added' ? '#1E9E4A' : '#F0A020'; const bi = ix(newB, b), lix = ix(oldB, b); return '<div data-row="' + row + '" data-kind="' + kind + '"' + (bi >= 0 ? ' data-bi="' + bi + '"' : '') + (lix >= 0 ? ' data-li="' + lix + '"' : '') + ' style="position:relative;padding:2px 10px 2px 12px;margin:0 -12px;border-left:3px solid ' + edge + ';border-radius:2px;cursor:pointer;"><div style="' + bstyle(b.type) + (li ? 'padding-left:16px;text-indent:-12px;' : '') + 'white-space:pre-wrap;overflow-wrap:anywhere;">' + (li ? '•&nbsp; ' : '') + inner + '</div></div>'; };
  const marker = (row, kind, text) => '<div data-row="' + row + '" data-kind="' + kind + '" style="margin:4px -12px 8px;padding:5px 12px;border-left:3px solid ' + (kind === 'added' ? '#1E9E4A' : '#E5534B') + ';background:' + (kind === 'added' ? '#F3FBF5' : '#FFF7F6') + ';font-family:Inter,sans-serif;font-size:10.5px;font-weight:700;color:' + (kind === 'added' ? '#1E7B3C' : '#B4291C') + ';cursor:pointer;">' + text + '</div>';
  let L = '', R = ''; const changes = [];
  let i = 0;
  while (i < cmp.rows.length) {
    const r = cmp.rows[i];
    if (r.kind === 'same') { L += wrap(i, 'same', r.l, esc(r.l.text)); R += wrap(i, 'same', r.r, esc(r.r.text)); i++; continue; }
    if (r.kind === 'changed') { changes.push(i); const d = wordDiff(r.l.text, r.r.text); L += wrap(i, 'changed', r.l, d.l); R += wrap(i, 'changed', r.r, d.r); i++; continue; }
    // collapse consecutive added/removed runs so the opposite side gets one marker
    const start = i; let nAdd = 0, nRem = 0;
    while (i < cmp.rows.length && (cmp.rows[i].kind === 'added' || cmp.rows[i].kind === 'removed')) { const x = cmp.rows[i]; if (x.kind === 'removed') { nRem++; L += wrap(i, 'removed', x.l, del(esc(x.l.text))); } else { nAdd++; R += wrap(i, 'added', x.r, ins(esc(x.r.text))); } i++; }
    changes.push(start);
    if (nAdd && !nRem) L += marker(start, 'added', '+ ' + nAdd + ' block' + (nAdd > 1 ? 's' : '') + ' added in the uploaded version →');
    if (nRem && !nAdd) R += marker(start, 'removed', '← ' + nRem + ' block' + (nRem > 1 ? 's' : '') + ' removed from the current version');
  }
  return { left: L || '<div style="color:#8b909c;font-size:13px;">Empty</div>', right: R || '<div style="color:#8b909c;font-size:13px;">Empty</div>', changes };
}

// ---- merge user-picked content into the current document ----
const wset = s => (String(s || '').toLowerCase().match(/[\w']+/g) || []);
function score(pick, target) {
  const P = wset(pick), T = new Set(wset(target)); if (!P.length || !T.size) return 0;
  let n = 0; const Ps = new Set(P); Ps.forEach(w => { if (T.has(w)) n++; });
  const jac = n / (Ps.size + T.size - n), cover = n / Ps.size;
  return Math.max(jac, cover * 0.85 * Math.min(1, Ps.size / 4));
}
// picks: [{ type, runs, text, srcIdx, snippet }] in uploaded-document order.
// cur: current blocks. orig: original extraction blocks (optional). pairs: compareBlocks(cur, uploaded) result.
export function mergeSelected(cur, picks, orig, pairs) {
  const out = cur.map(b => ({ ...b, _st: 'same' }));
  const origOf = new Map();
  if (orig && orig.length) { const c2 = compareBlocks(orig, cur); c2.rows.forEach(r => { if ((r.kind === 'same' || r.kind === 'changed') && r.l && r.r) origOf.set(r.r, r.l); }); }
  const newToCur = new Map(); if (pairs) pairs.rows.forEach(r => { if ((r.kind === 'same' || r.kind === 'changed') && r.l && r.r) newToCur.set(r.r, r.l); });
  const curIdx = b => out.findIndex(o => o._src === b || (!o._src && o.text === b.text && o.type === b.type));
  out.forEach((o, k) => { o._src = cur[k]; });
  const replaced = new Set(); let nRep = 0, nIns = 0; const report = [];
  picks.forEach(p => {
    let best = -1, bs = 0;
    out.forEach((o, k) => { if (o._st === 'inserted' || (!p.snippet && replaced.has(k))) return; const ob = o._src ? origOf.get(o._src) : null; let s = Math.max(score(p.text, o.text), o._was ? score(p.text, o._was) : 0, ob ? score(p.text, ob.text) : 0); if (p.type && o.type && (p.type === o.type || (p.type.startsWith('h') && o.type.startsWith('h')) || (p.type === 'title' && o.type === 'h1'))) s += 0.04; if (p.direct && p.direct === o._src) s += 1; if (s > bs) { bs = s; best = k; } });
    if (best >= 0 && bs >= 0.3) {
      const o = out[best]; const was = o._st === 'replaced' ? o._was : o.text;
      let text = p.text, runs = p.runs;
      if (p.snippet) { const base = o.text; const wasW = wset(base).length, pw = wset(p.text).length; if (pw < wasW * 0.6) { const merged = mergeSnippet(base, p.text); text = merged; runs = [{ text: merged, b: false }]; } }
      out[best] = { type: p.snippet ? o.type : (p.type || o.type), runs: runs || [{ text, b: false }], text, _st: 'replaced', _was: was, _src: o._src, _score: +bs.toFixed(2) };
      replaced.add(best); nRep++; report.push({ action: 'replaced', at: best, from: was, to: text, score: +bs.toFixed(2) });
    } else {
      let anchor = -1;
      if (p.prevNew) { for (let q = p.prevNew.length - 1; q >= 0 && anchor < 0; q--) { const cb = newToCur.get(p.prevNew[q]); if (cb) anchor = curIdx(cb); } }
      let at = anchor >= 0 ? anchor + 1 : out.length; while (at < out.length && out[at]._st === 'inserted') at++;
      out.splice(at, 0, { type: p.type || 'p', runs: p.runs || [{ text: p.text, b: false }], text: p.text, _st: 'inserted' }); nIns++; report.push({ action: 'inserted', at, to: p.text });
    }
  });
  return { blocks: out, replaced: nRep, inserted: nIns, report };
}
// Replace the sentence(s) in a paragraph that best match a short snippet.
function mergeSnippet(para, snip) {
  const sents = String(para).match(/[^.!?]+[.!?]*\s*/g) || [para];
  if (sents.length < 2) return snip;
  let best = 0, bs = -1; sents.forEach((s, k) => { const v = score(snip, s); if (v > bs) { bs = v; best = k; } });
  if (bs < 0.2) return para.trim() + ' ' + snip.trim();
  sents[best] = snip.trim() + (/\s$/.test(sents[best]) ? ' ' : ''); return sents.join('').trim();
}
export function mergedToHtml(blocks) {
  const html = blocksToHtml(blocks.map(b => ({ type: b.type, runs: b.runs, text: b.text })));
  const div = document.createElement('div'); div.innerHTML = html;
  const els = []; div.childNodes.forEach(n => { if (n.nodeType !== 1) return; if (n.tagName === 'UL' || n.tagName === 'OL') n.querySelectorAll(':scope > li').forEach(li => els.push(li)); else els.push(n); });
  els.forEach((el, k) => { const b = blocks[k]; if (!b || b._st === 'same') return; el.setAttribute('data-merge', b._st); el.style.background = b._st === 'inserted' ? '#E9F8EE' : '#FFF6E0'; el.style.boxShadow = 'inset 3px 0 0 ' + (b._st === 'inserted' ? '#1E9E4A' : '#F0A020'); el.style.borderRadius = '3px'; el.style.padding = '2px 6px'; el.title = b._st === 'inserted' ? 'Inserted from the uploaded file' : 'Replaced. Was: ' + String(b._was || '').slice(0, 300); });
  return div.innerHTML;
}

// Legacy Word 97-2003 (.doc): pull readable text runs out of the binary (good enough for comparing copy).
export function docBinaryToText(bytes) {
  const runs = (str) => (str.match(/[\x20-\x7E\u00A0-\u024F\u2018-\u201F\u2022\u2013\u2014\r\n\t]{12,}/g) || []).map(s => s.replace(/[\t ]+/g, ' ').trim()).filter(s => (s.match(/[A-Za-z]/g) || []).length > s.length * 0.5);
  let u16 = ''; for (let i = 0; i + 1 < bytes.length; i += 2) u16 += String.fromCharCode(bytes[i] | (bytes[i + 1] << 8));
  let l1 = ''; for (let i = 0; i < bytes.length; i++) l1 += String.fromCharCode(bytes[i]);
  const a = runs(u16), b = runs(l1); const pick = a.join('').length > b.join('').length ? a : b;
  return pick.join('\n').replace(/\r/g, '\n').split('\n').map(s => s.trim()).filter(Boolean).join('\n\n');
}
// Apple Pages: the package (zip) carries a PDF preview in most versions.
async function pagesToBlocks(file, pdfjsLib) {
  const JSZip = await loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js', 'JSZip');
  let zip; try { zip = await JSZip.loadAsync(await file.arrayBuffer()); } catch (e) { throw new Error('Could not open this Pages file. In Pages choose File → Export To → Word or PDF and upload that instead.'); }
  const pdfEntry = Object.keys(zip.files).find(n => /(^|\/)(QuickLook\/)?Preview\.pdf$/i.test(n));
  if (pdfEntry) { const bytes = await zip.file(pdfEntry).async('uint8array'); const j = await extractPdf(bytes, pdfjsLib); return j.blocks.map(b => ({ type: b.type, runs: b.runs, text: b.text })); }
  const xml = Object.keys(zip.files).find(n => /index\.xml$/i.test(n));
  if (xml) { const s = await zip.file(xml).async('string'); const d = new DOMParser().parseFromString(s, 'text/xml'); return textToBlocks(Array.from(d.getElementsByTagName('*')).filter(n => /:p$|^sf:p$/i.test(n.tagName)).map(n => n.textContent.trim()).filter(Boolean).join('\n\n')); }
  throw new Error('This Pages file has no readable preview. In Pages choose File → Export To → Word or PDF and upload that instead.');
}
export function csvToBlocks(text, delim) {
  const src = String(text || '').replace(/\r\n?/g, '\n'); const d = delim || ((src.split('\n')[0].match(/\t/g) || []).length > (src.split('\n')[0].match(/,/g) || []).length ? '\t' : ',');
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < src.length; i++) { const c = src[i]; if (q) { if (c === '"' && src[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; } else if (c === '"') q = true; else if (c === d) { row.push(cell); cell = ''; } else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; } else cell += c; }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const clean = rows.map(r => r.map(x => x.trim())).filter(r => r.some(Boolean)); if (!clean.length) return [];
  const head = clean[0]; const out = [];
  clean.slice(1).forEach(r => { const vals = r.filter(Boolean); if (vals.length === 1) { out.push({ type: 'p', runs: [{ text: vals[0], b: false }], text: vals[0] }); return; } const s = r.map((v, k) => v ? ((head[k] ? head[k] + ': ' : '') + v) : '').filter(Boolean).join(' · '); if (s) out.push({ type: 'p', runs: [{ text: s, b: false }], text: s }); });
  if (clean.length === 1 || !out.length) clean.forEach(r => { const s = r.filter(Boolean).join(' · '); if (s) out.push({ type: 'p', runs: [{ text: s, b: false }], text: s }); });
  return out;
}
// Google Docs: works for docs shared "Anyone with the link"; otherwise download as .docx.
export async function googleDocToBlocks(url) {
  const m = String(url || '').match(/\/document\/d\/([a-zA-Z0-9_-]{20,})/); if (!m) throw new Error('That does not look like a Google Docs link.');
  const tries = ['https://docs.google.com/document/d/' + m[1] + '/export?format=html', 'https://docs.google.com/document/d/' + m[1] + '/export?format=txt'];
  for (const u of tries) { try { const r = await fetch(u, { credentials: 'omit' }); if (!r.ok) continue; const s = await r.text(); if (/format=html/.test(u)) { const d = new DOMParser().parseFromString(s, 'text/html'); d.querySelectorAll('style,script').forEach(n => n.remove()); const b = htmlToBlocks(d.body ? d.body.innerHTML : ''); if (b.length) return b; } else { const b = textToBlocks(s); if (b.length) return b; } } catch (e) {} }
  throw new Error('Google blocked reading that doc directly. Either share it as "Anyone with the link can view", or in Google Docs choose File → Download → Microsoft Word (.docx) and upload the file.');
}

// ---- Word basic text styles (see word-styles.js) ----
export function styleEditor(root) { return WS.styleEditor(root); }
export function blocksToHtml(blocks) { return WS.blocksToHtml(blocks); }
export function htmlToBlocks(html) { return WS.htmlToBlocks(html); }
export function buildDocx(blocks, title) { return WS.buildDocx(blocks, title); }
export function textToBlocks(text) { return WS.autoFormat(text); }
export function docxToHtml(file) { return WS.docxToHtml(file); }
export function refineBlocks(blocks) { return WS.refineBlocks(blocks); }
export const PARA_STYLES = WS.PARA_STYLES, CHAR_STYLES = WS.CHAR_STYLES, ST_STYLES = WS.ST, CS_STYLES = WS.CS;
