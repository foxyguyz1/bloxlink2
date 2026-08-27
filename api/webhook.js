/**
 * Vercel Serverless Function: Webhook Relay (100% Seguro)
 * A URL do Webhook NÃO existe no código nem no GitHub.
 * Ela é lida estritamente da Variável de Ambiente configurada no painel da Vercel (DISCORD_WEBHOOK_URL).
 */
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Obtém a URL estritamente da Variável de Ambiente da Vercel
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    console.error('❌ Erro: DISCORD_WEBHOOK_URL não configurada no painel da Vercel (Settings -> Environment Variables).');
    return res.status(500).json({ error: 'DISCORD_WEBHOOK_URL environment variable is not configured in Vercel' });
  }

  try {
    const payload = req.body;
    const bodyStr = typeof payload === 'string' ? payload : JSON.stringify(payload);

    const discordRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: bodyStr
    });

    if (discordRes.ok) {
      return res.status(200).json({ success: true });
    } else {
      const errText = await discordRes.text();
      return res.status(discordRes.status).json({ error: 'Discord Webhook Error', details: errText });
    }
  } catch (err) {
    console.error('Webhook Relay Serverless Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
