import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { startOnlineSync } from "@/lib/sync-manager";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("SW registration failed:", err);
    });
  });
}

startOnlineSync();

createRoot(document.getElementById("root")!).render(<App />);
