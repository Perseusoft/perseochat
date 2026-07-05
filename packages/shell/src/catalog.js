const path = require("path");

// Chrome UA: Electron 33 is Chromium 130 which Slack rejects and Teams hates;
// advertise a current Chrome for every service (harmless for the rest).
const CHROME_UA =
  "Mozilla/5.0 (X11; Linux aarch64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36";

const ICONS = path.join(__dirname, "hub-ui", "icons");

// type -> template. `icon` = real logo PNG (Slack/Teams); otherwise the UI draws
// a lettermark tile from {color, abbrev}. `internal` = extra in-app domains.
const CATALOG = {
  // --- AI chats ---
  claude:     { type: "claude",     name: "Claude",     cat: "ai", url: "https://claude.ai",                 color: "#D97757", abbrev: "Cl" },
  chatgpt:    { type: "chatgpt",    name: "ChatGPT",    cat: "ai", url: "https://chatgpt.com",               color: "#1A7F64", abbrev: "GP" },
  gemini:     { type: "gemini",     name: "Gemini",     cat: "ai", url: "https://gemini.google.com/app",     color: "#4285F4", abbrev: "Gm" },
  grok:       { type: "grok",       name: "Grok",       cat: "ai", url: "https://grok.com",                  color: "#1F1F1F", abbrev: "Gk" },
  perplexity: { type: "perplexity", name: "Perplexity", cat: "ai", url: "https://www.perplexity.ai",         color: "#20808D", abbrev: "Px" },
  copilot:    { type: "copilot",    name: "Copilot",    cat: "ai", url: "https://copilot.microsoft.com",     color: "#6B4FBB", abbrev: "Co" },

  // --- Messaging & work ---
  slack:      { type: "slack",  name: "Slack",  cat: "work", url: "https://app.slack.com/client",   color: "#4A154B", abbrev: "Sl", icon: path.join(ICONS, "slack.png"), internal: ["slack.com"] },
  teams:      { type: "teams",  name: "Teams",  cat: "work", url: "https://teams.microsoft.com/v2/", color: "#5059C9", abbrev: "Te", icon: path.join(ICONS, "teams.png"),
                internal: ["microsoft.com","microsoftonline.com","office.com","office365.com","live.com","sharepoint.com","cloud.microsoft","skype.com"] },
  discord:    { type: "discord",  name: "Discord",  cat: "work", url: "https://discord.com/app",          color: "#5865F2", abbrev: "Dc" },
  whatsapp:   { type: "whatsapp", name: "WhatsApp", cat: "work", url: "https://web.whatsapp.com",          color: "#25D366", abbrev: "Wa" },
  telegram:   { type: "telegram", name: "Telegram", cat: "work", url: "https://web.telegram.org/a/",       color: "#2AABEE", abbrev: "Tg" },
};

// Every service has a real logo tile at icons/<type>.png (missing -> UI falls
// back to a colored lettermark).
for (const t of Object.values(CATALOG)) {
  if (!t.icon) t.icon = path.join(ICONS, `${t.type}.png`);
}

const CATEGORIES = [
  { key: "ai", label: "Chats de IA" },
  { key: "work", label: "Mensajería y trabajo" },
];

module.exports = { CATALOG, CATEGORIES, CHROME_UA };
