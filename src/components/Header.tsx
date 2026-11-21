"use client";

import { Bell, Menu, Smartphone, X } from "lucide-react";
import { useState } from "react";
import { useStore, isRelevant } from "@/lib/store";
import { NotificationCenter } from "./NotificationCenter";
import { AccountButton } from "./Account";
import { ThemeSwitch } from "./ThemeSwitch";

// The logo already links home; "about" is in the phone menu and at the bottom of the page.
const NAV = [
  ["#notices", "Мэдэгдэл"], ["#report", "Асуудлууд"], ["#map", "Газрын зураг"],
  ["#services", "Үйлчилгээ"], ["#visit", "Үзэх газар"],
] as const;
// Lower-priority links live only in the phone/tablet menu so the desktop bar fits on one line.
const MORE = [["#solved", "Үр дүн, санаа"], ["#app", "Апп татах"], ["#sources", "Эх сурвалж"], ["#about", "Бидний тухай"]] as const;

// Mark: the Erdenet open pit seen from above, its benches as stepped rings, with the Orkhon as one line through it.
export function Logo() {
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9" aria-hidden="true">
      <rect x="1" y="1" width="38" height="38" rx="10" fill="#eef2f7" />
      <g fill="none" stroke="#1f5fbf" strokeLinecap="round">
        <ellipse cx="20" cy="19" rx="14" ry="10" strokeWidth="1.6" opacity=".45" />
        <ellipse cx="20" cy="19" rx="9.5" ry="6.6" strokeWidth="1.8" opacity=".75" />
        <ellipse cx="20" cy="19" rx="5" ry="3.4" strokeWidth="2" />
      </g>
      <path d="M4 31 C 12 27, 18 34, 26 30 S 34 28, 37 29" fill="none" stroke="#6f9be0" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function Header() {
  const { announcements, readIds, prefs, ready, markAllRead } = useStore();
  const [open, setOpen] = useState(false);
  // Opening the bell marks everything read; the items that were new stay listed for this opening.
  const [fresh, setFresh] = useState<string[]>([]);
  const [menu, setMenu] = useState(false);
  const unreadIds = ready ? announcements.filter((a) => isRelevant(a, prefs) && !readIds.includes(a.id)).map((a) => a.id) : [];
  const unread = unreadIds.length;
  const openBell = () => { setFresh(unreadIds); setOpen(true); if (unread) markAllRead(); };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-2 px-4 sm:gap-4 md:px-6">
        <a href="#home" className="flex items-center gap-2.5" aria-label="SMART ORKHON нүүр">
          <Logo />
          <span className="whitespace-nowrap leading-tight">
            <span className="block font-display text-[15px] font-bold tracking-[0.02em]">SMART ORKHON</span>
            <span className="block text-[12.5px] text-muted">Ухаалаг Орхон</span>
          </span>
        </a>
        {/* 8 Mongolian labels need ~1200px on one line; below that the menu button is used so labels never wrap. */}
        <nav className="ml-auto hidden items-center gap-0.5 xl:flex" aria-label="Үндсэн цэс">
          {NAV.map(([h, l]) => (
            <a key={h} href={h} className="whitespace-nowrap rounded-md px-2.5 py-2 text-[14.5px] font-medium text-muted transition-colors hover:text-snow">{l}</a>
          ))}
        </nav>
        <button type="button" onClick={openBell} className="relative ml-auto grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-white transition-colors hover:border-cyan/50 xl:ml-2"
          aria-label={`Мэдэгдлийн төв${unread ? `, ${unread} уншаагүй` : ""}`}>
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-alert px-1 text-[11px] font-bold text-white">{unread}</span>
          )}
        </button>
        <AccountButton />
        <ThemeSwitch />
        <a href="#app" className="hidden h-10 shrink-0 items-center gap-1.5 rounded-[10px] bg-cyan px-3 text-sm font-semibold text-white transition-colors hover:bg-[#184c9c] xl:inline-flex"><Smartphone className="h-4 w-4" />Апп</a>
        {/* Phones use the bottom bar's «Цэс»; this button is for tablets and small laptops. */}
        <button type="button" className="hidden h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-snow/5 md:grid xl:hidden" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-label="Цэс">
          {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {menu && (
        <nav className="border-t border-line px-4 pb-4 pt-2 xl:hidden" aria-label="Гар утасны цэс">
          {[...NAV, ...MORE].map(([h, l]) => <a key={h} href={h} onClick={() => setMenu(false)} className="block rounded-lg px-3 py-2.5 text-[15px] text-snow hover:bg-snow/5">{l}</a>)}
        </nav>
      )}
      <NotificationCenter open={open} fresh={fresh} onClose={() => setOpen(false)} />
    </header>
  );
}
