// Admin "Share to agency": copies selected saved documents into an agency's library so that
// agency (and admins) see them in Saved Documents. Each copy is a new document owned by the agency.
function idbGet(key) {
  return new Promise((res) => {
    try {
      const r = indexedDB.open('cbVersionData', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('ex');
      r.onsuccess = () => { try { const q = r.result.transaction('ex', 'readonly').objectStore('ex').get(String(key)); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); } catch (e) { res(null); } };
      r.onerror = () => res(null);
    } catch (e) { res(null); }
  });
}
async function snapshotOf(v, fb) {
  const isEx = v.kind === 'existing';
  if (isEx) {
    if (v.ex) return v.ex;
    if (v.exIdb) { const d = await idbGet(v.exIdb === true ? v.t : v.exIdb); if (d) return d.ex || d; }
  } else {
    if (v.app) return { app: v.app, photos: v.photos || {} };
    const d = await idbGet(v.t); if (d && d.app) return d;
  }
  if (v.cloud && v.cloud.path) { const d = await fb.loadDocVersionSnapshot(v.cloud); if (d) return isEx ? (d.ex || d) : d; }
  return null;
}
export async function shareToAgency(list, orgId) {
  const fb = await import(new URL('./firebase-sync.js', location.href).href);
  const u = window.CatalystAuth && window.CatalystAuth.user && window.CatalystAuth.user();
  let n = 0; const failed = [];
  for (let i = 0; i < list.length; i++) {
    const v = list[i];
    try {
      const snap = await snapshotOf(v, fb);
      if (!snap) { failed.push((v.title || 'Untitled document') + ' (no saved data in this browser)'); continue; }
      const t = Date.now() + i;
      let thumb = v.thumb || localStorage.getItem('cbThumb:' + v.t) || ''; if (thumb.length > 300000) thumb = '';
      await fb.saveDocVersion({ clientId: '', orgId, versionId: String(t), snapshot: snap,
        meta: { title: v.title || 'Untitled document', label: v.label || '', sub: v.sub || '', kind: v.kind || 'new', t, thumb, sharedBy: u ? (u.email || '') : '', copiedFrom: String(v.t) } });
      n++;
    } catch (e) { console.warn('Share to agency failed', e); failed.push((v.title || 'Untitled document') + ' (' + ((e && (e.code || e.message)) || 'error') + ')'); }
  }
  return { n, failed };
}

// Duplicate saved documents into the CURRENT workspace (admin personal, admin-in-agency, or any agency member).
export async function duplicateDocs(list) {
  const fb = await import(new URL('./firebase-sync.js', location.href).href);
  const ctx = (window.CosCtx && window.CosCtx.get && window.CosCtx.get()) || {};
  let L = []; try { L = JSON.parse(localStorage.getItem('cbVersions') || '[]') || []; } catch (e) {}
  let n = 0; const failed = [];
  for (let i = 0; i < list.length; i++) {
    const v = list[i]; const t = Date.now() + i; const title = (v.title || 'Untitled document') + ' Copy';
    try {
      const snap = await snapshotOf(v, fb);
      if (!snap) { failed.push((v.title || 'Untitled document') + ' (no saved data found)'); continue; }
      let thumb = v.thumb || localStorage.getItem('cbThumb:' + v.t) || ''; if (thumb.length > 300000) thumb = '';
      const entry = JSON.parse(JSON.stringify(v)); delete entry.cloud; delete entry.sharedFrom; entry.t = t; entry.title = title; entry.savedAt = t; delete entry.sig;
      if (v.exIdb) entry.exIdb = v.exIdb === true ? v.t : v.exIdb;
      if (!entry.ex && !entry.exIdb && !entry.app && (v.kind === 'existing')) entry.ex = snap;
      try { const ref = await fb.saveDocVersion({ clientId: ctx.clientId || '', orgId: ctx.orgId || '', versionId: String(t), snapshot: snap, meta: { title, label: v.label || '', sub: v.sub || '', kind: v.kind || 'new', t, thumb, copiedFrom: String(v.t) } }); if (ref) { entry.cloud = ref; entry.org = ref.orgId || ctx.orgId || ''; } } catch (e) { console.warn('Duplicate cloud save failed', e); }
      if (thumb) { try { localStorage.setItem('cbThumb:' + t, thumb); } catch (e) {} }
      L.unshift(entry); n++;
    } catch (e) { failed.push((v.title || 'Untitled document') + ' (' + ((e && (e.code || e.message)) || 'error') + ')'); }
  }
  const put = list2 => { try { localStorage.setItem('cbVersions', JSON.stringify(list2)); return true; } catch (e) { return false; } };
  if (!put(L)) put(L.map((x, k) => k < n ? x : Object.assign({}, x, { ex: x.cloud ? undefined : x.ex, app: x.cloud ? undefined : x.app })));
  try { window.dispatchEvent(new StorageEvent('storage', { key: 'cbVersions' })); } catch (e) {}
  return { n, failed };
}
export function galleryImages() { try { return (JSON.parse(localStorage.getItem('cbImageLib') || '[]') || []).filter(x => x && x.src); } catch (e) { return []; } }
