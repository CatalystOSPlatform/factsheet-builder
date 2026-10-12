// The shared Saved Files window's card buttons for this app's documents: Approved, Assign to Campaigns, Duplicate,
// Make Template and Delete. Each one does exactly what the same button in Saved Documents does (doc-meta.js / share-agency.js).
// Registered on Doc Home, the Document Builder and the Existing Document Builder. Saved Files runs these for any
// document of the current client (also ones asked for while another app was open), so documents are looked up by ref.
const here = (f) => new URL('./' + f, import.meta.url).href;
const dm = () => import(here('doc-meta.js'));
const fbMod = () => import(here('firebase-sync.js'));
function ctx() { try { return (window.CosCtx && window.CosCtx.get && window.CosCtx.get()) || {}; } catch (e) { return {}; } }
const loadJ = (k) => { try { return JSON.parse(localStorage.getItem(k) || '[]') || []; } catch (e) { return []; } };
const sameT = (a, b) => String(a) === String(b);

// Only this client's documents (or agency documents with no client) are ever touched.
function belongs(v, rec) {
  const c = ctx(); const cur = c.personal ? '' : (c.clientId || '');
  const vc = (v.cloud && v.cloud.clientId) || v.clientId || '';
  const rc = rec && rec._cid ? String(rec._cid) : '';
  if (vc && vc !== cur) return false;
  if (rc && !/^org:/.test(rc) && rc !== cur) return false;
  const o = c.orgId || ''; const vo = v.org || (v.cloud && v.cloud.orgId) || '';
  if (vo && o && vo !== o && !v.sharedFrom && !(v.cloud && v.cloud.shared)) return false;
  return true;
}
// A saved document by ref: this browser first, then the CatalystOS database (added here the same way Saved Documents does).
async function findDoc(ref) {
  const t = Number(ref); let v = loadJ('cbVersions').find((x) => x && sameT(x.t, t));
  if (v) return v;
  try {
    const c = ctx(); const rows = await (await fbMod()).loadDocVersions({ clientId: c.clientId || '', orgId: c.orgId || '' });
    const r = (rows || []).find((x) => sameT(x.t, t)); if (!r) return null;
    const L = loadJ('cbVersions'); if (!L.some((x) => sameT(x.t, t))) { L.push({ t: r.t, kind: r.kind || 'new', label: r.label, sub: r.sub, title: r.title, thumb: r.thumb || '', cloud: r.ref, fromCloud: true, sharedFrom: r.sharedFrom || '', org: (r.ref && r.ref.orgId) || r.organization_id || '', approved: r.approved, campaignIds: r.campaignIds || [] }); L.sort((a, b) => b.t - a.t); try { localStorage.setItem('cbVersions', JSON.stringify(L)); } catch (e) {} }
    return loadJ('cbVersions').find((x) => x && sameT(x.t, t)) || null;
  } catch (e) { console.warn('Saved Files: document lookup', e); return null; }
}
async function findWord(t) {
  let r = loadJ('cbTextDocs').find((x) => x && sameT(x.t, t)); if (r) return r;
  try { const c = ctx(); const rows = await (await fbMod()).loadTextDocs({ clientId: c.clientId || '', orgId: c.orgId || '' }); const x = (rows || []).find((y) => sameT(y.t, t)); if (x) r = { t: x.t, title: x.title, cloud: x.ref, clientId: (x.ref && x.ref.clientId) || '' }; } catch (e) {}
  return r || null;
}
const refresh = () => { try { window.dispatchEvent(new StorageEvent('storage', { key: 'cbVersions' })); } catch (e) {} try { window.dispatchEvent(new CustomEvent('cb-saved-changed')); } catch (e) {} };
const notMine = () => { const e = new Error('This document belongs to another client.'); e.code = 'other-client'; return e; };
const wordOnly = (what) => { const e = new Error('Word documents can be opened and deleted here; ' + what + ' works on saved documents.'); e.code = 'word-doc'; return e; };

async function doc(ref, rec) {
  const v = await findDoc(ref); if (!v) { const e = new Error('This document isn’t saved in this workspace any more.'); e.code = 'missing'; throw e; }
  if (!belongs(v, rec)) throw notMine(); return v;
}
export const actions = {
  async approve(ref, on, rec) { if (/^txt:/.test(ref)) throw wordOnly('Approved'); const v = await doc(ref, rec); const msg = await (await dm()).setApproved(v, !!on, { clientId: ctx().clientId || '' }); refresh(); return msg; },
  async campaigns(ref, ids, rec) { if (/^txt:/.test(ref)) throw wordOnly('Assign to Campaigns'); const v = await doc(ref, rec); await (await dm()).setCampaigns(v, Array.isArray(ids) ? ids : [], { clientId: ctx().clientId || '' }); refresh(); },
  async duplicate(ref, _, rec) {
    if (/^txt:/.test(ref)) throw wordOnly('Duplicate'); const v = await doc(ref, rec);
    const r = await (await import(here('share-agency.js'))).duplicateDocs([v]);
    if (r.failed.length) { window.alert('Could not duplicate: ' + r.failed.join(', ')); throw new Error('duplicate failed'); }
    refresh(); return r.made;
  },
  async template(ref, _, rec) {
    if (/^txt:/.test(ref)) throw wordOnly('Make Template'); const v = await doc(ref, rec);
    const name = await (await dm()).makeTemplate(v); if (name) { window.alert('Saved as a template: ' + name + '. It now appears under My Templates.'); refresh(); }
    return name;
  },
  async remove(ref, _, rec) {
    if (/^txt:/.test(ref)) { const t = Number(String(ref).slice(4)); const w = await findWord(t); if (!w) return; if (!belongs(w, rec)) throw notMine(); await (await dm()).deleteTextDocument(t); refresh(); return; }
    const v = await findDoc(ref); if (!v) return; // already gone
    if (!belongs(v, rec)) throw notMine();
    try { await (await dm()).deleteVersion(v); } catch (e) { window.alert('Could not delete this document from the CatalystOS database. Check your connection and try again.'); throw e; }
    refresh();
  },
};
// Registers the actions with the shared Saved Files bar (once per page).
// The builders clear their link (?restore=…) as they open, before this loads, so they keep the link they were opened
// with in window.__cbSfUrl; a Duplicate / Make Template asked for in it (?sfAction=&sfRef=) is done here then.
function askedInLink() {
  try { const u = new URL(window.__cbSfUrl || ''); const act = u.searchParams.get('sfAction'), ref = u.searchParams.get('sfRef'); return act && ref && (act === 'duplicate' || act === 'template') ? { act, ref } : null; } catch (e) { return null; }
}
export function register() {
  if (window.__cbSfActions) return; window.__cbSfActions = true;
  let n = 0; const go = () => {
    if (!(window.CosSavedBar && window.CosSavedBar.setActions)) { if (n++ < 100) setTimeout(go, 150); return; }
    const w = askedInLink(); const live = new URLSearchParams(location.search).get('sfAction'); window.__cbSfUrl = '';
    window.CosSavedBar.setActions(actions);
    if (w && !live) setTimeout(() => { Promise.resolve(actions[w.act](w.ref, null, { ref: w.ref })).then(() => { try { window.CosSavedBar.refresh(); } catch (e) {} }).catch((e) => console.warn('Saved Files action', e)); }, 600);
  };
  go();
}
register();
