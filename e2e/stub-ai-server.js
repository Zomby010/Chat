/**
 * A stand-in for the Gemini REST API, used only by the end-to-end tests so
 * they can run without an API key. The real backend code path is exercised:
 * the backend is pointed at this server with GEMINI_BASE_URL.
 *
 * Control endpoints (test-only):
 *   POST /__mode  {"mode":"ok"|"fail"|"dosage"}
 *   GET  /__last  the last generateContent request body
 */
const http = require('http');

const PORT = Number(process.env.STUB_AI_PORT || 9911);
let mode = 'ok';
let last = null;

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

http
  .createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      if (req.method === 'GET' && req.url === '/') return send(res, 200, { ok: true });
      if (req.method === 'POST' && req.url === '/__mode') {
        mode = JSON.parse(raw || '{}').mode || 'ok';
        return send(res, 200, { mode });
      }
      if (req.method === 'GET' && req.url === '/__last') return send(res, 200, last || {});
      if (req.method === 'POST' && /:generateContent$/.test(req.url)) {
        if (!req.headers['x-goog-api-key']) return send(res, 401, { error: { message: 'missing key' } });
        last = JSON.parse(raw);
        if (mode === 'fail') return send(res, 503, { error: { message: 'stub unavailable' } });
        const userText = last.contents.at(-1).parts[0].text;
        const text =
          mode === 'dosage'
            ? 'You could take 50mg of sertraline to feel better.'
            : `That sounds like a lot to carry. You said: "${userText.slice(0, 80)}". Would a slow breath help right now?\n- Try breathing in for 4\n- And out for 6`;
        return send(res, 200, { candidates: [{ content: { role: 'model', parts: [{ text }] }, finishReason: 'STOP' }] });
      }
      send(res, 404, { error: { message: 'not found' } });
    });
  })
  .listen(PORT, '127.0.0.1', () => console.log(`stub AI listening on ${PORT}`));
