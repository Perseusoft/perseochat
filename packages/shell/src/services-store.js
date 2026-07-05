const { app } = require("electron");
const fs = require("fs");
const path = require("path");

// Persisted document: the user's service instances (tiles, each with its own
// `persist:svc-<id>` session) plus UI settings (theme, sidebar expanded state).
function storePath() {
  // Fixed shared location so every workspace process reads the same store,
  // even when each workspace runs with its own userData dir.
  return path.join(app.getPath("appData"), app.getName(), "services.json");
}

const DEFAULT_SETTINGS = { theme: "dark", expanded: false };

const DEFAULT_WORKSPACES = [{ id: "main", name: "Principal" }];

function loadDoc() {
  let doc = {};
  try { doc = JSON.parse(fs.readFileSync(storePath(), "utf8")); } catch { /* fresh */ }
  const services = Array.isArray(doc.services) ? doc.services : [];
  let workspaces = Array.isArray(doc.workspaces) && doc.workspaces.length
    ? doc.workspaces : DEFAULT_WORKSPACES.map((w) => ({ ...w }));
  const ids = new Set(workspaces.map((w) => w.id));
  // Every service belongs to a workspace (`win` = workspace id); default to main,
  // and any dangling workspace id falls back to main so nothing gets orphaned.
  for (const s of services) {
    if (!s.win || !ids.has(s.win)) s.win = "main";
  }
  if (!ids.has("main")) workspaces.unshift({ id: "main", name: "Principal" });
  return { services, workspaces, settings: { ...DEFAULT_SETTINGS, ...(doc.settings || {}) } };
}

function saveDoc(doc) {
  try {
    fs.mkdirSync(path.dirname(storePath()), { recursive: true });
    fs.writeFileSync(storePath(), JSON.stringify(doc, null, 2));
  } catch {
    /* best-effort */
  }
}

let counter = 0;
function newId() {
  return "s" + Date.now().toString(36) + (counter++).toString(36);
}

module.exports = { loadDoc, saveDoc, newId, DEFAULT_SETTINGS };
