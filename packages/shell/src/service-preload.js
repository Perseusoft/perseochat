// Injected into every service <webview>. Bridges the web app's notifications to
// PerseoChat's notification center and enforces mute / Do-Not-Disturb.
const { ipcRenderer } = require("electron");
const toHost = ipcRenderer.sendToHost ? ipcRenderer.sendToHost.bind(ipcRenderer) : null;

let muted = false;
let dnd = false;
ipcRenderer.on("perseo:mute", (_e, m) => (muted = !!m));
ipcRenderer.on("perseo:dnd", (_e, d) => (dnd = !!d));

const Native = window.Notification;
if (Native) {
  const Wrapped = function (title, opts) {
    const t = String(title || "");
    const body = (opts && opts.body) || "";
    if (toHost) toHost("perseo:notification", { title: t, body });
    if (muted || dnd) {
      return { close() {}, onclick: null, addEventListener() {}, removeEventListener() {} };
    }
    return new Native(t, opts);
  };
  Object.defineProperty(Wrapped, "permission", {
    get() {
      return Native.permission;
    },
  });
  Wrapped.requestPermission = (cb) => {
    if (cb) cb("granted");
    return Promise.resolve("granted");
  };
  try {
    Object.defineProperty(window, "Notification", { configurable: true, value: Wrapped });
  } catch {
    window.Notification = Wrapped;
  }
}

// App badge (Slack/WhatsApp) -> host, for tile unread counts.
if (toHost && navigator.setAppBadge) {
  const set = navigator.setAppBadge.bind(navigator);
  navigator.setAppBadge = (n) => {
    toHost("perseo:badge", typeof n === "number" ? n : 0);
    return set(n);
  };
  if (navigator.clearAppBadge) {
    const clr = navigator.clearAppBadge.bind(navigator);
    navigator.clearAppBadge = () => {
      toHost("perseo:badge", 0);
      return clr();
    };
  }
}
