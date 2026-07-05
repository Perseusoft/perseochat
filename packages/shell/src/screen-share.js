const { session, desktopCapturer } = require("electron");

/**
 * Route getDisplayMedia() through the desktop portal so screen sharing works
 * under Wayland (PipeWire). Requires launching Electron with
 * `--enable-features=WebRTCPipeWireCapturer` (set in each app's launch flags).
 *
 * NOTE: this spike auto-selects the primary screen. Production should present a
 * source picker (screen vs. individual window) before calling back.
 */
function wireScreenShareSession(ses) {
  ses.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer
      .getSources({ types: ["screen", "window"] })
      .then((sources) => {
        if (!sources.length) {
          callback({}); // deny gracefully
          return;
        }
        callback({ video: sources[0], audio: "loopback" });
      })
      .catch(() => callback({}));
  });
}

function wireScreenShare(win) {
  wireScreenShareSession(win ? win.webContents.session : session.defaultSession);
}

module.exports = { wireScreenShare, wireScreenShareSession };
