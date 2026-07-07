const { contextBridge, ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { CATALOG, CATEGORIES, CHROME_UA } = require("../catalog");

function iconDataUri(file) {
  try {
    return "data:image/png;base64," + fs.readFileSync(file).toString("base64");
  } catch {
    return "";
  }
}

// Static catalog for the renderer, with real logos inlined as data URIs.
const catalog = Object.values(CATALOG).map((t) => ({
  type: t.type,
  name: t.name,
  cat: t.cat,
  color: t.color,
  abbrev: t.abbrev,
  url: t.url,
  icon: t.icon ? iconDataUri(t.icon) : "",
}));

const servicePreloadUrl = pathToFileURL(
  path.join(__dirname, "..", "service-preload.js")
).toString();

contextBridge.exposeInMainWorld("perseo", {
  catalog,
  categories: CATEGORIES,
  chromeUA: CHROME_UA,
  servicePreloadUrl,
  store: {
    load: () => ipcRenderer.invoke("store:load"),
    save: (doc) => ipcRenderer.send("store:save", doc),
  },
  win: {
    minimize: () => ipcRenderer.send("win:minimize"),
    maximize: () => ipcRenderer.send("win:maximize"),
    close: () => ipcRenderer.send("win:close"),
    onMaximized: (cb) =>
      ipcRenderer.on("win:maximized", (_e, m) => cb(m)),
  },
  openWindow: (winId, focus) => ipcRenderer.send("shell:openWindow", { winId, focus }),
  pinWorkspace: (wsId) => ipcRenderer.send("ws:pin", wsId),
  openLauncher: () => ipcRenderer.send("open:launcher"),
  onStoreChanged: (cb) => ipcRenderer.on("store:changed", cb),
  onZoomCmd: (cb) => ipcRenderer.on("zoom:cmd", (_e, dir) => cb(dir)),
});
