/**
 * Inkling shell boot — WordWeaver opens first; Inkling does not auto-open.
 */
import { openPanel } from "./calendar/ui/AppLauncher.js";

/**
 * Close other panels and surface WordWeaver (after CalendarApp inkling boot).
 */
export function bootWordWeaverFirst() {
  const startTab = new URLSearchParams(window.location.search).get("tab");
  // Only auto-open WordWeaver for an EXPLICIT ?tab=wordweaver (or wall) deep link.
  // The normal launch (no tab) must rest on the cosmos welcome intro instead — this
  // used to fire on the default boot too, which hid the cosmos intro ~150ms in and
  // jumped straight to WordWeaver.
  if (startTab !== "wordweaver" && startTab !== "wall") {
    return;
  }

  const activate = () => {
    const app = window.__inklingApp;
    if (app?._handleBottomNavTab) {
      void app._handleBottomNavTab("wordweaver", { toggle: false });
      return;
    }
    document.dispatchEvent(new CustomEvent("inkling:close-all-panels"));
    openPanel("wordweaver");
  };

  queueMicrotask(activate);
  setTimeout(activate, 150);
}

/**
 * @param {import("./calendar/CalendarApp.js").CalendarApp} app
 */
export function registerInklingApp(app) {
  window.__inklingApp = app;
  bootWordWeaverFirst();
}
