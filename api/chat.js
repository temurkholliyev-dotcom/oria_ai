const systemPrompt = 'Siz Nia nomli muloyim, bilimdon va aniq AI yordamchisiz. Foydalanuvchiga o‘zbek tilida javob bering, agar u boshqa tilni so‘ramasa. Javoblarni tushunarli, foydali va samimiy saqlang.';

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }
  if (request.method !== 'POST') {
    response.status(405).json({ error: { message: 'Faqat POST so‘rovi qabul qilinadi.' } });
    return;
  }
  if (!process.env.GEMINI_API_KEY) {
    response.status(503).json({ error: { message: 'GEMINI_API_KEY Vercel Environment Variables’da sozlanmagan.' } });
    return;
  }

  const conversation = request.body?.conversation;
  if (!Array.isArray(conversation) || conversation.length === 0) {
    response.status(400).json({ error: { message: 'Suhbat mazmuni yuborilmadi.' } });
    return;
  }

  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  try {
    const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: conversation,
        generationConfig: { temperature: 0.75, maxOutputTokens: 1536 }
      })
    });
    const result = await upstream.json().catch(() => ({}));
    response.status(upstream.status).json(result);
  } catch {
    response.status(502).json({ error: { message: 'Gemini serveriga ulanib bo‘lmadi. Keyinroq urinib ko‘ring.' } });
  }
}
