// CatalystOS Saved Files: every saved document is also listed in the shared Saved Files bar (all apps, per client).
// This only adds an index entry; the document itself is still saved exactly as before (browser + CatalystOS database).
// The one line that differs between the Document Builder and the Fact Sheet Builder is APP / LIVE below (this is the Fact Sheet Builder).
export const APP = 'factsheets';
export const LIVE = 'https://catalystos-factsheet-builder-staging.vercel.app/';
const SF = () => import('https://catalystos-dashboard-staging.vercel.app/saved-files.js');
function ctx() { try { return (window.CosCtx && window.CosCtx.get && window.CosCtx.get()) || {}; } catch (e) { return {}; } }
export function clientOf(v, fallback) { return (v && v.cloud && v.cloud.clientId) || (v && v.clientId) || fallback || ctx().clientId || ''; }
export function openUrlFor(v, clientId) {
  const page = v && v.kind === 'existing' ? 'Existing%20Document%20Builder.dc.html' : 'Catalyst%20Document%20Builder.dc.html';
  const p = new URLSearchParams(); p.set('restore', String(v.t)); if (clientId) p.set('client', clientId); const o = ctx().orgId; if (o && !/^personal-/.test(o)) p.set('org', o);
  return LIVE + page + '?' + p.toString();
}
// The document's own thumbnail (first page, captured when it's saved): a data URL Saved Files stores once, or an https URL.
export function thumbOf(v) {
  if (!v) return ''; let th = typeof v.thumb === 'string' ? v.thumb : ''; if (!th) { try { th = localStorage.getItem('cbThumb:' + v.t) || ''; } catch (e) {} }
  return /^https:/.test(th) || (/^data:image\/(png|jpeg|jpg|webp);base64,/.test(th) && th.length > 1500) ? th : '';
}
// Adds or updates the Saved Files entry for a saved version. Never throws.
// What the document is, shown on its Saved Files thumbnail: its template type, Custom, Rebuilt (from an upload) or Text (Word).
const KINDS = { 'sell-sheet': 'Sell sheet', 'case-study': 'Case study', 'white-paper': 'White paper', proposal: 'Proposal', 'fact-sheet': 'Fact sheet' };
export function kindOf(v) {
  if (!v) return 'Custom'; if (KINDS[v.docType]) return KINDS[v.docType];
  const t = String(v.title || '').toLowerCase();
  if (/case[- ]?stud/.test(t)) return 'Case study'; if (/sell[- ]?sheet|one[- ]?pager/.test(t)) return 'Sell sheet'; if (/white[- ]?paper/.test(t)) return 'White paper'; if (/proposal|\brfp\b/.test(t)) return 'Proposal'; if (/fact[- ]?sheet/.test(t)) return 'Fact sheet';
  return v.kind === 'existing' ? 'Rebuilt' : 'Custom';
}
export async function recordVersion(v, { clientId = '' } = {}) {
  try {
    if (!v || v.t == null || v.demo) return null;
    const cid = clientOf(v, clientId); const org = (v.cloud && v.cloud.orgId) || v.org || ctx().orgId || '';
    if (!cid && (!org || /^personal-/.test(org))) return null; // no client: listed as an agency file
    const thumb = thumbOf(v);
    const rec = { clientId: cid, app: APP, ref: String(v.t), title: v.title || 'Untitled document', campaignIds: Array.isArray(v.campaignIds) ? v.campaignIds.slice() : [], openUrl: openUrlFor(v, cid), thumb, kind: kindOf(v), orgId: (v.cloud && v.cloud.orgId) || v.org || ctx().orgId || '' };
    if (v.approved !== undefined) rec.approved = !!v.approved;
    return await (await SF()).recordSave(rec);
  } catch (e) { console.warn('Saved Files', e); return null; }
}
export async function removeVersion(v, { clientId = '' } = {}) {
  try { if (!v || v.t == null) return; const cid = clientOf(v, clientId); const org = (v.cloud && v.cloud.orgId) || v.org || ctx().orgId || ''; const sc = cid || (org ? 'org:' + org : ''); if (!sc) return; await (await SF()).removeSave(sc, APP, String(v.t)); } catch (e) { console.warn('Saved Files', e); }
}

// Lists documents saved before Saved Files existed (once per page load). Documents keep the client they were saved for;
// documents saved without a client are listed as agency files. Nothing already listed is changed.
export async function syncAll() {
  if (window.__cosSfSynced) return 0; window.__cosSfSynced = true;
  try {
    const org = ctx().orgId || ''; const okOrg = (o) => !!o && !/^personal-/.test(o);
    let L = []; try { L = JSON.parse(localStorage.getItem('cbVersions') || '[]') || []; } catch (e) {}
    let T = []; try { T = JSON.parse(localStorage.getItem('cbTextDocs') || '[]') || []; } catch (e) {}
    const inWs = (o) => !o || !org || o === org;
    const items = [];
    L.forEach((v) => { if (!v || v.t == null || v.demo) return; const o = (v.cloud && v.cloud.orgId) || v.org || ''; if (!inWs(o)) return;
      const cid = (v.cloud && v.cloud.clientId) || v.clientId || ''; const oo = o || org; if (!cid && !okOrg(oo)) return;
      items.push({ clientId: cid, orgId: okOrg(oo) ? oo : '', app: APP, ref: String(v.t), title: v.title || 'Untitled document', campaignIds: Array.isArray(v.campaignIds) ? v.campaignIds : [], openUrl: openUrlFor(v, cid), thumb: thumbOf(v), kind: kindOf(v), approved: v.approved, at: v.savedAt || v.t }); });
    T.forEach((r) => { if (!r || r.t == null) return; const o = (r.cloud && r.cloud.orgId) || r.org || ''; if (!inWs(o)) return; const cid = (r.cloud && r.cloud.clientId) || r.clientId || ''; const oo = o || org; if (!cid && !okOrg(oo)) return;
      const p = new URLSearchParams(); p.set('txt', String(r.t)); if (cid) p.set('client', cid); if (okOrg(oo)) p.set('org', oo);
      items.push({ clientId: cid, orgId: okOrg(oo) ? oo : '', app: APP, ref: 'txt:' + r.t, title: (r.title || 'Untitled document') + ' (Word)', openUrl: LIVE + 'Existing%20Document%20Builder.dc.html?' + p.toString(), kind: 'Text', at: r.updated || r.t }); });
    if (!items.length) return 0;
    const sf = await SF(); const added = await sf.syncSaved(items);
    // Entries listed before thumbnails were sent get the document's thumbnail (nothing else changes; waiting actions are left alone).
    try {
      const byScope = new Map(); items.forEach((it) => { if (!it.thumb) return; const sc = sf.scopeOf(it.clientId, it.orgId); if (sc && !/^org:/.test(sc)) { if (!byScope.has(sc)) byScope.set(sc, []); byScope.get(sc).push(it); } });
      for (const [sc, list] of byScope) {
        const rows = await sf.listSaved(sc).catch(() => []); const by = new Map(rows.map((r) => [r.app + '~' + r.ref, r]));
        for (const it of list) { const r = by.get(it.app + '~' + it.ref); if (!r || r.thumb || r.pending) continue;
          await sf.recordSave({ clientId: sc, app: it.app, ref: it.ref, title: r.title || it.title, campaignIds: r.campaignIds || [], openUrl: r.openUrl || it.openUrl, thumb: it.thumb, approved: r.approved, note: r.note || '', at: r.at }); }
      }
    } catch (e) { console.warn('Saved Files thumbnails', e); }
    // Entries listed before kinds were sent get their label (Case study, Sell sheet, Custom, Text…), keeping their place in the date order.
    try {
      const scopes = new Map(); items.forEach((it) => { const sc = sf.scopeOf(it.clientId, it.orgId); if (sc) { if (!scopes.has(sc)) scopes.set(sc, []); scopes.get(sc).push(it); } });
      for (const [sc, list] of scopes) { const rows = await sf.listSaved(sc).catch(() => []); const by = new Map(rows.map((r) => [r.app + '~' + r.ref, r]));
        for (const it of list) { const r = by.get(it.app + '~' + it.ref); if (r && it.kind && r.kind !== it.kind && sf.patchSave) await sf.patchSave(sc, it.app, it.ref, { kind: it.kind }); } }
    } catch (e) { console.warn('Saved Files labels', e); }
    return added;
  } catch (e) { console.warn('Saved Files sync', e); return 0; }
}
