// Shared Brand SDK — every app reads client/brand data through this, never by
// hand-rolling its own localStorage/Firestore reach-in. Firestore (via firebase-sync.js)
// is the source of truth; the Brand Command Center's localStorage cache is only a fast,
// offline-friendly fallback for the client list.

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
      return profile;
    }
    const clients = await listClients();
    const client = clients.find((c) => c.id === clientId);
    return client ? mod.buildBrandProfile(client) : null;
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
