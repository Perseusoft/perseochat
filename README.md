<div align="center">

<img src="apps/perseochat/build/icon.png" width="128" alt="PerseoChat" />

# PerseoChat

### One home for every conversation — messaging and AI, together.

*A planet, its orbit, and the spark of a signal.*

Slack · Teams · Discord · WhatsApp · Telegram · Claude · ChatGPT · Gemini · Grok · Perplexity · Copilot

[![Platform](https://img.shields.io/badge/Linux-x86__64%20%7C%20aarch64-2E8BF0)](#platforms)
[![Formats](https://img.shields.io/badge/deb%20·%20rpm%20·%20AppImage%20·%20snap%20·%20flatpak-141E38)](#install)
[![By PerseuSoft](https://img.shields.io/badge/by-PerseuSoft-F5822E)](https://perseusoft.tech)

</div>

---

## Why PerseoChat

It started on an **ARM Linux** laptop (Fedora Asahi, Apple Silicon). Half the
tools a workday needs — Slack, Teams, and most AI chats — **ship no native ARM
build**, and juggling a dozen browser tabs for a dozen accounts is nobody's idea
of focus.

So we built the client we wanted: **one native app that gathers your services
and accounts into tidy, separate spaces** — and made it feel like a real desktop
app, not a pile of tabs. It runs just as well on x86_64, and it's the first
member of the **PerseuSoft** product family (alongside PerseoFlow and PerseoDesk).

The idea in one image: **a planet** (your workspace) with services **in orbit**
around it, and an **amber spark** when something needs you.

## What it does

- 🗂️ **Workspaces** — bundle the accounts for a context (*Client A*, *Personal*,
  *Company 2*). Each opens as **its own app window you can pin to the taskbar**.
  A launcher greets you at start: *which spaces do you want to open?*
- 🔒 **Isolated accounts** — every service runs in its own sandboxed session, so
  you can keep **several accounts of the same app** side by side, no conflicts.
- 🤖 **Messaging + AI in one place** — chat apps and AI assistants live together;
  add any of them, or a custom web app.
- 🔔 **Notifications center** — unified inbox with per-service **unread badges**,
  **mute**, and **Do-Not-Disturb**.
- ⚡ **Fast to drive** — command palette (`Ctrl K`), workspace hotkeys
  (`Ctrl 1…9`, `Ctrl Tab`), drag-to-reorder, collapsible groups.
- 🎨 **Yours** — dark / light / AMOLED themes, per-workspace custom logos, and a
  **multilingual UI** (English, Español, Português, Français, Deutsch) that even
  asks the web apps to load in your language.

## Services included

| Messaging & work | AI chats |
|---|---|
| Slack, Microsoft Teams, Discord, WhatsApp, Telegram | Claude, ChatGPT, Gemini, Grok, Perplexity, Copilot |

…plus any custom URL. New services are a few lines in the catalog.

## Platforms

**Available now — Linux, native:**

| Architecture | Formats |
|---|---|
| **x86_64** | `.deb` · `.rpm` · `.AppImage` · `snap` · `flatpak` |
| **aarch64 (ARM64)** | `.deb` · `.rpm` · `.AppImage` · `snap` · `flatpak` |

**On the roadmap:** Windows and macOS builds — the shell is cross-platform, so
these are packaging work, not a rewrite.

## Download

Pick your architecture and format. **AppImage** runs on any distro
(`chmod +x` and launch); `.deb`/`.rpm` install system-wide; `snap`/`flatpak`
are sandboxed.

| Format | x86_64 | aarch64 (ARM64) |
| :-- | :--: | :--: |
| **AppImage** — portable, any distro | [⬇ Download](https://get.perseusoft.tech/latest/x64/PerseoChat-x64.AppImage) | [⬇ Download](https://get.perseusoft.tech/latest/arm64/PerseoChat-arm64.AppImage) |
| **Debian / Ubuntu** — `.deb` | [⬇ Download](https://get.perseusoft.tech/latest/x64/PerseoChat-x64.deb) | [⬇ Download](https://get.perseusoft.tech/latest/arm64/PerseoChat-arm64.deb) |
| **Fedora / RHEL / openSUSE** — `.rpm` | [⬇ Download](https://get.perseusoft.tech/latest/x64/PerseoChat-x64.rpm) | [⬇ Download](https://get.perseusoft.tech/latest/arm64/PerseoChat-arm64.rpm) |
| **Snap** — `.snap` | [⬇ Download](https://get.perseusoft.tech/latest/x64/PerseoChat-x64.snap) | [⬇ Download](https://get.perseusoft.tech/latest/arm64/PerseoChat-arm64.snap) |
| **Flatpak** — `.flatpak` | [⬇ Download](https://get.perseusoft.tech/latest/x64/PerseoChat-x64.flatpak) | [⬇ Download](https://get.perseusoft.tech/latest/arm64/PerseoChat-arm64.flatpak) |

*Windows & macOS builds are coming — see [Platforms](#platforms).*

> Files are served from the **`perseochat-storage`** Cloudflare R2 bucket behind
> `get.perseusoft.tech`. `latest/` always points to the newest release;
> pinned versions live at `…/releases/<version>/<arch>/`.

> **Fedora Asahi** note: the app launches with `--disable-gpu` baked in —
> Chromium's GPU path isn't ready on the Apple GPU under Wayland yet; software
> compositing stays smooth.

## Build from source

```bash
git clone git@github.com:Perseusoft/perseochat.git
cd perseochat
npm install
npm run dev            # run it

npm run dist           # build installers for the host architecture
```

`snap` needs `snapcraft`, `flatpak` needs `flatpak-builder` + the
`org.electronjs.Electron2.BaseApp` runtime, `rpm` needs `rpmbuild`. All formats
for both architectures are produced by CI on every `v*` tag.

## How it's built

Electron shell, one `<webview>` per service (Ferdium-style), each on its own
`persist:` partition. Every workspace is a separate process with a distinct app
id, so the OS treats it as its own pinnable app.

```
apps/perseochat/     app entry, icon, packaging config
packages/shell/      the hub engine
  src/hub.js         main process — windows, workspaces, sessions, IPC
  src/hub-ui/        renderer — launcher + shell (HTML/CSS/JS), fonts, icons
  src/catalog.js     service catalog
ref/design/          brand system (palette, type, logo, mockups)
.github/workflows/   CI: build every format × arch → Cloudflare R2
```

## Brand

Night-sky **navy** with an amber **signal** accent · display **Space Grotesk** ·
UI **Public Sans** · mono **IBM Plex Mono**. The mark is a planet ringed by an
orbit with a single amber star.

---

<div align="center">

**PerseoChat** — made by [**PerseuSoft**](https://perseusoft.tech) ·
© PerseuSoft

</div>
