"use strict";
const P = window.perseo;
const CAT = new Map(P.catalog.map((c) => [c.type, c]));
const $ = (id) => document.getElementById(id);
const app = $("app");

let doc = { services: [], settings: {} };
const DEF = { theme: "dark", expanded: false, dnd: false, layout: "single", collapsed: {} };
let activeId = null;
let openOrder = []; // MRU of selected ids (drives layouts)
const wvs = new Map();
const unreadTitle = new Map();
const unreadBadge = new Map();
let notifs = [];
let dragId = null;
const MYWIN = new URLSearchParams(location.search).get("win") || "main";
const sel = new Set(); // multi-selected service ids

// ---------- icons ----------
function ico(name, size = 18) {
  const p = (window.ICONS && window.ICONS[name]) || "";
  return `<svg class="ico" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
}

// ---------- helpers ----------
function el(tag, props = {}, kids = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") n.className = v;
    else if (k === "html") n.innerHTML = v;
    else if (k === "text") n.textContent = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined && v !== false) n.setAttribute(k, v);
  }
  for (const c of [].concat(kids)) if (c) n.appendChild(c);
  return n;
}
function tmplOf(s) { return CAT.get(s.type) || { name: s.type, color: "#555", abbrev: "?" }; }
function displayName(s) { return s.name || tmplOf(s).name; }
function serviceUrl(s) { return s.url || tmplOf(s).url; }
function iconEl(s, cls = "ic") {
  const t = tmplOf(s);
  const box = el("span", { class: cls });
  if (t.icon) box.appendChild(el("img", { src: t.icon, alt: t.name }));
  else { box.style.background = t.color; box.appendChild(el("span", { class: "letter", text: t.abbrev || (displayName(s)[0] || "?") })); }
  return box;
}
function unreadOf(id) { return Math.max(unreadTitle.get(id) || 0, unreadBadge.get(id) || 0); }
function svc(id) { return doc.services.find((x) => x.id === id); }
function inMyWin(s) { return (s.win || "main") === MYWIN; }
function myServices() { return doc.services.filter(inMyWin); }
function newWinId() { return "w" + Date.now().toString(36) + Math.floor(Math.random() * 1e3).toString(36); }
function isMuted(id) { const s = svc(id); return !!(s && s.muted); }
function persist() { P.store.save(doc); }

// ---------- rail ----------
// Rail = ordered blocks in REAL array order: each named group is one contiguous
// block, each ungrouped service is its own block. Lets groups sit anywhere.
function blocks() {
  const res = [];
  for (const s of doc.services) {
    if (!inMyWin(s)) continue; // this window only shows its own space
    const g = s.group || "";
    const last = res[res.length - 1];
    if (g && last && last.group === g) last.items.push(s);
    else res.push({ group: g, items: [s] });
  }
  return res;
}
function groupHeaderEl(g, collapsed) {
  return el("div", {
    class: "group" + (collapsed ? " collapsed" : ""), title: g,
    onmousedown: (e) => startGroupDrag(e, g),
    onclick: () => { if (justDragged) return; toggleGroup(g); },
    oncontextmenu: (e) => { e.preventDefault(); groupMenu(e, g); },
  }, [el("span", { class: "chev", html: ico("chevron-down", 14) }), el("span", { class: "gname", text: g })]);
}
function renderRail() {
  const tiles = $("tiles");
  tiles.innerHTML = "";
  const collapsedMap = doc.settings.collapsed || {};
  for (const b of blocks()) {
    if (b.group) {
      const collapsed = !!collapsedMap[b.group];
      tiles.appendChild(groupHeaderEl(b.group, collapsed));
      if (collapsed && doc.settings.expanded) continue;
    }
    for (const s of b.items) tiles.appendChild(tileEl(s));
  }
}
function tileEl(s) {
  const t = el("button", {
    class: "tile" + (s.id === activeId ? " active" : "") + (sel.has(s.id) ? " selected" : ""),
    title: displayName(s), "data-id": s.id,
    onclick: (e) => {
      if (justDragged) return;
      // In selection mode (something already selected) or with Ctrl/Cmd, a click
      // toggles selection instead of navigating. "Cancelar" exits the mode.
      if (sel.size || e.ctrlKey || e.metaKey) { toggleSel(s.id); return; }
      selectService(s.id);
    },
    oncontextmenu: (e) => { e.preventDefault(); tileMenu(e, s.id); },
    onmousedown: (e) => startTileDrag(e, s.id),
  }, [iconEl(s)]);
  t.appendChild(el("span", { class: "name", text: displayName(s) }));
  const n = unreadOf(s.id);
  if (n > 0 && !s.muted) t.appendChild(el("span", { class: "count", text: n > 99 ? "99+" : String(n) }));
  if (s.muted) t.appendChild(el("span", { class: "muteflag", html: ico("bell-off", 10) }));
  return t;
}
function toggleGroup(g) {
  if (!doc.settings.collapsed) doc.settings.collapsed = {};
  doc.settings.collapsed[g] = !doc.settings.collapsed[g];
  persist(); renderRail();
}

// ---------- drag reorder / regroup ----------
function moveBefore(dragId, targetId) {
  const arr = doc.services, it = svc(dragId), tgt = svc(targetId);
  if (!it || !tgt || dragId === targetId) return;
  it.group = tgt.group || "";
  arr.splice(arr.indexOf(it), 1);
  arr.splice(arr.indexOf(tgt), 0, it);
  persist(); renderRail();
}
function dropToGroup(dragId, g) {
  const arr = doc.services, it = svc(dragId);
  if (!it) return;
  it.group = g;
  arr.splice(arr.indexOf(it), 1);
  const first = arr.findIndex((x) => x.group === g);
  if (first >= 0) arr.splice(first, 0, it); else arr.push(it);
  persist(); renderRail();
}
// Move a whole group block to any position (before/after the target item's block).
function moveGroupTo(dg, hover) {
  const bs = blocks();
  const from = bs.findIndex((b) => b.group === dg);
  if (from < 0) return;
  let to = hover.targetKind === "header"
    ? bs.findIndex((b) => b.group === hover.ref)
    : bs.findIndex((b) => b.items.some((s) => s.id === hover.ref));
  if (to < 0) return;
  if (hover.after) to += 1;
  const [moved] = bs.splice(from, 1);
  if (from < to) to -= 1;
  to = Math.max(0, Math.min(to, bs.length));
  bs.splice(to, 0, moved);
  doc.services = bs.flatMap((b) => b.items);
  persist(); renderRail();
}

// ---------- webviews & layout ----------
function ensureWebview(id) {
  if (wvs.has(id)) return wvs.get(id);
  const s = svc(id);
  const wv = el("webview", { partition: `persist:svc-${id}`, src: serviceUrl(s), useragent: P.chromeUA, preload: P.servicePreloadUrl, allowpopups: "" });
  wv.addEventListener("page-title-updated", (e) => {
    const m = String(e.title || "").match(/\((\d+)\+?\)/);
    unreadTitle.set(id, m ? parseInt(m[1], 10) : (/[*•]/.test(e.title || "") ? 1 : 0));
    renderRail();
  });
  wv.addEventListener("ipc-message", (e) => {
    if (e.channel === "perseo:notification") addNotif(id, e.args[0] || {});
    else if (e.channel === "perseo:badge") { unreadBadge.set(id, e.args[0] || 0); renderRail(); }
  });
  wv.addEventListener("dom-ready", () => { try { wv.send("perseo:mute", isMuted(id)); wv.send("perseo:dnd", doc.settings.dnd); } catch {} if (id === activeId) updateHeader(); });
  wv.addEventListener("did-navigate", () => id === activeId && updateHeader());
  wv.addEventListener("did-navigate-in-page", () => id === activeId && updateHeader());
  $("views").appendChild(wv);
  wvs.set(id, wv);
  return wv;
}
function activeWv() { return activeId ? wvs.get(activeId) : null; }
function capacity() { return 1; }
function visibleIds() {
  const ids = openOrder.filter((id) => { const s = svc(id); return s && inMyWin(s); });
  for (const s of myServices()) if (!ids.includes(s.id)) ids.push(s.id); // fill to capacity
  return ids.slice(0, capacity());
}
function applyLayout() {
  const vids = visibleIds();
  vids.forEach(ensureWebview);
  $("views").className = "";
  for (const [id, wv] of wvs) wv.classList.toggle("show", vids.includes(id));
  $("svcHeader").classList.toggle("hidden", !activeId);
  $("empty").style.display = myServices().length ? "none" : "flex";
}
function selectService(id) {
  if (!svc(id)) return;
  activeId = id;
  ensureWebview(id);
  openOrder = [id, ...openOrder.filter((x) => x !== id)];
  applyLayout(); updateHeader(); renderRail();
}
function cycleLayout() {
  const order = ["single", "split", "grid"];
  doc.settings.layout = order[(order.indexOf(doc.settings.layout || "single") + 1) % 3];
  persist(); applyLayout();
}
function updateHeader() {
  const s = svc(activeId); if (!s) return;
  const wv = activeWv();
  $("shIcon").replaceWith(Object.assign(iconEl(s), { id: "shIcon" }));
  $("shName").textContent = displayName(s);
  let host = ""; try { host = new URL((wv && wv.getURL && wv.getURL()) || serviceUrl(s)).host; } catch {}
  $("shUrl").textContent = host;
  const mute = $("shMute");
  mute.classList.toggle("on", !!s.muted);
  mute.innerHTML = ico(s.muted ? "bell-off" : "bell");
}

// ---------- CRUD ----------
function newId() { return "s" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36); }
function addService(type, name, url) {
  const t = CAT.get(type);
  const s = { id: newId(), type, name: name || (t ? t.name : "Servicio"), group: "", win: MYWIN };
  if (url) s.url = url;
  doc.services.push(s); persist(); renderRail(); selectService(s.id);
}
function removeService(id) {
  const wv = wvs.get(id); if (wv) { wv.remove(); wvs.delete(id); }
  doc.services = doc.services.filter((x) => x.id !== id);
  openOrder = openOrder.filter((x) => x !== id);
  notifs = notifs.filter((n) => n.svcId !== id);
  persist();
  if (activeId === id) { activeId = openOrder[0] || null; }
  if (!doc.services.length) { $("svcHeader").classList.add("hidden"); $("empty").style.display = "flex"; }
  else if (!activeId) selectService(doc.services[0].id);
  applyLayout(); renderRail(); renderNotif();
}
function renameService(id, name) { const s = svc(id); if (s && name) { s.name = name; persist(); renderRail(); if (id === activeId) updateHeader(); } }
function setGroup(id, g) { const s = svc(id); if (s) { s.group = g || ""; persist(); renderRail(); } }
function toggleMute(id) {
  const s = svc(id); if (!s) return;
  s.muted = !s.muted; persist();
  const wv = wvs.get(id); if (wv) { try { wv.send("perseo:mute", s.muted); wv.setAudioMuted(s.muted); } catch {} }
  renderRail(); if (id === activeId) updateHeader();
}
function dropLocal(id) {
  const wv = wvs.get(id); if (wv) { wv.remove(); wvs.delete(id); }
  openOrder = openOrder.filter((x) => x !== id);
  if (activeId === id) activeId = null;
}
// Re-render this window after its service set changed.
function refresh() {
  applyTheme();
  const mine = myServices();
  if (!mine.length) {
    activeId = null; renderRail(); renderNotif(); renderSelBar();
    $("svcHeader").classList.add("hidden"); $("empty").style.display = "flex"; return;
  }
  if (!activeId || !mine.some((s) => s.id === activeId)) activeId = mine[0].id;
  selectService(activeId); renderNotif(); renderSelBar();
}
// Move chats to an existing workspace (opens/focuses its window).
function moveToWorkspace(ids, wsId) {
  ids = ids.filter((id) => svc(id));
  if (!ids.length || !wsId || wsId === MYWIN) return;
  for (const id of ids) { svc(id).win = wsId; dropLocal(id); sel.delete(id); }
  persist();
  P.openWindow(wsId, ids[0]);
  refresh();
}
// Create a new workspace and move the chats into it.
function newWorkspaceFor(ids, name) {
  doc.workspaces = doc.workspaces || [];
  const wsId = newWinId();
  doc.workspaces.push({ id: wsId, name: name || "Espacio " + doc.workspaces.length });
  moveToWorkspace(ids, wsId);
}
// Menu to pick an existing workspace or create a new one.
function chooseWorkspace(x, y, ids) {
  const items = doc.workspaces
    .filter((w) => w.id !== MYWIN)
    .map((w) => ({ label: t("moveToLabel", w.name), click: () => moveToWorkspace(ids, w.id) }));
  if (items.length) items.push({ div: 1 });
  items.push({ label: t("newWs"), click: async () => { const n = await askText(t("newWsTitle"), t("wsNamePh")); if (n) newWorkspaceFor(ids, n); } });
  showCtx(x, y, items);
}
function popout(id) { newWorkspaceFor([id]); }
function toggleSel(id) { sel.has(id) ? sel.delete(id) : sel.add(id); renderRail(); renderSelBar(); }
function deleteSelected() {
  for (const id of sel) { const wv = wvs.get(id); if (wv) { wv.remove(); wvs.delete(id); } }
  doc.services = doc.services.filter((s) => !sel.has(s.id));
  openOrder = openOrder.filter((id) => !sel.has(id));
  notifs = notifs.filter((n) => !sel.has(n.svcId));
  if (sel.has(activeId)) activeId = null;
  sel.clear();
  persist(); refresh();
}
function renderSelBar() {
  const bar = $("selbar");
  if (!sel.size) { bar.hidden = true; bar.innerHTML = ""; return; }
  bar.hidden = false; bar.innerHTML = "";
  bar.appendChild(el("span", { class: "selcount", text: t("selected", sel.size) }));
  bar.appendChild(el("button", { class: "btn sm", text: t("moveToSpace"), onclick: (e) => chooseWorkspace(e.clientX, e.clientY, [...sel]) }));
  bar.appendChild(el("button", { class: "ghost sm", text: t("del"), onclick: deleteSelected }));
  bar.appendChild(el("button", { class: "ghost sm", text: t("cancel"), onclick: () => { sel.clear(); renderRail(); renderSelBar(); } }));
}
async function reloadFromStore() {
  const fresh = await P.store.load();
  doc.services = fresh.services || [];
  doc.workspaces = fresh.workspaces || [{ id: "main", name: "Principal" }];
  doc.settings = Object.assign({}, DEF, fresh.settings || {});
  if (!doc.settings.collapsed) doc.settings.collapsed = {};
  const mineIds = new Set(myServices().map((s) => s.id));
  for (const [id, wv] of wvs) if (!mineIds.has(id)) { wv.remove(); wvs.delete(id); }
  openOrder = openOrder.filter((id) => mineIds.has(id));
  for (const id of [...sel]) if (!mineIds.has(id)) sel.delete(id);
  refresh();
}

// ---------- notifications ----------
function addNotif(svcId, { title, body }) {
  notifs.unshift({ svcId, title: title || displayName(svc(svcId) || {}), body: body || "", ts: Date.now(), read: false });
  if (notifs.length > 200) notifs.pop();
  renderNotif();
}
function relTime(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 45) return "ahora"; if (s < 3600) return Math.floor(s / 60) + " min";
  if (s < 86400) return Math.floor(s / 3600) + " h"; return Math.floor(s / 86400) + " d";
}
function renderNotif() {
  const unread = notifs.filter((n) => !n.read).length;
  $("npCount").textContent = unread;
  $("bellDot").hidden = unread === 0;
  $("npDnd").hidden = !doc.settings.dnd;
  const list = $("npList"); list.innerHTML = "";
  if (!notifs.length) { list.appendChild(el("div", { class: "np-empty", text: t("noNotif") })); return; }
  list.appendChild(el("div", { class: "np-section", text: t("recent") }));
  for (const n of notifs.slice(0, 60)) {
    const s = svc(n.svcId) || { type: "?" };
    const item = el("div", { class: "np-item", onclick: () => { n.read = true; selectService(n.svcId); renderNotif(); } }, [
      iconEl(s),
      el("div", { class: "body" }, [
        el("div", { class: "top" }, [el("div", { class: "who", text: n.title }), el("div", { class: "time", text: relTime(n.ts) })]),
        el("div", { class: "msg", text: n.body || displayName(s) }),
      ]),
    ]);
    if (!n.read) item.appendChild(el("div", { class: "udot" }));
    list.appendChild(item);
  }
}
function toggleNotifPanel(force) {
  const n = $("notif");
  n.hidden = force !== undefined ? !force : !n.hidden;
  $("bellBtn").classList.toggle("on", !n.hidden);
}
function setDnd(v) { doc.settings.dnd = v; persist(); for (const [, wv] of wvs) { try { wv.send("perseo:dnd", v); } catch {} } renderNotif(); }

// ---------- theme / layout ----------
function applyTheme() {
  document.body.dataset.theme = doc.settings.theme;
  app.classList.toggle("expanded", !!doc.settings.expanded);
  $("themeBtn").innerHTML = ico(doc.settings.theme === "light" ? "sun" : "moon");
  $("themeBtn").title = "Tema: " + doc.settings.theme;
  const w = (doc.workspaces || []).find((x) => x.id === MYWIN);
  $("wsName").textContent = w ? "· " + w.name : "";
  const badge = document.querySelector(".brand-badge");
  if (badge) badge.src = w && w.icon ? w.icon : "icons/perseo.png";
}
function setTheme(t) { doc.settings.theme = t; persist(); applyTheme(); }
function toggleTheme() { setTheme(doc.settings.theme === "light" ? "dark" : "light"); }
function toggleExpand() { doc.settings.expanded = !doc.settings.expanded; persist(); applyTheme(); renderRail(); }

// ---------- context menus ----------
function showCtx(x, y, items) {
  const c = $("ctx"); c.innerHTML = "";
  for (const it of items) {
    if (it.div) { c.appendChild(el("div", { class: "div" })); continue; }
    c.appendChild(el("button", { class: it.danger ? "danger" : "", text: it.label, onclick: () => { hideCtx(); it.click && it.click(); } }));
  }
  c.hidden = false;
  const w = c.offsetWidth, h = c.offsetHeight;
  c.style.left = Math.min(x, innerWidth - w - 8) + "px";
  c.style.top = Math.min(y, innerHeight - h - 8) + "px";
  // Register the outside-click closer AFTER this click, so the opening click
  // (which bubbles to document) doesn't close the menu immediately.
  setTimeout(() => document.addEventListener("click", hideCtx, { once: true }), 0);
}
function hideCtx() { $("ctx").hidden = true; }

function tileMenu(e, id) {
  const s = svc(id);
  const groups = [...new Set(doc.services.map((x) => x.group).filter(Boolean))];
  showCtx(e.clientX, e.clientY, [
    { label: t("moveToSpaceMenu"), click: () => chooseWorkspace(e.clientX, e.clientY, [id]) },
    { label: t("popoutNew"), click: () => popout(id) },
    { label: sel.has(id) ? t("deselect") : t("select"), click: () => toggleSel(id) },
    { label: s.muted ? t("unmute") : t("mute"), click: () => toggleMute(id) },
    { div: 1 },
    { label: t("newGroup"), click: async () => { const g = await askText(t("newGroup"), ""); if (g) setGroup(id, g); } },
    ...groups.map((g) => ({ label: (s.group === g ? "✓ " : "") + t("groupTo", g), click: () => setGroup(id, g) })),
    ...(s.group ? [{ label: t("ungroupItem"), click: () => setGroup(id, "") }] : []),
    { div: 1 },
    { label: t("rename"), click: async () => { const n = await askText(t("rename"), displayName(s)); if (n) renameService(id, n); } },
    { label: t("removeItem"), danger: 1, click: () => removeService(id) },
  ]);
}
function groupMenu(e, g) {
  const inGroup = doc.services.filter((s) => s.group === g);
  showCtx(e.clientX, e.clientY, [
    { label: t("openGroupWins"), click: () => inGroup.forEach((s) => popout(s.id)) },
    { label: doc.settings.collapsed && doc.settings.collapsed[g] ? t("expand") : t("collapse"), click: () => toggleGroup(g) },
    { label: t("renameGroup"), click: async () => { const nn = await askText(t("renameGroup"), g); if (nn) { inGroup.forEach((s) => (s.group = nn)); persist(); renderRail(); } } },
    { div: 1 },
    { label: t("ungroup"), click: () => { inGroup.forEach((s) => (s.group = "")); persist(); renderRail(); } },
  ]);
}

// ---------- add modal ----------
function openAdd() {
  const m = $("addModal"); m.innerHTML = "";
  const box = el("div", { class: "modal" });
  box.appendChild(el("button", { class: "close-x", html: ico("x"), onclick: () => (m.hidden = true) }));
  box.appendChild(el("h2", { text: t("addTitle") }));
  box.appendChild(el("div", { class: "sub", text: t("addSub") }));
  for (const c of P.categories) {
    box.appendChild(el("div", { class: "catlabel", text: t(c.key === "ai" ? "catAI" : "catWork") }));
    const grid = el("div", { class: "cards" });
    for (const t of P.catalog.filter((x) => x.cat === c.key))
      grid.appendChild(el("button", { class: "card", onclick: () => { m.hidden = true; addService(t.type, t.name); } }, [iconEl({ type: t.type }, "ic"), el("div", { class: "cname", text: t.name })]));
    box.appendChild(grid);
  }
  m.appendChild(box); m.hidden = false;
}

// ---------- palette ----------
function openPalette() {
  const p = $("palette"); p.innerHTML = "";
  const inp = el("input", { type: "text", placeholder: "Ir a servicio…" });
  const list = el("div", { class: "pal-list" });
  p.appendChild(el("div", { class: "palette-box" }, [inp, list])); p.hidden = false;
  let sel = 0, items = [];
  function draw() {
    const q = inp.value.toLowerCase();
    items = myServices().filter((s) => displayName(s).toLowerCase().includes(q));
    list.innerHTML = "";
    items.forEach((s, i) => list.appendChild(el("div", { class: "pal-item" + (i === sel ? " sel" : ""), onclick: () => { p.hidden = true; selectService(s.id); } }, [iconEl(s), el("div", { text: displayName(s) })])));
  }
  inp.addEventListener("input", () => { sel = 0; draw(); });
  inp.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { sel = Math.min(sel + 1, items.length - 1); draw(); }
    else if (e.key === "ArrowUp") { sel = Math.max(sel - 1, 0); draw(); }
    else if (e.key === "Enter" && items[sel]) { p.hidden = true; selectService(items[sel].id); }
    else if (e.key === "Escape") p.hidden = true;
  });
  draw(); inp.focus();
}

// ---------- tiny prompt ----------
function askText(title, placeholder, value = "") {
  return new Promise((resolve) => {
    const m = $("ask"); m.innerHTML = "";
    const inp = el("input", { type: "text", placeholder, value });
    const done = (v) => { m.hidden = true; resolve(v); };
    m.appendChild(el("div", { class: "modal ask" }, [
      el("h2", { text: title }), inp,
      el("div", { class: "row" }, [
        el("button", { class: "ghost", text: t("cancel"), onclick: () => done(null) }),
        el("button", { class: "btn", text: t("accept"), onclick: () => done(inp.value.trim()) }),
      ]),
    ]));
    m.hidden = false; inp.focus();
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") done(inp.value.trim()); if (e.key === "Escape") done(null); });
  });
}

// ---------- header actions ----------
$("svcHeader").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-a]"); if (!b) return;
  const wv = activeWv(); const a = b.dataset.a;
  if (a === "back" && wv && wv.canGoBack()) wv.goBack();
  else if (a === "fwd" && wv && wv.canGoForward()) wv.goForward();
  else if (a === "reload" && wv) wv.reload();
  else if (a === "mute") toggleMute(activeId);
  else if (a === "popout") popout(activeId);
  else if (a === "more") {
    const s = svc(activeId);
    showCtx(e.clientX, e.clientY, [
      { label: t("rename"), click: async () => { const n = await askText(t("rename"), displayName(s)); if (n) renameService(activeId, n); } },
      { label: t("reloadItem"), click: () => wv && wv.reload() },
      { div: 1 },
      { label: t("removeItem"), danger: 1, click: () => removeService(activeId) },
    ]);
  }
});

// ---------- pointer-based drag (works over <webview>, unlike HTML5 DnD) ----------
let justDragged = false;
let drag = null;
function startTileDrag(e, id) {
  if (e.button !== 0) return;
  drag = { kind: "tile", id, sx: e.clientX, sy: e.clientY, active: false, hover: null };
  window.addEventListener("mousemove", onDragMove);
  window.addEventListener("mouseup", onDragUp, { once: true });
}
function startGroupDrag(e, g) {
  if (e.button !== 0) return;
  drag = { kind: "group", g, sx: e.clientX, sy: e.clientY, active: false, hover: null };
  window.addEventListener("mousemove", onDragMove);
  window.addEventListener("mouseup", onDragUp, { once: true });
}
function onDragMove(e) {
  if (!drag) return;
  if (!drag.active) {
    if (Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) < 6) return;
    beginDrag();
  }
  drag.ghost.style.left = e.clientX + 14 + "px";
  drag.ghost.style.top = e.clientY + 14 + "px";
  hitTest(e.clientX, e.clientY);
}
function beginDrag() {
  drag.active = true;
  document.body.classList.add("dragging");
  drag.ghost = drag.kind === "group"
    ? el("div", { class: "drag-ghost group-ghost", text: drag.g })
    : el("div", { class: "drag-ghost" }, [iconEl(svc(drag.id) || {})]);
  drag.layer = el("div", { id: "dragLayer" });
  document.body.appendChild(drag.layer);
  document.body.appendChild(drag.ghost);
}
function clearHover() {
  document.querySelectorAll(".drop-into").forEach((n) => n.classList.remove("drop-into"));
  $("stage").classList.remove("dropzone");
}
function inRect(x, y, r) { return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; }
function hitTest(x, y) {
  clearHover(); drag.hover = null;
  // Group drag: snap to the NEAREST rail item (tile OR header) so the group can
  // land anywhere — before/after by that item's midpoint.
  if (drag.kind === "group") {
    let best = null, bestd = 1e9;
    for (const c of $("tiles").children) {
      const r = c.getBoundingClientRect(), mid = (r.top + r.bottom) / 2, d = Math.abs(y - mid);
      if (d < bestd) { bestd = d; best = { c, after: y > mid }; }
    }
    if (best) {
      best.c.classList.add("drop-into");
      const c = best.c;
      drag.hover = c.classList.contains("group")
        ? { kind: "group", targetKind: "header", ref: c.title, after: best.after }
        : { kind: "group", targetKind: "tile", ref: c.dataset.id, after: best.after };
    }
    return;
  }
  for (const t of document.querySelectorAll("#tiles .tile"))
    if (inRect(x, y, t.getBoundingClientRect())) { t.classList.add("drop-into"); drag.hover = { kind: "tile", id: t.dataset.id }; return; }
  for (const h of document.querySelectorAll("#tiles .group"))
    if (inRect(x, y, h.getBoundingClientRect())) { h.classList.add("drop-into"); drag.hover = { kind: "group", g: h.title }; return; }
  if (inRect(x, y, $("stage").getBoundingClientRect())) { $("stage").classList.add("dropzone"); drag.hover = { kind: "stage" }; }
}
function onDragUp() {
  window.removeEventListener("mousemove", onDragMove);
  if (drag && drag.active) {
    const h = drag.hover;
    if (drag.kind === "group") {
      if (h) moveGroupTo(drag.g, h);
    } else if (h) {
      if (h.kind === "tile" && h.id !== drag.id) moveBefore(drag.id, h.id);
      else if (h.kind === "group") dropToGroup(drag.id, h.g);
      else if (h.kind === "stage") popout(drag.id);
    }
    clearHover();
    document.body.classList.remove("dragging");
    drag.ghost && drag.ghost.remove();
    drag.layer && drag.layer.remove();
    justDragged = true; setTimeout(() => (justDragged = false), 60);
  }
  drag = null;
}

// ---------- wire top bar ----------
function fillIcons() { document.querySelectorAll("[data-i]").forEach((b) => b.insertAdjacentHTML("afterbegin", ico(b.dataset.i, +(b.dataset.sz || 18)))); }
$("menuBtn").onclick = toggleExpand;
$("themeBtn").onclick = toggleTheme;
$("bellBtn").onclick = () => toggleNotifPanel();
$("searchBtn").onclick = openPalette;
$("addBtn").onclick = openAdd;
$("spacesBtn").onclick = () => P.openLauncher();
$("winMin").onclick = P.win.minimize;
$("winMax").onclick = P.win.maximize;
$("winClose").onclick = P.win.close;
$("npClose").onclick = () => toggleNotifPanel(false);
$("npReadAll").onclick = () => { notifs.forEach((n) => (n.read = true)); renderNotif(); };
$("dndOff").onclick = () => setDnd(false);
$("settingsBtn").onclick = () => {
  const r = $("settingsBtn").getBoundingClientRect();
  showCtx(r.right + 6, r.top, [
    { label: (doc.settings.dnd ? "✓ " : "") + t("dnd"), click: () => setDnd(!doc.settings.dnd) },
    { div: 1 },
    { label: (doc.settings.theme === "dark" ? "✓ " : "") + t("themeDark"), click: () => setTheme("dark") },
    { label: (doc.settings.theme === "light" ? "✓ " : "") + t("themeLight"), click: () => setTheme("light") },
    { label: (doc.settings.theme === "black" ? "✓ " : "") + t("themeBlack"), click: () => setTheme("black") },
    { div: 1 },
    { label: (doc.settings.expanded ? "✓ " : "") + t("expandedBar"), click: toggleExpand },
    { div: 1 },
    ...Object.keys(window.tLangs).map((code) => ({
      label: (window.tLang === code ? "✓ " : "") + window.tLangs[code],
      click: () => { doc.settings.lang = code; persist(); window.setLang(code); },
    })),
  ]);
};
window.addEventListener("keydown", (e) => {
  const mod = e.ctrlKey || e.metaKey;
  if (!mod) return;
  if (e.key.toLowerCase() === "k") { e.preventDefault(); openPalette(); return; }
  const list = doc.workspaces || [];
  // Ctrl/Cmd + 1..9 → jump to that workspace (opens or focuses its app).
  if (e.key >= "1" && e.key <= "9") {
    const ws = list[parseInt(e.key, 10) - 1];
    if (ws) { e.preventDefault(); P.openWindow(ws.id); }
  } else if (e.key === "Tab" && list.length > 1) {
    // Ctrl+Tab / Ctrl+Shift+Tab → next / previous workspace.
    e.preventDefault();
    const idx = Math.max(0, list.findIndex((w) => w.id === MYWIN));
    const next = list[(idx + (e.shiftKey ? -1 : 1) + list.length) % list.length];
    if (next) P.openWindow(next.id);
  }
});
P.win.onMaximized(() => {});

// ---------- boot ----------
function applyI18n() {
  const set = (sel, txt) => { const e = document.querySelector(sel); if (e) e.textContent = txt; };
  set("#searchBtn .grow", t("searchPh"));
  set("#notif .np-head b", t("notif"));
  const dnd = $("npDnd"); if (dnd && dnd.firstChild) dnd.firstChild.nodeValue = t("dndBanner") + " ";
  set("#dndOff", t("dndDisable"));
  set("#empty div", t("emptyStage"));
  set("#addBtn .lbl", t("addTitle"));
  const sp = $("spacesBtn"); if (sp) sp.title = t("spaces");
  const ad = $("addBtn"); if (ad) ad.title = t("addTitle");
}

(async function boot() {
  fillIcons();
  applyI18n();
  doc = await P.store.load();
  doc.settings = Object.assign({}, DEF, doc.settings || {});
  if (!doc.settings.collapsed) doc.settings.collapsed = {};
  if (MYWIN === "main" && (!doc.services || !doc.services.length)) {
    doc.services = [
      { id: newId(), type: "slack", name: "Slack", group: "", win: "main" },
      { id: newId(), type: "teams", name: "Teams", group: "", win: "main" },
    ];
    persist();
  }
  applyTheme(); renderRail(); renderNotif(); renderSelBar();
  P.onStoreChanged(() => reloadFromStore());
  const focus = new URLSearchParams(location.search).get("focus");
  const mine = myServices();
  if (focus && svc(focus) && inMyWin(svc(focus))) selectService(focus);
  else if (mine[0]) selectService(mine[0].id);
  else { $("svcHeader").classList.add("hidden"); $("empty").style.display = "flex"; }
})();

// Always clear the splash — even if boot throws — so it never traps the titlebar.
function hideSplash() { const s = $("splash"); if (s) { s.classList.add("hide"); setTimeout(() => s.remove(), 600); } }
setTimeout(hideSplash, 1100);
