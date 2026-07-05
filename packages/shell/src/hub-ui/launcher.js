"use strict";
const P = window.perseo;
const CAT = new Map(P.catalog.map((c) => [c.type, c]));
const $ = (id) => document.getElementById(id);
let doc = { services: [], workspaces: [], settings: {} };

function el(tag, props = {}, kids = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") n.className = v;
    else if (k === "text") n.textContent = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else if (v != null) n.setAttribute(k, v);
  }
  for (const c of [].concat(kids)) if (c) n.appendChild(c);
  return n;
}
function iconEl(s) {
  const t = CAT.get(s.type) || { color: "#555", abbrev: "?", name: s.type };
  const box = el("span", { class: "ic" });
  if (t.icon) box.appendChild(el("img", { src: t.icon, alt: "" }));
  else { box.style.background = t.color; box.appendChild(el("span", { class: "letter", text: (t.abbrev || "?") })); }
  return box;
}
function svcOf(wsId) { return doc.services.filter((s) => (s.win || "main") === wsId); }
function persist() { P.store.save(doc); }
function newWsId() { return "w" + Date.now().toString(36) + Math.floor(Math.random() * 1e3).toString(36); }

function render() {
  const grid = $("grid"); grid.innerHTML = "";
  for (const ws of doc.workspaces) {
    const list = svcOf(ws.id);
    let mid;
    if (list.length) {
      mid = el("div", { class: "icons" });
      list.slice(0, 6).forEach((s) => mid.appendChild(iconEl(s)));
      if (list.length > 6) mid.appendChild(el("span", { class: "more-n", text: "+" + (list.length - 6) }));
    } else {
      mid = el("div", { class: "hint", text: t("emptyWs") });
    }

    const more = el("button", { class: "more", title: t("options"), onclick: (e) => { e.stopPropagation(); openCardMenu(e, ws); } });
    more.innerHTML = ico("ellipsis-vertical", 18);
    const actions = el("div", { class: "actions" }, [
      el("button", { class: "open", text: t("open"), onclick: () => P.openWindow(ws.id) }),
      more,
    ]);

    const head = el("div", { class: "ws-head" });
    if (ws.icon) head.appendChild(el("img", { class: "wslogo", src: ws.icon, alt: "" }));
    head.appendChild(el("div", { class: "name", text: ws.name }));
    grid.appendChild(el("div", { class: "ws" }, [
      head,
      el("div", { class: "meta", text: t("accounts", list.length) }),
      mid, actions,
    ]));
  }
  grid.appendChild(el("div", { class: "ws new", onclick: newWorkspace }, [
    el("div", { class: "plus", text: "+" }), el("div", { class: "lbl", text: t("newWs") }),
  ]));
  $("openAll").hidden = doc.workspaces.length <= 1;
}

function deleteWs(ws) {
  for (const s of doc.services) if ((s.win || "main") === ws.id) s.win = "main";
  doc.workspaces = doc.workspaces.filter((w) => w.id !== ws.id);
  persist(); render();
}

function ico(name, size = 16) {
  const p = (window.ICONS && window.ICONS[name]) || "";
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
}
function hideMenu() { $("ctx").hidden = true; }
function showMenu(x, y, items) {
  const c = $("ctx"); c.innerHTML = "";
  for (const it of items) {
    const b = el("button", { class: it.danger ? "danger" : "", onclick: () => { hideMenu(); it.click(); } });
    b.innerHTML = ico(it.icon) + "<span>" + it.label + "</span>";
    c.appendChild(b);
  }
  c.hidden = false;
  const w = c.offsetWidth, h = c.offsetHeight;
  c.style.left = Math.min(x, innerWidth - w - 8) + "px";
  c.style.top = Math.min(y, innerHeight - h - 8) + "px";
  setTimeout(() => document.addEventListener("click", hideMenu, { once: true }), 0);
}
function pickLogo(ws) {
  const inp = document.createElement("input");
  inp.type = "file"; inp.accept = "image/*";
  inp.onchange = () => {
    const f = inp.files && inp.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 128, s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(img.width * s));
        c.height = Math.max(1, Math.round(img.height * s));
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        ws.icon = c.toDataURL("image/png");
        persist(); render();
      };
      img.src = r.result;
    };
    r.readAsDataURL(f);
  };
  inp.click();
}
function openCardMenu(e, ws) {
  const items = [
    { icon: "pencil", label: t("rename"), click: () => askName(t("renameWsTitle"), ws.name, (n) => { ws.name = n; persist(); render(); }) },
    { icon: "image", label: t("changeLogo"), click: () => pickLogo(ws) },
  ];
  if (ws.icon) items.push({ icon: "trash-2", label: t("removeLogo"), click: () => { delete ws.icon; persist(); render(); } });
  items.push({ icon: "external-link", label: t("pin"), click: () => P.pinWorkspace(ws.id) });
  if (ws.id !== "main")
    items.push({ icon: "trash-2", label: t("del"), danger: true, click: async () => {
      const ok = await confirmDialog(t("deleteWsTitle"), t("deleteWsMsg", ws.name, svcOf(ws.id).length));
      if (ok) deleteWs(ws);
    } });
  showMenu(e.clientX, e.clientY, items);
}
function confirmDialog(title, message) {
  return new Promise((resolve) => {
    $("confirmTitle").textContent = title;
    $("confirmMsg").textContent = message;
    $("confirm").classList.add("on");
    const done = (v) => { $("confirm").classList.remove("on"); resolve(v); };
    $("confirmOk").onclick = () => done(true);
    $("confirmCancel").onclick = () => done(false);
  });
}
function newWorkspace() {
  askName(t("newWsTitle"), "", (name) => {
    doc.workspaces.push({ id: newWsId(), name });
    persist(); render();
  });
}
function applyI18n() {
  $("min").title = t("minimize"); $("close").title = t("close");
  document.querySelector(".head h1").textContent = t("chooseTitle");
  document.querySelector(".head p").textContent = t("chooseSub");
  $("openAll").textContent = t("openAll");
  $("askCancel").textContent = t("cancel"); $("askOk").textContent = t("accept");
  $("askInput").placeholder = t("wsNamePh");
  $("confirmCancel").textContent = t("cancel"); $("confirmOk").textContent = t("del");
}

// mini prompt
let askCb = null;
function askName(title, value, cb) {
  askCb = cb;
  $("askTitle").textContent = title;
  const inp = $("askInput"); inp.value = value || "";
  $("ask").classList.add("on"); inp.focus(); inp.select();
}
function closeAsk() { $("ask").classList.remove("on"); askCb = null; }
$("askOk").onclick = () => { const v = $("askInput").value.trim(); if (v && askCb) askCb(v); closeAsk(); };
$("askCancel").onclick = closeAsk;
$("askInput").addEventListener("keydown", (e) => { if (e.key === "Enter") $("askOk").click(); if (e.key === "Escape") closeAsk(); });

$("openAll").onclick = () => doc.workspaces.forEach((w) => P.openWindow(w.id));
$("min").onclick = P.win.minimize;
$("close").onclick = P.win.close;

(async function boot() {
  applyI18n();
  doc = await P.store.load();
  if (!doc.workspaces || !doc.workspaces.length) doc.workspaces = [{ id: "main", name: "Principal" }];
  render();
  P.onStoreChanged(async () => { doc = await P.store.load(); render(); });
})();
