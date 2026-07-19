export const NAVIGATION_START_EVENT = "wyjezdnik:navigation-start";

export function announceNavigationStart() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(NAVIGATION_START_EVENT));
}
