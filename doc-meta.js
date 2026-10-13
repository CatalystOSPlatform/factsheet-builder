// Saved-document extras shared by Doc Home and the builders: the Approved switch (approved documents go to the client's
// Brand Command knowledge base, where we decide whether they belong to the whole brand or to campaigns, and ask when
// unsure) and assigning a saved document to one or more Brand Command campaigns.
const PILOT = 'https://catalystos-dashboard-staging.vercel.app/';
const fbMod = () => import(new URL('./firebase-sync.js', import.meta.url).href);
const akMod = () => import(PILOT + 'approved-knowledge.js');
// Shared Saved Files bar index (same entry is updated when approval or campaigns change).
const sfMod = () => import(new URL('./saved-index.js', import.meta.url).href);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function loadV() { try { return JSON.parse(localStorage.getItem('cbVersions') || '[]') || []; } catch (e) { return []; } }
function saveV(list) { try { localStorage.setItem('cbVersions', JSON.stringify(list)); } catch (e) {} }
function ctx() { try { return (window.CosCtx && window.CosCtx.get && window.CosCtx.get()) || {}; } catch (e) { return {}; } }
export function clientIdFor(v, fallback) { return (v && v.cloud && v.cloud.clientId) || (v && v.clientId) || fallback || ctx().clientId || ''; }

// Calls Brand Command's AI service directly (same as every CatalystOS app).
export async function complete(body) {
  const r = await fetch(PILOT + 'api/claude', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(typeof body === 'string' ? { messages: [{ role: 'user', content: body }] } : body) });
  const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || 'HTTP ' + r.status); return d.text || '';
}

function idbGet(key) {
  return new Promise((res) => { try { const r = indexedDB.open('cbVersionData', 1); r.onupgradeneeded = () => r.result.createObjectStore('ex'); r.onsuccess = () => { try { const q = r.result.transaction('ex', 'readonly').objectStore('ex').get(String(key)); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); } catch (e) { res(null); } }; r.onerror = () => res(null); } catch (e) { res(null); } });
}
export async function snapshotFor(v) {
  if (!v) return null; const isEx = v.kind === 'existing';
  let data = isEx ? (v.ex ? { ex: v.ex } : null) : (v.app ? { app: v.app } : null);
  if (!data && v.exIdb) { const d = await idbGet(v.exIdb === true ? v.t : v.exIdb); if (d) data = isEx ? { ex: d.ex || d } : d; }
  if (!data && v.cloud) { try { const d = await (await fbMod()).loadDocVersionSnapshot(v.cloud); if (d) data = isEx ? { ex: d.ex || d } : d; } catch (e) {} }
  return data;
}
// Every piece of readable text in a saved document (text boxes, tables, captions), in order, without duplicates.
export function textOf(data) {
  const out = []; const seen = new Set();
  const add = (t) => { t = String(t || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/[ \t]+/g, ' ').trim(); if (t.length > 1 && !/^data:|^https?:\/\//.test(t) && !seen.has(t)) { seen.add(t); out.push(t); } };
  const walk = (o, depth) => { if (!o || depth > 9) return; if (Array.isArray(o)) { o.forEach((x) => (Array.isArray(x) ? add(x.filter((y) => typeof y === 'string').join(' | ')) : walk(x, depth + 1))); return; } if (typeof o !== 'object') return;
    for (const k of Object.keys(o)) { const v = o[k]; if (typeof v === 'string' && /^(text|title|cap|caption|label|value|html)$/i.test(k)) add(v); else if (v && typeof v === 'object' && !/^(photos|vars|thumb|src|aiPending|fonts|style)$/i.test(k)) walk(v, depth + 1); } };
  if (data && data.app) { walk(data.app.pageObjs, 0); walk(data.app.textDoc, 0); } else if (data) walk(data.ex || data, 0);
  return out.join('\n\n').slice(0, 60000);
}

async function file(v, list, i, app, fallback) {
  const cid = clientIdFor(v, fallback); if (!cid) return null;
  const data = await snapshotFor(v); const text = textOf(data);
  const ak = await akMod();
  return ak.fileApproved({ clientId: cid, app, key: 'document:' + v.t, title: v.title || 'Untitled document', type: v.docType || '', text, campaignIds: v.campaignIds || [], complete });
}

// Turns the Approved switch on or off for a saved document. Resolves a short message for the person.
export async function setApproved(v, on, { app = 'Document Builder', clientId = '' } = {}) {
  const list = loadV(); const i = list.findIndex((z) => z.t === v.t); if (i < 0) return '';
  list[i].approved = !!on; saveV(list);
  sfMod().then((m) => m.recordVersion(list[i], { clientId })).catch(() => {});
  if (list[i].cloud) { try { const fb = await fbMod(); fb.saveDocVersionMeta && (await fb.saveDocVersionMeta(list[i].cloud, { approved: !!on })); } catch (e) {} }
  const cid = clientIdFor(list[i], clientId);
  if (!cid) return 'Marked approved here. Pick a client at the top so it can be added to that client’s Brand Command knowledge base.';
  const slot = 'document:' + v.t;
  try {
    const fb = await fbMod();
    if (on) {
      const text = textOf(await snapshotFor(list[i]));
      await fb.approveVersion(cid, slot, v.title || 'Untitled document', { type: 'document', title: v.title || 'Untitled document', text, pages: v.sub || '', docId: String(v.t), campaignIds: list[i].campaignIds || [] }, app);
      // The knowledge base entry follows Saved Files (recorded above as approved); the older separate entry is retired.
      await (await akMod()).removeApproved(cid, slot).catch(() => {});
      return 'Approved. The knowledge base now treats it as approved work.';
    }
    if (fb.unapproveVersion) await fb.unapproveVersion(cid, slot);
    await (await akMod()).removeApproved(cid, slot).catch(() => {});
    return 'No longer approved. It stays in the knowledge base as saved work.';
  } catch (e) { console.warn(e); return on ? 'Approved here, but Brand Command couldn’t be updated. Try again in a moment.' : 'Couldn’t update Brand Command. Try again in a moment.'; }
}

// Assigns a saved document to campaigns (any number, including none).
export async function setCampaigns(v, ids, { app = 'Document Builder', clientId = '' } = {}) {
  const list = loadV(); const i = list.findIndex((z) => z.t === v.t); if (i < 0) return;
  list[i].campaignIds = ids.slice(); saveV(list);
  sfMod().then((m) => m.recordVersion(list[i], { clientId })).catch(() => {});
  if (list[i].cloud) { try { const fb = await fbMod(); fb.saveDocVersionMeta && (await fb.saveDocVersionMeta(list[i].cloud, { campaignIds: ids.slice() })); } catch (e) {} }
  if (list[i].approved && clientIdFor(list[i], clientId)) { try { await file(list[i], list, i, app, clientId); } catch (e) {} }
}

const campCache = {};
export async function campaignsFor(clientId) {
  if (!clientId) return [];
  if (!campCache[clientId]) campCache[clientId] = fbMod().then((fb) => fb.loadCampaigns(clientId)).then((r) => (r || []).filter((c) => !/^archived$/i.test(c.status || ''))).catch(() => { delete campCache[clientId]; return []; });
  return campCache[clientId];
}

// A small dialog to pick campaigns. Resolves the picked ids, or null if cancelled.
export function pickCampaigns({ title = '', camps = [], selected = [] } = {}) {
  return new Promise((resolve) => {
    const prev = document.activeElement; const sel = new Set(selected);
    const wrap = document.createElement('div'); wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-labelledby', 'cb-camp-t');
    wrap.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(8,26,83,.45);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,sans-serif;';
    const btn = 'height:38px;padding:0 16px;border-radius:9px;cursor:pointer;font:700 13px Manrope,sans-serif;';
    const draw = () => {
      wrap.innerHTML = '<div style="max-width:520px;width:100%;background:#fff;border-radius:16px;padding:24px 26px;box-shadow:0 20px 60px rgba(0,0,0,.3);">' +
        '<h2 id="cb-camp-t" style="margin:0 0 6px;font:800 19px Manrope,sans-serif;color:#081A53;">Assign to campaigns</h2>' +
        '<p style="margin:0 0 14px;font-size:13.5px;line-height:1.55;color:#4A5168;">Pick every campaign “' + esc(title || 'this document') + '” is for. Campaigns come from Brand Command.</p>' +
        (camps.length ? '<div role="group" aria-label="Campaigns" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px;">' + camps.map((c) => '<button type="button" data-c="' + esc(c.id) + '" aria-pressed="' + (sel.has(c.id) ? 'true' : 'false') + '" style="height:34px;padding:0 14px;border-radius:999px;cursor:pointer;font:700 13px Manrope,sans-serif;border:1px solid ' + (sel.has(c.id) ? '#081A53' : 'rgba(8,26,83,.2)') + ';background:' + (sel.has(c.id) ? '#081A53' : '#fff') + ';color:' + (sel.has(c.id) ? '#fff' : '#081A53') + ';">' + esc(c.name || 'Untitled campaign') + '</button>').join('') + '</div>'
          : '<p style="margin:0 0 18px;font-size:13px;color:#8A4B00;">This client has no campaigns in Brand Command yet.</p>') +
        '<div style="display:flex;gap:10px;justify-content:flex-end;"><button type="button" data-k="x" style="' + btn + 'border:1px solid rgba(8,26,83,.2);background:#fff;color:#4A5168;">Cancel</button><button type="button" data-k="ok" style="' + btn + 'border:0;background:#081A53;color:#fff;">Save</button></div></div>';
      wrap.querySelectorAll('[data-c]').forEach((b) => b.addEventListener('click', () => { const id = b.getAttribute('data-c'); sel.has(id) ? sel.delete(id) : sel.add(id); draw(); const a = wrap.querySelector('[data-c="' + CSS.escape(id) + '"]'); a && a.focus(); }));
      wrap.querySelector('[data-k="x"]').onclick = () => done(null);
      wrap.querySelector('[data-k="ok"]').onclick = () => done([...sel]);
    };
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); done(null); } };
    const done = (v) => { wrap.remove(); document.removeEventListener('keydown', onKey, true); try { prev && prev.focus && prev.focus(); } catch (e) {} resolve(v); };
    draw(); document.body.appendChild(wrap); document.addEventListener('keydown', onKey, true);
    const f = wrap.querySelector('[data-c]') || wrap.querySelector('[data-k="ok"]'); f && f.focus();
  });
}

// Opens the picker for a saved document and saves the answer. Resolves the new ids (or null if cancelled).
export async function assignCampaigns(v, { app = 'Document Builder', clientId = '' } = {}) {
  const cid = clientIdFor(v, clientId);
  if (!cid) { window.alert('Pick a client at the top first. Campaigns come from that client’s Brand Command.'); return null; }
  const camps = await campaignsFor(cid);
  const ids = await pickCampaigns({ title: v.title, camps, selected: v.campaignIds || [] });
  if (ids) await setCampaigns(v, ids, { app, clientId: cid });
  return ids;
}
export function campaignNames(v, camps) { const ids = (v && v.campaignIds) || []; return (camps || []).filter((c) => ids.includes(c.id)).map((c) => c.name || 'Untitled campaign'); }

function idbOpen(name, store) { return new Promise((res, rej) => { const r = indexedDB.open(name, 1); r.onupgradeneeded = () => r.result.createObjectStore(store); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
const bump = () => { try { window.dispatchEvent(new StorageEvent('storage', { key: 'cbVersions' })); } catch (e) {} };

// Saves a saved document as one of "My Templates" (asks for the name). Resolves the template name, or '' if not made.
export async function makeTemplate(v, name) {
  if (!v) return '';
  if (name == null) name = window.prompt('Name this template. It will appear under My Templates across the app.', v.title || 'My Template');
  name = String(name || '').trim(); if (!name) return '';
  const isEx = v.kind === 'existing'; let data = isEx ? (v.ex ? { ex: v.ex } : null) : (v.app ? { app: v.app, photos: v.photos } : null);
  if (!data && v.exIdb) { const d = await idbGet(v.exIdb === true ? v.t : v.exIdb); if (d) data = isEx ? { ex: d.ex || d } : d; }
  if (!data && v.cloud) { try { const d = await (await fbMod()).loadDocVersionSnapshot(v.cloud); if (d) data = isEx ? { ex: d.ex || d } : d; } catch (e) {} }
  if (!data || !(isEx ? data.ex : data.app)) { window.alert('This document’s data is no longer available, so it can’t be made into a template.'); return ''; }
  const id = 'ut' + Date.now();
  try { const db = await idbOpen('cbUserTemplates', 't'); await new Promise((res, rej) => { const tx = db.transaction('t', 'readwrite'); tx.objectStore('t').put(isEx ? { kind: 'existing', ex: data.ex } : { kind: 'new', app: data.app, photos: data.photos || null }, id); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); } catch (e) { window.alert('Could not save the template.'); return ''; }
  const pages = (String(v.sub || '').split('· ')[1] || '').trim(); const th = v.thumb || localStorage.getItem('cbThumb:' + v.t) || '';
  let L = []; try { L = JSON.parse(localStorage.getItem('cbUserTemplates') || '[]'); } catch (e) {} L = L.filter((x) => x.name !== name);
  L.unshift({ id, kind: isEx ? 'existing' : 'new', name, desc: 'Saved from ' + (v.title || 'a document') + (pages ? ' · ' + pages : ''), thumb: /^data:image\//.test(th) && th.length < 90000 ? th : '', savedAt: Date.now() });
  try { localStorage.setItem('cbUserTemplates', JSON.stringify(L)); } catch (e) { L.forEach((x) => { x.thumb = ''; }); try { localStorage.setItem('cbUserTemplates', JSON.stringify(L)); } catch (er) { window.alert('Not enough storage to save this template.'); return ''; } }
  try { window.dispatchEvent(new StorageEvent('storage', { key: 'cbUserTemplates' })); } catch (e) {}
  return name;
}

// Permanently deletes a saved document (CatalystOS database, this browser, and its Saved Files entry). No confirm here:
// callers ask first. Throws if the database copy couldn't be deleted (nothing is removed then).
export async function deleteVersion(v) {
  if (!v) return; const t = v.t;
  if (v.cloud && v.cloud.id) await (await fbMod()).deleteDocVersion(v.cloud);
  try { const D = JSON.parse(localStorage.getItem('cbDeletedVersions') || '[]'); if (!D.includes(t)) { D.push(t); localStorage.setItem('cbDeletedVersions', JSON.stringify(D.slice(-500))); } } catch (e) {}
  const L = loadV().filter((x) => x.t !== t); try { localStorage.setItem('cbVersions', JSON.stringify(L)); localStorage.removeItem('cbThumb:' + t); } catch (e) {}
  const k = v.exIdb === true ? t : null; if (k && !L.some((x) => x.exIdb === t)) { try { const db = await idbOpen('cbVersionData', 'ex'); db.transaction('ex', 'readwrite').objectStore('ex').delete(String(k)); } catch (e) {} }
  sfMod().then((m) => m.removeVersion(v)).catch(() => {});
  bump();
}
// Word documents (made from uploads in the Existing Document Builder): same delete as that page's own.
export async function deleteTextDocument(t) {
  let T = []; try { T = JSON.parse(localStorage.getItem('cbTextDocs') || '[]') || []; } catch (e) {}
  const rec = T.find((x) => x.t === t);
  try { const D = JSON.parse(localStorage.getItem('cbDeletedVersions') || '[]'); if (!D.includes(t)) { D.push(t); localStorage.setItem('cbDeletedVersions', JSON.stringify(D)); } } catch (e) {}
  if (rec && rec.cloud) { try { await (await fbMod()).deleteTextDoc(rec.cloud); } catch (e) { console.warn('Cloud delete of text document failed; removed from this gallery', e); } }
  try { const db = await idbOpen('cbVersionData', 'ex'); db.transaction('ex', 'readwrite').objectStore('ex').delete('txt:' + t); } catch (e) {}
  try { localStorage.setItem('cbTextDocs', JSON.stringify(T.filter((x) => x.t !== t))); } catch (e) {}
  try { window.dispatchEvent(new StorageEvent('storage', { key: 'cbTextDocs' })); } catch (e) {}
}
