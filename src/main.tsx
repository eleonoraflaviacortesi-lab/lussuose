import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// PWA: make sure updates take effect quickly (especially on iOS)
import { registerSW } from "virtual:pwa-register";

const BUILD_VERSION = "v2.1.0";
console.info(`[build] ${BUILD_VERSION} - ${__BUILD_ID__}`);

// If an updated SW is available, activate it and hard-reload.
// This avoids users being stuck on an older cached build.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.info("[pwa] update available -> reloading");
    updateSW(true);
    window.location.reload();
  },
  onOfflineReady() {
    console.info("[pwa] offline ready");
  },
});

createRoot(document.getElementById("root")!).render(<App />);
