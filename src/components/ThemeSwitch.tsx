"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect } from "react";
import { setTheme, useTheme } from "@/lib/theme";

export function ThemeSwitch() {
  const mode = useTheme();
  const night = mode === "night";

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = night ? "dark" : "light";
  }, [mode, night]);

  return (
    <button type="button" role="switch" aria-checked={night}
      aria-label="Шөнийн горим" title={night ? "Өдрийн горимд шилжих" : "Шөнийн горимд шилжих"}
      onClick={() => setTheme(night ? "day" : "night")}
      className="theme-switch">
      <span className="theme-switch-thumb" aria-hidden="true" />
      <Sun className="theme-switch-sun" aria-hidden="true" />
      <Moon className="theme-switch-moon" aria-hidden="true" />
    </button>
  );
}
