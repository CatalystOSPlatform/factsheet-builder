// Microsoft Word basic text styles for the Catalyst text-document editor and .docx export.
// Paragraph block types: p, nospacing, title, subtitle, h1–h9, quote, iquote, caption, li, oli.
// Run flags: b (Strong), i (Emphasis), ie (Intense Emphasis), se (Subtle Emphasis), bt (Book Title).
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const xesc = s => esc(s).replace(/"/g, '&quot;');
function loadScript(src, g) {
  if (window[g]) return Promise.resolve(window[g]);
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = () => res(window[g]); s.onerror = rej; document.head.appendChild(s); });
}

export const PARA_STYLES = [
  ['Normal', 'p'], ['NoSpacing', 'nospacing', 'No Spacing'], ['Title', 'title'], ['Subtitle', 'subtitle'],
  ['Heading1', 'h1', 'Heading 1'], ['Heading2', 'h2', 'Heading 2'], ['Heading3', 'h3', 'Heading 3'], ['Heading4', 'h4', 'Heading 4'], ['Heading5', 'h5', 'Heading 5'],
  ['Heading6', 'h6', 'Heading 6'], ['Heading7', 'h7', 'Heading 7'], ['Heading8', 'h8', 'Heading 8'], ['Heading9', 'h9', 'Heading 9'],
  ['Quote', 'quote'], ['IntenseQuote', 'iquote', 'Intense Quote'], ['Caption', 'caption'],
].map(([id, type, name]) => ({ id, type, name: name || id }));
export const CHAR_STYLES = [
  { id: 'Emphasis', flag: 'i', name: 'Emphasis' }, { id: 'IntenseEmphasis', flag: 'ie', name: 'Intense Emphasis' }, { id: 'Strong', flag: 'b', name: 'Strong' },
  { id: 'SubtleEmphasis', flag: 'se', name: 'Subtle Emphasis' }, { id: 'BookTitle', flag: 'bt', name: 'Book Title' },
];
const TYPE_BY_ID = {}; PARA_STYLES.forEach(s => { TYPE_BY_ID[s.id] = s.type; });
const ID_BY_TYPE = {}; PARA_STYLES.forEach(s => { ID_BY_TYPE[s.type] = s.id; });

const H = "font-family:Manrope,sans-serif;", B = "font-family:Inter,sans-serif;";
export const ST = {
  p: B + 'margin:0 0 10px;font-size:14px;line-height:1.6;color:#2b3040;',
  nospacing: B + 'margin:0;font-size:14px;line-height:1.45;color:#2b3040;',
  title: H + 'margin:0 0 6px;font-size:32px;line-height:1.12;font-weight:800;color:#081A53;letter-spacing:-.02em;',
  subtitle: B + 'margin:0 0 22px;font-size:17px;line-height:1.4;font-weight:400;color:#5a6178;letter-spacing:.01em;',
  h1: H + 'margin:26px 0 10px;font-size:24px;line-height:1.2;font-weight:800;color:#081A53;',
  h2: H + 'margin:22px 0 8px;font-size:20px;line-height:1.25;font-weight:800;color:#081A53;',
  h3: H + 'margin:18px 0 6px;font-size:17px;line-height:1.3;font-weight:700;color:#081A53;',
  h4: H + 'margin:16px 0 6px;font-size:15px;line-height:1.35;font-weight:700;font-style:italic;color:#1d2226;',
  h5: H + 'margin:14px 0 5px;font-size:14px;line-height:1.35;font-weight:700;color:#6818F8;',
  h6: H + 'margin:12px 0 4px;font-size:13.5px;line-height:1.4;font-weight:600;font-style:italic;color:#4a5170;',
  h7: H + 'margin:12px 0 4px;font-size:13px;line-height:1.4;font-weight:600;font-style:italic;color:#4a5170;',
  h8: H + 'margin:12px 0 4px;font-size:12px;line-height:1.4;font-weight:700;color:#4a5170;text-transform:uppercase;letter-spacing:.06em;',
  h9: H + 'margin:10px 0 4px;font-size:12px;line-height:1.4;font-weight:600;font-style:italic;color:#6b7180;text-transform:uppercase;letter-spacing:.04em;',
  quote: B + 'margin:16px 48px;font-size:15px;line-height:1.6;font-style:italic;color:#3a4159;text-align:center;',
  iquote: B + 'margin:20px 40px;padding:12px 20px;font-size:15.5px;line-height:1.55;font-style:italic;font-weight:600;color:#6818F8;text-align:center;border-top:1px solid #c9bdf5;border-bottom:1px solid #c9bdf5;',
  caption: B + 'margin:4px 0 14px;font-size:11.5px;line-height:1.45;font-style:italic;color:#6b7180;',
  ul: B + 'margin:0 0 10px;padding-left:24px;font-size:14px;line-height:1.6;color:#2b3040;',
  li: 'margin:0 0 4px;',
};
export const CS = {
  IntenseEmphasis: 'font-style:italic;font-weight:700;color:#6818F8;',
  SubtleEmphasis: 'font-style:italic;color:#6b7180;',
  BookTitle: 'font-weight:700;font-style:italic;letter-spacing:.03em;',
};

// ---- HTML <-> blocks ----
function typeOf(el) {
  const ws = el.getAttribute && el.getAttribute('data-ws'); if (ws && TYPE_BY_ID[ws]) return TYPE_BY_ID[ws];
  const t = el.tagName.toLowerCase();
  if (t === 'h1') return el.getAttribute('data-title') ? 'title' : 'h1';
  if (/^h[2-6]$/.test(t)) return t;
  if (t === 'blockquote') return 'quote';
  return 'p';
}
const runsHtml = runs => (runs || []).map(r => {
  let s = esc(r.text).replace(/\n/g, '<br>');
  if (r.ie) s = '<span data-cs="IntenseEmphasis" style="' + CS.IntenseEmphasis + '">' + s + '</span>';
  else if (r.se) s = '<span data-cs="SubtleEmphasis" style="' + CS.SubtleEmphasis + '">' + s + '</span>';
  else if (r.bt) s = '<span data-cs="BookTitle" style="' + CS.BookTitle + '">' + s + '</span>';
  if (r.i) s = '<em>' + s + '</em>'; if (r.b) s = '<strong>' + s + '</strong>';
  return s;
}).join('');
function blockTag(type) {
  if (type === 'title') return ['h1', ' data-title="1" data-ws="Title"'];
  if (/^h[1-6]$/.test(type)) return [type, ' data-ws="' + ID_BY_TYPE[type] + '"'];
  if (/^h[7-9]$/.test(type)) return ['p', ' data-ws="' + ID_BY_TYPE[type] + '" role="heading" aria-level="' + type.slice(1) + '"'];
  if (type === 'quote' || type === 'iquote') return ['blockquote', ' data-ws="' + ID_BY_TYPE[type] + '"'];
  if (ID_BY_TYPE[type] && type !== 'p') return ['p', ' data-ws="' + ID_BY_TYPE[type] + '"'];
  return ['p', ''];
}
export function blocksToHtml(blocks) {
  let out = '', list = null;
  const close = () => { if (list) { out += '</' + list + '>'; list = null; } };
  (blocks || []).forEach(b => {
    const runs = b.runs && b.runs.length ? b.runs : [{ text: b.text || '' }];
    if (b.type === 'li' || b.type === 'oli') { const tag = b.type === 'li' ? 'ul' : 'ol'; if (list !== tag) { close(); out += '<' + tag + ' style="' + ST.ul + '">'; list = tag; } out += '<li style="' + ST.li + '">' + runsHtml(runs) + '</li>'; return; }
    close(); const type = ST[b.type] ? b.type : 'p'; const [tag, attrs] = blockTag(type);
    out += '<' + tag + attrs + ' style="' + ST[type] + '">' + runsHtml(runs) + '</' + tag + '>';
  });
  close(); return out || '<p style="' + ST.p + '"><br></p>';
}
function inlineRuns(node, fmt, out) {
  node.childNodes.forEach(n => {
    if (n.nodeType === 3) { if (n.nodeValue) out.push(Object.assign({ text: n.nodeValue.replace(/\s+/g, ' ') }, fmt)); return; }
    if (n.nodeType !== 1) return; const t = n.tagName.toLowerCase();
    if (t === 'br') { out.push(Object.assign({ text: '\n' }, fmt)); return; }
    const fw = n.style && n.style.fontWeight; const cs = n.getAttribute('data-cs');
    const f = Object.assign({}, fmt);
    if (t === 'b' || t === 'strong' || fw === 'bold' || Number(fw) >= 600) f.b = true;
    if (t === 'i' || t === 'em' || (n.style && n.style.fontStyle === 'italic' && !cs)) f.i = true;
    if (cs === 'IntenseEmphasis') f.ie = true; if (cs === 'SubtleEmphasis') f.se = true; if (cs === 'BookTitle') f.bt = true;
    inlineRuns(n, f, out);
  });
  return out;
}
const cleanFlags = r => { const o = { text: r.text }; ['b', 'i', 'ie', 'se', 'bt'].forEach(k => { if (r[k]) o[k] = true; }); if (!o.b) o.b = false; return o; };
export function htmlToBlocks(html) {
  const root = document.createElement('div'); root.innerHTML = html; const blocks = [];
  const add = (type, el) => { const runs = inlineRuns(el, {}, []).filter(r => r.text).map(cleanFlags); const text = runs.map(r => r.text).join('').trim(); if (text) blocks.push({ type, runs, text }); };
  const walk = parent => parent.childNodes.forEach(n => {
    if (n.nodeType === 3) { const v = n.nodeValue.trim(); if (v) blocks.push({ type: 'p', runs: [{ text: v, b: false }], text: v }); return; }
    if (n.nodeType !== 1) return; const t = n.tagName.toLowerCase();
    if (t === 'ul' || t === 'ol') { n.querySelectorAll(':scope > li').forEach(li => add(t === 'ul' ? 'li' : 'oli', li)); return; }
    if ((t === 'div' || t === 'section' || t === 'article') && n.querySelector('p,h1,h2,h3,h4,h5,h6,ul,ol,div,blockquote')) { walk(n); return; }
    if (t === 'blockquote' && !n.getAttribute('data-ws') && n.querySelector('p')) { n.querySelectorAll(':scope > p').forEach(p => add('quote', p)); return; }
    add(typeOf(n), n);
  });
  walk(root); return blocks;
}
export function styleEditor(root) {
  if (!root) return;
  root.querySelectorAll('h1,h2,h3,h4,h5,h6,p,blockquote,ul,ol,li,div').forEach(el => {
    const tag = el.tagName.toLowerCase();
    const k = tag === 'ul' || tag === 'ol' ? 'ul' : tag === 'li' ? 'li' : tag === 'div' ? 'p' : typeOf(el);
    if (ST[k] && el.getAttribute('style') !== ST[k]) el.setAttribute('style', ST[k]);
  });
  root.querySelectorAll('span[data-cs]').forEach(sp => { const v = CS[sp.getAttribute('data-cs')]; if (v && sp.getAttribute('style') !== v) sp.setAttribute('style', v); });
}

// ---- smart formatting for plain text ----
export function inlineMarkup(s) {
  const runs = []; const re = /(\*\*|__)(.+?)\1|(\*|_)(?!\s)(.+?)(?<!\s)\3/g; let last = 0, m;
  while ((m = re.exec(s))) { if (m.index > last) runs.push({ text: s.slice(last, m.index), b: false }); if (m[1]) runs.push({ text: m[2], b: true }); else runs.push({ text: m[4], b: false, i: true }); last = re.lastIndex; }
  if (last < s.length) runs.push({ text: s.slice(last), b: false });
  return runs.length ? runs : [{ text: s, b: false }];
}
const mk = (type, s) => { const runs = inlineMarkup(s); return { type, runs, text: runs.map(r => r.text).join('') }; };
const LIST = /^\s*([-*+•●▪◦‣–]|\(?\d{1,2}[.)]|\(?[a-z][.)])\s+/;
const CAPTION = /^(figure|fig\.|table|chart|exhibit|graph|image|photo|illustration|source|note)\s*(\d+[a-z]?|[ivx]+)?\s*[:.\-–—]/i;
const terminal = s => /[.!?;,]["”’)]?$/.test(s);
const words = s => (s.match(/\S+/g) || []).length;
function headingLike(s) { return s.length <= 80 && words(s) <= 12 && !terminal(s) && /^[\p{Lu}\d"“(]/u.test(s); }
export function autoFormat(text) {
  const src = String(text || '').replace(/\r\n?/g, '\n').replace(/\t/g, '    ').replace(/\u00a0/g, ' ');
  let paras = src.split(/\n\s*\n/);
  if (paras.length < 3 && src.split('\n').length > 6) paras = src.split('\n');
  const out = [];
  paras.forEach(p => {
    const lines = p.split('\n').map(l => l.replace(/\s+$/, '')).filter(l => l.trim());
    if (!lines.length) return;
    if (lines.length > 1 && lines.every(l => LIST.test(l))) { lines.forEach(l => out.push(mk(/^\s*\(?\d/.test(l) ? 'oli' : 'li', l.replace(LIST, '')))); return; }
    if (lines.length > 1 && LIST.test(lines[1]) && lines.slice(1).every(l => LIST.test(l))) { out.push(mk(lines[0].trim().endsWith(':') ? 'h3' : 'p', lines[0].trim())); lines.slice(1).forEach(l => out.push(mk(/^\s*\(?\d/.test(l) ? 'oli' : 'li', l.replace(LIST, '')))); return; }
    if (lines.length > 1 && lines.length <= 4 && lines.every(l => l.trim().length <= 90 && !terminal(l.trim()))) { lines.forEach(l => out.push(mk(out.length ? 'h2' : 'p', l.trim()))); return; }
    const one = lines.join(' ').replace(/\s+/g, ' ').trim();
    let m;
    if ((m = one.match(/^(#{1,9})\s+(.+)$/))) { out.push(mk('h' + m[1].length, m[2])); return; }
    if ((m = one.match(/^>>\s*(.+)$/))) { out.push(mk('iquote', m[1])); return; }
    if ((m = one.match(/^>\s*(.+)$/))) { out.push(mk('quote', m[1])); return; }
    if (/^["“].{20,400}["”](\s*[—–-]\s*.{2,60})?$/.test(one)) { out.push(mk(/[—–-]\s*\S/.test(one.replace(/^["“].*["”]/, '')) ? 'iquote' : 'quote', one)); return; }
    if (CAPTION.test(one) && one.length <= 220) { out.push(mk('caption', one)); return; }
    if ((m = one.match(/^(\d+(?:\.\d+){0,8})\.?\s+(.{2,80})$/)) && !terminal(m[2]) && /^[\p{Lu}]/u.test(m[2])) { out.push(mk('h' + Math.min(9, m[1].split('.').filter(Boolean).length), one)); return; }
    if (one.length <= 70 && /[A-Z]/.test(one) && one === one.toUpperCase() && !terminal(one)) { out.push(mk('h1', one.toLowerCase().replace(/(^|[\s\-–—/(])(\p{L})/gu, (m, p, c) => p + c.toUpperCase()).replace(/\b(And|Or|Of|The|A|An|In|On|For|To|At|By|With)\b/g, (m, x, i) => i ? x.toLowerCase() : x))); return; }
    if (headingLike(one) && lines.length === 1) { out.push(mk(one.endsWith(':') ? 'h3' : 'h2', one.replace(/:$/, ''))); return; }
    if (lines.length === 1 && LIST.test(one)) { out.push(mk(/^\s*\(?\d/.test(one) ? 'oli' : 'li', one.replace(LIST, ''))); return; }
    out.push(mk('p', one));
  });
  return finishHierarchy(out);
}
// Title/subtitle detection, collapse stray headings, and promote levels so the hierarchy starts at Heading 1.
export function finishHierarchy(blocks) {
  const b = blocks.slice(); if (!b.length) return b;
  const isHead = x => /^h\d$/.test(x.type);
  if (!b.some(x => x.type === 'title')) {
    const f = b[0]; if ((isHead(f) || f.type === 'p') && f.text.length <= 110 && !terminal(f.text)) f.type = 'title';
  }
  const ti = b.findIndex(x => x.type === 'title');
  if (ti >= 0 && b[ti + 1] && !b.some(x => x.type === 'subtitle')) { const s = b[ti + 1], n = b[ti + 2]; const realSection = isHead(s) && n && !isHead(n) && n.type !== 'subtitle'; if ((s.type === 'p' || isHead(s)) && s.text.length <= 160 && words(s.text) <= 24 && !terminal(s.text) && !realSection) s.type = 'subtitle'; }
  for (let k = 0; k < b.length; k++) { const x = b[k], n = b[k + 1]; if (isHead(x) && n && isHead(n) && x.type === n.type && x.text.length > 50) x.type = 'p'; }
  for (let k = b.length - 1; k >= 0; k--) { if (isHead(b[k]) && (!b[k + 1] || isHead(b[k + 1]) && Number(b[k + 1].type.slice(1)) <= Number(b[k].type.slice(1)))) { if (k === b.length - 1) b[k].type = 'p'; } else break; }
  const lv = b.filter(isHead).map(x => Number(x.type.slice(1))); if (lv.length) { const min = Math.min(...lv); if (min > 1) b.forEach(x => { if (isHead(x)) x.type = 'h' + Math.max(1, Number(x.type.slice(1)) - (min - 1)); }); }
  let prev = 0; b.forEach(x => { if (!isHead(x)) return; let n = Number(x.type.slice(1)); if (n > prev + 1) n = prev + 1; x.type = 'h' + n; prev = n; });
  return b;
}
// Word-processor output with no real styles (everything Normal) gets the same smart pass.
export function ensureStructure(blocks) {
  const structured = blocks.some(x => x.type !== 'p' && x.type !== 'li' && x.type !== 'oli');
  if (structured) return finishHierarchy(blocks);
  const keepRuns = new Map(blocks.map(x => [x.text, x.runs]));
  return autoFormat(blocks.map(x => (x.type === 'li' ? '- ' : x.type === 'oli' ? '1. ' : '') + x.text).join('\n\n')).map(x => { const r = keepRuns.get(x.text); return r && x.type !== 'li' && x.type !== 'oli' ? Object.assign(x, { runs: r }) : x; });
}

// ---- .docx in (mammoth) with full Word style mapping ----
export async function docxToHtml(file) {
  const mammoth = await loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js', 'mammoth');
  const map = ["p[style-name='Title'] => h1.ws-Title:fresh", "p[style-name='Subtitle'] => p.ws-Subtitle:fresh", "p[style-name='No Spacing'] => p.ws-NoSpacing:fresh",
    "p[style-name='Quote'] => blockquote.ws-Quote:fresh", "p[style-name='Intense Quote'] => blockquote.ws-IntenseQuote:fresh", "p[style-name='Caption'] => p.ws-Caption:fresh",
    "p[style-name='Heading 7'] => p.ws-Heading7:fresh", "p[style-name='Heading 8'] => p.ws-Heading8:fresh", "p[style-name='Heading 9'] => p.ws-Heading9:fresh",
    "r[style-name='Intense Emphasis'] => span.cs-IntenseEmphasis", "r[style-name='Subtle Emphasis'] => span.cs-SubtleEmphasis", "r[style-name='Book Title'] => span.cs-BookTitle",
    "r[style-name='Strong'] => strong", "r[style-name='Emphasis'] => em"];
  const r = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() }, { styleMap: map });
  return String(r.value || '').replace(/<img[^>]*>/g, '').replace(/<h1 class="ws-Title">/g, '<h1 data-title="1" data-ws="Title">').replace(/class="ws-(\w+)"/g, 'data-ws="$1"').replace(/class="cs-(\w+)"/g, 'data-cs="$1"');
}
export async function docxToBlocks(file) { return ensureStructure(htmlToBlocks(await docxToHtml(file))); }

// ---- .pptx in: slide titles become headings, body placeholders become lists or paragraphs ----
export async function pptxToBlocks(file) {
  const JSZip = await loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js', 'JSZip');
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const slides = Object.keys(zip.files).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => Number(a.match(/(\d+)\.xml$/)[1]) - Number(b.match(/(\d+)\.xml$/)[1]));
  const A = 'http://schemas.openxmlformats.org/drawingml/2006/main', P = 'http://schemas.openxmlformats.org/presentationml/2006/main';
  const out = [];
  const paraRuns = ap => { const runs = []; Array.from(ap.getElementsByTagNameNS(A, 'r')).forEach(r => { const t = Array.from(r.getElementsByTagNameNS(A, 't')).map(x => x.textContent).join(''); if (!t) return; const pr = r.getElementsByTagNameNS(A, 'rPr')[0]; runs.push({ text: t, b: !!(pr && pr.getAttribute('b') === '1'), ...(pr && pr.getAttribute('i') === '1' ? { i: true } : {}) }); }); return runs; };
  for (let si = 0; si < slides.length; si++) {
    const doc = new DOMParser().parseFromString(await zip.file(slides[si]).async('string'), 'application/xml');
    const shapes = Array.from(doc.getElementsByTagNameNS(P, 'sp'));
    const info = shapes.map(sp => { const ph = sp.getElementsByTagNameNS(P, 'ph')[0]; const type = ph ? (ph.getAttribute('type') || 'body') : 'free'; const paras = Array.from(sp.getElementsByTagNameNS(A, 'p')).map(ap => { const pPr = ap.getElementsByTagNameNS(A, 'pPr')[0]; const runs = paraRuns(ap); return { runs, text: runs.map(r => r.text).join('').trim(), lvl: Number(pPr && pPr.getAttribute('lvl') || 0), noBullet: !!(pPr && pPr.getElementsByTagNameNS(A, 'buNone')[0]) }; }).filter(x => x.text); return { type, paras }; }).filter(x => x.paras.length);
    const ttl = info.find(x => x.type === 'title' || x.type === 'ctrTitle');
    if (ttl) out.push({ type: si === 0 && ttl.type === 'ctrTitle' ? 'title' : 'h1', runs: ttl.paras[0].runs, text: ttl.paras.map(p => p.text).join(' ') });
    info.filter(x => x !== ttl).forEach(x => {
      if (x.type === 'subTitle') { x.paras.forEach(p => out.push({ type: si === 0 ? 'subtitle' : 'h2', runs: p.runs, text: p.text })); return; }
      if (x.type === 'sldNum' || x.type === 'dt' || x.type === 'ftr') return;
      const asList = x.type === 'body' && x.paras.length > 1 && !x.paras.every(p => p.noBullet);
      x.paras.forEach(p => out.push({ type: asList && !p.noBullet ? 'li' : (p.lvl > 0 ? 'li' : (x.type === 'free' && p.text.length < 60 && !terminal(p.text) && x.paras.length === 1 ? 'h3' : 'p')), runs: p.runs, text: p.text }));
    });
    Array.from(doc.getElementsByTagNameNS(A, 'tbl')).forEach(tbl => Array.from(tbl.getElementsByTagNameNS(A, 'tr')).forEach(tr => { const t = Array.from(tr.getElementsByTagNameNS(A, 'tc')).map(tc => Array.from(tc.getElementsByTagNameNS(A, 't')).map(x => x.textContent).join('').trim()).join('  |  '); if (t.replace(/[|\s]/g, '')) out.push({ type: 'nospacing', runs: [{ text: t, b: false }], text: t }); }));
  }
  return finishHierarchy(out);
}

// ---- .docx out with every Word basic style defined ----
function runXml(r) {
  const rs = r.ie ? 'IntenseEmphasis' : r.se ? 'SubtleEmphasis' : r.bt ? 'BookTitle' : r.b ? 'Strong' : r.i ? 'Emphasis' : '';
  const extra = (rs && rs !== 'Strong' && r.b ? '<w:b/>' : '') + (rs && rs !== 'Emphasis' && r.i ? '<w:i/>' : '');
  const rpr = rs || extra ? '<w:rPr>' + (rs ? '<w:rStyle w:val="' + rs + '"/>' : '') + extra + '</w:rPr>' : '';
  return String(r.text).split('\n').map((p, k) => '<w:r>' + rpr + (k ? '<w:br/>' : '') + '<w:t xml:space="preserve">' + xesc(p) + '</w:t></w:r>').join('');
}
export async function buildDocx(blocks, title) {
  const JSZip = await loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js', 'JSZip');
  const body = (blocks || []).map(b => {
    let ppr = '';
    if (b.type === 'li' || b.type === 'oli') ppr = '<w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="' + (b.type === 'li' ? 1 : 2) + '"/></w:numPr></w:pPr>';
    else if (ID_BY_TYPE[b.type] && b.type !== 'p') ppr = '<w:pPr><w:pStyle w:val="' + ID_BY_TYPE[b.type] + '"/></w:pPr>';
    return '<w:p>' + ppr + (b.runs && b.runs.length ? b.runs : [{ text: b.text || '' }]).map(runXml).join('') + '</w:p>';
  }).join('');
  const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
  const doc = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ' + W + '><w:body>' + body + '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>';
  const ps = (id, name, o) => '<w:style w:type="paragraph" w:styleId="' + id + '"><w:name w:val="' + name + '"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/>' + (o.ui != null ? '<w:uiPriority w:val="' + o.ui + '"/>' : '') + '<w:qFormat/><w:pPr>' + (o.keep ? '<w:keepNext/><w:keepLines/>' : '') + (o.bdr || '') + '<w:spacing w:before="' + (o.before || 0) + '" w:after="' + (o.after != null ? o.after : 160) + '"' + (o.line ? ' w:line="' + o.line + '" w:lineRule="auto"' : '') + '/>' + (o.ind || '') + (o.jc ? '<w:jc w:val="' + o.jc + '"/>' : '') + (o.outline != null ? '<w:outlineLvl w:val="' + o.outline + '"/>' : '') + '</w:pPr><w:rPr>' + (o.font ? '<w:rFonts w:ascii="' + o.font + '" w:hAnsi="' + o.font + '" w:cs="' + o.font + '"/>' : '') + (o.b ? '<w:b/>' : '') + (o.i ? '<w:i/>' : '') + (o.caps ? '<w:caps/>' : '') + (o.spacing ? '<w:spacing w:val="' + o.spacing + '"/>' : '') + (o.color ? '<w:color w:val="' + o.color + '"/>' : '') + (o.sz ? '<w:sz w:val="' + o.sz + '"/><w:szCs w:val="' + o.sz + '"/>' : '') + '</w:rPr></w:style>';
  const cs = (id, name, rpr) => '<w:style w:type="character" w:styleId="' + id + '"><w:name w:val="' + name + '"/><w:basedOn w:val="DefaultParagraphFont"/><w:qFormat/><w:rPr>' + rpr + '</w:rPr></w:style>';
  const HF = 'Calibri Light', heads = [[36, '081A53', 1, 0, 480, 160], [30, '081A53', 1, 0, 360, 120], [26, '081A53', 1, 0, 280, 100], [24, '1D2226', 1, 1, 240, 80], [22, '6818F8', 1, 0, 220, 80], [22, '4A5170', 0, 1, 200, 60], [21, '4A5170', 0, 1, 200, 60], [20, '4A5170', 1, 0, 200, 60], [20, '6B7180', 0, 1, 200, 60]];
  const styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles ' + W + '><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="2B3040"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="288" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>'
    + '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>'
    + '<w:style w:type="character" w:default="1" w:styleId="DefaultParagraphFont"><w:name w:val="Default Paragraph Font"/><w:uiPriority w:val="1"/><w:semiHidden/></w:style>'
    + ps('NoSpacing', 'No Spacing', { ui: 1, after: 0, line: 240 })
    + ps('Title', 'Title', { ui: 10, after: 80, line: 240, font: HF, sz: 56, color: '081A53', b: true, spacing: -10 })
    + ps('Subtitle', 'Subtitle', { ui: 11, after: 360, sz: 30, color: '5A6178', spacing: 10 })
    + heads.map(([sz, color, b, i, before, after], k) => ps('Heading' + (k + 1), 'heading ' + (k + 1), { ui: 9, keep: true, before, after, font: HF, sz, color, b, i, caps: k === 7, outline: k })).join('')
    + ps('Quote', 'Quote', { ui: 29, before: 200, after: 160, ind: '<w:ind w:left="864" w:right="864"/>', jc: 'center', i: true, color: '3A4159' })
    + ps('IntenseQuote', 'Intense Quote', { ui: 30, before: 360, after: 360, bdr: '<w:pBdr><w:top w:val="single" w:sz="4" w:space="10" w:color="C9BDF5"/><w:bottom w:val="single" w:sz="4" w:space="10" w:color="C9BDF5"/></w:pBdr>', ind: '<w:ind w:left="864" w:right="864"/>', jc: 'center', i: true, b: true, color: '6818F8' })
    + ps('Caption', 'caption', { ui: 35, after: 200, line: 240, sz: 18, i: true, color: '6B7180' })
    + '<w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:uiPriority w:val="34"/><w:qFormat/><w:pPr><w:spacing w:after="80"/><w:ind w:left="720"/><w:contextualSpacing/></w:pPr></w:style>'
    + cs('Emphasis', 'Emphasis', '<w:i/><w:iCs/>') + cs('IntenseEmphasis', 'Intense Emphasis', '<w:b/><w:i/><w:iCs/><w:color w:val="6818F8"/>') + cs('Strong', 'Strong', '<w:b/><w:bCs/>')
    + cs('SubtleEmphasis', 'Subtle Emphasis', '<w:i/><w:iCs/><w:color w:val="6B7180"/>') + cs('BookTitle', 'Book Title', '<w:b/><w:bCs/><w:i/><w:iCs/><w:spacing w:val="5"/>')
    + '</w:styles>';
  const lvl = (fmt, text) => '<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="' + fmt + '"/><w:lvlText w:val="' + text + '"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>' + (fmt === 'bullet' ? '<w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/></w:rPr>' : '') + '</w:lvl>';
  const numbering = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering ' + W + '><w:abstractNum w:abstractNumId="0">' + lvl('bullet', '\uF0B7') + '</w:abstractNum><w:abstractNum w:abstractNumId="1">' + lvl('decimal', '%1.') + '</w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num><w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num></w:numbering>';
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>');
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>');
  zip.file('docProps/core.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>' + xesc(title || 'Document') + '</dc:title><dc:creator>CatalystOS</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">' + new Date().toISOString() + '</dcterms:created></cp:coreProperties>');
  zip.file('word/document.xml', doc); zip.file('word/styles.xml', styles); zip.file('word/numbering.xml', numbering);
  zip.file('word/_rels/document.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/></Relationships>');
  return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

// Polish blocks pulled from a PDF or rebuilt pages into the Word style hierarchy.
export function refineBlocks(blocks) {
  const junk = t => /^(tm|™|®|©|\(r\)|\(c\)|sm|℠)$/i.test(t) || /^\d{1,3}$/.test(t) || /^[\W_]+$/.test(t);
  const b = (blocks || []).map(x => Object.assign({}, x, { runs: (x.runs || [{ text: x.text || '' }]).map(r => Object.assign({}, r)) })).filter(x => { const t = String(x.text || '').trim(); return t && !junk(t); });
  const isHead = x => /^h\d$/.test(x.type);
  const sizes = [...new Set(b.filter(x => isHead(x) && x.size).map(x => Math.round(x.size)))].sort((a, c) => c - a);
  if (sizes.length > 1) b.forEach(x => { if (isHead(x) && x.size) x.type = 'h' + Math.min(6, sizes.indexOf(Math.round(x.size)) + 1); });
  b.forEach((x, k) => {
    const t = String(x.text).trim(); const allItal = x.runs.length && x.runs.every(r => !r.text.trim() || r.i); const allBold = x.runs.length && x.runs.every(r => !r.text.trim() || r.b);
    if (x.type === 'li' || x.type === 'oli' || x.type === 'title') return;
    if (CAPTION.test(t) && t.length <= 220) { x.type = 'caption'; return; }
    if (/^["“].{20,400}["”]$/.test(t)) { x.type = 'quote'; return; }
    if (/^["“].{20,400}["”]\s*[—–-]\s*\S.{1,60}$/.test(t)) { x.type = 'iquote'; return; }
    if (x.type === 'p' && allBold && t.length <= 90 && !terminal(t)) { x.type = 'h3'; x.runs.forEach(r => { r.b = false; }); return; }
    if (x.type === 'p' && allItal && t.length > 0) { x.runs.forEach(r => { if (r.text.trim()) { r.i = false; r.se = true; } }); return; }
    if (x.type === 'p' && /^(note|notes|disclaimer|important|tip)\s*:/i.test(t)) { const m = t.match(/^[^:]+:/)[0]; x.runs = [{ text: m, b: true }, { text: t.slice(m.length), b: false }]; }
  });
  return finishHierarchy(b);
}
