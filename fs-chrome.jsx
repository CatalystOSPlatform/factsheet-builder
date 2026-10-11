// CatalystOS Fact Sheet header + footer template system.
// Live HTML templates (never flattened to images). Every logo, QR code, photo and scenic
// background is an independently replaceable image with X/Y focal point, fit and crop zoom.
// Templates render at a fixed design width and scale proportionally to their container.
//
// Exports: ChromeRender (one header/footer on a page), ChromePanel (template gallery +
// editing tools, optional live preview), resolveChrome, HEADER_TEMPLATES, FOOTER_TEMPLATES.
//
// Value shape (stored per client in Brand Command as master defaults, per document in apps):
//   { template, overrides: { ...HeaderData|FooterData }, behavior, height, applyTo, pages }
// Only overrides are stored; everything else resolves live from the active Brand Center.

const { useRef, useState, useEffect, useLayoutEffect, createContext, useContext } = React;
const DESIGN_W = 612;

const HEADER_TEMPLATES = [
  { id: 'image-masthead', num: '01', label: 'Pattern Masthead' },
  { id: 'brand-banner', num: '02', label: 'Brand Banner' },
  { id: 'split-identity', num: '03', label: 'Split Identity' },
  { id: 'minimal-editorial', num: '04', label: 'Minimal Editorial' },
];
const FOOTER_TEMPLATES = [
  { id: 'disclosure-logo', num: '01', label: 'Disclosure + Logo' },
  { id: 'contact-qr', num: '02', label: 'Contact + QR' },
  { id: 'cta-scenic', num: '03', label: 'CTA + Pattern' },
  { id: 'scenic-logo', num: '04', label: 'Pattern Logo' },
];
const HEADER_BEHAVIORS = [
  { id: 'first-page-full', label: 'Full first page + continuation header', note: 'Default. Pages 2+ get a compact bar with logo, title and date.' },
  { id: 'full-every-page', label: 'Full header every page', note: '' },
  { id: 'first-page-only', label: 'First page only', note: '' },
];
const DARK = { 'image-masthead': 1, 'brand-banner': 1, 'split-identity': 1, 'minimal-editorial': 0, 'disclosure-logo': 0, 'contact-qr': 1, 'cta-scenic': 1, 'scenic-logo': 1 };
const OVERLAY_DEFAULT = {};
const DEFAULT_H = { 'image-masthead': 210, 'brand-banner': 130, 'split-identity': 150, 'minimal-editorial': 150, 'disclosure-logo': 100, 'contact-qr': 105, 'cta-scenic': 125, 'scenic-logo': 110 };
// Abstract brand patterns (same generator + kept library as the Brand Template Gallery).
const PATTERN_ON = { 'image-masthead': 1, 'cta-scenic': 1, 'scenic-logo': 1 };
const PAT_FAMILIES = ['waves', 'grid', 'rings', 'diagonals', 'arcs', 'triangles', 'halftone', 'topo'];
const PAT_NAMES = { waves: 'Flow lines', grid: 'Fine grid', rings: 'Radiating rings', diagonals: 'Diagonal rule', arcs: 'Arc tiles', triangles: 'Triangle lattice', halftone: 'Halftone fade', topo: 'Contours' };
function genPattern(seed, fam) {
  if (window.CosPostTemplates && window.CosPostTemplates.genTexture) return window.CosPostTemplates.genTexture(seed, fam);
  let a = (seed >>> 0) || 1; const R = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const f = PAT_FAMILIES.indexOf(fam) >= 0 ? fam : PAT_FAMILIES[Math.floor(R() * PAT_FAMILIES.length)];
  const r1 = (n) => Math.round(n * 10) / 10; let g = '';
  const sw = r1(1 + R() * 2.2);
  if (f === 'waves') { const n = 8 + Math.floor(R() * 8), amp = 30 + R() * 90, ph = R() * 400; for (let i = 0; i < n; i++) { const y = r1(-40 + i * (1300 / n)); g += `<path d='M -50 ${y} C ${r1(250 + ph / 4)} ${r1(y - amp)}, ${r1(600 - ph / 5)} ${r1(y + amp)}, 850 ${y} S 1250 ${r1(y - amp * .6)}, 1300 ${y}' fill='none' stroke='white' stroke-width='${sw}'/>`; } }
  else if (f === 'grid') { const step = 60 + Math.floor(R() * 90), rot = Math.floor(R() * 3) * 15; for (let x = -600; x <= 1800; x += step) g += `<line x1='${x}' y1='-600' x2='${x}' y2='1800' stroke='white' stroke-width='${sw * .6}'/>`; for (let y = -600; y <= 1800; y += step) g += `<line x1='-600' y1='${y}' x2='1800' y2='${y}' stroke='white' stroke-width='${sw * .6}'/>`; g = `<g transform='rotate(${rot} 600 600)'>${g}</g>`; }
  else if (f === 'rings') { const cx = R() < .5 ? r1(R() * 300) : r1(900 + R() * 300), cy = R() < .5 ? r1(R() * 300) : r1(900 + R() * 300), step = 40 + R() * 60; for (let rr = step; rr < 1800; rr += step) g += `<circle cx='${cx}' cy='${cy}' r='${r1(rr)}' fill='none' stroke='white' stroke-width='${sw}'/>`; }
  else if (f === 'diagonals') { const step = 36 + R() * 70, ang = [30, 45, 60, -45][Math.floor(R() * 4)]; let l = ''; for (let x = -1800; x < 1800; x += step) l += `<line x1='${r1(x)}' y1='-1200' x2='${r1(x)}' y2='2400' stroke='white' stroke-width='${sw}'/>`; g = `<g transform='rotate(${ang} 600 600)'>${l}</g>`; }
  else if (f === 'arcs') { const s = 150 + Math.floor(R() * 150); for (let x = 0; x < 1200; x += s) for (let y = 0; y < 1200; y += s) { const k = Math.floor(R() * 4), px = x + (k % 2) * s, py = y + (k > 1 ? s : 0); for (let q = 1; q <= 3; q++) g += `<circle cx='${px}' cy='${py}' r='${r1(s * q / 3)}' fill='none' stroke='white' stroke-width='${sw * .8}'/>`; } g = `<clipPath id='c'><rect width='1200' height='1200'/></clipPath><g clip-path='url(#c)'>${g}</g>`; }
  else if (f === 'triangles') { const s = 110 + Math.floor(R() * 110), hh = s * .866; for (let row = -1; row * hh < 1300; row++) for (let col = -1; col * s < 1300; col++) { const ox = col * s + (row % 2 ? s / 2 : 0), oy = row * hh; if (R() < .72) g += `<path d='M ${r1(ox)} ${r1(oy + hh)} L ${r1(ox + s / 2)} ${r1(oy)} L ${r1(ox + s)} ${r1(oy + hh)} Z' fill='${R() < .15 ? "white" : "none"}' fill-opacity='.35' stroke='white' stroke-width='${sw * .7}'/>`; } }
  else if (f === 'halftone') { const step = 34 + Math.floor(R() * 26), dir = Math.floor(R() * 4); for (let x = step / 2; x < 1200; x += step) for (let y = step / 2; y < 1200; y += step) { const t = dir === 0 ? x / 1200 : dir === 1 ? y / 1200 : dir === 2 ? (x + y) / 2400 : Math.hypot(x - 1200, y - 1200) / 1700; const rr = r1(step * .46 * Math.max(0, 1 - t)); if (rr > .6) g += `<circle cx='${x}' cy='${y}' r='${rr}' fill='white'/>`; } }
  else { const cx = 300 + R() * 600, cy = 300 + R() * 600, k = 3 + Math.floor(R() * 3); for (let i = 1; i <= 14; i++) { const bb = i * 70; let dd = ''; for (let j = 0; j <= 48; j++) { const th = j / 48 * Math.PI * 2, rr = bb * (1 + .18 * Math.sin(th * k + i * .4) + .08 * Math.cos(th * (k + 2))); dd += (j ? ' L ' : 'M ') + r1(cx + rr * Math.cos(th)) + ' ' + r1(cy + rr * Math.sin(th)); } g += `<path d='${dd} Z' fill='none' stroke='white' stroke-width='${sw * .8}'/>`; } }
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 1200' preserveAspectRatio='xMidYMid slice'>${g}</svg>`;
}
// Gradient-shape families: soft brand-colored forms (orbs, ribbons, layered waves, facets) to match brand imagery.
const GRAD_FAMILIES = ['orbs', 'ribbons', 'swells', 'facets'];
Object.assign(PAT_NAMES, { orbs: 'Soft orbs', ribbons: 'Gradient ribbons', swells: 'Layered swells', facets: 'Gradient facets' });
// fg = the text color that sits over the shapes: every stop is nudged until fg on it is ≥4.5:1.
function genGradientShapes(seed, fam, cols, fg, bg) {
  let a = (seed >>> 0) || 1; const R = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const f = GRAD_FAMILIES.includes(fam) ? fam : GRAD_FAMILIES[Math.floor(R() * GRAD_FAMILIES.length)];
  const pal = (cols || []).filter((c) => hexRgb(c)).map((c) => rgbHex(hexRgb(c)));
  const base = pal.length ? pal : ['#4F7BFF', '#9B6BFF', '#2EC5CE'];
  const ink = fg || '#FFFFFF', surf = bg && hexRgb(bg) ? bg : null;
  // Vary each shape by drifting it toward the surface color (never toward white), then make it safe under the text.
  const light = (c, t) => ensureContrast(surf ? rgbHex(mixRgb(hexRgb(c), hexRgb(surf), Math.min(t, 0.6))) : c, ink, 4.5);
  const pick = () => base[Math.floor(R() * base.length)];
  const r1 = (n) => Math.round(n);
  let defs = '', g = '';
  const lin = (id, c1, c2, ang, o1, o2) => { const rad = ang * Math.PI / 180, x = Math.cos(rad) * 50, y = Math.sin(rad) * 50; defs += `<linearGradient id='${id}' x1='${r1(50 - x)}%' y1='${r1(50 - y)}%' x2='${r1(50 + x)}%' y2='${r1(50 + y)}%'><stop offset='0' stop-color='${c1}' stop-opacity='${o1}'/><stop offset='1' stop-color='${c2}' stop-opacity='${o2}'/></linearGradient>`; };
  const rad = (id, c, o) => { defs += `<radialGradient id='${id}'><stop offset='0' stop-color='${c}' stop-opacity='${o}'/><stop offset='1' stop-color='${c}' stop-opacity='0'/></radialGradient>`; };
  if (f === 'orbs') {
    const n = 4 + Math.floor(R() * 3);
    for (let i = 0; i < n; i++) { const c = light(pick(), R() * 0.45); rad('o' + i, c, 0.75 + R() * 0.25); const cx = r1(500 + R() * 800), cy = r1(-100 + R() * 800), rr = r1(220 + R() * 380); g += `<circle cx='${cx}' cy='${cy}' r='${rr}' fill='url(#o${i})'/>`; }
  } else if (f === 'ribbons') {
    const n = 2 + Math.floor(R() * 3);
    for (let i = 0; i < n; i++) { const c1 = light(pick(), R() * 0.4), c2 = light(pick(), 0.2 + R() * 0.4); lin('r' + i, c1, c2, R() * 360, 0.9, 0.05); const y0 = r1(-80 + R() * 600), w = r1(90 + R() * 200), k = r1(-260 + R() * 520);
      g += `<path d='M -100 ${y0} C 300 ${y0 + k}, 700 ${y0 - k}, 1300 ${y0 + r1(k / 2)} L 1300 ${y0 + r1(k / 2) + w} C 700 ${y0 - k + w}, 300 ${y0 + k + w}, -100 ${y0 + w} Z' fill='url(#r${i})'/>`; }
  } else if (f === 'swells') {
    const n = 3 + Math.floor(R() * 2);
    for (let i = 0; i < n; i++) { const c = light(pick(), i * 0.12 + R() * 0.15); lin('s' + i, c, c, 90, 0.15, 0.85); const y = r1(260 + i * (300 / n) + R() * 60), amp = r1(40 + R() * 120), ph = R() * 600;
      g += `<path d='M -50 ${y} C ${r1(250 + ph / 3)} ${y - amp}, ${r1(650 - ph / 4)} ${y + amp}, 1250 ${y - r1(amp / 2)} L 1250 700 L -50 700 Z' fill='url(#s${i})'/>`; }
  } else {
    const n = 5 + Math.floor(R() * 4);
    for (let i = 0; i < n; i++) { const c1 = light(pick(), R() * 0.5), c2 = light(pick(), 0.3 + R() * 0.4); lin('f' + i, c1, c2, R() * 360, 0.85, 0.1); const cx = 500 + R() * 750, cy = R() * 600, s = 180 + R() * 320;
      const pts = [0, 1, 2].map((k) => { const th = (k / 3) * Math.PI * 2 + R() * 1.2; return r1(cx + Math.cos(th) * s) + ',' + r1(cy + Math.sin(th) * s); }).join(' ');
      g += `<polygon points='${pts}' fill='url(#f${i})'/>`; }
  }
  return `<svg xmlns='http://www.w3.org/2000/svg' data-colored='1' viewBox='0 0 1200 600' preserveAspectRatio='xMidYMid slice'><defs>${defs}</defs>${g}</svg>`;
}
const isColoredPattern = (svg) => /data-colored=/.test(svg || '');
const brandPatternColors = (b, d) => { const ac = ((b.aesthetic || {}).colors || []); return (ac.length ? [...ac, b.accentColor] : [b.secondaryColor, b.accentColor, ...(b.swatches || []), d && d.accentColor]).filter(Boolean).slice(0, 5); };
const siteFamilies = (b) => (((b && b.aesthetic) || {}).families || []).filter((f) => GRAD_FAMILIES.includes(f) || PAT_FAMILIES.includes(f));
// One pattern from a family: gradient-shape families get brand colors made safe under fg; line families are white strokes.
function makePattern(seed, fam, b, fg, bg) { return GRAD_FAMILIES.includes(fam) ? genGradientShapes(seed, fam, brandPatternColors(b), fg, bg) : genPattern(seed, fam); }
const svgUrl = (svg) => 'data:image/svg+xml;utf8,' + encodeURIComponent(svg).replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29');
const strHash = (s) => { let x = 2166136261; for (const ch of String(s || 'brand')) { x ^= ch.charCodeAt(0); x = Math.imul(x, 16777619); } return x >>> 0; };
const GEN_PATTERNS = {};
// Highest pattern opacity (≤ op) at which fg still reads ≥ target over every colour in the pattern, composited on bg.
function patternSafeOpacity(svg, op, fg, bg, invert, target = 4.5) {
  const f = hexRgb(fg), b = hexRgb(bg); if (!f || !b || !op) return op || 0;
  const cols = []; String(svg || '').replace(/#([0-9a-f]{6}|[0-9a-f]{3})\b|rgba?\([^)]+\)/gi, (m) => { const c = hexRgb(m); if (c) cols.push(invert ? c.map((v) => 255 - v) : c); return m; });
  if (!cols.length) cols.push(lum(b) > 0.5 ? [0, 0, 0] : [255, 255, 255]);
  for (let a = op; a > 0.001; a -= 0.02) if (cols.every((c) => ratio(f, mixRgb(b, c, a)) >= target)) return Math.round(a * 100) / 100;
  return 0;
}
function PatternLayer({ p, dark, fg, bg }) {
  if (!p || p.on === false || !p.svg) return null;
  const raw = p.opacity == null ? 0.3 : p.opacity, sz = p.size == null ? 1 : p.size, ang = p.angle || 0;
  // Light surfaces: much fainter and faded off the text column so body copy keeps ≥4.5:1.
  const colored = isColoredPattern(p.svg);
  const op0 = colored ? (dark ? Math.min(raw * 2, 0.6) : Math.min(raw * 1.2, 0.4)) : (dark ? raw : Math.min(raw * 0.35, 0.08));
  const op = fg ? patternSafeOpacity(p.svg, op0, fg, bg || '#FFFFFF', !dark && !colored) : op0; if (!op) return null;
  const mask = dark ? undefined : 'linear-gradient(to left, #000 0, #000 30%, transparent 65%)';
  if (colored) return <div className="fs-pattern" aria-hidden="true" style={mask ? { WebkitMaskImage: mask, maskImage: mask } : undefined}><div style={{ position: 'absolute', inset: '-20%', background: "url(\"" + svgUrl(p.svg) + "\") center / cover no-repeat", opacity: op, transform: 'rotate(' + ang + 'deg) scale(' + sz + ')' }}></div></div>;
  return <div className="fs-pattern" aria-hidden="true" style={mask ? { WebkitMaskImage: mask, maskImage: mask } : undefined}><div style={{ position: 'absolute', inset: '-50%', background: "url(\"" + svgUrl(p.svg) + "\") center / 50% auto repeat", opacity: op, transform: 'rotate(' + ang + 'deg) scale(' + sz + ')', filter: dark ? 'none' : 'invert(1)' }}></div></div>;
}
const STYLE_KEYS = ['backgroundColor', 'foregroundColor', 'accentColor', 'textColor', 'logoImage', 'heroImage', 'backgroundImage', 'overlayOpacity', 'pattern', 'imageSettings', 'heroPositionX', 'heroPositionY', 'imagePositionX', 'imagePositionY', 'logoWidth', 'showLogo'];

/* ---------------- elements (per-template show/hide) ---------------- */
const ELEMENT_LABELS = { logo: 'Logo', eyebrow: 'Eyebrow', title: 'Title', subtitle: 'Subhead', period: 'Date / period', organization: 'Organization name', tagline: 'Tagline', cta: 'Call to action', website: 'Website', address: 'Address', phone: 'Phone', fax: 'Fax', email: 'Email', social: 'Social media icons', qr: 'QR code', disclosure: 'Disclosure' };
const HEADER_ELEMS = ['logo', 'eyebrow', 'title', 'subtitle', 'period', 'organization', 'tagline', 'website', 'address', 'phone', 'email', 'social', 'qr', 'disclosure'];
const FOOTER_ELEMS = ['logo', 'disclosure', 'cta', 'organization', 'tagline', 'website', 'address', 'phone', 'fax', 'email', 'social', 'qr'];
const EXTRA_ORDER = ['organization', 'tagline', 'cta', 'website', 'address', 'phone', 'fax', 'email', 'social', 'qr'];
const FIELD = { organization: 'organization', tagline: 'tagline', cta: 'ctaText', website: 'website', address: 'address', phone: 'phone', fax: 'fax', email: 'email', disclosure: 'disclosureText' };
const PH = { organization: 'Organization', tagline: 'Tagline', cta: 'Learn more about our approach.', website: 'website.com', address: '123 Main Street, City, ST 00000', phone: '555.555.5555', fax: 'Fax', email: 'name@company.com', disclosure: 'Disclosure or legal copy…' };
const DEFAULT_SHOW = {
  'image-masthead': { logo: 1, period: 1, eyebrow: 1, title: 1, subtitle: 1 },
  'brand-banner': { logo: 1, eyebrow: 1, title: 1, subtitle: 1, period: 1 },
  'split-identity': { logo: 1, organization: 1, tagline: 1, eyebrow: 1, title: 1, subtitle: 1, period: 1 },
  'minimal-editorial': { logo: 1, period: 1, eyebrow: 1, title: 1, subtitle: 1 },
  'disclosure-logo': { disclosure: 1, logo: 1, tagline: 1, website: 1 },
  'contact-qr': { logo: 1, tagline: 1, address: 1, phone: 1, fax: 1, email: 1, website: 1, qr: 1 },
  'cta-scenic': { cta: 1, website: 1, tagline: 1, qr: 1 },
  'scenic-logo': { logo: 1, tagline: 1, website: 1 },
};
// Elements each template can actually show (only these appear as checkboxes for it).
const TEMPLATE_ELEMS = {
  'image-masthead': ['logo', 'eyebrow', 'title', 'subtitle', 'period', 'tagline', 'website', 'social', 'qr'],
  'brand-banner': ['logo', 'eyebrow', 'title', 'subtitle', 'period', 'tagline', 'website', 'social'],
  'split-identity': ['logo', 'organization', 'tagline', 'eyebrow', 'title', 'subtitle', 'period', 'website', 'address', 'phone', 'email', 'social'],
  'minimal-editorial': ['logo', 'eyebrow', 'title', 'subtitle', 'period', 'tagline', 'website', 'social', 'qr'],
  'disclosure-logo': ['logo', 'disclosure', 'tagline', 'website', 'address', 'phone', 'email', 'social'],
  'contact-qr': ['logo', 'tagline', 'address', 'phone', 'fax', 'email', 'website', 'social', 'qr', 'disclosure'],
  'cta-scenic': ['logo', 'cta', 'tagline', 'website', 'social', 'qr'],
  'scenic-logo': ['logo', 'tagline', 'website', 'address', 'phone', 'email', 'social'],
};
function on(d, k) {
  const allowed = TEMPLATE_ELEMS[d.__template];
  if (allowed && !allowed.includes(k)) return false;
  const s = ((d.show || {})[d.__showKey || d.__template]) || {};
  if (k in s) return !!s[k];
  if (k === 'logo' && d.showLogo === false) return false;
  return !!(DEFAULT_SHOW[d.__template] || {})[k];
}
const SOCIAL_NETS = [['linkedin', 'in', 'LinkedIn'], ['x', 'X', 'X (Twitter)'], ['facebook', 'f', 'Facebook'], ['instagram', 'ig', 'Instagram'], ['youtube', 'yt', 'YouTube']];

const SAMPLE_HEADER = { eyebrow: 'Investment Strategy', title: 'Fact Sheet Title', subtitle: 'A short supporting descriptor for the document', period: 'Q3 2026', organization: 'Organization', tagline: 'Organization tagline', website: 'website.com', address: '123 Main Street, City, ST 00000', phone: '555.555.5555', email: 'name@company.com', disclosureText: 'Past performance is not indicative of future results.' };
const SAMPLE_FOOTER = { disclosureText: 'Past performance is not indicative of future results. This material is provided for informational purposes only and does not constitute an offer to sell or a solicitation of an offer to buy any security.', tagline: 'Brand tagline', website: 'website.com', address: '123 Main Street, City, ST 00000', phone: '555.555.5555', email: 'name@company.com', organization: 'Organization', ctaText: 'Learn more about our approach.' };

/* ---------------- brand resolution ---------------- */
function brandDefaults(kind, template, b) {
  b = b || {};
  const imgs = (b.images || []).map((i) => (typeof i === 'string' ? i : i && i.url)).filter(Boolean);
  const base = {
    organization: b.organization || '',
    logoImage: DARK[template] ? (b.reversedLogo || b.logo || '') : (b.logo || b.reversedLogo || ''),
    backgroundColor: b.primaryColor || '#15223B',
    foregroundColor: '#FFFFFF',
    accentColor: b.accentColor || b.secondaryColor || '#E8A93A',
    textColor: b.textColor || '#1E2530',
    headingFont: b.headingFont || '', bodyFont: b.bodyFont || '',
    tagline: b.tagline || '',
    website: String(b.website || '').replace(/^https?:\/\//, '').replace(/\/$/, ''),
    email: b.email || '', phone: b.phone || '', address: b.address || '',
    disclosureText: b.disclosure || (((b.disclosures || []).find((x) => x && x.text) || {}).text) || '',
    socials: b.socials || {},
    qrCodeImage: b.qrCode || '',
  };
  const lib = (b.textures || []).filter((t) => t && t.svg);
  const seed = strHash(b.organization);
  base.pattern = lib.length ? { on: !!PATTERN_ON[template], svg: lib[0].svg, texId: lib[0].id || 'lib0', opacity: 0.3, size: 1, angle: 0 }
    : { on: !!PATTERN_ON[template], svg: makePattern(seed, siteFamilies(b)[0] || GRAD_FAMILIES[seed % GRAD_FAMILIES.length], b, DARK[template] ? '#FFFFFF' : (b.textColor || '#1E2530'), DARK[template] ? (b.primaryColor || '#15223B') : '#FFFFFF'), texId: 'brand-' + seed + (siteFamilies(b)[0] || ''), opacity: 0.3, size: 1, angle: 0 };
  if (kind === 'header') return { ...base, title: b.documentTitle || '', heroImage: '', showLogo: true };
  return { ...base, backgroundImage: imgs[1] || imgs[0] || '' };
}
/* ---------------- saved custom templates (per client) ---------------- */
// store = { templates: [{ id, kind, base, name, overrides, height }], hidden: { header: [], footer: [] }, stamp }
const CUSTOM_DEFS = {};
const STORES = {}, STORE_LISTENERS = new Set();
const storeKey = (cid) => 'fs-chrome-templates-' + (cid || 'local');
function indexStore(st) { (st.templates || []).forEach((t) => { CUSTOM_DEFS[t.id] = t; }); }
function getStore(cid) {
  const k = cid || 'local';
  if (!STORES[k]) {
    let st = null; try { st = JSON.parse(localStorage.getItem(storeKey(k)) || 'null'); } catch (e) {}
    STORES[k] = st || { templates: [], hidden: { header: [], footer: [] }, stamp: 0 };
    indexStore(STORES[k]);
    if (cid) import('./firebase-sync.js').then((m) => m.loadChromeTemplates && m.loadChromeTemplates(cid)).then((remote) => {
      if (remote && (remote.stamp || 0) > (STORES[k].stamp || 0)) { STORES[k] = remote; indexStore(remote); try { localStorage.setItem(storeKey(k), JSON.stringify(remote)); } catch (e) {} STORE_LISTENERS.forEach((fn) => fn()); }
    }).catch(() => {});
  }
  return STORES[k];
}
function saveStore(cid, st) {
  const k = cid || 'local';
  st = { ...st, stamp: Date.now() };
  STORES[k] = st; indexStore(st);
  try { localStorage.setItem(storeKey(k), JSON.stringify(st)); } catch (e) {}
  if (cid) import('./firebase-sync.js').then((m) => m.saveChromeTemplates && m.saveChromeTemplates(cid, st)).catch(() => {});
  STORE_LISTENERS.forEach((fn) => fn());
}
function useChromeStore(cid) {
  const [, bump] = useState(0);
  useEffect(() => { const fn = () => bump((x) => x + 1); STORE_LISTENERS.add(fn); return () => STORE_LISTENERS.delete(fn); }, []);
  return getStore(cid);
}

/* ---------------- WCAG contrast ---------------- */
function hexRgb(c) {
  let s = String(c || '').trim();
  const m = s.match(/^rgba?\(([^)]+)\)/i);
  if (m) { const p = m[1].split(',').map((x) => parseFloat(x)); return [p[0] || 0, p[1] || 0, p[2] || 0]; }
  s = s.replace('#', '');
  if (s.length === 3) s = s.split('').map((x) => x + x).join('');
  if (!/^[0-9a-f]{6}/i.test(s)) return null;
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
}
const rgbHex = (r) => '#' + r.map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('').toUpperCase();
function lum(r) { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r[0]) + 0.7152 * f(r[1]) + 0.0722 * f(r[2]); }
function ratio(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
const mixRgb = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
// Nudge color c toward black or white (keeping its hue) until it reaches target contrast on surface s.
function ensureContrast(c, s, target) {
  const cr = hexRgb(c), sr = hexRgb(s);
  if (!cr || !sr || ratio(cr, sr) >= target) return c;
  const toward = lum(sr) > 0.18 ? [0, 0, 0] : [255, 255, 255];
  for (let t = 0.05; t <= 1.0001; t += 0.05) { const n = mixRgb(cr, toward, t); if (ratio(n, sr) >= target) return rgbHex(n); }
  const alt = ratio([255, 255, 255], sr) >= ratio([0, 0, 0], sr) ? [255, 255, 255] : [0, 0, 0];
  return rgbHex(alt);
}
// Text on a colored panel: keep the chosen color if it passes, else white or near-black, whichever reads better.
function textOn(fg, bg) {
  const f = hexRgb(fg), b = hexRgb(bg);
  if (!f || !b || ratio(f, b) >= 4.5) return fg;
  const w = ratio([255, 255, 255], b), k = ratio([15, 22, 36], b);
  return w >= k ? '#FFFFFF' : '#0F1624';
}
// Overlay tint that keeps fg text ≥4.5:1 over the worst-case image pixel without hiding the photo:
// opacity is raised to at most 0.5, then the brand colour is deepened (toward black/white) until it passes.
function overlayFor(fg, bg, opacity) {
  const f = hexRgb(fg), b = hexRgb(bg); if (!f || !b) return { color: bg, opacity };
  const worst = lum(f) > 0.5 ? [255, 255, 255] : [0, 0, 0];
  const toward = lum(f) > 0.5 ? [0, 0, 0] : [255, 255, 255];
  for (let a = Math.max(opacity || 0, 0.5); a <= 0.9001; a += 0.02)
    for (let t = 0; t <= 1.0001; t += 0.04) { const c = mixRgb(b, toward, t); if (ratio(f, mixRgb(worst, c, a)) >= 4.5) return { color: rgbHex(c), opacity: Math.round(a * 100) / 100 }; }
  return { color: rgbHex(toward), opacity: 0.9 };
}
function applyContrast(template, d) {
  const dark = !!DARK[template];
  if (dark) {
    { const b = hexRgb(d.backgroundColor); if (b && Math.max(ratio([255, 255, 255], b), ratio([15, 22, 36], b)) < 4.5) d.backgroundColor = ensureContrast(d.backgroundColor, '#FFFFFF', 4.5); }
    d.foregroundColor = textOn(d.foregroundColor, d.backgroundColor);
    if (OVERLAY_DEFAULT[template] != null) { const o = overlayFor(d.foregroundColor, d.backgroundColor, d.overlayOpacity); d.__overlayColor = o.color; d.__overlayOpacity = o.opacity; }
  }
  d.textColor = ensureContrast(d.textColor, '#FFFFFF', 4.5);
  d.__inkOnWhite = ensureContrast(d.backgroundColor, '#FFFFFF', 4.5);
  const accentSurface = (template === 'brand-banner') ? d.backgroundColor : '#FFFFFF';
  d.accentColor = ensureContrast(d.accentColor, accentSurface, 3);
  return d;
}
function resolveChrome(kind, value, brand) {
  const v = value || {};
  const list = kind === 'header' ? HEADER_TEMPLATES : FOOTER_TEMPLATES;
  const fallback = kind === 'header' ? 'minimal-editorial' : 'disclosure-logo';
  const template = v.template || fallback;
  const def = CUSTOM_DEFS[template] || null;
  const base = def ? def.base : (list.some((t) => t.id === template) ? template : (v.base || fallback));
  const bo = (def && def.overrides) || {}, vo = v.overrides || {};
  const show = { ...(bo.show || {}), ...(vo.show || {}) };
  if ((bo.show || {})[template] && (vo.show || {})[template]) show[template] = { ...bo.show[template], ...vo.show[template] };
  const ov = { ...bo, ...vo, show };
  const bd = brandDefaults(kind, base, brand);
  const d = { ...bd, ...ov, pattern: { ...bd.pattern, ...(ov.pattern || {}) } };
  if (d.overlayOpacity == null) d.overlayOpacity = OVERLAY_DEFAULT[base];
  d.__template = base; d.__showKey = template;
  applyContrast(base, d);
  const meta = def ? { id: template, num: '★', label: def.name || 'Custom', custom: true } : list.find((t) => t.id === base);
  return { template, base, d, def, ov, meta };
}
function footerApplies(v, page) {
  const a = (v && v.applyTo) || 'all';
  return a === 'all' || ((v.pages || [1]).includes(page));
}

/* ---------------- fonts + css ---------------- */
const loadedFonts = {};
function ensureFonts(list) {
  list.filter(Boolean).forEach((f) => {
    if (loadedFonts[f] || /^(arial|helvetica|georgia|times|inherit|sans-serif|serif)/i.test(f)) return;
    loadedFonts[f] = 1;
    const l = document.createElement('link'); l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(f).replace(/%20/g, '+') + ':wght@400;500;600;700;800&display=swap';
    document.head.appendChild(l);
  });
}
const CSS = `
.fsc{--fs-primary:#15223b;--fs-secondary:#516679;--fs-accent:#e5a83b;--fs-text:#1e2530;--fs-muted:#5E6672;--fs-heading-font:Arial,Helvetica,sans-serif;--fs-body-font:Arial,Helvetica,sans-serif}
.fsc .fs-header,.fsc .fs-footer,.fsc .continuation-header{box-sizing:border-box;width:100%;font-family:var(--fs-body-font);position:relative;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.fsc .fs-header *,.fsc .fs-footer *{box-sizing:border-box}
.fsc .fs-editable{outline:none;border-radius:2px;white-space:pre-wrap;word-break:break-word;min-width:16px}
.fsc.is-editing .fs-editable{cursor:text}
.fsc.is-editing .fs-editable:hover{box-shadow:0 0 0 1px rgba(104,24,248,.55)}
.fsc .fs-editable:focus{box-shadow:0 0 0 1.5px #6818F8}
.fsc .fs-editable:empty:before{content:attr(data-placeholder);opacity:.5;pointer-events:none}
.fsc .image-upload-slot{position:relative;width:100%;height:100%;overflow:hidden}
.fsc .image-upload-slot img{position:absolute;inset:0;width:100%;height:100%;display:block;max-width:none}
.fsc.is-editing .image-upload-slot{cursor:pointer}
.fsc.is-editing .image-upload-slot:hover:after,.fsc .image-upload-slot.drag-over:after{content:'';position:absolute;inset:0;box-shadow:inset 0 0 0 1.5px #6818F8;background:rgba(104,24,248,.08);pointer-events:none}
.fsc .upload-placeholder{width:100%;height:100%;min-height:24px;display:flex;align-items:center;justify-content:center;text-align:center;border:1px dashed rgba(128,128,128,.7);background:rgba(245,245,245,.85);color:#666;font-size:9px;font-family:Arial,sans-serif;letter-spacing:.04em}
.fsc .generic-image{position:absolute;inset:0;background:linear-gradient(135deg,#C9CFDB 0%,#A9B2C3 45%,#8C97AC 100%);display:flex;align-items:center;justify-content:flex-end;padding:0 36px}
.fsc .generic-image-badge{display:flex;flex-direction:column;align-items:center;gap:6px;color:rgba(255,255,255,.92);font:600 10px/1.2 'Inter',sans-serif;letter-spacing:.04em;text-transform:uppercase;position:relative;z-index:3}
.fsc .thumb-placeholder{width:100%;height:100%;background:repeating-linear-gradient(45deg,rgba(150,160,180,.28) 0 6px,rgba(150,160,180,.14) 6px 12px)}
.fsc .header-eyebrow{font-size:9px;line-height:1.25;letter-spacing:.14em;font-weight:700;text-transform:uppercase}
.fsc .header-title{font-family:var(--fs-heading-font);font-size:28px;line-height:1.05;font-weight:700}
.fsc .header-subtitle{font-size:11px;line-height:1.4}
.fsc .header-period{font-size:9px;line-height:1.3}
.fsc .footer-tagline,.fsc .footer-website,.fsc .footer-phone,.fsc .footer-fax,.fsc .footer-address,.fsc .footer-email{font-size:8px;line-height:1.4}
.fsc .image-masthead{min-height:210px;overflow:hidden}
.fsc .fs-inset>.fs-header,.fsc .fs-inset>.fs-footer,.fsc .fs-inset>.continuation-header{border-radius:4px}
.fsc .fs-pattern{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0}
.fsc .fs-header>*:not(.fs-pattern),.fsc .fs-footer>*:not(.fs-pattern),.fsc .split-brand>*:not(.fs-pattern){position:relative;z-index:1}
.fsc .fs-header,.fsc .fs-footer,.fsc .split-brand{overflow:hidden}
.fsc .footer-accent-rule{position:absolute!important}
.fsc .fs-wrow{display:flex;justify-content:space-between;align-items:flex-end;gap:18px}
.fsc .fs-extras{display:flex;gap:10px;align-items:flex-end;flex:none;max-width:46%}
.fsc .fs-extras.right{justify-content:flex-end;text-align:right}
.fsc .fs-extras.left{justify-content:flex-start;text-align:left;margin-top:6px;max-width:none}
.fsc .fs-extras-text{display:flex;flex-direction:column;gap:2px;min-width:0}
.fsc .fs-extras.right .fs-extras-text{align-items:flex-end}
.fsc .fs-x-text{font-size:8px;line-height:1.4}
.fsc .fs-x-organization{font-weight:700;font-size:9px}
.fsc .fs-x-cta{font-family:var(--fs-heading-font);font-weight:700;font-size:11px}
.fsc .fs-x-website{font-weight:700}
.fsc .fs-x-qr{width:52px;height:52px;flex:none}
.fsc .footer-qr,.fsc .fs-x-qr{background:#FFFFFF;padding:3px;border-radius:3px;box-sizing:border-box}
.fsc .fs-x-disc{font-size:7px;line-height:1.4;margin-top:6px;max-width:100%}
.fsc .fs-x-discrow{grid-column:1 / -1;margin-top:-6px}
.fsc .fs-social{display:flex;gap:5px;margin-top:3px}
.fsc .fs-social-icon{width:16px;height:16px;border-radius:50%;border:1px solid currentColor;display:flex;align-items:center;justify-content:center;font:700 7px/1 Arial,Helvetica,sans-serif;color:inherit;text-decoration:none;pointer-events:auto}
.fsc .cta-scenic-content .footer-logo{width:100px;height:36px;flex:none}
.fsc .masthead-image,.fsc .scenic-image{position:absolute;inset:0}
.fsc .masthead-overlay,.fsc .scenic-overlay{position:absolute;inset:0;pointer-events:none}
.fsc .masthead-content,.fsc .cta-scenic-content,.fsc .scenic-logo-content{text-shadow:var(--fs-tshadow,none)}
.fsc .masthead-content{position:relative;z-index:2;height:100%;padding:32px 40px;display:flex;flex-direction:column;justify-content:space-between;pointer-events:none}
.fsc .masthead-content .fs-editable,.fsc .masthead-content .image-upload-slot,.fsc .cta-scenic-content .fs-editable,.fsc .cta-scenic-content .image-upload-slot,.fsc .scenic-logo-content .fs-editable,.fsc .scenic-logo-content .image-upload-slot{pointer-events:auto}
.fsc .masthead-top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}
.fsc .header-logo{width:135px;height:42px}
.fsc .masthead-title-group{max-width:70%}
.fsc .image-masthead .header-title{font-size:34px;margin-top:5px}
.fsc .image-masthead .header-subtitle{margin-top:7px;max-width:520px}
.fsc .brand-banner{min-height:130px;padding:28px 38px;display:grid;grid-template-columns:135px 4px 1fr auto;gap:20px;align-items:center}
.fsc .brand-banner-logo{width:125px;height:52px}
.fsc .brand-banner-rule{width:4px;height:74px}
.fsc .brand-banner-copy{min-width:0}
.fsc .brand-banner-copy .header-title{font-size:26px}
.fsc .brand-banner-copy .header-subtitle{margin-top:4px}
.fsc .brand-banner-side{display:flex;flex-direction:column;align-items:flex-end;gap:8px;text-align:right;max-width:200px}
.fsc .brand-banner-side .fs-extras{max-width:none}
.fsc .split-identity{min-height:150px;display:grid;grid-template-columns:34% 66%}
.fsc .split-brand{position:relative;padding:28px 32px;display:flex;flex-direction:column;justify-content:flex-end}
.fsc .split-logo{width:130px;height:46px;margin-bottom:15px}
.fsc .split-org{font-size:11px;font-weight:700}
.fsc .split-tagline{margin-top:4px;font-size:8px}
.fsc .split-copy{padding:24px 32px;display:flex;flex-direction:column;justify-content:center;color:var(--fs-text);background:#fff}
.fsc .split-copy .header-title{margin:3px 0 5px}
.fsc .split-copy .header-period{margin-top:10px}
.fsc .minimal-editorial{min-height:150px;padding:22px 30px 20px;color:var(--fs-text);background:#fff}
.fsc .minimal-topline{display:flex;justify-content:space-between;align-items:center;gap:16px}
.fsc .minimal-logo{width:125px;height:40px}
.fsc .minimal-rule{width:100%;height:3px;margin:14px 0 18px}
.fsc .minimal-copy{min-width:0;flex:1}
.fsc .minimal-editorial .header-title{max-width:90%}
.fsc .minimal-editorial .header-subtitle{max-width:70%;color:var(--fs-muted);margin-top:6px}
.fsc .continuation-header{height:42px;padding:7px 28px;border-bottom:2px solid;display:grid;grid-template-columns:95px 1fr auto;align-items:center;column-gap:18px;background:#fff}
.fsc .continuation-logo{width:90px;height:25px;position:relative}
.fsc .continuation-title{font-size:9px;font-weight:700;font-family:var(--fs-heading-font)}
.fsc .continuation-period{font-size:8px}
.fsc .disclosure-logo-footer{min-height:100px;padding:16px 26px 15px;display:grid;grid-template-columns:1fr 170px;column-gap:24px;color:var(--fs-text);background:#fff;overflow:hidden}
.fsc .footer-accent-rule{position:absolute;top:0;left:26px;right:26px;height:3px}
.fsc .footer-disclosure{font-size:7px;line-height:1.4;color:#565B62}
.fsc .disclosure-brand{display:flex;flex-direction:column;align-items:flex-end;justify-content:center;text-align:right}
.fsc .footer-logo{width:115px;height:38px}
.fsc .disclosure-brand .footer-tagline{margin-top:5px}
.fsc .disclosure-brand .footer-website{font-weight:700;margin-top:3px}
.fsc .contact-qr-footer{min-height:105px;padding:26px 36px;display:grid;grid-template-columns:1fr 1.25fr 74px;gap:24px;align-items:center;overflow:hidden}
.fsc .contact-footer-brand .footer-logo{width:125px;height:40px;margin-bottom:7px}
.fsc .contact-footer-info{display:flex;flex-direction:column;gap:2px}
.fsc .footer-qr{width:68px;height:68px;flex:none}
.fsc .cta-scenic-footer{min-height:125px;overflow:hidden}
.fsc .cta-scenic-content{position:relative;z-index:2;height:100%;padding:28px 38px;display:flex;justify-content:space-between;align-items:center;gap:20px;pointer-events:none}
.fsc .cta-copy{max-width:70%}
.fsc .footer-cta{font-family:var(--fs-heading-font);font-size:18px;line-height:1.15;font-weight:700}
.fsc .cta-copy .footer-website{margin-top:7px;font-weight:700;font-size:9px}
.fsc .cta-copy .footer-tagline{margin-top:4px}
.fsc .scenic-logo-footer{min-height:110px;overflow:hidden}
.fsc .scenic-logo-content{position:relative;z-index:2;height:100%;padding:26px 38px;display:flex;align-items:center;pointer-events:none}
.fsc .scenic-logo{height:42px}
.fsc .scenic-logo-content .footer-tagline{margin-top:6px}
.fsc .scenic-logo-content .footer-website{margin-top:2px;font-weight:700}
@media print{
  .fsc .fs-editable{box-shadow:none!important}
  .fsc .fs-editable:empty,.fsc .upload-placeholder,.fsc .thumb-placeholder,.fs-edit-ui{display:none!important}
  .fsc .image-upload-slot:after{display:none!important}
  .fsc .fs-header,.fsc .fs-footer,.fsc .continuation-header{break-inside:avoid;page-break-inside:avoid}
}`;
function ensureCss() {
  if (document.getElementById('fs-chrome-css')) return;
  const s = document.createElement('style'); s.id = 'fs-chrome-css'; s.textContent = CSS; document.head.appendChild(s);
}

/* ---------------- primitives ---------------- */
const ChromeCtx = createContext(null);

function ScaleBox({ designWidth = DESIGN_W, children, fixedHeight }) {
  const outer = useRef(null), inner = useRef(null);
  const [s, setS] = useState(1), [h, setH] = useState(0);
  useLayoutEffect(() => {
    const measure = () => { if (!outer.current || !inner.current) return; setS(outer.current.clientWidth / designWidth); setH(inner.current.offsetHeight); };
    measure();
    const ro = new ResizeObserver(measure); ro.observe(outer.current); ro.observe(inner.current);
    return () => ro.disconnect();
  }, [designWidth]);
  return (
    <div ref={outer} style={{ width: '100%', height: fixedHeight != null ? fixedHeight * s : h * s, position: 'relative', overflow: 'hidden' }}>
      <div ref={inner} style={{ width: designWidth, position: 'absolute', left: 0, top: 0, transform: 'scale(' + s + ')', transformOrigin: '0 0' }}>{children}</div>
    </div>
  );
}

function EditableText({ value = '', onChange, className = '', placeholder = '', isEditing, multiline, style }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.innerText !== (value || '')) el.innerText = value || '';
  });
  if (!isEditing) return value ? <div className={className} style={style}>{value}</div> : null;
  return (
    <div ref={ref} className={'fs-editable ' + className} style={style} contentEditable suppressContentEditableWarning data-placeholder={placeholder}
      onInput={(e) => onChange && onChange(e.currentTarget.innerText.replace(/\n$/, ''))}
      onKeyDown={(e) => { if (!multiline && e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
      onPaste={(e) => { e.preventDefault(); document.execCommand('insertText', false, (e.clipboardData.getData('text/plain') || '').replace(multiline ? /\r/g : /[\r\n]+/g, multiline ? '' : ' ')); }}
      onClick={(e) => e.stopPropagation()}></div>
  );
}

function imgSettings(d, key, kind) {
  const s = (d.imageSettings || {})[key] || {};
  const lx = key === 'heroImage' ? d.heroPositionX : key === 'backgroundImage' ? d.imagePositionX : undefined;
  const ly = key === 'heroImage' ? d.heroPositionY : key === 'backgroundImage' ? d.imagePositionY : undefined;
  return { x: s.x ?? lx ?? 50, y: s.y ?? ly ?? 50, fit: kind === 'photo' ? (s.fit || 'cover') : 'contain', zoom: kind === 'photo' ? (s.zoom || 1) : 1 };
}
function imgStyle(s) {
  return { objectFit: s.fit, objectPosition: s.x + '% ' + s.y + '%', transform: s.zoom > 1 ? 'scale(' + s.zoom + ')' : undefined, transformOrigin: s.x + '% ' + s.y + '%' };
}

function ImageSlot({ k, src, d, kind = 'photo', label = 'Upload image', ed, thumb, generic }) {
  const ctx = useContext(ChromeCtx);
  const [over, setOver] = useState(false);
  const s = imgSettings(d, k, kind);
  const handlers = ed ? {
    onClick: (e) => { e.stopPropagation(); ctx && ctx.open(k, kind, label); },
    onDragOver: (e) => { e.preventDefault(); setOver(true); },
    onDragLeave: () => setOver(false),
    onDrop: (e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f && ctx) ctx.file(k, kind, f); },
  } : {};
  return (
    <div className={'image-upload-slot' + (over ? ' drag-over' : '')} {...handlers} title={ed ? label + ' (click to replace, crop or reposition)' : undefined}>
      {src ? <img src={src} alt="" draggable={false} style={imgStyle(s)} />
        : generic ? <div className="generic-image"><div className="generic-image-badge"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="9" cy="10" r="1.8"></circle><path d="M21 16l-5-5-9 9"></path></svg>{ed ? <span>Click to change image</span> : null}</div></div>
        : ed ? <div className="upload-placeholder">{label}</div>
        : thumb ? <div className="thumb-placeholder"></div> : null}
    </div>
  );
}

/* ---------------- templates ---------------- */
function useKit(d, set, ed, thumb) {
  const T = (key, cls, ph, multiline) => <EditableText value={d[key]} onChange={(v) => set({ [key]: v })} className={cls} placeholder={ph} isEditing={ed} multiline={multiline} />;
  const I = (key, label, kind, generic) => <ImageSlot k={key} src={d[key]} d={d} kind={kind || 'photo'} label={label} ed={ed} thumb={thumb} generic={generic} />;
  const G = (k, key, cls, ph, ml) => (on(d, k) ? T(key, cls, ph, ml) : null);
  const keyed = (k, el) => (el ? <div key={k} style={{ display: 'contents' }}>{el}</div> : null);
  // Elements switched on that this template has no native spot for.
  const X = (natives, align, opts) => {
    opts = opts || {};
    const ks = EXTRA_ORDER.filter((k) => on(d, k) && !natives.includes(k) && !(opts.noQr && k === 'qr'));
    if (!ks.length) return null;
    const txt = ks.filter((k) => k !== 'qr');
    return (
      <div className={'fs-extras ' + (align || 'right')}>
        {txt.length ? <div className="fs-extras-text">{txt.map((k) => keyed(k, k === 'social' ? <Social d={d} ed={ed} thumb={thumb} /> : T(FIELD[k], 'fs-x-text fs-x-' + k, PH[k])))}</div> : null}
        {ks.includes('qr') ? <div className="fs-x-qr">{I('qrCodeImage', 'QR code', 'qr')}</div> : null}
      </div>
    );
  };
  const D = (natives) => (on(d, 'disclosure') && !natives.includes('disclosure') ? T('disclosureText', 'fs-x-disc', PH.disclosure, true) : null);
  return { T, I, G, X, D };
}
function Social({ d, ed, thumb }) {
  const s = d.socials || {};
  let list = SOCIAL_NETS.filter(([k]) => s[k]);
  if (!list.length && (ed || thumb)) list = SOCIAL_NETS.slice(0, 3);
  if (!list.length) return null;
  const href = (u) => (u ? (/^https?:/i.test(u) ? u : 'https://' + u) : undefined);
  return <div className="fs-social">{list.map(([k, g, label]) => <a key={k} className="fs-social-icon" href={href(s[k])} target="_blank" rel="noopener" title={label} aria-label={label} onClick={(e) => { if (ed) e.preventDefault(); }}>{g}</a>)}</div>;
}
const logoOn = (d) => on(d, 'logo');

function ImageMastheadHeader({ d, set, ed, thumb, h }) {
  const { T, I, G, X, D } = useKit(d, set, ed, thumb);
  const N = ['logo', 'period', 'eyebrow', 'title', 'subtitle'];
  return (
    <header className="fs-header image-masthead" style={{ color: d.foregroundColor, backgroundColor: d.backgroundColor, height: h || undefined, minHeight: h ? 0 : undefined }}>
      <PatternLayer p={d.pattern} dark={true} fg={d.foregroundColor} bg={d.backgroundColor} />
      <div className="masthead-content">
        <div className="masthead-top">{logoOn(d) ? <div className="header-logo">{I('logoImage', 'Logo', 'logo')}</div> : <div></div>}{G('period', 'period', 'header-period', 'Q3 2026')}</div>
        <div className="fs-wrow">
          <div className="masthead-title-group">{G('eyebrow', 'eyebrow', 'header-eyebrow', 'INVESTMENT STRATEGY')}{G('title', 'title', 'header-title', 'Fact Sheet Title')}{G('subtitle', 'subtitle', 'header-subtitle', 'Optional subtitle')}{D(N)}</div>
          {X(N, 'right')}
        </div>
      </div>
    </header>
  );
}
function BrandBannerHeader({ d, set, ed, thumb, h }) {
  const { T, I, G, X, D } = useKit(d, set, ed, thumb);
  const N = ['logo', 'eyebrow', 'title', 'subtitle', 'period'];
  return (
    <header className="fs-header brand-banner" style={{ backgroundColor: d.backgroundColor, color: d.foregroundColor, height: h || undefined, minHeight: h ? 0 : undefined }}>
      <PatternLayer p={d.pattern} dark={true} fg={d.foregroundColor} bg={d.backgroundColor} />
      <div className="brand-banner-logo">{logoOn(d) ? I('logoImage', 'Logo', 'logo') : null}</div>
      <div className="brand-banner-rule" style={{ backgroundColor: d.accentColor }}></div>
      <div className="brand-banner-copy">{G('eyebrow', 'eyebrow', 'header-eyebrow', 'FACT SHEET')}{G('title', 'title', 'header-title', 'Strategy or Product Name')}{G('subtitle', 'subtitle', 'header-subtitle', 'Optional descriptor')}{D(N)}</div>
      <div className="brand-banner-side">{G('period', 'period', 'header-period', 'As of June 30, 2026')}{X(N, 'right')}</div>
    </header>
  );
}
function SplitIdentityHeader({ d, set, ed, thumb, h }) {
  const { T, I, G, X, D } = useKit(d, set, ed, thumb);
  const N = ['logo', 'organization', 'tagline', 'eyebrow', 'title', 'subtitle', 'period'];
  return (
    <header className="fs-header split-identity" style={{ minHeight: h ? 0 : undefined, height: h || undefined }}>
      <div className="split-brand" style={{ backgroundColor: d.backgroundColor, color: d.foregroundColor }}>
        <PatternLayer p={d.pattern} dark={true} fg={d.foregroundColor} bg={d.backgroundColor} />
        {logoOn(d) ? <div className="split-logo">{I('logoImage', 'Logo', 'logo')}</div> : null}
        {G('organization', 'organization', 'split-org', 'Organization')}{G('tagline', 'tagline', 'split-tagline', 'Organization tagline')}
      </div>
      <div className="split-copy fs-wrow">
        <div style={{ minWidth: 0 }}>{G('eyebrow', 'eyebrow', 'header-eyebrow', 'FACT SHEET')}{G('title', 'title', 'header-title', 'Product or Strategy')}{G('subtitle', 'subtitle', 'header-subtitle', 'Supporting description')}{G('period', 'period', 'header-period', 'Q3 2026')}{D(N)}</div>
        {X(N, 'right')}
      </div>
    </header>
  );
}
function MinimalEditorialHeader({ d, set, ed, thumb, h }) {
  const { T, I, G, X, D } = useKit(d, set, ed, thumb);
  const N = ['logo', 'period', 'eyebrow', 'title', 'subtitle'];
  return (
    <header className="fs-header minimal-editorial" style={{ minHeight: h ? 0 : undefined, height: h || undefined }}>
      <PatternLayer p={d.pattern} dark={false} fg={d.textColor} bg="#FFFFFF" />
      <div className="minimal-topline">{logoOn(d) ? <div className="minimal-logo">{I('logoImage', 'Logo', 'logo')}</div> : <div></div>}{G('period', 'period', 'header-period', 'Q3 2026')}</div>
      <div className="minimal-rule" style={{ backgroundColor: d.accentColor }}></div>
      <div className="fs-wrow">
        <div className="minimal-copy">{G('eyebrow', 'eyebrow', 'header-eyebrow', 'STRATEGY OVERVIEW')}{G('title', 'title', 'header-title', 'Fact Sheet Title')}{G('subtitle', 'subtitle', 'header-subtitle', 'Optional supporting copy')}{D(N)}</div>
        {X(N, 'right')}
      </div>
    </header>
  );
}
function ContinuationHeader({ d }) {
  const logo = d.logoImage && DARK[d.__template] ? (d.__lightLogo || d.logoImage) : d.logoImage;
  return (
    <div className="continuation-header" style={{ borderColor: d.accentColor, color: d.__inkOnWhite || d.backgroundColor }}>
      <div className="continuation-logo">{logo && logoOn(d) ? <img src={logo} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: '0% 50%' }} /> : null}</div>
      <div className="continuation-title">{on(d, 'title') ? d.title : ''}</div>
      <div className="continuation-period">{on(d, 'period') ? d.period : ''}</div>
    </div>
  );
}
function DisclosureLogoFooter({ d, set, ed, thumb, h }) {
  const { T, I, G, X } = useKit(d, set, ed, thumb);
  const N = ['disclosure', 'logo', 'tagline', 'website'];
  return (
    <footer className="fs-footer disclosure-logo-footer" style={{ height: h || undefined, minHeight: h ? 0 : undefined }}>
      <PatternLayer p={d.pattern} dark={false} fg={d.textColor} bg="#FFFFFF" />
      <div className="footer-accent-rule" style={{ backgroundColor: d.accentColor }}></div>
      <div className="disclosure-copy">{G('disclosure', 'disclosureText', 'footer-disclosure', 'Disclosure, legal copy or supporting information…', true)}</div>
      <div className="disclosure-brand">{logoOn(d) ? <div className="footer-logo">{I('logoImage', 'Logo', 'logo')}</div> : null}{G('tagline', 'tagline', 'footer-tagline', 'Tagline')}{G('website', 'website', 'footer-website', 'www.company.com')}{X(N, 'right')}</div>
    </footer>
  );
}
function ContactQRFooter({ d, set, ed, thumb, h }) {
  const { T, I, G, X, D } = useKit(d, set, ed, thumb);
  const N = ['logo', 'tagline', 'address', 'phone', 'fax', 'email', 'website', 'qr'];
  const disc = D(N);
  return (
    <footer className="fs-footer contact-qr-footer" style={{ backgroundColor: d.backgroundColor, color: d.foregroundColor, height: h || undefined, minHeight: h ? 0 : undefined }}>
      <PatternLayer p={d.pattern} dark={true} fg={d.foregroundColor} bg={d.backgroundColor} />
      <div className="contact-footer-brand">{logoOn(d) ? <div className="footer-logo">{I('logoImage', 'Logo', 'logo')}</div> : null}{G('tagline', 'tagline', 'footer-tagline', 'Brand tagline')}{X(N, 'left')}</div>
      <div className="contact-footer-info">{G('address', 'address', 'footer-address', '123 Main Street, City, ST 00000')}{G('phone', 'phone', 'footer-phone', '555.555.5555')}{G('fax', 'fax', 'footer-fax', 'Fax')}{G('email', 'email', 'footer-email', 'Email')}{G('website', 'website', 'footer-website', 'website.com')}</div>
      {on(d, 'qr') ? <div className="footer-qr">{I('qrCodeImage', 'Upload QR code', 'qr')}</div> : <div></div>}
      {disc ? <div className="fs-x-discrow">{disc}</div> : null}
    </footer>
  );
}
function CTAScenicFooter({ d, set, ed, thumb, h }) {
  const { T, I, G, X, D } = useKit(d, set, ed, thumb);
  const N = ['cta', 'website', 'tagline', 'qr'];
  return (
    <footer className="fs-footer cta-scenic-footer" style={{ color: d.foregroundColor, backgroundColor: d.backgroundColor, height: h || undefined, minHeight: h ? 0 : undefined }}>
      <PatternLayer p={d.pattern} dark={true} fg={d.foregroundColor} bg={d.backgroundColor} />
      <div className="cta-scenic-content">
        {logoOn(d) ? <div className="footer-logo">{I('logoImage', 'Logo', 'logo')}</div> : null}
        <div className="cta-copy">{G('cta', 'ctaText', 'footer-cta', 'Learn more about our approach.')}{G('website', 'website', 'footer-website', 'website.com')}{G('tagline', 'tagline', 'footer-tagline', 'Optional supporting line')}{X(N, 'left')}{D(N)}</div>
        {on(d, 'qr') ? <div className="footer-qr">{I('qrCodeImage', 'QR', 'qr')}</div> : null}
      </div>
    </footer>
  );
}
function ScenicLogoFooter({ d, set, ed, thumb, h }) {
  const { T, I, G, X, D } = useKit(d, set, ed, thumb);
  const N = ['logo', 'tagline', 'website'];
  return (
    <footer className="fs-footer scenic-logo-footer" style={{ color: d.foregroundColor, backgroundColor: d.backgroundColor, height: h || undefined, minHeight: h ? 0 : undefined }}>
      <PatternLayer p={d.pattern} dark={true} fg={d.foregroundColor} bg={d.backgroundColor} />
      <div className="scenic-logo-content fs-wrow">
        <div style={{ minWidth: 0 }}>
          {logoOn(d) ? <div className="footer-logo scenic-logo" style={{ width: (d.logoWidth || 150) + 'px' }}>{I('logoImage', 'Logo', 'logo')}</div> : null}
          {G('tagline', 'tagline', 'footer-tagline', 'Tagline')}{G('website', 'website', 'footer-website', 'website.com')}{D(N)}
        </div>
        {X(N, 'right')}
      </div>
    </footer>
  );
}
const REGISTRY = {
  'image-masthead': ImageMastheadHeader, 'brand-banner': BrandBannerHeader, 'split-identity': SplitIdentityHeader, 'minimal-editorial': MinimalEditorialHeader,
  'disclosure-logo': DisclosureLogoFooter, 'contact-qr': ContactQRFooter, 'cta-scenic': CTAScenicFooter, 'scenic-logo': ScenicLogoFooter,
};

function Root({ d, ed, children }) {
  ensureCss(); ensureFonts([d.headingFont, d.bodyFont]);
  const q = (f) => (f ? "'" + f + "', Arial, Helvetica, sans-serif" : undefined);
  return <div className={'fsc' + (ed ? ' is-editing' : '')} style={{ '--fs-heading-font': q(d.headingFont), '--fs-body-font': q(d.bodyFont), '--fs-text': d.textColor, '--fs-tshadow': (() => { const f = hexRgb(d.foregroundColor); return f && lum(f) > 0.5 ? '0 1px 2px rgba(0,0,0,.25)' : 'none'; })() }}>{children}</div>;
}

/* ---------------- image handling ---------------- */
const readFile = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
async function processImage(file, kind) {
  const url = await readFile(file);
  if (/svg/.test(file.type)) return url;
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
  const max = kind === 'photo' ? 2600 : 1400; // ≥300dpi across a letter-width page
  const sc = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  if (sc === 1 && file.size < 1.8e6) return url;
  const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * sc); c.height = Math.round(img.naturalHeight * sc);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return kind === 'photo' ? c.toDataURL('image/jpeg', 0.9) : c.toDataURL('image/png');
}
async function uploadAsset(clientId, dataUrl, name) {
  if (!clientId || !/^data:/.test(dataUrl)) return null;
  try { const m = await import('./firebase-sync.js'); return m.uploadImageAsset ? await m.uploadImageAsset(clientId, dataUrl, name) : null; } catch (e) { return null; }
}

const ui = {
  label: { fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', color: '#8A93A8' },
  btn: { appearance: 'none', cursor: 'pointer', border: '1px solid rgba(8,26,83,0.16)', background: '#FFFFFF', color: '#081A53', fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 12.5, borderRadius: 8, padding: '8px 12px', whiteSpace: 'nowrap' },
  primary: { appearance: 'none', cursor: 'pointer', border: 'none', background: '#6818F8', color: '#FFFFFF', fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 12.5, borderRadius: 8, padding: '8px 14px', whiteSpace: 'nowrap' },
  seg: (on) => ({ appearance: 'none', cursor: 'pointer', borderRadius: 8, padding: '7px 12px', whiteSpace: 'nowrap', fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 12, border: '1px solid ' + (on ? '#081A53' : 'rgba(8,26,83,0.16)'), background: on ? '#081A53' : '#FFFFFF', color: on ? '#FFFFFF' : '#59627A' }),
  card: { border: '1px solid rgba(8,26,83,0.1)', borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12, background: '#FFFFFF' },
  row: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  rowLabel: { fontSize: 12.5, color: '#59627A', width: 104, flex: 'none', fontFamily: "'Inter',sans-serif" },
};

function ImageDialog({ label, kind, src, settings, library, onSrc, onFile, onSettings, onClose }) {
  const fileRef = useRef(null), boxRef = useRef(null), dragging = useRef(false);
  const [over, setOver] = useState(false);
  const s = settings, photo = kind === 'photo';
  useEffect(() => { const k = (e) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, []);
  const focal = (e) => {
    const r = boxRef.current.getBoundingClientRect();
    const cl = (v) => Math.max(0, Math.min(100, Math.round(v)));
    onSettings({ ...s, x: cl(((e.clientX - r.left) / r.width) * 100), y: cl(((e.clientY - r.top) / r.height) * 100) });
  };
  const aspect = kind === 'logo' ? '3 / 1' : kind === 'qr' ? '1 / 1' : '16 / 9';
  const lib = (library || []).filter(Boolean).slice(0, 12);
  return (
    <div className="fs-edit-ui" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(8,26,83,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Inter',sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 540, maxHeight: '92vh', overflowY: 'auto', background: '#FFFFFF', borderRadius: 16, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 24px 60px -12px rgba(8,26,83,0.45)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 18, color: '#081A53' }}>{label}</span>
          <button onClick={onClose} style={{ ...ui.btn, borderRadius: '50%', width: 30, height: 30, padding: 0 }}>✕</button>
        </div>
        <div ref={boxRef}
          onPointerDown={(e) => { if (!src) { fileRef.current.click(); return; } dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); focal(e); }}
          onPointerMove={(e) => { if (dragging.current) focal(e); }}
          onPointerUp={() => { dragging.current = false; }}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) onFile(f); }}
          style={{ position: 'relative', width: '100%', aspectRatio: aspect, borderRadius: 10, overflow: 'hidden', cursor: src ? 'crosshair' : 'pointer', touchAction: 'none',
            background: kind === 'photo' ? '#0B1330' : 'repeating-conic-gradient(#EEF0F4 0% 25%, #FFFFFF 0% 50%) 50% / 16px 16px',
            border: over ? '2px dashed #6818F8' : '1px solid rgba(8,26,83,0.12)' }}>
          {src ? <img src={src} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', ...imgStyle(s), pointerEvents: 'none' }} />
            : <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: kind === 'photo' ? '#C9CEE8' : '#59627A', fontSize: 13 }}>
                <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 14 }}>Drop an image here</span><span>or click to upload</span></div>}
          {src ? <span style={{ position: 'absolute', left: s.x + '%', top: s.y + '%', width: 22, height: 22, marginLeft: -11, marginTop: -11, borderRadius: '50%', border: '2px solid #FFFFFF', boxShadow: '0 0 0 1.5px #6818F8, 0 2px 8px rgba(0,0,0,.4)', pointerEvents: 'none' }}></span> : null}
        </div>
        {src ? <span style={{ fontSize: 12, color: '#8A93A8', marginTop: -6 }}>{photo ? 'Click or drag on the image to set the focal point.' : 'Click or drag to set alignment. Proportions are always preserved.'} X {s.x}% · Y {s.y}%</span> : null}
        <div style={ui.row}>
          <button onClick={() => fileRef.current.click()} style={ui.primary}>{src ? 'Replace' : 'Upload'}</button>
          {src ? <button onClick={() => onSrc('')} style={{ ...ui.btn, color: '#C23A1F', borderColor: 'rgba(194,58,31,0.3)' }}>Remove</button> : null}
          {src ? <button onClick={() => onSettings({ ...s, x: 50, y: 50 })} style={ui.btn}>Center</button> : null}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) onFile(f); e.target.value = ''; }} />
        </div>
        {photo && src ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={ui.row}><span style={ui.rowLabel}>Fit</span>
              <div style={{ display: 'flex', gap: 6 }}>{['cover', 'contain'].map((f) => <button key={f} onClick={() => onSettings({ ...s, fit: f, zoom: f === 'contain' ? 1 : s.zoom })} style={ui.seg(s.fit === f)}>{f === 'cover' ? 'Cover' : 'Contain'}</button>)}</div></div>
            {s.fit === 'cover' ? <div style={ui.row}><span style={ui.rowLabel}>Crop (zoom)</span>
              <input type="range" min="1" max="3" step="0.05" value={s.zoom} onChange={(e) => onSettings({ ...s, zoom: Number(e.target.value) })} style={{ flex: 1, accentColor: '#6818F8' }} />
              <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 12, color: '#081A53', width: 40, textAlign: 'right' }}>{s.zoom.toFixed(2)}×</span></div> : null}
          </div>
        ) : null}
        {lib.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={ui.label}>From Brand Center</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))', gap: 8 }}>
              {lib.map((u, i) => <button key={i} onClick={() => onSrc(u)} style={{ appearance: 'none', cursor: 'pointer', padding: 0, aspectRatio: '4 / 3', borderRadius: 8, overflow: 'hidden', border: u === src ? '2px solid #6818F8' : '1px solid rgba(8,26,83,0.12)', background: 'repeating-conic-gradient(#EEF0F4 0% 25%, #FFFFFF 0% 50%) 50% / 12px 12px' }}>
                <img src={u} alt="" style={{ width: '100%', height: '100%', objectFit: kind === 'photo' ? 'cover' : 'contain', display: 'block' }} /></button>)}
            </div>
          </div>
        ) : null}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button onClick={onClose} style={ui.primary}>Done</button></div>
      </div>
    </div>
  );
}

/* ---------------- ChromeRender: one header/footer on a page ---------------- */
function ChromeRender({ kind = 'header', value, brand, isEditing = false, pageNumber = 1, clientId, onChange, designWidth = DESIGN_W, thumb = false, forceTemplate }) {
  useChromeStore(clientId);
  const vRef = useRef(value || {}); vRef.current = value || {};
  const [dlg, setDlg] = useState(null);
  const res = resolveChrome(kind, forceTemplate ? { ...(value || {}), template: forceTemplate } : value, brand);
  const d = thumb ? { ...(kind === 'header' ? SAMPLE_HEADER : SAMPLE_FOOTER), ...Object.fromEntries(Object.entries(res.d).filter(([, x]) => x !== '' && x != null)) } : res.d;
  const set = (patch) => { if (!onChange) return; const v = vRef.current; onChange({ ...v, template: v.template || res.template, overrides: { ...(v.overrides || {}), ...patch } }); };
  const setSettings = (key, s) => {
    const patch = { imageSettings: { ...(d.imageSettings || {}), [key]: s } };
    if (key === 'heroImage') { patch.heroPositionX = s.x; patch.heroPositionY = s.y; }
    if (key === 'backgroundImage') { patch.imagePositionX = s.x; patch.imagePositionY = s.y; }
    set(patch);
  };
  const file = async (key, k, f) => {
    try {
      const data = await processImage(f, k); set({ [key]: data });
      const url = await uploadAsset(clientId, data, key + '-' + (f.name || 'image'));
      if (url) set({ [key]: url });
    } catch (e) { /* unreadable image: keep previous */ }
  };
  const v = value || {};
  if (!thumb && kind === 'header' && pageNumber > 1 && (v.behavior || 'first-page-full') === 'first-page-only') return null;
  if (!thumb && kind === 'footer' && !footerApplies(v, pageNumber)) return null;
  const cont = !thumb && kind === 'header' && pageNumber > 1 && (v.behavior || 'first-page-full') === 'first-page-full';
  const Comp = REGISTRY[res.base];
  const fh = v.height || (res.def && res.def.height);
  const h = fh || null;
  const bleed = v.bleed || (res.def && res.def.bleed) || 'full';
  const inset = bleed === 'margins' ? (kind === 'header' ? '24px 36px 0' : '0 36px 24px') : 0;
  const library = [brand && brand.logo, brand && brand.reversedLogo, ...((brand && brand.library) || []), ...((brand && brand.images) || []).map((i) => (typeof i === 'string' ? i : i && i.url))].filter((x, i, a) => x && a.indexOf(x) === i);
  const RD = window.ReactDOM;
  const dlgEl = dlg ? <ImageDialog label={dlg.label} kind={dlg.kind} src={d[dlg.key]} settings={imgSettings(d, dlg.key, dlg.kind)} library={library}
    onSrc={(u) => set({ [dlg.key]: u })} onFile={(f) => file(dlg.key, dlg.kind, f)} onSettings={(s) => setSettings(dlg.key, s)} onClose={() => setDlg(null)} /> : null;
  return (
    <ChromeCtx.Provider value={{ open: (key, k, label) => setDlg({ key, kind: k, label }), file }}>
      <ScaleBox designWidth={designWidth}>
        <Root d={d} ed={isEditing && !thumb}>
          <div className={bleed === 'margins' ? 'fs-inset' : undefined} style={{ padding: inset }}>{cont ? <ContinuationHeader d={{ ...d, __template: res.base, __showKey: res.template, __lightLogo: (brand && brand.logo) || '' }} /> : <Comp d={d} set={set} ed={isEditing && !thumb} thumb={thumb} h={h} />}</div>
        </Root>
      </ScaleBox>
      {dlgEl && RD && RD.createPortal ? RD.createPortal(dlgEl, document.body) : dlgEl}
    </ChromeCtx.Provider>
  );
}

/* ---------------- ChromePanel: gallery + tools (+ optional live preview) ---------------- */
function ColorRow({ label, value, isOverride, swatches, onPick, onReset }) {
  return (
    <div style={ui.row}>
      <span style={ui.rowLabel}>{label}</span>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
        {swatches.map((hex) => <button key={hex} title={hex} onClick={() => onPick(hex)} style={{ appearance: 'none', cursor: 'pointer', width: 26, height: 26, padding: 0, borderRadius: 7, background: hex, border: String(value).toLowerCase() === hex.toLowerCase() ? '2px solid #6818F8' : '1px solid rgba(8,26,83,0.18)', boxShadow: String(value).toLowerCase() === hex.toLowerCase() ? 'inset 0 0 0 2px #FFFFFF' : 'none' }}></button>)}
        <label title="Custom color" style={{ position: 'relative', width: 26, height: 26, borderRadius: 7, border: '1px dashed rgba(8,26,83,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, color: '#59627A' }}>+
          <input type="color" value={/^#[0-9a-f]{6}$/i.test(value || '') ? value : '#000000'} onChange={(e) => onPick(e.target.value)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} /></label>
        {isOverride ? <button onClick={onReset} style={{ ...ui.btn, padding: '4px 8px', fontSize: 11 }}>Use brand</button> : <span style={{ fontSize: 11, color: '#8A93A8' }}>Brand default</span>}
      </div>
    </div>
  );
}
function Slider({ label, min, max, step, value, fmt, onChange, onReset, isOverride }) {
  return (
    <div style={ui.row}>
      <span style={ui.rowLabel}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ flex: 1, minWidth: 120, accentColor: '#6818F8' }} />
      <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 12, color: '#081A53', width: 46, textAlign: 'right' }}>{fmt(value)}</span>
      {isOverride && onReset ? <button onClick={onReset} style={{ ...ui.btn, padding: '4px 8px', fontSize: 11 }}>Reset</button> : null}
    </div>
  );
}

function ChromePanel({ kind = 'header', value, brand, onChange, preview = false, clientId, pageCount, activePage = 1, requireSelection = false, showLayout = true }) {
  const v = value || {};
  const vRef = useRef(v); vRef.current = v;
  const store = useChromeStore(clientId);
  const { template, base, d, def, ov, meta } = resolveChrome(kind, v, brand);
  const o = v.overrides || {};
  const hidden = ((store.hidden || {})[kind]) || [];
  const customs = (store.templates || []).filter((t) => t.kind === kind);
  const list = [...(kind === 'header' ? HEADER_TEMPLATES : FOOTER_TEMPLATES).filter((t) => !hidden.includes(t.id)), ...customs.map((t) => ({ id: t.id, num: '★', label: t.name || 'Custom', custom: true, base: t.base }))];
  const [dupName, setDupName] = useState(null);
  const [nameDraft, setNameDraft] = useState(null);
  const chosen = !requireSelection || !!v.template;
  const change = (patch) => onChange && onChange({ ...vRef.current, template: vRef.current.template || template, ...patch });
  const setO = (patch) => change({ overrides: { ...(vRef.current.overrides || {}), ...patch } });
  const clearO = (keys) => { const n = { ...(vRef.current.overrides || {}) }; keys.forEach((k) => delete n[k]); change({ overrides: n }); };
  const b = brand || {};
  const sw = [...new Set([...(b.swatches || []), b.primaryColor, b.secondaryColor, b.accentColor, b.textColor, '#FFFFFF', '#15223B', '#000000'].filter((x) => /^#/.test(x || '')))].slice(0, 10);
  const lightBody = base === 'minimal-editorial' || base === 'disclosure-logo' || base === 'split-identity';
  const hasBg = base !== 'minimal-editorial' && base !== 'disclosure-logo';
  const hasOverlay = OVERLAY_DEFAULT[base] != null;
  const elemsFor = kind === 'header' ? HEADER_ELEMS : FOOTER_ELEMS;
  const patOn = !!(d.pattern && d.pattern.on !== false && d.pattern.svg);
  const setPat = (patch) => { const cur = (vRef.current.overrides || {}).pattern || {}; let p = { ...cur, ...patch }; if (patch.on && !d.pattern.svg && !p.svg) p.svg = genPattern(Date.now() >>> 0); setO({ pattern: p }); };
  // Generated patterns autosave to this client (shared by headers and footers), max 5.
  const MAX_GEN = 5;
  const hasSite = siteFamilies(brand || {}).length > 0;
  const [patStyleRaw, setPatStyle] = useState(null);
  const patStyle = patStyleRaw || (hasSite ? 'site' : 'shapes');
  const genList = (store.patterns || []).map((t) => ({ ...t, gen: true }));
  const removeGen = (id) => saveStore(clientId, { ...store, patterns: (store.patterns || []).filter((t) => t.id !== id) });
  const libPats = ((b.textures || []).filter((t) => t && t.svg)).map((t, i) => ({ id: t.id || 'lib' + i, name: t.name || 'Pattern', svg: t.svg, kept: !!t.kept }));
  const patChoices = [...libPats, ...genList, ...(d.pattern && d.pattern.svg && ![...libPats, ...genList].some((t) => t.svg === d.pattern.svg) ? [{ id: 'current', name: 'Current pattern', svg: d.pattern.svg }] : [])].slice(0, 20);
  const newPattern = () => {
    if (genList.length >= MAX_GEN) return;
    const liked = libPats.filter((t) => t.kept && t.family && PAT_FAMILIES.includes(t.family)).map((t) => t.family);
    const rnd = (a) => a[Math.floor(Math.random() * a.length)];
    const site = siteFamilies(b);
    const fam = patStyle === 'site' && site.length ? (Math.random() < 0.55 ? site[0] : rnd(site))
      : patStyle === 'lines' ? (liked.length && Math.random() < 0.6 ? rnd(liked) : rnd(site.filter((x) => PAT_FAMILIES.includes(x)).length && Math.random() < 0.6 ? site.filter((x) => PAT_FAMILIES.includes(x)) : PAT_FAMILIES))
      : rnd(site.filter((x) => GRAD_FAMILIES.includes(x)).length && Math.random() < 0.6 ? site.filter((x) => GRAD_FAMILIES.includes(x)) : GRAD_FAMILIES);
    const seedN = Math.floor(Math.random() * 1e9);
    const t = { id: 'gen' + Date.now(), name: (patStyle === 'site' ? 'Site · ' : '') + (PAT_NAMES[fam] || 'Pattern'), svg: makePattern(seedN, fam, b, DARK[base] ? d.foregroundColor : d.textColor, DARK[base] ? d.backgroundColor : '#FFFFFF') };
    saveStore(clientId, { ...store, patterns: [...(store.patterns || []), { ...t, family: fam }].slice(-MAX_GEN) });
    setPat({ on: true, svg: t.svg, texId: t.id });
  };
  const patSurface = DARK[base] ? (d.backgroundColor || '#15223B') : '#FFFFFF';
  const fullShow = (key) => ({ [key]: Object.fromEntries(elemsFor.map((k) => [k, on(d, k)])) });
  const dirty = !!def && (Object.keys(o).length > 0 || (v.height && v.height !== def.height) || (v.bleed && v.bleed !== def.bleed));
  const [dupFor, setDupFor] = useState(null);
  const startDuplicate = (t) => { setDupFor(t.id); setDupName(t.label + ' copy'); };
  const createDuplicate = () => {
    const src = list.find((t) => t.id === dupFor); if (!src) { setDupName(null); return; }
    const name = String(dupName || '').trim() || src.label + ' copy';
    const id = 'custom-' + kind + '-' + Date.now().toString(36);
    let nb, nov, nh;
    if (src.id === template) { nb = base; nov = { ...ov, show: fullShow(id) }; nh = v.height || (def && def.height) || null; }
    else { const dd = CUSTOM_DEFS[src.id]; nb = dd ? dd.base : src.id; const so = (dd && dd.overrides) || {}; nov = { ...so, show: (so.show || {})[src.id] ? { [id]: so.show[src.id] } : {} }; nh = (dd && dd.height) || null; }
    saveStore(clientId, { ...store, templates: [...(store.templates || []), { id, kind, base: nb, name, overrides: nov, height: nh, bleed: src.id === template ? (v.bleed || (def && def.bleed) || null) : ((CUSTOM_DEFS[src.id] || {}).bleed || null) }] });
    setDupName(null); setDupFor(null);
    change({ template: id, base: nb, overrides: {} });
  };
  const saveCustom = () => {
    if (!def) return;
    const nt = { ...def, overrides: { ...ov, show: fullShow(def.id) }, height: v.height || def.height || null, bleed: v.bleed || def.bleed || null };
    saveStore(clientId, { ...store, templates: (store.templates || []).map((t) => (t.id === def.id ? nt : t)) });
    change({ overrides: {}, height: null, bleed: null });
  };
  const renameCustom = (name) => { if (!def) return; const n = String(name || '').trim(); if (!n || n === def.name) return; saveStore(clientId, { ...store, templates: (store.templates || []).map((t) => (t.id === def.id ? { ...t, name: n } : t)) }); };
  const deleteTpl = (t) => {
    if (list.length <= 1) return;
    const isCustom = !!CUSTOM_DEFS[t.id] && t.custom;
    if (!window.confirm('Delete "' + t.label + '"? ' + (isCustom ? 'This saved ' + kind + ' will be removed for this client.' : 'It will be hidden from this client\'s gallery. You can restore it later.'))) return;
    const rest = list.filter((x) => x.id !== t.id);
    if (isCustom) saveStore(clientId, { ...store, templates: (store.templates || []).filter((x) => x.id !== t.id) });
    else saveStore(clientId, { ...store, hidden: { ...(store.hidden || {}), [kind]: [...hidden, t.id] } });
    if (t.id === template) {
      const next = rest.find((x) => x.id === base) || rest[0];
      change({ template: next.id, base: next.base || next.id, overrides: isCustom && next.id === base ? { ...ov, show: fullShow(base) } : (isCustom ? {} : o) });
    }
  };
  const restoreHidden = () => saveStore(clientId, { ...store, hidden: { ...(store.hidden || {}), [kind]: [] } });
  const pages = Array.from({ length: pageCount || 0 }, (_, i) => i + 1);
  const applyTo = v.applyTo || 'all';
  const elemList = TEMPLATE_ELEMS[base] || (kind === 'header' ? HEADER_ELEMS : FOOTER_ELEMS);
  const toggleEl = (k, val) => { const all = vRef.current.overrides && vRef.current.overrides.show || {}; setO({ show: { ...all, [template]: { ...(all[template] || {}), [k]: val } } }); };
  const discs = ((brand && brand.disclosures) || []).filter((x) => x && String(x.text || '').trim()).map((x, i) => ({ id: x.id || 'd' + i, label: x.label, text: String(x.text).trim(), status: x.status }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontFamily: "'Inter',sans-serif" }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
        {list.map((t) => {
          const on = chosen && template === t.id;
          return (
            <div key={t.id} role="button" tabIndex={0} onClick={() => change({ template: t.id, base: t.base || t.id })} onKeyDown={(e) => { if (e.key === 'Enter') change({ template: t.id, base: t.base || t.id }); }} style={{ cursor: 'pointer', textAlign: 'left', padding: 6, borderRadius: 10, background: on ? '#F1EAFE' : '#FFFFFF', border: on ? '2px solid #6818F8' : '1px solid rgba(8,26,83,0.12)', display: 'flex', flexDirection: 'column', gap: 8, boxShadow: on ? '0 6px 18px -10px rgba(104,24,248,.6)' : 'none' }}>
              <div style={{ borderRadius: 6, overflow: 'hidden', background: '#FFFFFF', border: '1px solid rgba(8,26,83,0.08)', pointerEvents: 'none', height: kind === 'header' ? undefined : undefined }}>
                <ChromeRender kind={kind} value={{ ...v, template: t.id, height: undefined }} forceTemplate={t.id} brand={brand} thumb />
              </div>
              <span style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '0 4px 2px' }}>
                <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 11, color: on ? '#6818F8' : '#8A93A8' }}>{t.num}</span>
                <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 12, color: '#081A53', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{t.label}</span>
                {t.custom ? <span style={{ marginLeft: 'auto', flex: 'none', fontSize: 10, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#6818F8', background: '#F1EAFE', borderRadius: 99, padding: '2px 7px' }}>Saved</span> : null}
              </span>
              <span style={{ display: 'flex', gap: 6, padding: '0 4px 2px', justifyContent: 'flex-end' }}>
                <button title={'Duplicate as new ' + kind} aria-label={'Duplicate ' + t.label} onClick={(e) => { e.stopPropagation(); startDuplicate(t); }} style={{ ...{ appearance: 'none', cursor: 'pointer', width: 28, height: 28, padding: 0, borderRadius: 7, border: '1px solid rgba(8,26,83,0.14)', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }, color: '#081A53' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#F1EAFE'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"></rect><path d="M5 15V5a2 2 0 0 1 2-2h10"></path></svg></button>
                <button title={'Delete ' + t.label} aria-label={'Delete ' + t.label} disabled={list.length <= 1} onClick={(e) => { e.stopPropagation(); deleteTpl(t); }} style={{ ...{ appearance: 'none', cursor: 'pointer', width: 28, height: 28, padding: 0, borderRadius: 7, border: '1px solid rgba(8,26,83,0.14)', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }, color: '#C23A1F', opacity: list.length <= 1 ? 0.4 : 1 }} onMouseEnter={(e) => { e.currentTarget.style.background = '#FDEDEA'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path></svg></button>
              </span>
            </div>
          );
        })}
      </div>

      {dupName != null ? (
        <div style={{ ...ui.card, gap: 10, borderColor: '#6818F8' }}>
          <span style={ui.label}>Name your new {kind}</span>
          <div style={ui.row}>
            <input autoFocus value={dupName} onChange={(e) => setDupName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') createDuplicate(); if (e.key === 'Escape') setDupName(null); }} style={{ flex: 1, minWidth: 180, fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#081A53', border: '1px solid rgba(8,26,83,0.2)', borderRadius: 8, padding: '7px 10px' }} />
            <button onClick={createDuplicate} style={ui.primary}>Create & save</button>
            <button onClick={() => setDupName(null)} style={ui.btn}>Cancel</button>
          </div>
        </div>
      ) : null}
      {chosen && def ? (
        <div style={{ ...ui.card, gap: 10 }}>
          <div style={ui.row}><span style={ui.rowLabel}>Name</span>
            <input value={nameDraft != null ? nameDraft : (def.name || '')} onChange={(e) => setNameDraft(e.target.value)} onBlur={() => { renameCustom(nameDraft); setNameDraft(null); }} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} style={{ flex: 1, minWidth: 160, fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#081A53', border: '1px solid rgba(8,26,83,0.16)', borderRadius: 8, padding: '7px 10px' }} />
            <button onClick={saveCustom} disabled={!dirty} style={{ ...ui.primary, opacity: dirty ? 1 : 0.45, cursor: dirty ? 'pointer' : 'default' }}>{dirty ? 'Save changes' : 'Saved'}</button>
          </div>
        </div>
      ) : null}
      {hidden.length ? <button onClick={restoreHidden} style={{ appearance: 'none', border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: '#6818F8', fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 12, alignSelf: 'flex-start' }}>Restore {hidden.length} hidden template{hidden.length === 1 ? '' : 's'}</button> : null}

      {!chosen ? <div style={{ fontSize: 13, color: '#59627A' }}>Choose a {kind} to set it as this brand's default and open its editing tools.</div> : null}

      {chosen && preview ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={ui.label}>Edit {meta ? meta.label : ''}</span>
          <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(8,26,83,0.12)', background: '#FFFFFF' }}>
            <ChromeRender kind={kind} value={{ ...v, template, behavior: 'full-every-page', applyTo: 'all' }} brand={brand} isEditing clientId={clientId} onChange={(nv) => change({ overrides: nv.overrides })} />
          </div>
          <span style={{ fontSize: 12, color: '#8A93A8' }}>Click any text to edit it. Click any image, logo or QR code to upload, replace, crop or reposition it. You can also drop files straight onto them.</span>
        </div>
      ) : null}

      {chosen ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={ui.card}>
            <span style={ui.label}>Elements</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '6px 14px' }}>
              {elemList.map((k) => (
                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#33394A', cursor: 'pointer' }}>
                  <input type="checkbox" checked={on(d, k)} onChange={(e) => toggleEl(k, e.target.checked)} style={{ width: 15, height: 15, accentColor: '#6818F8', flex: 'none' }} />{ELEMENT_LABELS[k]}</label>
              ))}
            </div>
            {on(d, 'disclosure') && discs.length > 1 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid rgba(8,26,83,0.08)', paddingTop: 10 }}>
                <span style={{ ...ui.rowLabel, width: 'auto' }}>Which disclosure?</span>
                {discs.map((x) => {
                  const sel = (o.disclosureId ? o.disclosureId === x.id : d.disclosureText === x.text);
                  return (
                    <button key={x.id} onClick={() => setO({ disclosureId: x.id, disclosureText: x.text })} style={{ appearance: 'none', cursor: 'pointer', textAlign: 'left', borderRadius: 10, padding: '8px 11px', border: sel ? '1.5px solid #6818F8' : '1px solid rgba(8,26,83,0.14)', background: sel ? '#F1EAFE' : '#FFFFFF', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ flex: 'none', width: 14, height: 14, marginTop: 2, borderRadius: '50%', border: sel ? '4px solid #6818F8' : '1.5px solid #B9C0CF', boxSizing: 'border-box', background: '#FFFFFF' }}></span>
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                        <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 12.5, color: '#081A53' }}>{x.label || 'Disclosure'}{x.status === 'approved' ? '' : ' · needs review'}</span>
                        <span style={{ fontSize: 11.5, color: '#59627A', lineHeight: 1.4 }}>{x.text.length > 140 ? x.text.slice(0, 140) + '…' : x.text}</span>
                      </span>
                    </button>
                  );
                })}
                {discs.length > 1 ? <button onClick={() => setO({ disclosureId: 'all', disclosureText: discs.map((x) => x.text).join('\n\n') })} style={{ ...ui.seg(o.disclosureId === 'all'), alignSelf: 'flex-start' }}>Use all {discs.length}</button> : null}
                <span style={{ fontSize: 11.5, color: '#8A93A8' }}>You can still edit the text right on the page.</span>
              </div>
            ) : null}
            {on(d, 'social') ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid rgba(8,26,83,0.08)', paddingTop: 10 }}>
                <span style={{ ...ui.rowLabel, width: 'auto' }}>Social links (icons show for filled ones)</span>
                {SOCIAL_NETS.map(([k, , label]) => (
                  <div key={k} style={ui.row}><span style={ui.rowLabel}>{label}</span>
                    <input value={(d.socials || {})[k] || ''} onChange={(e) => setO({ socials: { ...(d.socials || {}), [k]: e.target.value } })} placeholder={k + '.com/…'} style={{ flex: 1, minWidth: 140, fontFamily: "'Inter',sans-serif", fontSize: 12.5, color: '#081A53', border: '1px solid rgba(8,26,83,0.16)', borderRadius: 8, padding: '7px 10px' }} /></div>
                ))}
              </div>
            ) : null}
          </div>

          <div style={ui.card}>
            <span style={ui.label}>Size & placement</span>
            <Slider label="Height" min={kind === 'header' ? 70 : 50} max={kind === 'header' ? 320 : 220} step={1} value={v.height || (def && def.height) || DEFAULT_H[base]} fmt={(x) => (v.height || (def && def.height) ? x + 'px' : 'Auto')} onChange={(x) => change({ height: x })} isOverride={!!v.height} onReset={() => change({ height: null })} />
            <div style={ui.row}><span style={ui.rowLabel}>Placement</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[['full', 'Full bleed'], ['margins', 'Within margins']].map(([k, label]) => { const cur = v.bleed || (def && def.bleed) || 'full'; return <button key={k} onClick={() => change({ bleed: k })} style={ui.seg(cur === k)}>{label}</button>; })}
              </div>
            </div>
          </div>

          <div style={ui.card}>
            <span style={ui.label}>Colors</span>
            {hasBg ? <ColorRow label="Background" value={d.backgroundColor} isOverride={'backgroundColor' in o} swatches={sw} onPick={(x) => setO({ backgroundColor: x })} onReset={() => clearO(['backgroundColor'])} /> : null}
            {hasBg ? <ColorRow label="Text on color" value={d.foregroundColor} isOverride={'foregroundColor' in o} swatches={sw} onPick={(x) => setO({ foregroundColor: x })} onReset={() => clearO(['foregroundColor'])} /> : null}
            {lightBody ? <ColorRow label="Text" value={d.textColor} isOverride={'textColor' in o} swatches={sw} onPick={(x) => setO({ textColor: x })} onReset={() => clearO(['textColor'])} /> : null}
            <ColorRow label="Accent" value={d.accentColor} isOverride={'accentColor' in o} swatches={sw} onPick={(x) => setO({ accentColor: x })} onReset={() => clearO(['accentColor'])} />
          </div>

          <div style={ui.card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span style={ui.label}>Pattern</span>
              <button onClick={() => setPat({ on: !patOn })} style={{ appearance: 'none', cursor: 'pointer', borderRadius: 99, padding: '5px 12px', fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 12, border: patOn ? 'none' : '1px solid rgba(8,26,83,0.16)', background: patOn ? '#6818F8' : '#FFFFFF', color: patOn ? '#FFFFFF' : '#59627A' }}>{patOn ? 'On' : 'Off'}</button>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#59627A' }}>Generate:</span>
              {[...(hasSite ? [['site', 'Match website imagery']] : []), ['shapes', 'Gradient shapes'], ['lines', 'Line patterns']].map(([k, label]) => <button key={k} onClick={() => setPatStyle(k)} style={ui.seg(patStyle === k)}>{label}</button>)}
            </div>
            {hasSite && (b.aesthetic || {}).summary ? <span style={{ fontSize: 11.5, color: '#59627A', lineHeight: 1.45 }}>From {(b.aesthetic.count || 'the')} scraped website image{b.aesthetic.count === 1 ? '' : 's'}: {b.aesthetic.summary}</span> : null}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: 8 }}>
              {patChoices.map((t) => {
                const sel = patOn && d.pattern.svg === t.svg;
                return (
                  <button key={t.id} title={t.name} onClick={() => setPat({ on: true, svg: t.svg, texId: t.id })} style={{ appearance: 'none', cursor: 'pointer', padding: 0, position: 'relative', aspectRatio: '1 / 1', borderRadius: 8, overflow: 'hidden', background: '#FFFFFF', border: sel ? '2px solid #6818F8' : '1px solid rgba(8,26,83,0.14)', boxShadow: sel ? 'inset 0 0 0 2px #FFFFFF' : 'none' }}>
                    <span style={{ position: 'absolute', inset: 0, background: "url(\"" + svgUrl(t.svg) + "\") " + (isColoredPattern(t.svg) ? 'center / cover no-repeat' : 'center / 260% auto no-repeat'), opacity: 1, filter: isColoredPattern(t.svg) ? 'none' : 'invert(1) contrast(1.6)' }}></span>
                    {t.gen ? <span role="button" tabIndex={0} title="Delete this pattern" aria-label="Delete this pattern" onClick={(e) => { e.stopPropagation(); removeGen(t.id); }} style={{ position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: '50%', background: '#FFFFFF', border: '1px solid rgba(194,58,31,0.35)', color: '#C23A1F', fontSize: 12, fontWeight: 800, lineHeight: '18px', textAlign: 'center', boxShadow: '0 1px 4px rgba(8,26,83,.2)' }}>✕</span> : null}
                    {t.kept ? <span style={{ position: 'absolute', left: 4, bottom: 4, fontSize: 9, fontWeight: 800, color: '#FFFFFF', background: 'rgba(104,24,248,.9)', borderRadius: 99, padding: '1px 5px' }}>Kept</span> : null}
                  </button>
                );
              })}
              <button onClick={newPattern} disabled={genList.length >= MAX_GEN} title={genList.length >= MAX_GEN ? 'Delete one to generate another (5 max)' : 'Generate a new pattern'} style={{ appearance: 'none', cursor: genList.length >= MAX_GEN ? 'default' : 'pointer', opacity: genList.length >= MAX_GEN ? 0.45 : 1, aspectRatio: '1 / 1', borderRadius: 8, border: '1.5px dashed #9B7BF2', background: '#F8F5FF', color: '#6818F8', fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 11.5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"></path><path d="M21 3v6h-6"></path></svg>
                {genList.length >= MAX_GEN ? '5 max' : 'Generate'}</button>
            </div>
            {patOn ? <Slider label="Intensity" min={0.05} max={0.4} step={0.01} value={d.pattern.opacity ?? 0.3} fmt={(x) => Math.round(x * 100) + '%'} onChange={(x) => setPat({ opacity: x })} /> : null}
            {patOn ? <Slider label="Size" min={0.5} max={2.5} step={0.05} value={d.pattern.size ?? 1} fmt={(x) => Math.round(x * 100) + '%'} onChange={(x) => setPat({ size: x })} /> : null}
            {patOn ? <Slider label="Angle" min={0} max={180} step={5} value={d.pattern.angle || 0} fmt={(x) => x + '°'} onChange={(x) => setPat({ angle: x })} /> : null}
            <span style={{ fontSize: 11.5, color: '#8A93A8', fontWeight: 700 }}>{genList.length}/{MAX_GEN}</span>
          </div>

          {showLayout ? <div style={ui.card}>
            <span style={ui.label}>Layout</span>
            {template === 'scenic-logo' ? <Slider label="Logo width" min={80} max={280} step={2} value={d.logoWidth || 150} fmt={(x) => x + 'px'} onChange={(x) => setO({ logoWidth: x })} isOverride={'logoWidth' in o} onReset={() => clearO(['logoWidth'])} /> : null}
            {kind === 'header' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ ...ui.rowLabel, width: 'auto' }}>Page behavior</span>
                {HEADER_BEHAVIORS.map((hb) => {
                  const on = (v.behavior || 'first-page-full') === hb.id;
                  return (
                    <button key={hb.id} onClick={() => change({ behavior: hb.id })} style={{ appearance: 'none', cursor: 'pointer', textAlign: 'left', borderRadius: 10, padding: '9px 12px', border: on ? '1.5px solid #6818F8' : '1px solid rgba(8,26,83,0.14)', background: on ? '#F1EAFE' : '#FFFFFF', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ flex: 'none', width: 14, height: 14, marginTop: 2, borderRadius: '50%', border: on ? '4px solid #6818F8' : '1.5px solid #B9C0CF', boxSizing: 'border-box', background: '#FFFFFF' }}></span>
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 12.5, color: '#081A53' }}>{hb.label}</span>
                        {hb.note ? <span style={{ fontSize: 11.5, color: '#8A93A8', lineHeight: 1.4 }}>{hb.note}</span> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
            {kind === 'footer' && pageCount ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ ...ui.rowLabel, width: 'auto' }}>Apply footer to</span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button onClick={() => change({ applyTo: 'this', pages: [activePage] })} style={ui.seg(applyTo === 'this')}>This page ({activePage})</button>
                  <button onClick={() => change({ applyTo: 'all' })} style={ui.seg(applyTo === 'all')}>All pages</button>
                  <button onClick={() => change({ applyTo: 'selected', pages: v.pages && v.pages.length ? v.pages : [activePage] })} style={ui.seg(applyTo === 'selected')}>Selected pages</button>
                </div>
                {applyTo === 'selected' ? (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {pages.map((p) => { const on = (v.pages || []).includes(p); return <button key={p} onClick={() => change({ pages: on ? (v.pages || []).filter((x) => x !== p) : [...(v.pages || []), p].sort((a, c) => a - c) })} style={{ ...ui.seg(on), minWidth: 36 }}>{p}</button>; })}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div> : null}

          {STYLE_KEYS.some((k) => k in o) ? (
            <button onClick={() => clearO(STYLE_KEYS)} style={{ ...ui.btn, alignSelf: 'flex-start', color: '#FD5920', borderColor: 'rgba(253,89,32,0.3)', background: 'rgba(253,89,32,0.06)' }}>Reset colors & images to Brand Center</button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

const FSChrome = { ChromeRender, ChromePanel, resolveChrome, HEADER_TEMPLATES, FOOTER_TEMPLATES };
if (typeof window !== 'undefined') window.FSChrome = FSChrome;
if (typeof module !== 'undefined') module.exports = FSChrome;
