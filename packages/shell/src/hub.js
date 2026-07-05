const { app, BrowserWindow, ipcMain, session } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const store = require("./services-store");
const { setupPermissions } = require("./permissions");
const { wireScreenShareSession } = require("./screen-share");
const { windowOpenPolicy } = require("./nav-policy");

const SHELL = path.join(__dirname, "hub-ui", "shell.html");
const LAUNCHER = path.join(__dirname, "hub-ui", "launcher.html");
const HUB_PRELOAD = path.join(__dirname, "hub-ui", "hub-preload.js");
const GPU_FLAGS = ["--ozone-platform-hint=auto", "--enable-features=WebRTCPipeWireCapturer", "--disable-gpu"];
const wsClass = (wsId) => "arm-perseochat-" + wsId;
const wsArg = () => {
  const a = process.argv.find((x) => x.startsWith("--perseo-ws="));
  return a ? a.split("=")[1] : null;
};

const LANG_ACCEPT = { en: "en-US,en", es: "es-ES,es", pt: "pt-BR,pt", fr: "fr-FR,fr", de: "de-DE,de" };
function currentLang() {
  try {
    const l = (store.loadDoc().settings || {}).lang;
    if (l && LANG_ACCEPT[l]) return l;
  } catch { /* fall through */ }
  const sys = (app.getLocale() || "en").slice(0, 2).toLowerCase();
  return LANG_ACCEPT[sys] ? sys : "en";
}

const sessionsReady = new WeakSet();
function prepareSession(ses) {
  if (sessionsReady.has(ses)) return;
  sessionsReady.add(ses);
  setupPermissions(ses);
  wireScreenShareSession(ses);
  // Make the web apps render in the app's language via Accept-Language.
  try { ses.setUserAgent(ses.getUserAgent(), LANG_ACCEPT[currentLang()] + ",en"); } catch { /* best-effort */ }
}

// Apply the in-app/external window-open policy to any service webContents,
// deciding by the opener's current URL (no per-service config needed).
function applyServiceNav(contents) {
  contents.setWindowOpenHandler((details) =>
    windowOpenPolicy(details, { url: contents.getURL() })
  );
  contents.on("did-create-window", (child) => {
    child.webContents.setWindowOpenHandler((d) =>
      windowOpenPolicy(d, { url: child.webContents.getURL() })
    );
  });
}

function startHub({ productName, icon }) {
  app.setName(productName || "PerseoChat");
  const bootWs = wsArg(); // set when this process was launched as one workspace

  // Each workspace runs as its own process/app with an isolated userData dir,
  // while all processes share the store file on disk.
  if (bootWs) {
    app.setPath("userData", path.join(app.getPath("appData"), app.getName(), "spaces", bootWs));
  }

  // Single-instance PER userData → one launcher, and one window per workspace;
  // a second launch of the same one just focuses the existing window.
  if (!app.requestSingleInstanceLock()) {
    app.quit();
    return;
  }
  app.on("second-instance", () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w) { if (w.isMinimized()) w.restore(); w.focus(); }
  });

  // Service <webview>s (in any shell window): media/screen-share permissions +
  // the shared window-open policy.
  app.on("web-contents-created", (_e, contents) => {
    if (contents.getType() !== "webview") return;
    prepareSession(contents.session);
    applyServiceNav(contents);
  });

  const windowIds = new Map(); // BrowserWindow -> workspace id

  // Tell every other window the shared store changed so it re-renders.
  function broadcast(exceptWc) {
    for (const w of BrowserWindow.getAllWindows())
      if (!w.isDestroyed() && w.webContents !== exceptWc)
        w.webContents.send("store:changed");
  }

  // A full PerseoChat window bound to workspace `wsId`; `focus` = initial service.
  function createShellWindow(wsId, focus) {
    wsId = wsId || "main";
    const win = new BrowserWindow({
      width: 1320, height: 880, minWidth: 820, minHeight: 560,
      title: productName, icon, frame: false, backgroundColor: "#0B0F19",
      webPreferences: {
        preload: HUB_PRELOAD, contextIsolation: true, nodeIntegration: false,
        sandbox: false, webviewTag: true, spellcheck: true,
      },
    });
    windowIds.set(win, wsId);
    win.webContents.on("will-attach-webview", (_e, wp) => {
      wp.nodeIntegration = false;
      wp.contextIsolation = false;
      wp.sandbox = false;
    });
    const sendMax = () => win.webContents.send("win:maximized", win.isMaximized());
    win.on("maximize", sendMax);
    win.on("unmaximize", sendMax);
    win.on("closed", () => windowIds.delete(win)); // workspaces persist; nothing to return
    const q = { win: wsId };
    if (focus) q.focus = focus;
    win.loadFile(SHELL, { query: q });
    return win;
  }

  // One window per workspace: focus if already open, else create.
  function createLauncherWindow() {
    const win = new BrowserWindow({
      width: 820, height: 680, resizable: true, frame: false,
      title: productName, icon, backgroundColor: "#0B0F19",
      webPreferences: { preload: HUB_PRELOAD, contextIsolation: true, nodeIntegration: false, sandbox: false },
    });
    win.loadFile(LAUNCHER);
    return win;
  }

  // Launch a workspace as its OWN process → distinct app id (pinnable), isolated.
  function spawnWorkspace(wsId) {
    const args = app.isPackaged ? [] : [app.getAppPath()];
    args.push("--perseo-ws=" + wsId, "--class=" + wsClass(wsId), ...GPU_FLAGS);
    spawn(process.execPath, args, { detached: true, stdio: "ignore" }).unref();
  }
  // Open the workspaces launcher (its own process; single-instance focuses it).
  function spawnLauncher() {
    const args = app.isPackaged ? [] : [app.getAppPath()];
    args.push("--class=arm-perseochat", ...GPU_FLAGS);
    spawn(process.execPath, args, { detached: true, stdio: "ignore" }).unref();
  }

  // Write a pinnable .desktop for a workspace: its own name, logo and app id.
  function pinWorkspace(wsId) {
    const doc = store.loadDoc();
    const ws = (doc.workspaces || []).find((w) => w.id === wsId);
    if (!ws) return;
    const home = app.getPath("home");
    const appsDir = path.join(home, ".local/share/applications");
    const iconsDir = path.join(home, ".local/share/icons");
    let iconPath = icon;
    try {
      if (ws.icon && ws.icon.startsWith("data:image")) {
        fs.mkdirSync(iconsDir, { recursive: true });
        iconPath = path.join(iconsDir, "perseochat-" + wsId + ".png");
        fs.writeFileSync(iconPath, Buffer.from(ws.icon.split(",")[1], "base64"));
      }
    } catch { /* fall back to default icon */ }
    const appArg = app.isPackaged ? "" : ` ${app.getAppPath()}`;
    const exec = `${process.execPath}${appArg} --perseo-ws=${wsId} --class=${wsClass(wsId)} ${GPU_FLAGS.join(" ")}`;
    const content = `[Desktop Entry]
Type=Application
Name=${ws.name} — ${productName}
Comment=${productName} · ${ws.name}
Exec=${exec}
Icon=${iconPath}
Terminal=false
Categories=Network;InstantMessaging;Chat;
StartupNotify=true
StartupWMClass=${wsClass(wsId)}
`;
    try {
      fs.mkdirSync(appsDir, { recursive: true });
      fs.writeFileSync(path.join(appsDir, "perseochat-" + wsId + ".desktop"), content);
    } catch { /* best-effort */ }
  }

  const senderWin = (e) => BrowserWindow.fromWebContents(e.sender);

  ipcMain.handle("store:load", () => store.loadDoc());
  ipcMain.on("store:save", (e, doc) => { store.saveDoc(doc); broadcast(e.sender); });
  ipcMain.on("win:minimize", (e) => senderWin(e)?.minimize());
  ipcMain.on("win:maximize", (e) => {
    const w = senderWin(e);
    if (w) (w.isMaximized() ? w.unmaximize() : w.maximize());
  });
  ipcMain.on("win:close", (e) => senderWin(e)?.close());
  ipcMain.on("shell:openWindow", (_e, { winId }) => {
    if (winId === bootWs) { const w = BrowserWindow.getAllWindows()[0]; if (w) w.focus(); }
    else spawnWorkspace(winId);
  });
  ipcMain.on("ws:pin", (_e, wsId) => pinWorkspace(wsId));
  ipcMain.on("open:launcher", () => spawnLauncher());

  app.whenReady().then(() => {
    if (bootWs) createShellWindow(bootWs);
    else createLauncherWindow();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}

module.exports = { startHub };
