// CatalystOS hand-off for the Document Builder.
// COS opens apps with ?client=<id>&org=<id>&app=factsheetbuilder (older links: ?brand=<base64 JSON>).
// Keeps agency (org) + client in localStorage so every page shares them, fills
// [data-cos="client"|"agency"|"email"], wires [data-cos="back"|"signout"] and the
// select[data-cos="picker"] client picker. Clients are always the signed-in agency's own.
(function () {
  if (window.CosCtx) return;
  var KEY = 'cosCtx';
  var DASH = 'https://pilot-dash-ten.vercel.app/COS.dc.html';
  var ctx = {};
  try { ctx = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { ctx = {}; }
  delete ctx.dashboardUrl; delete ctx.agencySlug;

  function decode(s) {
    if (!s) return null;
    var b = s.replace(/-/g, '+').replace(/_/g, '/'); while (b.length % 4) b += '=';
    var tries = [
      function () { return JSON.parse(decodeURIComponent(atob(b))); },
      function () { return JSON.parse(atob(b)); },
      function () { return JSON.parse(decodeURIComponent(s)); }
    ];
    for (var i = 0; i < tries.length; i++) { try { var v = tries[i](); if (v && typeof v === 'object') return v; } catch (e) {} }
    return null;
  }
  function str(v) { return typeof v === 'string' || typeof v === 'number' ? String(v) : ''; }
  function first(o, keys) { for (var i = 0; i < keys.length; i++) { var v = o && o[keys[i]]; if (str(v)) return str(v); } return ''; }

  var q = new URLSearchParams(location.search);
  var data = decode(q.get('brand')) || {};
  var next = {
    clientId: q.get('client') || first(data, ['clientId', 'client_id']) || first(data.client, ['id']),
    clientName: q.get('clientName') || first(data, ['clientName', 'client_name']) || first(data.client, ['name']),
    orgId: q.get('org') || first(data, ['orgId', 'org', 'organizationId', 'organization_id', 'agencyId']) || first(data.agency, ['id']),
    agencyName: first(data, ['agencyName', 'agency_name', 'orgName']) || first(data.agency, ['name'])
  };
  if (!next.orgId) { try { var ac = JSON.parse(localStorage.getItem('cos-app-ctx') || '{}'); if (ac.org) next.orgId = ac.org; } catch (e) {} }
  // Opening the app for another agency wipes the previous agency's client.
  if (next.orgId && ctx.orgId && next.orgId !== ctx.orgId) ctx = {};
  if (next.clientId && next.clientId !== ctx.clientId) ctx.clientName = '';
  Object.keys(next).forEach(function (k) { if (next[k]) ctx[k] = next[k]; });
  save();
  try { var ac2 = JSON.parse(localStorage.getItem('cos-app-ctx') || '{}') || {}; if (ctx.orgId) ac2.org = ctx.orgId; if (ctx.clientId) ac2.client = ctx.clientId; localStorage.setItem('cos-app-ctx', JSON.stringify(ac2)); } catch (e) {}

  function save() { try { localStorage.setItem(KEY, JSON.stringify(ctx)); } catch (e) {} }
  function dashUrl(clientId) {
    var p = new URLSearchParams();
    if (ctx.orgId) p.set('org', ctx.orgId);
    if (clientId || ctx.clientId) p.set('client', clientId || ctx.clientId);
    var s = p.toString(); return DASH + (s ? '?' + s : '');
  }
  function go(url) { try { if (window.top !== window) { window.top.location.href = url; return; } } catch (e) {} location.href = url; }

  var clients = null, loading = false, user = null, orgs = null, orgsLoading = false;
  // Admins (CatalystOS staff) get a workspace switcher: their own personal workspace, or any agency's platform.
  var ADMINS = ['ehutchings@catalyst-os.ai', 'erika@crybabydesign.com'];
  function isAdmin() { return !!(user && user.email && ADMINS.indexOf(String(user.email).toLowerCase()) >= 0); }
  function personalId() { return user ? 'personal-' + user.uid : ''; }
  function usePersonal() { ctx = { orgId: personalId(), agencyName: 'My Workspace', personal: true }; save(); syncAppCtx(); }
  function syncAppCtx() { try { var a = JSON.parse(localStorage.getItem('cos-app-ctx') || '{}') || {}; a.org = ctx.orgId || ''; a.client = ctx.clientId || ''; localStorage.setItem('cos-app-ctx', JSON.stringify(a)); } catch (e) {} }
  function loadOrgs() {
    if (orgs || orgsLoading || !isAdmin()) return; orgsLoading = true;
    fbMod().then(function (m) { return m.loadOrganizations(); }).then(function (L) { orgs = (L || []).filter(function (o) { return o && o.id && !/^personal-/.test(o.id); }).map(function (o) { return { id: o.id, name: o.name || o.id }; }).sort(function (a, b) { return a.name.localeCompare(b.name); }); })
      .catch(function (e) { console.warn('[CatalystOS] could not load agencies', e); orgs = []; }).then(function () { orgsLoading = false; emit(); });
  }
  function switchWs(val) {
    if (val === '__personal') usePersonal();
    else { var o = (orgs || []).find(function (x) { return x.id === val; }); ctx = { orgId: val, agencyName: o ? o.name : '' }; save(); syncAppCtx(); }
    location.href = location.pathname; // reload clean (no ?org/?client) so every part of the page uses the new workspace
  }
  function paintWs() {
    document.querySelectorAll('[data-cos="agency-wrap"]').forEach(function (wrap) {
      var sel = wrap.querySelector('select[data-cos="ws"]');
      if (!isAdmin()) { if (sel) sel.remove(); Array.prototype.forEach.call(wrap.children, function (c) { if (c.__cosHid) { c.style.display = ''; c.__cosHid = false; } }); return; }
      Array.prototype.forEach.call(wrap.children, function (c) { if (c.tagName !== 'SELECT' && !c.__cosHid) { c.style.display = 'none'; c.__cosHid = true; } });
      if (!sel) { sel = document.createElement('select'); sel.setAttribute('data-cos', 'ws'); sel.setAttribute('aria-label', 'Workspace'); sel.title = 'Admin: switch between your own workspace and an agency\u2019s platform';
        sel.style.cssText = "appearance:none;-webkit-appearance:none;cursor:pointer;font-family:'Manrope',sans-serif;font-size:13px;font-weight:800;color:#FFFFFF;background:rgba(255,255,255,0.1) url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%23fff' stroke-width='1.6'/%3E%3C/svg%3E\") no-repeat right 10px center;border:1px solid rgba(255,255,255,0.3);border-radius:8px;height:30px;padding:0 28px 0 10px;max-width:260px;";
        sel.addEventListener('change', function () { switchWs(sel.value); }); wrap.appendChild(sel); }
      var cur = ctx.personal ? '__personal' : (ctx.orgId || '');
      var sig = JSON.stringify([cur, orgs, ctx.agencyName]); if (sel.__sig === sig) return; sel.__sig = sig;
      while (sel.firstChild) sel.removeChild(sel.firstChild);
      var add = function (v, t, parent) { var o = document.createElement('option'); o.value = v; o.textContent = t; o.style.color = '#081A53'; (parent || sel).appendChild(o); };
      add('__personal', 'ADMIN \u00b7 My Workspace');
      var g = document.createElement('optgroup'); g.label = 'Agency platforms'; sel.appendChild(g);
      var list = (orgs || []).slice(); if (!ctx.personal && ctx.orgId && !list.some(function (x) { return x.id === ctx.orgId; })) list.unshift({ id: ctx.orgId, name: ctx.agencyName || 'Current agency' });
      if (!orgs) add('', 'Loading agencies\u2026', g);
      list.forEach(function (x) { add(x.id, 'ADMIN \u00b7 ' + x.name, g); });
      sel.value = cur;
    });
  }
  function fbMod() { return import(new URL('./firebase-sync.js', location.href).href); }
  function loadClients() {
    if (loading) return;
    if (ctx.personal) { clients = []; emit(); return; }
    loading = true;
    fbMod().then(function (m) {
      return m.loadClients().then(function (r) {
        if (r.orgId && !ctx.orgId) { ctx.orgId = r.orgId; save(); }
        clients = (r.clients || []).filter(function (c) { return c && c.id && (!ctx.orgId || !c.organization_id || c.organization_id === ctx.orgId); })
          .map(function (c) { return { id: c.id, name: c.name || 'Untitled client' }; })
          .sort(function (a, b) { return a.name.localeCompare(b.name); });
        if (ctx.clientId && !clients.some(function (c) { return c.id === ctx.clientId; }) && clients.length) { /* client not in this agency */ ctx.clientId = ''; ctx.clientName = ''; }
        var mm = clients.find(function (x) { return x.id === ctx.clientId; }); if (mm) ctx.clientName = mm.name;
        save();
        return ctx.orgId && !ctx.agencyName ? m.loadOrganization(ctx.orgId).then(function (o) { if (o && o.name) { ctx.agencyName = o.name; save(); } }) : null;
      });
    }).catch(function (e) { console.warn('[CatalystOS] could not load clients', e); clients = clients || []; })
      .then(function () { loading = false; emit(); });
  }

  function paintPicker(sel) {
    var list = (clients || []).slice();
    if (ctx.clientId && !list.some(function (c) { return c.id === ctx.clientId; })) list.unshift({ id: ctx.clientId, name: ctx.clientName || 'Current client' });
    var sig = JSON.stringify([ctx.clientId, clients ? 1 : 0, list]);
    if (sel.__cosSig === sig) return;
    sel.__cosSig = sig;
    while (sel.firstChild) sel.removeChild(sel.firstChild);
    if (!ctx.clientId) { var o0 = document.createElement('option'); o0.value = ''; o0.textContent = ctx.personal ? 'No clients \u00b7 My Workspace' : (clients ? 'Select a Client' : 'Loading clients…'); sel.appendChild(o0); }
    list.forEach(function (c) { var o = document.createElement('option'); o.value = c.id; o.textContent = c.name; sel.appendChild(o); });
    sel.value = ctx.clientId || '';
  }
  function setText(sel, t) { document.querySelectorAll(sel).forEach(function (el) { if (el.textContent !== t) el.textContent = t; }); }
  function paint() {
    // The select is created here (not in the template) so React never reconciles its options.
    document.querySelectorAll('[data-cos="picker-mount"]').forEach(function (m) {
      if (m.querySelector('select')) return;
      var s = document.createElement('select'); s.setAttribute('data-cos', 'picker'); s.setAttribute('aria-label', 'Client');
      s.style.cssText = "appearance:none;-webkit-appearance:none;border:0;outline:none;background:transparent;font-family:'Manrope',sans-serif;font-size:15px;font-weight:700;color:#081A53;height:100%;padding:0 54px 0 18px;min-width:220px;cursor:pointer;";
      m.appendChild(s);
    });
    document.querySelectorAll('select[data-cos="picker"]').forEach(paintPicker);
    setText('[data-cos="client"]', ctx.clientName || 'Client Name');
    setText('[data-cos="agency"]', ctx.agencyName || '');
    setText('[data-cos="email"]', (user && user.email) || '');
    document.querySelectorAll('[data-cos="agency-wrap"]').forEach(function (el) { var d = ctx.agencyName || isAdmin() ? 'flex' : 'none'; if (el.style.display !== d) el.style.display = d; });
    paintWs();
    document.querySelectorAll('[data-cos="account"]').forEach(function (el) { var d = user ? 'flex' : 'none'; if (el.style.display !== d) el.style.display = d; });
    var h = dashUrl();
    document.querySelectorAll('[data-cos="back"]').forEach(function (el) { if (el.getAttribute('href') !== h) el.setAttribute('href', h); });
  }
  var emitting = false;
  function emit() {
    paint(); if (emitting) return; emitting = true;
    try { window.dispatchEvent(new CustomEvent('cos-ctx', { detail: ctx })); } catch (e) {}
    emitting = false;
  }

  window.CosCtx = {
    get: function () { return Object.assign({}, ctx); },
    isAdmin: isAdmin,
    orgs: function () { return (orgs || []).slice(); },
    switchWorkspace: switchWs,
    dashboardUrl: dashUrl,
    clients: function () { return (clients || []).slice(); },
    setClient: function (id, name) { if (!id || (id === ctx.clientId && (!name || name === ctx.clientName))) return; ctx.clientId = id; if (name) ctx.clientName = name; save(); emit(); }
  };

  // Switching client in the app picker opens that client's dashboard (CatalystOS rule: apps never reload with a new client).
  document.addEventListener('change', function (e) {
    var sel = e.target; if (!sel || !sel.matches || !sel.matches('select[data-cos="picker"]')) return;
    var id = sel.value; if (!id || id === ctx.clientId) return;
    var m = (clients || []).find(function (c) { return c.id === id; });
    window.CosCtx.setClient(id, m ? m.name : '');
    go(dashUrl(id));
  }, true);
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-cos="back"],[data-cos="signout"]'); if (!t) return;
    e.preventDefault();
    if (t.getAttribute('data-cos') === 'signout') { if (window.CatalystAuth) window.CatalystAuth.signOut(); else go(dashUrl()); return; }
    go(dashUrl());
  }, true);

  function watchAuth() {
    var tries = 0;
    (function wait() {
      if (window.CatalystAuth) {
        var onUser = function () { if (isAdmin()) { if (!ctx.orgId || (ctx.personal && ctx.orgId !== personalId()) || (/^personal-/.test(ctx.orgId) && !ctx.personal)) { usePersonal(); emit(); } loadOrgs(); } else if (user && ctx.personal) { ctx = {}; save(); syncAppCtx(); } };
        window.CatalystAuth.ready.then(function (u) { user = u || null; onUser(); paint(); loadClients(); });
        window.addEventListener('catalyst-auth', function (e) { var u = (e.detail && e.detail.user) || null; var changed = (u && u.uid) !== (user && user.uid); user = u; if (changed && u) { onUser(); clients = null; } paint(); if (changed && u) loadClients(); });
        return;
      }
      if (++tries < 40) return setTimeout(wait, 100);
      loadClients();
    })();
  }
  function start() {
    paint(); watchAuth();
    // Light repaint instead of a DOM observer (avoids fighting React re-renders).
    setInterval(paint, 1000);
    window.dispatchEvent(new CustomEvent('cos-ctx', { detail: ctx }));
    // Keep every app in step with Brand Command: ask apps to re-pull the brand on load, on return to the tab, when another tab changes brand data, and periodically.
    var lastR = 0;
    function brandRefresh(force) { var n = Date.now(); if (!force && n - lastR < 15000) return; lastR = n; try { window.dispatchEvent(new CustomEvent('cos-brand-refresh', { detail: ctx })); } catch (e) {} }
    window.CosCtx.refreshBrand = function () { brandRefresh(true); };
    setTimeout(function () { brandRefresh(true); }, 900);
    window.addEventListener('focus', function () { brandRefresh(); });
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') brandRefresh(); });
    window.addEventListener('storage', function (e) { if (e.key && /^cos-bcc/i.test(e.key)) brandRefresh(); });
    setInterval(function () { if (document.visibilityState === 'visible') brandRefresh(); }, 60000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
