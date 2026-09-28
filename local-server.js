import 'dotenv/config';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const systemPrompt = 'Siz Oria nomli muloyim, bilimdon va aniq AI yordamchisiz. Foydalanuvchiga o‘zbek tilida javob bering, agar u boshqa tilni so‘ramasa. Javoblarni tushunarli, foydali va samimiy saqlang.';
const contentTypes = { '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };

function send(response, status, body, contentType = 'application/json; charset=utf-8') {
  response.writeHead(status, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  });
  if (typeof body === 'string' || Buffer.isBuffer(body) || body instanceof Uint8Array) {
    response.end(body);
    return;
  }
  response.end(JSON.stringify(body));
}

async function handleChat(request, response) {
  if (!process.env.GEMINI_API_KEY) {
    send(response, 503, { error: { message: 'GEMINI_API_KEY serverda sozlanmagan.' } });
    return;
  }

  let raw = '';
  for await (const chunk of request) raw += chunk;
  let body;
  try { body = JSON.parse(raw); } catch { send(response, 400, { error: { message: 'Noto‘g‘ri JSON so‘rov.' } }); return; }
  if (!Array.isArray(body.conversation) || body.conversation.length === 0) {
    send(response, 400, { error: { message: 'Suhbat mazmuni yuborilmadi.' } });
    return;
  }

  const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: systemPrompt }] }, contents: body.conversation, generationConfig: { temperature: 0.75, maxOutputTokens: 1536 } })
  });
  const result = await upstream.json().catch(() => ({}));
  send(response, upstream.status, result);
}

async function handleRequest(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';
  if (pathname === '/api/health') { send(response, 200, { ok: true, backend: 'oria' }); return; }
  if (pathname === '/api/chat' && request.method === 'OPTIONS') { send(response, 204, ''); return; }
  if (pathname === '/api/chat' && request.method === 'POST') {
    try { await handleChat(request, response); } catch { send(response, 502, { error: { message: 'AI serveriga ulanishda xatolik.' } }); }
    return;
  }
  if (request.method !== 'GET') { send(response, 405, { error: { message: 'Method qo‘llab-quvvatlanmaydi.' } }); return; }

  const requested = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.resolve(root, `.${requested}`);
  if (!filePath.startsWith(root)) { send(response, 403, 'Forbidden', 'text/plain; charset=utf-8'); return; }
  try {
    const file = await readFile(filePath);
    send(response, 200, file, contentTypes[path.extname(filePath)] || 'application/octet-stream');
  } catch { send(response, 404, 'Not found', 'text/plain; charset=utf-8'); }
}

http.createServer(handleRequest).listen(port, () => console.log(`Oria backend http://localhost:${port}`));