// Shared Firebase sync for CatalystOS Brand Command Center + App Board.
// Loads the Firebase SDK from CDN at runtime (no bundler needed) and exposes
// simple read/write helpers other apps/pages can reuse against the same data.

const firebaseConfig = {
  apiKey: "AIzaSyA0s678NudXhvRHTNVKRje_SQwQX2_mU3E",
  authDomain: "catalystos-staging.firebaseapp.com",
  projectId: "catalystos-staging",
  storageBucket: "catalystos-staging.firebasestorage.app",
};

// Wait for the CatalystOS sign-in (cos-app-auth.js) so Firestore reads run as the signed-in agency user.
async function authReady() {
  for (let i = 0; i < 40 && !window.CatalystAuth; i++) await new Promise((r) => setTimeout(r, 100));
  try { if (window.CatalystAuth) return await window.CatalystAuth.ready; } catch (e) {}
  return null;
}
function launchOrg() {
  try { const q = new URLSearchParams(location.search); if (q.get("org")) return q.get("org"); } catch (e) {}
  try { const a = JSON.parse(localStorage.getItem("cos-app-ctx") || "{}"); if (a.org) return a.org; } catch (e) {}
  try { const c = JSON.parse(localStorage.getItem("cosCtx") || "{}"); if (c.orgId) return c.orgId; } catch (e) {}
  return "";
}

let dbPromise = null;

async function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      await authReady();
      const appMod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
      const firestore = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
      const app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(firebaseConfig);
      const db = firestore.getFirestore(app);
      return { db, firestore, app };
    })();
  }
  return dbPromise;
}

// Each client is its own document in catalystos_clients/{clientId} — fully walled off from
// every other client's data. Only the app-level "which client is selected" UI preference
// lives in a separate small meta doc; it holds no client content.
// Agencies may only read their own clients, so the query is scoped to the agency (org).
export async function myOrgId() {
  const org = launchOrg(); if (org) return org;
  try {
    const user = window.CatalystAuth && window.CatalystAuth.user(); if (!user) return "";
    const { db, firestore } = await getDb();
    const m = await firestore.getDoc(firestore.doc(db, "catalystos_members", user.uid));
    return m.exists() ? m.data().orgId || "" : "";
  } catch (e) { return ""; }
}
export function isActiveClient(c) {
  if (!c) return false;
  const s = String(c.status || "").toLowerCase();
  return !c.archived && !c.deleted && !c.deletedAt && s !== "archived" && s !== "inactive" && s !== "deleted";
}
export async function loadClients() {
  const { db, firestore } = await getDb();
  const colRef = firestore.collection(db, "catalystos_clients");
  const orgId = await myOrgId();
  let snap = null;
  if (orgId) snap = await firestore.getDocs(firestore.query(colRef, firestore.where("organization_id", "==", orgId)));
  else snap = await firestore.getDocs(colRef); // admins only
  let selectedId = null;
  try { const metaSnap = await firestore.getDoc(firestore.doc(db, "catalystos_meta", "state")); selectedId = metaSnap.exists() ? metaSnap.data().selectedId || null : null; } catch (e) {}
  const clients = [];
  snap.forEach((d) => { const c = { ...d.data(), id: d.id }; if (isActiveClient(c)) clients.push(c); });
  return { clients, selectedId, orgId };
}
export async function loadOrganization(orgId) {
  if (!orgId) return null;
  try { const { db, firestore } = await getDb(); const s = await firestore.getDoc(firestore.doc(db, "catalystos_organizations", orgId)); return s.exists() ? { id: s.id, ...s.data() } : null; } catch (e) { return null; }
}

// removedIds: client ids deleted since the last save — their docs are removed too,
// so a deleted client's data doesn't linger walled off in Firestore forever.
export async function saveClients(clients, selectedId, removedIds = []) {
  const { db, firestore } = await getDb();
  const writes = clients.map((c) =>
    firestore.setDoc(firestore.doc(db, "catalystos_clients", c.id), { ...c, updatedAt: firestore.serverTimestamp() })
  );
  const deletes = removedIds.map((id) => firestore.deleteDoc(firestore.doc(db, "catalystos_clients", id)));
  const metaWrite = firestore.setDoc(firestore.doc(db, "catalystos_meta", "state"), { selectedId });
  await Promise.all([...writes, ...deletes, metaWrite]);
}

// A small, stable, flattened shape other apps can read without knowing our
// full internal schema — they pick the fields they need and can ignore the rest.
export function buildBrandProfile(client) {
  if (!client) return null;
  const colorByName = (name) => (client.colors || []).find((c) => (c.name || "").toLowerCase() === name)?.value;
  return {
    clientId: client.id,
    name: client.name,
    website: client.website || "",
    linkedin: client.linkedin || "",
    primaryColor: colorByName("primary") || client.colors?.[0]?.value || "",
    secondaryColor: colorByName("secondary") || client.colors?.[1]?.value || "",
    accentColor: colorByName("accent") || client.colors?.[2]?.value || "",
    neutralColor: colorByName("neutral") || client.colors?.[3]?.value || "",
    headingFont: (client.typography || []).find((t) => t.id === "t1")?.fontFamily || "",
    bodyFont: (client.typography || []).find((t) => t.id === "t5")?.fontFamily || "",
    typography: (client.typography || []).map((t) => ({ id: t.id, label: t.label || "", printLabel: t.printLabel || "", fontFamily: t.fontFamily || "", weight: t.weight || 400 })),
    customFonts: ((client.fonts && client.fonts.custom) || []).map((x) => ({ name: x.name, dataUrl: x.dataUrl || "" })),
    logos: { color: client.manualLogoColor || "", black: client.manualLogoBlack || "", white: client.manualLogoWhite || "" },
    headerTemplate: client.headerTemplate || null,
    footerTemplate: client.footerTemplate || null,
    writingSystem: buildWritingSystem(client.writingComponents),
    writingSources: (client.writingSources || []).map((s) => ({
      label: s.label, category: s.category, text: s.text || "", link: s.link || "", fileCount: (s.files || []).length,
    })),
    voiceSummary: client.writingComponents?.personality?.text || client.writingComponents?.description?.text || client.writing?.personality || client.writing?.description || "",
    updatedAt: Date.now(),
  };
}

// Flattens the structured writing fields into the plain-text shape apps read directly —
// each key resolved to whatever content exists (typed text wins, else a link reference).
function buildWritingSystem(wc) {
  if (!wc) return {};
  const field = (v) => (v && (v.text || v.link)) ? { text: v.text || "", link: v.link || "", fileCount: (v.files || []).length } : { text: "", link: "", fileCount: (v?.files || []).length };
  return {
    description: field(wc.description), mission: field(wc.mission), positioning: field(wc.positioning),
    approvedClaims: field(wc.claims), wordsToUse: field(wc.wordsUse), wordsToAvoid: field(wc.wordsAvoid),
    competitors: field(wc.competitors), personality: field(wc.personality), complianceRules: field(wc.compliance),
  };
}

export async function saveBrandProfile(client) {
  const profile = buildBrandProfile(client);
  if (!profile) return;
  const { db, firestore } = await getDb();
  const ref = firestore.doc(db, "catalystos_brand_profiles", client.id);
  await firestore.setDoc(ref, profile);
}

// ---- Approved versions: unlimited history per "slot" (a named piece of generated content,
// e.g. socialPost:linkedin, brandGuideDoc). Slots live in a subcollection per client so
// history never touches — or bloats — the client's own walled-off document. Exactly one
// version per slot has isCurrent:true; that's what "Current Approved Version" means. ----
export async function approveVersion(clientId, slotKey, slotLabel, value, sourceApp) {
  const { db, firestore } = await getDb();
  const col = firestore.collection(db, "catalystos_clients", clientId, "approvedVersions");
  const q = firestore.query(col, firestore.where("slotKey", "==", slotKey), firestore.where("isCurrent", "==", true));
  const existing = await firestore.getDocs(q);
  await Promise.all(existing.docs.map((d) => firestore.updateDoc(d.ref, { isCurrent: false })));
  await firestore.addDoc(col, { slotKey, slotLabel, value, sourceApp: sourceApp || "", isCurrent: true, approvedAt: firestore.serverTimestamp() });
}

export async function unapproveVersion(clientId, slotKey) {
  const { db, firestore } = await getDb();
  const col = firestore.collection(db, "catalystos_clients", clientId, "approvedVersions");
  const q = firestore.query(col, firestore.where("slotKey", "==", slotKey), firestore.where("isCurrent", "==", true));
  const existing = await firestore.getDocs(q);
  await Promise.all(existing.docs.map((d) => firestore.updateDoc(d.ref, { isCurrent: false })));
}

export async function loadApprovedVersions(clientId, slotKey) {
  const { db, firestore } = await getDb();
  const col = firestore.collection(db, "catalystos_clients", clientId, "approvedVersions");
  const q = slotKey ? firestore.query(col, firestore.where("slotKey", "==", slotKey)) : col;
  const snap = await firestore.getDocs(q);
  const versions = [];
  snap.forEach((d) => versions.push({ id: d.id, ...d.data() }));
  versions.sort((a, b) => (b.approvedAt?.toMillis?.() || 0) - (a.approvedAt?.toMillis?.() || 0));
  return versions;
}

// Current approved value per slot, e.g. { "socialPost:linkedin": {...version} }
export async function loadCurrentApproved(clientId) {
  const { db, firestore } = await getDb();
  const col = firestore.collection(db, "catalystos_clients", clientId, "approvedVersions");
  const q = firestore.query(col, firestore.where("isCurrent", "==", true));
  const snap = await firestore.getDocs(q);
  const bySlot = {};
  snap.forEach((d) => { const v = { id: d.id, ...d.data() }; bySlot[v.slotKey] = v; });
  return bySlot;
}

export async function reinstateVersion(clientId, slotKey, versionId) {
  const { db, firestore } = await getDb();
  const col = firestore.collection(db, "catalystos_clients", clientId, "approvedVersions");
  const q = firestore.query(col, firestore.where("slotKey", "==", slotKey), firestore.where("isCurrent", "==", true));
  const existing = await firestore.getDocs(q);
  await Promise.all(existing.docs.map((d) => firestore.updateDoc(d.ref, { isCurrent: false })));
  await firestore.updateDoc(firestore.doc(db, "catalystos_clients", clientId, "approvedVersions", versionId), { isCurrent: true });
}

// Telemetry events — one doc per event_id so retried/duplicate writes (from the
// client-side retry queue) collapse instead of double-counting. Behavior only:
// never stores approved assets, file/asset contents, or free text (enforced
// client-side in telemetry.js before this is ever called).
export async function writeTelemetryEvent(event) {
  const { db, firestore } = await getDb();
  const ref = firestore.doc(db, "catalystos_telemetry", event.event_id);
  await firestore.setDoc(ref, event, { merge: true });
}

// Reads recent telemetry events for the dashboard. Firestore-side filter on timestamp
// keeps this bounded; capped further client-side. Read-only — never mutates events.
export async function loadTelemetryEvents({ sinceISO, cap = 4000 } = {}) {
  const { db, firestore } = await getDb();
  const col = firestore.collection(db, "catalystos_telemetry");
  const q = sinceISO
    ? firestore.query(col, firestore.where("timestamp", ">=", sinceISO), firestore.orderBy("timestamp", "desc"), firestore.limit(cap))
    : firestore.query(col, firestore.orderBy("timestamp", "desc"), firestore.limit(cap));
  const snap = await firestore.getDocs(q);
  const events = [];
  snap.forEach((d) => events.push(d.data()));
  return events;
}

// ---- Pilot organizations (tenants): each pilot company gets a walled-off slice of
// catalystos_clients via organization_id, reached by a secret ?org=<id> link — no
// login yet, by design, but built so a future auth layer can gate the same link.
export async function loadOrganizations() {
  const { db, firestore } = await getDb();
  const snap = await firestore.getDocs(firestore.collection(db, "catalystos_organizations"));
  const orgs = [];
  snap.forEach((d) => orgs.push({ id: d.id, ...d.data() }));
  orgs.sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
  return orgs;
}

export async function getOrganization(orgId) {
  if (!orgId) return null;
  const { db, firestore } = await getDb();
  const snap = await firestore.getDoc(firestore.doc(db, "catalystos_organizations", orgId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function saveOrganization(org) {
  const { db, firestore } = await getDb();
  const ref = firestore.doc(db, "catalystos_organizations", org.id);
  const existing = await firestore.getDoc(ref);
  await firestore.setDoc(ref, { ...org, createdAt: existing.exists() ? existing.data().createdAt : firestore.serverTimestamp() });
}

export async function deleteOrganization(orgId) {
  const { db, firestore } = await getDb();
  await firestore.deleteDoc(firestore.doc(db, "catalystos_organizations", orgId));
}

// ---- Source Library: data sources/CSVs added from any builder app, tagged with which
// app created them and when — read by Brand Command Center's Source Library view. ----
export async function addDataSourceEntry(clientId, entry) {
  const { db, firestore } = await getDb();
  const col = firestore.collection(db, "catalystos_clients", clientId, "dataSources");
  const ref = await firestore.addDoc(col, { ...entry, createdAt: firestore.serverTimestamp() });
  return ref.id;
}

export async function loadDataSourceEntries(clientId) {
  const { db, firestore } = await getDb();
  const col = firestore.collection(db, "catalystos_clients", clientId, "dataSources");
  const snap = await firestore.getDocs(col);
  const rows = [];
  snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
  rows.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  return rows;
}

export async function deleteDataSourceEntry(clientId, entryId) {
  const { db, firestore } = await getDb();
  await firestore.deleteDoc(firestore.doc(db, "catalystos_clients", clientId, "dataSources", entryId));
}

export async function saveCampaign(clientId, campaign) {
  const { db, firestore } = await getDb();
  const ref = firestore.doc(db, "catalystos_clients", clientId, "campaigns", campaign.id);
  await firestore.setDoc(ref, { ...campaign, updatedAt: firestore.serverTimestamp() }, { merge: true });
}

export async function loadCampaigns(clientId) {
  const { db, firestore } = await getDb();
  const col = firestore.collection(db, "catalystos_clients", clientId, "campaigns");
  const snap = await firestore.getDocs(col);
  const rows = [];
  snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
  rows.sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
  return rows;
}

export async function deleteCampaign(clientId, campaignId) {
  const { db, firestore } = await getDb();
  await firestore.deleteDoc(firestore.doc(db, "catalystos_clients", clientId, "campaigns", campaignId));
}

export async function deleteClientCompletely(clientId) {
  const { db, firestore } = await getDb();
  const subcollections = ["campaigns", "dataSources", "approvedVersions"];
  for (const sub of subcollections) {
    const col = firestore.collection(db, "catalystos_clients", clientId, sub);
    const snap = await firestore.getDocs(col);
    await Promise.all(snap.docs.map((d) => firestore.deleteDoc(d.ref)));
  }
  await firestore.deleteDoc(firestore.doc(db, "catalystos_clients", clientId));
  await firestore.deleteDoc(firestore.doc(db, "catalystos_brand_profiles", clientId)).catch(() => {});
}

export async function loadBrandProfile(clientId) {
  const { db, firestore } = await getDb();
  const ref = firestore.doc(db, "catalystos_brand_profiles", clientId);
  const snap = await firestore.getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

// ---- Uploaded documents: the original file goes to Firebase Storage, a metadata doc goes to
// catalystos_clients/{clientId}/documents (or catalystos_organizations/{orgId}/documents when no client is picked). ----
export async function saveUploadedDocument({ file, clientId, orgId, name, pageCount, sourceApp }) {
  if (!file) throw new Error("No file");
  const { db, firestore, app } = await getDb();
  const storageMod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js");
  const org = orgId || (await myOrgId());
  const col = clientId ? firestore.collection(db, "catalystos_clients", clientId, "documents") : firestore.collection(db, "catalystos_organizations", org || "unassigned", "documents");
  const ref = firestore.doc(col);
  const safe = String(file.name || "document.pdf").replace(/[^\w.\- ]+/g, "_");
  const path = (clientId ? "catalystos_clients/" + clientId : "catalystos_organizations/" + (org || "unassigned")) + "/documents/" + ref.id + "/" + safe;
  const storage = storageMod.getStorage(app);
  const sref = storageMod.ref(storage, path);
  await storageMod.uploadBytes(sref, file, { contentType: file.type || "application/pdf" });
  const url = await storageMod.getDownloadURL(sref);
  const user = window.CatalystAuth && window.CatalystAuth.user && window.CatalystAuth.user();
  await firestore.setDoc(ref, {
    name: name || safe.replace(/\.pdf$/i, ""), fileName: file.name || safe, size: file.size || 0, contentType: file.type || "application/pdf",
    pageCount: pageCount || 0, storagePath: path, url, clientId: clientId || "", organization_id: org || "",
    sourceApp: sourceApp || "", uploadedBy: user ? (user.email || user.uid || "") : "", createdAt: firestore.serverTimestamp(),
  });
  return { id: ref.id, url, path, clientId: clientId || "", orgId: org || "" };
}

export async function updateUploadedDocument(info, patch) {
  if (!info || !info.id) return;
  const { db, firestore } = await getDb();
  const ref = info.clientId ? firestore.doc(db, "catalystos_clients", info.clientId, "documents", info.id) : firestore.doc(db, "catalystos_organizations", info.orgId || "unassigned", "documents", info.id);
  await firestore.updateDoc(ref, { ...patch, updatedAt: firestore.serverTimestamp() });
}

export async function loadUploadedDocuments(clientId) {
  const { db, firestore } = await getDb();
  const snap = await firestore.getDocs(firestore.collection(db, "catalystos_clients", clientId, "documents"));
  const rows = []; snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
  rows.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  return rows;
}

// ---- Document versions: metadata in catalystos_clients/{clientId}/documentVersions/{versionId} (or the
// agency's documentVersions when no client); the full snapshot is a JSON file in Storage (too big for Firestore). ----
function versionsCol(firestore, db, clientId, orgId) {
  return clientId ? firestore.collection(db, "catalystos_clients", clientId, "documentVersions") : firestore.collection(db, "catalystos_organizations", orgId || "unassigned", "documentVersions");
}
// The owning agency is the client's organization_id — never the signed-in admin's own org — so work an
// admin saves inside an agency account lands in (and is visible to) that agency.
async function ownerOrg(firestore, db, clientId, orgId) {
  if (clientId) { try { const c = await firestore.getDoc(firestore.doc(db, "catalystos_clients", clientId)); const o = c.exists() && c.data().organization_id; if (o) return o; } catch (e) {} }
  return orgId || (await myOrgId());
}
export async function saveDocVersion({ clientId, orgId, versionId, meta, snapshot }) {
  const { db, firestore, app } = await getDb();
  const storageMod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js");
  const org = await ownerOrg(firestore, db, clientId, orgId);
  const base = clientId ? "catalystos_clients/" + clientId : "catalystos_organizations/" + (org || "unassigned");
  const path = base + "/documentVersions/" + versionId + ".json";
  const json = JSON.stringify(snapshot);
  // Primary copy in Firestore (readable from any browser, no CORS), chunked under the 1MB doc limit.
  await writeSnapParts(firestore, db, base, versionId, json);
  try { const sref = storageMod.ref(storageMod.getStorage(app), path); await storageMod.uploadBytes(sref, new Blob([json], { type: "application/json" }), { contentType: "application/json" }); } catch (e) { console.warn("Storage copy failed (Firestore copy saved)", e); }
  const user = window.CatalystAuth && window.CatalystAuth.user && window.CatalystAuth.user();
  let thumb = meta.thumb || ""; if (thumb.length > 300000) thumb = "";
  const rec = { ...meta, app: FS_APP, thumb, snapshotPath: path, clientId: clientId || "", organization_id: org || "", savedBy: user ? (user.email || user.uid || "") : "", createdAt: firestore.serverTimestamp() };
  await firestore.setDoc(firestore.doc(versionsCol(firestore, db, clientId, org), versionId), rec);
  // Mirror into the agency's library so the agency sees it with or without that client selected.
  if (clientId && org) { try { await firestore.setDoc(firestore.doc(versionsCol(firestore, db, "", org), versionId), { ...rec, mirrorOf: "client" }); } catch (e) { console.warn("Agency mirror failed", e); } }
  const ref = { id: versionId, clientId: clientId || "", orgId: org || "", path };
  if (meta.sharedWith && meta.sharedWith.length) { try { await shareDocVersion(ref, rec, meta.sharedWith); } catch (e) { console.warn("Share failed", e); } }
  return ref;
}
// ---- Sharing: a copy of the version's metadata in catalystos_shared_docVersions/{versionId} listing the
// emails it is shared with; each recipient sees it in their own Saved Documents. ----
const normEmails = (L) => Array.from(new Set((L || []).map((e) => String(e || "").trim().toLowerCase()).filter((e) => /.+@.+\..+/.test(e))));
export async function shareDocVersion(ref, meta, emails) {
  if (!ref || !ref.id) return;
  const { db, firestore } = await getDb();
  const user = window.CatalystAuth && window.CatalystAuth.user && window.CatalystAuth.user();
  const to = normEmails(emails);
  const d = firestore.doc(db, "catalystos_shared_docVersions", String(ref.id));
  if (!to.length) { try { await firestore.deleteDoc(d); } catch (e) {} return; }
  const m = { ...(meta || {}) }; delete m.createdAt; delete m.sharedWith;
  await firestore.setDoc(d, { ...m, snapshotPath: ref.path || m.snapshotPath || "", clientId: ref.clientId || "", organization_id: ref.orgId || "", sharedWith: to, sharedBy: user ? (user.email || "").toLowerCase() : "", sharedAt: firestore.serverTimestamp() });
}
// The Fact Sheet Builder keeps its own list: its saves are marked app "factsheet" and only those are listed here.
const FS_APP = "factsheet";
export async function loadDocVersions({ clientId, orgId }) {
  const { db, firestore } = await getDb();
  const org = await ownerOrg(firestore, db, clientId, orgId);
  const rows = [], seen = new Set();
  const add = (snap, cid) => snap.forEach((d) => { if (seen.has(d.id)) return; const x = d.data(); if (x.app !== FS_APP) return; const rc = cid !== undefined ? cid : (x.clientId || "");
    if (clientId && rc && rc !== clientId) return; seen.add(d.id);
    rows.push({ ...x, ref: { id: d.id, clientId: rc, orgId: org || "", path: x.snapshotPath || "" } }); });
  if (clientId) { try { add(await firestore.getDocs(versionsCol(firestore, db, clientId, org)), clientId); } catch (e) { console.warn("Client versions load failed", e); } }
  if (org) { try { add(await firestore.getDocs(versionsCol(firestore, db, "", org))); } catch (e) { console.warn("Agency versions load failed", e); } }
  const me = window.CatalystAuth && window.CatalystAuth.user && window.CatalystAuth.user(); const em = me && me.email && String(me.email).toLowerCase();
  if (em) { try { const snap = await firestore.getDocs(firestore.query(firestore.collection(db, "catalystos_shared_docVersions"), firestore.where("sharedWith", "array-contains", em)));
    snap.forEach((d) => { if (seen.has(d.id)) return; const x = d.data(); if (x.app !== FS_APP) return; seen.add(d.id); rows.push({ ...x, sharedFrom: x.sharedBy || "", ref: { id: d.id, clientId: x.clientId || "", orgId: x.organization_id || "", path: x.snapshotPath || "", shared: true } }); });
  } catch (e) { console.warn("Shared versions load failed", e); } }
  return rows;
}
const SNAP_CHUNK = 700000;
function snapBase(path) { const m = String(path || "").match(/^(catalystos_(?:clients|organizations)\/[^/]+)\//); return m ? m[1] : ""; }
async function writeSnapParts(firestore, db, base, versionId, json) {
  const n = Math.max(1, Math.ceil(json.length / SNAP_CHUNK));
  const segs = base.split("/");
  for (let i = 0; i < n; i++) await firestore.setDoc(firestore.doc(db, ...segs, "docSnapshots", String(versionId), "parts", String(i).padStart(4, "0")), { i, n, d: json.slice(i * SNAP_CHUNK, (i + 1) * SNAP_CHUNK) });
  await firestore.setDoc(firestore.doc(db, ...segs, "docSnapshots", String(versionId)), { n, len: json.length, at: Date.now() });
}
async function readSnapParts(ref) {
  const base = snapBase(ref.path); if (!base) return null;
  const { db, firestore } = await getDb(); const segs = base.split("/");
  const head = await firestore.getDoc(firestore.doc(db, ...segs, "docSnapshots", String(ref.id)));
  if (!head.exists()) return null;
  const snap = await firestore.getDocs(firestore.collection(db, ...segs, "docSnapshots", String(ref.id), "parts"));
  const parts = []; snap.forEach((d) => parts.push(d.data()));
  parts.sort((a, b) => a.i - b.i);
  if (parts.length !== head.data().n) return null;
  return JSON.parse(parts.map((p) => p.d).join(""));
}
const withTimeout = (p, ms, label) => Promise.race([p, new Promise((_, rej) => setTimeout(() => { const e = new Error(label); e.code = label; rej(e); }, ms))]);
export async function loadDocVersionSnapshot(ref) {
  try { const d = await readSnapParts(ref); if (d) return d; } catch (e) { console.warn("Firestore snapshot read failed", e); }
  return await withTimeout(loadDocVersionSnapshotStorage(ref), 15000, "this copy was saved before the fix; ask the person who shared it to share it again");
}
async function loadDocVersionSnapshotStorage(ref) {
  const { app } = await getDb();
  const storageMod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js");
  if (!ref || !ref.path) throw new Error("no-path");
  const sref = storageMod.ref(storageMod.getStorage(app), ref.path);
  let firstErr = null;
  try { const b = await storageMod.getBytes(sref); return JSON.parse(new TextDecoder().decode(b)); } catch (e) { firstErr = e; console.warn("getBytes failed, trying download URL", e); }
  try { const url = await storageMod.getDownloadURL(sref); const r = await fetch(url); if (!r.ok) throw new Error("http-" + r.status); return await r.json(); }
  catch (e) { const err = new Error((firstErr && (firstErr.code || firstErr.message)) || e.code || e.message || "load-failed"); err.code = (firstErr && firstErr.code) || e.code || ""; throw err; }
}
export async function deleteDocVersion(ref) {
  if (!ref || !ref.id) return;
  const { db, firestore, app } = await getDb();
  if (ref.shared) return; // a recipient removing a shared doc only hides it locally; the owner's copy stays
  try { await firestore.deleteDoc(firestore.doc(db, "catalystos_shared_docVersions", String(ref.id))); } catch (e) {}
  await firestore.deleteDoc(firestore.doc(versionsCol(firestore, db, ref.clientId, ref.orgId), ref.id));
  if (ref.clientId && ref.orgId) { try { await firestore.deleteDoc(firestore.doc(versionsCol(firestore, db, "", ref.orgId), ref.id)); } catch (e) {} }
  if (ref.path) { try { const storageMod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js"); await storageMod.deleteObject(storageMod.ref(storageMod.getStorage(app), ref.path)); } catch (e) {} }
}

// ---- Text documents (extracted from uploads): metadata in catalystos_clients/{clientId}/textDocuments/{id};
// the .docx and the internal structured JSON live in Storage next to each other. ----
function textCol(firestore, db, clientId, orgId) {
  return clientId ? firestore.collection(db, "catalystos_clients", clientId, "textDocuments") : firestore.collection(db, "catalystos_organizations", orgId || "unassigned", "textDocuments");
}
export async function saveTextDoc({ clientId, orgId, id, meta, json, docx }) {
  const { db, firestore, app } = await getDb();
  const st = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js");
  const storage = st.getStorage(app);
  const org = await ownerOrg(firestore, db, clientId, orgId);
  const base = (clientId ? "catalystos_clients/" + clientId : "catalystos_organizations/" + (org || "unassigned")) + "/textDocuments/" + id;
  await st.uploadBytes(st.ref(storage, base + "/content.json"), new Blob([JSON.stringify(json)], { type: "application/json" }), { contentType: "application/json" });
  let docxUrl = "";
  if (docx) { const dref = st.ref(storage, base + "/document.docx"); await st.uploadBytes(dref, docx, { contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }); docxUrl = await st.getDownloadURL(dref); }
  const user = window.CatalystAuth && window.CatalystAuth.user && window.CatalystAuth.user();
  await firestore.setDoc(firestore.doc(textCol(firestore, db, clientId, org), id), {
    ...meta, ...(() => { try { const s = JSON.stringify(json); return s.length < 800000 ? { inlineJson: s } : {}; } catch (e) { return {}; } })(), jsonPath: base + "/content.json", docxPath: docx ? base + "/document.docx" : "", docxUrl,
    clientId: clientId || "", organization_id: org || "", savedBy: user ? (user.email || user.uid || "") : "", updatedAt: firestore.serverTimestamp(),
  }, { merge: true });
  return { id, clientId: clientId || "", orgId: org || "", base };
}
export async function loadTextDocs({ clientId, orgId }) {
  const { db, firestore } = await getDb();
  const org = orgId || (await myOrgId());
  const snap = await firestore.getDocs(textCol(firestore, db, clientId, org));
  const rows = []; snap.forEach((d) => { const x = d.data(); rows.push({ ...x, ref: { id: d.id, clientId: clientId || "", orgId: org || "", base: String(x.jsonPath || "").replace(/\/content\.json$/, "") } }); });
  return rows;
}
export async function loadTextDocJson(ref) {
  const { app, db, firestore } = await getDb();
  try { if (ref.id) { const d = await Promise.race([firestore.getDoc(firestore.doc(textCol(firestore, db, ref.clientId, ref.orgId), ref.id)), new Promise((_, rj) => setTimeout(() => rj(new Error('timeout')), 6000))]); const x = d.exists() ? d.data() : null; if (x && x.inlineJson) return JSON.parse(x.inlineJson); } } catch (e) {}
  const st = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js");
  const r = st.ref(st.getStorage(app), ref.base + "/content.json");
  try { const url = await Promise.race([st.getDownloadURL(r), new Promise((_, rj) => setTimeout(() => rj(new Error('timeout')), 8000))]); return (await fetch(url)).json(); }
  catch (e) { throw new Error("This file was saved to the cloud from another computer, and the cloud storage is blocking it from loading on this site (CORS). Ask the person who uploaded it to open and re-save it once, or have your admin allow this site in the storage bucket's CORS settings."); }
}
export async function deleteTextDoc(ref) {
  if (!ref || !ref.id) return;
  const { db, firestore, app } = await getDb();
  await firestore.deleteDoc(firestore.doc(textCol(firestore, db, ref.clientId, ref.orgId), ref.id));
  try { const st = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js"); const s = st.getStorage(app); await Promise.all(["/content.json", "/document.docx"].map((p) => st.deleteObject(st.ref(s, ref.base + p)).catch(() => {}))); } catch (e) {}
}

export async function saveDocVersionMeta(ref, patch) {
  if (!ref || !ref.id) return;
  const { db, firestore } = await getDb();
  await firestore.setDoc(firestore.doc(versionsCol(firestore, db, ref.clientId, ref.orgId), ref.id), patch, { merge: true });
  if (ref.clientId && ref.orgId) { try { await firestore.setDoc(firestore.doc(versionsCol(firestore, db, "", ref.orgId), ref.id), patch, { merge: true }); } catch (e) {} }
}
