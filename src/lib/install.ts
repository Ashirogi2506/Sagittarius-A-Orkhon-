"use client";

import { useSyncExternalStore } from "react";

// Install state for the "Апп татах" section. The browser fires beforeinstallprompt once, possibly before
// any component mounts, so it is caught at module level and shared through useSyncExternalStore.

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
export type Platform = "ios" | "android" | "desktop";
export type InstallState = { ready: boolean; platform: Platform; installed: boolean; canPrompt: boolean };

const SERVER: InstallState = { ready: false, platform: "desktop", installed: false, canPrompt: false };
let state: InstallState = SERVER;
let deferred: PromptEvent | null = null;
let started = false;
const subs = new Set<() => void>();
const emit = (patch: Partial<InstallState>) => { state = { ...state, ...patch }; subs.forEach((f) => f()); };

function detect(): Platform {
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac; touch support tells them apart.
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  state = { ready: true, platform: detect(), installed: standalone, canPrompt: false };
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e as PromptEvent; emit({ canPrompt: true }); });
  window.addEventListener("appinstalled", () => { deferred = null; emit({ installed: true, canPrompt: false }); });
  // Only in production: in development the build files change on every edit and must not be cached.
  if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
}

// Start listening as soon as the client bundle loads, so an early beforeinstallprompt is not missed.
if (typeof window !== "undefined") start();

export function useInstall(): InstallState {
  return useSyncExternalStore(
    (f) => { start(); subs.add(f); return () => { subs.delete(f); }; },
    () => state,
    () => SERVER,
  );
}

/** Shows the browser's own install dialog. Returns true when the person accepted. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const e = deferred;
  deferred = null;
  emit({ canPrompt: false });
  await e.prompt();
  return (await e.userChoice).outcome === "accepted";
}
