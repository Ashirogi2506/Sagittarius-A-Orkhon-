"use client";

import { useSyncExternalStore } from "react";

export type Theme = "day" | "night";
const STORAGE_KEY = "so.theme";
const CHANGE_EVENT = "smart-orkhon-theme";
let current: Theme = "day";
let transitionTimer: number | undefined;

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getTheme(): Theme {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "day" || saved === "night") return saved;
  } catch { /* Storage is optional. */ }
  return current;
}

const getServerTheme = (): Theme => "day";

export function useTheme() {
  return useSyncExternalStore(subscribe, getTheme, getServerTheme);
}

export function setTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.themeSwitching = "";
  window.clearTimeout(transitionTimer);
  transitionTimer = window.setTimeout(() => { delete root.dataset.themeSwitching; }, 320);
  current = theme;
  try { window.localStorage.setItem(STORAGE_KEY, theme); } catch { /* Keep the selection for this tab. */ }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
