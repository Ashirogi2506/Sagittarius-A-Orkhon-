"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, X } from "lucide-react";
import { useEffect, useState } from "react";
import { MENU, TABS } from "@/lib/appNav";
import { cn } from "./ui";

/** App-style bottom bar for phones: four main tabs and a «Цэс» sheet with every section. Hidden from md up. */
export function MobileTabBar() {
  const [active, setActive] = useState("#home");
  const [sheet, setSheet] = useState(false);

  // Highlight the tab whose section crosses the middle of the screen.
  useEffect(() => {
    const ids = TABS.map((t) => t.href.slice(1));
    const visible = new Set<string>();
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? visible.add(e.target.id) : visible.delete(e.target.id)));
      // Outside these four sections (e.g. «Үйлчилгээ») no tab is highlighted.
      const id = ids.find((x) => visible.has(x));
      setActive(id ? `#${id}` : "");
    }, { rootMargin: "-45% 0px -50% 0px" });
    ids.forEach((id) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSheet(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet]);

  return (
    <>
      <AnimatePresence>
        {sheet && (
          <>
            {/* Above the chat button (z-50) but stopping at the tab bar, which stays usable. */}
            <motion.div className="fixed inset-x-0 top-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-[51] bg-black/50 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheet(false)} />
            <motion.nav aria-label="Бүх хэсэг" initial={{ y: "110%" }} animate={{ y: 0 }} exit={{ y: "110%" }} transition={{ type: "spring", damping: 30, stiffness: 320 }}
              className="editorial-navigation fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-[51] max-h-[75dvh] overflow-y-auto rounded-t-3xl border-t border-cyan/25 bg-navy-3 px-4 pt-3 pb-4 md:hidden">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-snow/20" />
              <div className="mb-3 flex items-center justify-between">
                <p className="font-display font-semibold">Бүх хэсэг</p>
                <button type="button" onClick={() => setSheet(false)} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-snow/10" aria-label="Цэс хаах"><X className="h-5 w-5" /></button>
              </div>
              <ul className="grid grid-cols-3 gap-2">
                {MENU.map(({ href, label, icon: I }) => (
                  <li key={href + label}>
                    <a href={href} onClick={() => setSheet(false)} className="flex h-full flex-col items-center gap-1.5 rounded-lg border border-line bg-navy px-1 py-3 text-center text-[13px] leading-tight active:bg-cyan/10">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan/10 text-cyan"><I className="h-[18px] w-[18px]" /></span>{label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      <nav aria-label="Үндсэн цэс (гар утас)" className="editorial-navigation fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        <ul className="mx-auto grid h-16 max-w-md grid-cols-5">
          {TABS.map(({ href, label, icon: I, primary }) => {
            const on = !sheet && active === href;
            return (
              <li key={href} className="grid">
                <a href={href} onClick={() => setSheet(false)} aria-current={on ? "page" : undefined}
                  className={cn("flex flex-col items-center justify-center gap-0.5 text-[11.5px] font-semibold", on ? "text-cyan" : "text-muted")}>
                  {primary
                    ? <span className="-mt-5 grid h-12 w-12 place-items-center rounded-lg bg-action text-snow"><I className="h-5 w-5" /></span>
                    : <I className="h-5 w-5" />}
                  {label}
                </a>
              </li>
            );
          })}
          <li className="grid">
            <button type="button" onClick={() => setSheet((s) => !s)} aria-expanded={sheet}
              className={cn("flex flex-col items-center justify-center gap-0.5 text-[11.5px] font-semibold", sheet ? "text-cyan" : "text-muted")}>
              <LayoutGrid className="h-5 w-5" />Цэс
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
