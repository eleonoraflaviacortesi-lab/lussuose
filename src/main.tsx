import { createRoot } from "react-dom/client";
import "./index.css";

// PWA: abilita service worker solo in produzione (evita blank screen in preview/dev)
import { registerSW } from "virtual:pwa-register";

const BUILD_VERSION = "v2.2.2";
const buildId = typeof __BUILD_ID__ !== "undefined" ? __BUILD_ID__ : "no-build-id";
console.info(`[build] ${BUILD_VERSION} - ${buildId}`);

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
} else {
  // Preview/Dev safety: remove any previously registered SW + stale caches
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
        console.info("[pwa] unregistered service worker in preview/dev");
      });
    });
  }

  if ("caches" in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        if (name.includes("workbox") || name.includes("precache")) {
          caches.delete(name);
          console.info(`[pwa] deleted dev cache: ${name}`);
        }
      });
    });
  }
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);

async function bootstrap() {
  try {
    const { default: App } = await import("./App.tsx");
    root.render(<App />);
  } catch (error) {
    console.error("[bootstrap] Failed to load app", error);
    root.render(
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-6 text-center">
        Errore di caricamento app. Ricarica la pagina.
      </div>
    );
  }
}

bootstrap();
