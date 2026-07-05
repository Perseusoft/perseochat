// Electron denies most web permissions by default. These wrappers ARE the
// service's official web app, so grant the capabilities it legitimately needs:
// microphone/camera (calls), notifications, screen sharing, clipboard.
const GRANTED = new Set([
  "media", // getUserMedia: microphone + camera
  "audioCapture",
  "videoCapture",
  "display-capture", // getDisplayMedia: screen sharing
  "notifications",
  "clipboard-read",
  "clipboard-sanitized-write",
  "fullscreen",
  "pointerLock",
]);

function setupPermissions(ses) {
  // Async request path (getUserMedia, Notification.requestPermission, ...).
  ses.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(GRANTED.has(permission));
  });

  // Synchronous check path (some apps gate UI on this before requesting).
  ses.setPermissionCheckHandler((_wc, permission) => GRANTED.has(permission));

  // Chromium also routes device enumeration/selection through this on Linux;
  // allow all so mic/camera pickers inside the web app are populated.
  if (ses.setDevicePermissionHandler) {
    ses.setDevicePermissionHandler(() => true);
  }
}

module.exports = { setupPermissions };
