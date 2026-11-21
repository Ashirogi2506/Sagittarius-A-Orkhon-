"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect } from "react";
import { setTheme, useTheme } from "@/lib/theme";

export function ThemeSync() {
  const theme = useTheme();
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "night" ? "#141424" : "#FFF4C5");
  }, [theme]);
  return null;
}

export function ThemeSwitch() {
  const night = useTheme() === "night";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={night}
      aria-label="Шөнийн горим"
      title={night ? "Өдрийн горимд шилжих" : "Шөнийн горимд шилжих"}
      onClick={() => setTheme(night ? "day" : "night")}
      className="theme-switch"
    >
      <span className="theme-switch-thumb" aria-hidden="true" />
      <Sun className="theme-switch-sun" aria-hidden="true" />
      <Moon className="theme-switch-moon" aria-hidden="true" />
    </button>
  );
}
