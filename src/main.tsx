import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// PWA: make sure updates take effect quickly (especially on iOS)
import { registerSW } from "virtual:pwa-register";

const BUILD_VERSION = "v2.2.0";
console.info(`[build] ${BUILD_VERSION} - ${__BUILD_ID__}`);

// Nuke all old caches on every load to prevent stale builds
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      // Delete all workbox/precache caches — fresh assets will be re-cached by SW
      if (name.includes('workbox') || name.includes('precache')) {
        caches.delete(name);
        console.info(`[pwa] deleted stale cache: ${name}`);
      }
    });
  });
}

// If an updated SW is available, activate it and hard-reload.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.info("[pwa] update available -> activating new SW");
    updateSW(true).then(() => {
      // Small delay to let the new SW take control before reload
      setTimeout(() => window.location.reload(), 300);
    });
  },
  onOfflineReady() {
    console.info("[pwa] offline ready");
  },
});

createRoot(document.getElementById("root")!).render(<App />);
