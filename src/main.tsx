import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// PWA: abilita service worker solo in produzione (evita blank screen in preview/dev)
import { registerSW } from "virtual:pwa-register";

const BUILD_VERSION = "v2.2.1";
console.info(`[build] ${BUILD_VERSION} - ${__BUILD_ID__}`);

if (import.meta.env.PROD) {
  // Nuke old caches only in production PWA mode
  if ("caches" in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        if (name.includes("workbox") || name.includes("precache")) {
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
        setTimeout(() => window.location.reload(), 300);
      });
    },
    onOfflineReady() {
      console.info("[pwa] offline ready");
    },
  });
}

createRoot(document.getElementById("root")!).render(<App />);

