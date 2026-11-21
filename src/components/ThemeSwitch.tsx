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
      className="relative flex h-10 w-[60px] shrink-0 items-center justify-between rounded-full border border-line bg-navy-3 px-2 text-muted transition-colors">
      <span className={`absolute left-1 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform ${night ? "translate-x-6" : ""}`} aria-hidden="true" />
      <Sun className={`relative z-10 h-4 w-4 ${night ? "" : "text-cyan"}`} aria-hidden="true" />
      <Moon className={`relative z-10 h-4 w-4 ${night ? "text-cyan" : ""}`} aria-hidden="true" />
    </button>
  );
}
