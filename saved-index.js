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
    const cid = clientOf(v, clientId); if (!cid) return null;
    const thumb = typeof v.thumb === 'string' && /^https:/.test(v.thumb) ? v.thumb : '';
    const rec = { clientId: cid, app: APP, ref: String(v.t), title: v.title || 'Untitled document', campaignIds: Array.isArray(v.campaignIds) ? v.campaignIds.slice() : [], openUrl: openUrlFor(v, cid), thumb, orgId: (v.cloud && v.cloud.orgId) || v.org || ctx().orgId || '' };
    if (v.approved !== undefined) rec.approved = !!v.approved;
    return await (await SF()).recordSave(rec);
  } catch (e) { console.warn('Saved Files', e); return null; }
}
export async function removeVersion(v, { clientId = '' } = {}) {
  try { if (!v || v.t == null) return; const cid = clientOf(v, clientId); if (!cid) return; await (await SF()).removeSave(cid, APP, String(v.t)); } catch (e) { console.warn('Saved Files', e); }
}
