// Shared Brand SDK — every app reads client/brand data through this, never by
// hand-rolling its own localStorage/Firestore reach-in. Firestore (via firebase-sync.js)
// is the source of truth; the Brand Command Center's localStorage cache is only a fast,
// offline-friendly fallback for the client list.

// Brand Command → Typography → Case (Erika's rule: every type style except body copy defaults to Title Case).
// Source of truth: the dashboard's type-case.js (pilot-dash; its brand-sdk.js adds the same typeCaseFor/applyTypeCase as
// below). Loaded from the dashboard so every builder follows the same rules (AP or Chicago per brand; names, trademarks
// and acronyms kept). Builders change the TEXT when rendering and exporting (never CSS text-transform, never the saved
// content). If the rules can't load, text stays as written.
const TC_HOST = 'https://catalystos-dashboard-staging.vercel.app/';
let TC = null;
export const typeCaseReady = import(TC_HOST + 'type-case.js').then((t) => { TC = t; return true; })
  .catch((e) => { console.warn('Brand Command type case rules could not load; text stays as written.', e); return false; });
async function withTypeCase(profile, client) {
  if (!profile || !(await typeCaseReady)) return profile;
  try {
    const raw = (client && client.typography) || profile.typography || [];
    const byId = Object.fromEntries(raw.map((t) => [t.id, t]));
    profile.typography = (profile.typography || raw.map((t) => ({ id: t.id, label: t.label || '', printLabel: t.printLabel || '', fontFamily: t.fontFamily || '', weight: t.weight || 400 })))
      .map((t) => ({ ...t, textCase: TC.effectiveCase({ label: t.label, textCase: (byId[t.id] || t).textCase }) }));
    profile.typeCase = TC.typeCaseMap(profile.typography);
    if (client && client.styleGuide && !profile.styleGuide) profile.styleGuide = client.styleGuide;
  } catch (e) { console.warn('type case', e); }
  return profile;
}
// The case for one type style: an exact label ('H1', 'Button / CTA') or a role ('heading', 'subheading', 'title',
// 'button', 'label', 'caption', 'quote', 'body'). 'asis' when the rules or the profile aren't there.
export function typeCaseFor(profile, style) {
  if (!TC || !profile) return 'asis';
  const ty = profile.typography || []; const m = profile.typeCase || TC.typeCaseMap(ty); return m[style] || TC.caseFor(ty, style);
}
// The text in the case Brand Command sets for that style. Body copy stays as written.
export function applyTypeCase(text, style, profile) {
  if (text == null || !TC || !profile) return text;
  try { return TC.applyCase(String(text), typeCaseFor(profile, style), { guide: TC.guideFor(profile), keep: TC.keepListFor(profile) }); } catch (e) { return text; }
}

export async function listClients() {
  try {
    const mod = await import('./firebase-sync.js');
    const { clients } = await mod.loadClients();
    if (clients && clients.length) return clients;
  } catch (e) { /* fall through to local cache */ }
  try {
    const raw = localStorage.getItem('cos-bcc-clients-v1');
    const data = raw ? JSON.parse(raw) : null;
    return (data && data.clients) || [];
  } catch (e) { return []; }
}

// The client's Brand Command images as apps read them: usable check and Keep kept, newest-added first.
function liveImages(c) {
  const at = (i) => { const t = Number(i.at) || Number(i.addedAt) || Date.parse(i.addedAt || '') || 0; if (t) return t; const m = /(1[5-9]\d{11})/.exec(String(i.id || '')); return m ? Number(m[1]) : 0; };
  return (c.brandImages || []).filter((i) => i && i.url).map((i, k) => ({ i, k, t: at(i) })).sort((a, b) => (b.t - a.t) || (a.k - b.k)).map(({ i }) => {
    const o = { id: i.id, url: i.url, sourceUrl: i.sourceUrl || '', category: i.category || '', tags: i.tags || {} };
    ['unusable', 'unusableWhy', 'keep', 'resChecked', 'at', 'scene', 'description', 'alt'].forEach((k) => { if (i[k] !== undefined) o[k] = i[k]; });
    return o;
  });
}

// Flattened, walled-off brand profile for one client (colors, fonts, voice, writing).
// Falls back to building a same-shaped profile from the raw local cache if Firestore
// is unreachable, so consuming apps never need to branch on which source answered.
export async function getBrandProfile(clientId) {
  if (!clientId) return null;
  try {
    const mod = await import('./firebase-sync.js');
    const profile = await mod.loadBrandProfile(clientId);
    if (profile) {
      // Older profiles were saved before logos were added — fill them from the client doc.
      const needLogos = !profile.logos || !(profile.logos.color || profile.logos.black || profile.logos.white);
      if (profile.headerTemplate === undefined || profile.footerTemplate === undefined) { const c0 = (await listClients()).find((x) => x.id === clientId); if (c0) { profile.headerTemplate = c0.headerTemplate || null; profile.footerTemplate = c0.footerTemplate || null; } }
      if (needLogos || !profile.typography || !profile.customFonts) {
        const c = (await listClients()).find((x) => x.id === clientId);
        if (c) {
          if (needLogos) profile.logos = { color: c.manualLogoColor || '', black: c.manualLogoBlack || '', white: c.manualLogoWhite || '' };
          if (!profile.typography) profile.typography = (c.typography || []).map((t) => ({ id: t.id, label: t.label || '', printLabel: t.printLabel || '', fontFamily: t.fontFamily || '', weight: t.weight || 400 }));
          if (!profile.customFonts) profile.customFonts = ((c.fonts && c.fonts.custom) || []).map((x) => ({ name: x.name, dataUrl: x.dataUrl || '' }));
        }
      }
      // The saved profile is only rebuilt when Brand Command saves: its images always come from the live client record
      // (with Brand Command's Not usable / Keep marks), newest-added first.
      let cl = null; try { cl = (await listClients()).find((x) => x.id === clientId); if (cl) profile.images = liveImages(cl); } catch (e) {}
      return withTypeCase(profile, cl);
    }
    const clients = await listClients();
    const client = clients.find((c) => c.id === clientId);
    return client ? withTypeCase(mod.buildBrandProfile(client), client) : null;
  } catch (e) { return null; }
}

// Resolves which client to use: exact name match, sole client, or an explicit id.
// Returns null (never throws) if nothing matches — callers decide how to prompt.
export async function pickClient({ id, name } = {}) {
  const clients = await listClients();
  if (!clients.length) return null;
  if (id) return clients.find((c) => c.id === id) || null;
  const n = (name || '').trim().toLowerCase();
  if (n) return clients.find((c) => (c.name || '').trim().toLowerCase() === n) || null;
  return clients.length === 1 ? clients[0] : null;
}

// ---- Approved versions: any app can approve a piece of generated content into a client's
// Current Approved Version for that slot; every prior approval stays in history and can be
// reinstated. slotKey identifies the asset (e.g. "socialPost:linkedin", "brandGuideDoc").
export async function approveAsset(clientId, slotKey, slotLabel, value, sourceApp) {
  const mod = await import('./firebase-sync.js');
  return mod.approveVersion(clientId, slotKey, slotLabel, value, sourceApp);
}

export async function getCurrentApproved(clientId) {
  try { const mod = await import('./firebase-sync.js'); return await mod.loadCurrentApproved(clientId); }
  catch (e) { return {}; }
}

export async function listVersions(clientId, slotKey) {
  try { const mod = await import('./firebase-sync.js'); return await mod.loadApprovedVersions(clientId, slotKey); }
  catch (e) { return []; }
}

export async function reinstateVersion(clientId, slotKey, versionId) {
  const mod = await import('./firebase-sync.js');
  return mod.reinstateVersion(clientId, slotKey, versionId);
}

// Builds a controlled context object for AI calls: only populated fields, optionally
// scoped to a subset of sections, never raw internal ids/blobs/scrape metadata. Every
// app's AI features should build their prompt context through this instead of hand-picking
// fields, so "what's safe to send" stays in one place. sections (optional) filters to any
// of: 'company', 'colors', 'typography', 'voice', 'writing', 'approved'.
export async function buildAIContext(clientId, { sections } = {}) {
  const profile = await getBrandProfile(clientId);
  if (!profile) return {};
  const want = (key) => !sections || sections.includes(key);
  const ctx = {};

  if (want('company')) {
    if (profile.name) ctx.company = profile.name;
    if (profile.website) ctx.website = profile.website;
  }
  if (want('colors')) {
    const colors = ['primaryColor', 'secondaryColor', 'accentColor', 'neutralColor']
      .map((k) => profile[k]).filter(Boolean);
    if (colors.length) ctx.colors = colors;
  }
  if (want('typography')) {
    if (profile.headingFont) ctx.headingFont = profile.headingFont;
    if (profile.bodyFont) ctx.bodyFont = profile.bodyFont;
  }
  if (want('voice') && profile.voiceSummary) ctx.voiceSummary = profile.voiceSummary;
  if (want('writing') && profile.writingSystem) {
    const writing = {};
    Object.entries(profile.writingSystem).forEach(([k, v]) => { if (v && v.text) writing[k] = v.text; });
    if (Object.keys(writing).length) ctx.writing = writing;
  }
  if (want('approved')) {
    const approved = await getCurrentApproved(clientId);
    const slots = Object.values(approved || {}).filter((v) => v && v.value);
    if (slots.length) ctx.approvedContent = slots.map((v) => ({ label: v.slotLabel, value: v.value }));
  }
  return ctx;
}
