// Vercel serverless function: POST /api/ai  { prompt } -> { text }
// Keeps the Anthropic API key on the server. Set ANTHROPIC_API_KEY in Vercel → Project → Settings → Environment Variables.
export default async function handler(req, res) {
  const G = await import('./_guard.js'); const ok = await (G.guard || G.default.guard)(req, res, { name: 'ai', perMinute: 40 });
  if (!ok) return;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) { res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set on the server.' }); return; }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const prompt = String(body.prompt || '').slice(0, 120000);
    if (!prompt) { res.status(400).json({ error: 'Missing prompt' }); return; }
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5', max_tokens: 8000, messages: [{ role: 'user', content: prompt }] })
    });
    const j = await r.json();
    if (!r.ok) { res.status(r.status).json({ error: (j && j.error && j.error.message) || 'AI request failed' }); return; }
    const text = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
    res.status(200).json({ text });
  } catch (e) { res.status(500).json({ error: String(e && e.message || e) }); }
}
