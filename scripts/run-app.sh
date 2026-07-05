#!/usr/bin/env bash
# Launch an arm-waiting app from the repo (no packaging/root needed).
# Usage: run-app.sh <slack|teams> [profile]
#   profile: optional account profile (isolated session), e.g. work / personal.
#            Omit for the default account.
set -euo pipefail

ROOT="/home/joseespana/Develop/PerseuSoft/GitHub/arm-waiting"
APP="${1:?usage: run-app.sh <slack|teams> [profile]}"
PROFILE="${2:-}"

# Unique window id per account so the compositor (KDE/KWin) treats each profile
# as its own app — otherwise launching the 2nd account just focuses the 1st.
WMID="arm-$APP"
[ -n "$PROFILE" ] && WMID="arm-$APP-$PROFILE"

exec env ARM_PROFILE="$PROFILE" \
  "$ROOT/node_modules/electron/dist/electron" "$ROOT/apps/$APP" \
  --class="$WMID" \
  --ozone-platform-hint=auto \
  --enable-features=WebRTCPipeWireCapturer \
  --disable-gpu
