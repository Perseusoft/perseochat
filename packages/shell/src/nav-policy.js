const { shell } = require("electron");

// Identity providers whose popups/redirects must stay in-app so SSO can finish.
const AUTH_HOSTS = [
  "login.microsoftonline.com",
  "login.microsoft.com",
  "login.live.com",
  "login.windows.net",
  "microsoftonline.com",
  "accounts.google.com",
  "accounts.youtube.com",
  "okta.com",
  "auth0.com",
  "onelogin.com",
  "pingidentity.com",
  "duosecurity.com",
  "apple.com",
];

function registrable(host) {
  return String(host).split(".").slice(-2).join(".");
}

// Should this URL open inside the app (true) or the system browser (false)?
function hostAllowed(url, svc) {
  let host;
  let appHost;
  try {
    host = new URL(url).hostname;
    appHost = new URL(svc.url).hostname;
  } catch {
    return false;
  }
  if (registrable(host) === registrable(appHost)) return true;
  if ((svc.internalDomains || []).some((d) => host === d || host.endsWith("." + d)))
    return true;
  if (AUTH_HOSTS.some((a) => host === a || host.endsWith("." + a))) return true;
  return false;
}

// window.open()/target=_blank policy: keep same-site + SSO + about:blank popups
// (Slack huddles) in-app; send genuinely external links to the system browser.
function windowOpenPolicy({ url }, svc) {
  if (!url || url === "about:blank" || url.startsWith("about:")) {
    return { action: "allow" };
  }
  if (hostAllowed(url, svc)) return { action: "allow" };
  shell.openExternal(url);
  return { action: "deny" };
}

module.exports = { hostAllowed, windowOpenPolicy };
