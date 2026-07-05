# PerseoChat

A unified messaging + AI hub for **Linux (x86_64 and aarch64)** — Slack, Teams,
Discord, WhatsApp, Telegram and AI chats (Claude, ChatGPT, Gemini, Grok,
Perplexity, Copilot) in one native app, with **isolated per-account sessions**
and **persistent workspaces**. By [PerseuSoft](https://perseusoft.tech).

Built to give ARM Linux (Fedora Asahi, Ubuntu ARM) first-class desktop clients
for services that ship no native ARM build — while working just as well on x86_64.

## Features

- **Workspaces** — group accounts (e.g. *Client A*, *Personal*), each opens as
  its own app window you can pin to the taskbar; a launcher lets you pick which
  to open on start.
- **Isolated sessions** — every account runs in its own container; add several
  accounts of the same service.
- **Notifications center** with per-service badges, mute and Do-Not-Disturb.
- **Groups**, drag-to-reorder, quick switcher (`Ctrl+K`), workspace hotkeys
  (`Ctrl+1..9`, `Ctrl+Tab`).
- **Multi-language** UI (en/es/pt/fr/de) that also asks web apps to render in
  your language (`Accept-Language`).
- **Theming** (dark / light / AMOLED), custom per-workspace logos.

## Repository layout

```
apps/perseochat/        the app entry (main.js) + electron-builder config + icon
packages/shell/         the hub engine
  src/hub.js            main process: windows, workspaces, sessions, IPC
  src/hub-ui/           renderer: launcher + shell (HTML/CSS/JS), fonts, icons
  src/catalog.js        service catalog (urls, brands)
  src/{permissions,screen-share,nav-policy,service-preload,services-store}.js
scripts/run-app.sh      dev launcher
ref/design/             brand system (colors, fonts, logo, mockups)
.github/workflows/      CI: build all formats × arches → Cloudflare R2
```

## Develop

```bash
npm install
scripts/run-app.sh perseochat     # or: npm run dev
```

## Build installers

```bash
npm run dist                       # deb, rpm, AppImage, snap, flatpak (host arch)
```

Snap needs `snapcraft`; flatpak needs `flatpak-builder` + the
`org.electronjs.Electron2.BaseApp` runtime; rpm needs `rpmbuild`. In practice all
formats for both architectures are produced by CI.

## Releases

Tagging `v*` triggers the CI matrix (x86_64 + aarch64), builds every format and
uploads them to the **`perseochat-storage`** Cloudflare R2 bucket under
`releases/<tag>/<arch>/` (and `releases/latest/<arch>/`).

CI secrets required: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ACCOUNT_ID`.

## Notes

- On Fedora Asahi (Apple GPU / Wayland) the app launches with `--disable-gpu`
  (baked in); Chromium's GPU scanout path isn't ready there yet.
- Slack/Teams tie their UI language to the account settings rather than
  `Accept-Language`.
