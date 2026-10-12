// CatalystOS Saved Files: every saved document is also listed in the shared Saved Files bar (all apps, per client).
// This only adds an index entry; the document itself is still saved exactly as before (browser + CatalystOS database).
// The one line that differs between the Document Builder and the Fact Sheet Builder is APP / LIVE below (this is the Fact Sheet Builder).
export const APP = 'factsheets';
export const LIVE = 'https://factsheet-builder.vercel.app/';
const SF = () => import('https://pilot-dash-ten.vercel.app/saved-files.js');
function ctx() { try { return (window.CosCtx && window.CosCtx.get && window.CosCtx.get()) || {}; } catch (e) { return {}; } }
export function clientOf(v, fallback) { return (v && v.cloud && v.cloud.clientId) || (v && v.clientId) || fallback || ctx().clientId || ''; }
export function openUrlFor(v, clientId) {
  const page = v && v.kind === 'existing' ? 'Existing%20Document%20Builder.dc.html' : 'Catalyst%20Document%20Builder.dc.html';
  const p = new URLSearchParams(); p.set('restore', String(v.t)); if (clientId) p.set('client', clientId); const o = ctx().orgId; if (o && !/^personal-/.test(o)) p.set('org', o);
  return LIVE + page + '?' + p.toString();
}
// Adds or updates the Saved Files entry for a saved version. Never throws.
export async function recordVersion(v, { clientId = '' } = {}) {
  try {
    if (!v || v.t == null || v.demo) return null;
    const cid = clientOf(v, clientId); const org = (v.cloud && v.cloud.orgId) || v.org || ctx().orgId || '';
    if (!cid && (!org || /^personal-/.test(org))) return null; // no client: listed as an agency file
    const thumb = typeof v.thumb === 'string' && /^https:/.test(v.thumb) ? v.thumb : '';
    const rec = { clientId: cid, app: APP, ref: String(v.t), title: v.title || 'Untitled document', campaignIds: Array.isArray(v.campaignIds) ? v.campaignIds.slice() : [], openUrl: openUrlFor(v, cid), thumb, orgId: (v.cloud && v.cloud.orgId) || v.org || ctx().orgId || '' };
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
      items.push({ clientId: cid, orgId: okOrg(oo) ? oo : '', app: APP, ref: String(v.t), title: v.title || 'Untitled document', campaignIds: Array.isArray(v.campaignIds) ? v.campaignIds : [], openUrl: openUrlFor(v, cid), thumb: typeof v.thumb === 'string' && /^https:/.test(v.thumb) ? v.thumb : '', approved: v.approved, at: v.savedAt || v.t }); });
    T.forEach((r) => { if (!r || r.t == null) return; const o = (r.cloud && r.cloud.orgId) || r.org || ''; if (!inWs(o)) return; const cid = (r.cloud && r.cloud.clientId) || r.clientId || ''; const oo = o || org; if (!cid && !okOrg(oo)) return;
      const p = new URLSearchParams(); p.set('txt', String(r.t)); if (cid) p.set('client', cid); if (okOrg(oo)) p.set('org', oo);
      items.push({ clientId: cid, orgId: okOrg(oo) ? oo : '', app: APP, ref: 'txt:' + r.t, title: (r.title || 'Untitled document') + ' (Word)', openUrl: LIVE + 'Existing%20Document%20Builder.dc.html?' + p.toString(), at: r.updated || r.t }); });
    return items.length ? await (await SF()).syncSaved(items) : 0;
  } catch (e) { console.warn('Saved Files sync', e); return 0; }
}
