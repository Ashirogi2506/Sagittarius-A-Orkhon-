"use client";

import { useSyncExternalStore } from "react";

export type Theme = "day" | "night";
const KEY = "so.theme";
const EVENT = "smart-orkhon-theme";
let fallback: Theme = "day";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function snapshot(): Theme {
  try {
    const saved = window.localStorage.getItem(KEY);
    return saved === "day" || saved === "night" ? saved : fallback;
  } catch {
    return fallback;
  }
}

const serverSnapshot = (): Theme => "day";

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

export function setTheme(value: Theme) {
  fallback = value;
  try { window.localStorage.setItem(KEY, value); } catch { /* keep this tab's choice */ }
  window.dispatchEvent(new Event(EVENT));
}
