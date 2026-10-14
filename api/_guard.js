// Shared gate for the paid AI endpoints (/api/claude, /api/image, /api/ai).
// 1. Only CatalystOS sites may call (a request with no Origin, e.g. from a script or curl, is refused).
// 2. A signed-in CatalystOS user's Firebase ID token (Authorization: Bearer …) is checked when sent.
//    Set REQUIRE_SIGNIN=1 in Vercel once every app sends it; until then calls from CatalystOS sites without a token still work.
// 3. A simple per-visitor speed limit stops runaway loops from running up the bill.
const APP_ORIGINS = [
  'https://catalystos-content-offer-staging.vercel.app', 'https://catalystos-campaign-graphics-staging.vercel.app', 'https://catalystos-logo-builder-staging.vercel.app',
  'https://catalystos-factsheet-builder-staging.vercel.app', 'https://catalystos-web-builder-staging.vercel.app', 'https://catalystos-story-builder-staging.vercel.app',
  'https://catalystos-profile-builder-staging.vercel.app', 'https://post-writer-blue.vercel.app', 'https://catalystos-post-builder-staging.vercel.app',
  'https://catalystos-document-builder-staging.vercel.app', 'https://linkedin-profile-writer.vercel.app', 'https://linkedin-profile-builder-three.vercel.app',
  'https://catalystos-brand-guide-staging.vercel.app', 'https://catalystos-email-builder-staging.vercel.app', 'https://catalystos-dashboard-staging.vercel.app',
];
const LIVE_RE = /^https:\/\/(content-offer-builder|document-builder|factsheet-builder|post-builder|brand-guide-builder|logo-builder|story-builder|web-builder|email-builder|event-graphics-builder|linkedin-profiles|pilot-dash)[a-z0-9-]*\.vercel\.app$/;
const API_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyA0s678NudXhvRHTNVKRje_SQwQX2_mU3E';
const seen = new Map(); // token → { uid, email, until }
const hits = new Map(); // visitor → [timestamps]

function originOk(req) {
  const origin = req.headers.origin || '', host = req.headers.host || '';
  if (!origin) return { ok: false, origin };
  const extra = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const ok = origin.replace(/^https?:\/\//, '') === host || APP_ORIGINS.includes(origin) || extra.includes(origin) || LIVE_RE.test(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) && process.env.VERCEL_ENV !== 'production';
  return { ok, origin };
}
async function userOf(token) {
  const c = seen.get(token); if (c && c.until > Date.now()) return c;
  const r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + API_KEY, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ idToken: token }) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.users || !d.users[0]) return null;
  const u = { uid: d.users[0].localId, email: String(d.users[0].email || '').toLowerCase(), until: Date.now() + 5 * 60 * 1000 };
  if (seen.size > 500) seen.clear(); seen.set(token, u); return u;
}
function tooFast(key, perMinute) {
  const now = Date.now(); const a = (hits.get(key) || []).filter((t) => now - t < 60000); a.push(now); hits.set(key, a);
  if (hits.size > 2000) hits.clear();
  return a.length > perMinute;
}

// Returns { user } when the call may go ahead; otherwise it has already answered and returns null.
async function guard(req, res, opts = {}) {
  const { ok, origin } = originOk(req);
  if (origin && ok) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(204).end(); return null; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return null; }
  if (!ok) { res.status(403).json({ error: 'Only CatalystOS sites can use this.' }); return null; }
  const auth = String(req.headers.authorization || ''); const token = /^Bearer\s+(.+)$/i.test(auth) ? auth.replace(/^Bearer\s+/i, '') : '';
  let user = null;
  if (token) { try { user = await userOf(token); } catch (e) { user = null; } }
  if (!user && process.env.REQUIRE_SIGNIN === '1') { res.status(401).json({ error: 'Please sign in to CatalystOS again.' }); return null; }
  const who = user ? 'u:' + user.uid : 'ip:' + String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  if (tooFast(who + ':' + (opts.name || ''), opts.perMinute || 60)) { res.status(429).json({ error: 'Too many requests at once. Please wait a moment and try again.' }); return null; }
  return { user };
}
module.exports = { guard, APP_ORIGINS };
