"use client";

import {
  Bell, ChartColumn, ChevronDown, CircleHelp, House, Landmark, LayoutGrid, MapPin,
  Megaphone, Menu, Mountain, Smartphone, Siren, Trees, X,
} from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { ANN_CAT } from "@/lib/labels";
import { useStore, isRelevant } from "@/lib/store";
import type { AnnouncementCategory } from "@/lib/types";
import { NotificationCenter } from "./NotificationCenter";
import { AccountButton } from "./Account";
import { ThemeSwitch } from "./ThemeSwitch";
import { cn } from "./ui";
import "./site-chrome.css";

const HOME = { href: "#home", label: "Нүүр", Icon: House };
const NEWS = { href: "#notices", label: "Мэдээ", Icon: Megaphone };
const LINKS = [
  { href: "#alerts", label: "Шуурхай мэдээлэл", Icon: Siren },
  { href: "#map", label: "Газрын зураг", Icon: MapPin },
  { href: "#services", label: "Үйлчилгээ", Icon: Landmark },
  { href: "#city-overview", label: "Эрдэнэт хот", Icon: Mountain },
  { href: "#visit", label: "Үзэх газрууд", Icon: Trees },
  { href: "#report", label: "Асуудал мэдээлэх", Icon: Megaphone },
  { href: "#solved", label: "Үр дүн, санаа", Icon: ChartColumn },
  { href: "#app", label: "Апп суулгах", Icon: Smartphone },
  { href: "#about", label: "Бидний тухай", Icon: CircleHelp },
] as const;
const CATEGORIES: AnnouncementCategory[] = [
  "transport", "traffic", "road", "water", "electricity", "waste", "environment", "service", "emergency",
];

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

function currentHash() {
  const hash = window.location.hash;
  return hash.startsWith("#ann-") ? "#notices" : hash || "#home";
}

function selectNewsCategory(category: AnnouncementCategory | "all") {
  window.dispatchEvent(new CustomEvent("smart-orkhon-news-category", { detail: category }));
}

// The contours reference the Erdenet mine, and the line represents the Orkhon.
export function Logo() {
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" aria-hidden="true">
      <rect x="1" y="1" width="38" height="38" rx="10" fill="#024950" />
      <g fill="none" stroke="#AFDDE5" strokeLinecap="round">
        <ellipse cx="20" cy="18" rx="13" ry="9" strokeWidth="1.6" opacity=".55" />
        <ellipse cx="20" cy="18" rx="9" ry="6" strokeWidth="1.8" opacity=".8" />
        <ellipse cx="20" cy="18" rx="5" ry="3.2" strokeWidth="1.8" />
      </g>
      <path d="M6 31 C 13 26, 18 35, 27 30 S 33 29, 35 29" fill="none" stroke="#0FA4AF" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

function Brand({ className }: { className?: string }) {
  return (
    <a href="#home" className={cn("flex shrink-0 items-center gap-2.5", className)} aria-label="SMART ORKHON нүүр">
      <Logo />
      <span className="font-display font-extrabold leading-[.95] tracking-[-.045em]">
        <span className="block">SMART</span>
        <span className="block">ORKHON</span>
      </span>
    </a>
  );
}

export function DesktopNavigation() {
  const active = useSyncExternalStore(subscribeToHash, currentHash, () => "#home");
  const first = [HOME, NEWS];

  return (
    <aside className="orkhon-chrome orkhon-rail hidden min-[960px]:sticky min-[960px]:top-0 min-[960px]:block min-[960px]:h-dvh min-[960px]:self-start">
      <Brand className="px-4 pb-6 pt-6 text-[23px]" />
      <nav aria-label="Үндсэн цэс" className="px-2.5 pb-5">
        {first.map(({ href, label, Icon }) => (
          <a key={href} href={href} onClick={href === "#notices" ? () => selectNewsCategory("all") : undefined}
            className="orkhon-nav-link mb-1" aria-current={active === href ? "location" : undefined}>
            <Icon className="h-[19px] w-[19px]" aria-hidden="true" />
            {label}
          </a>
        ))}
        <details className="orkhon-category-links mb-2" open>
          <summary className="orkhon-nav-link cursor-pointer">
            <LayoutGrid className="h-[19px] w-[19px]" aria-hidden="true" />
            Ангилал
            <ChevronDown className="ml-auto h-4 w-4 shrink-0 transition-transform" aria-hidden="true" />
          </summary>
          <ul className="mt-1 space-y-0.5 pl-6">
            {CATEGORIES.map((category) => (
              <li key={category}>
                <a href="#notices" onClick={() => selectNewsCategory(category)}
                  className="orkhon-category-link">
                  {ANN_CAT[category].label}
                </a>
              </li>
            ))}
          </ul>
        </details>
        <div className="space-y-1 border-t border-line pt-2">
          {LINKS.map(({ href, label, Icon }) => (
            <a key={href} href={href} className="orkhon-nav-link" aria-current={active === href ? "location" : undefined}>
              <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              {label}
            </a>
          ))}
        </div>
      </nav>
    </aside>
  );
}

export function Header() {
  const { announcements, readIds, prefs, ready, markAllRead } = useStore();
  const [open, setOpen] = useState(false);
  const [fresh, setFresh] = useState<string[]>([]);
  const [menu, setMenu] = useState(false);
  const unreadIds = ready ? announcements.filter((a) => isRelevant(a, prefs) && !readIds.includes(a.id)).map((a) => a.id) : [];
  const unread = unreadIds.length;

  function openBell() {
    setMenu(false);
    setFresh(unreadIds);
    setOpen(true);
    if (unread) markAllRead();
  }

  useEffect(() => {
    if (!menu) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenu(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  return (
    <header className="orkhon-chrome orkhon-topbar sticky top-0 z-40">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 max-[479px]:grid max-[479px]:grid-cols-[2.5rem_1fr_2.5rem] sm:gap-3 sm:px-5 min-[960px]:h-[72px] min-[960px]:gap-4 min-[960px]:px-6">
        <button type="button" className="orkhon-toolbar-button grid min-[960px]:hidden" aria-expanded={menu}
          aria-controls="orkhon-compact-nav" aria-label={menu ? "Цэс хаах" : "Цэс нээх"} onClick={() => setMenu(!menu)}>
          {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Brand className="mr-auto text-[16px] max-[479px]:mx-auto min-[960px]:hidden" />
        <div id="news-search-desktop" className="ml-auto hidden w-full max-w-[24rem] min-[960px]:block" />
        <button type="button" onClick={openBell} className="orkhon-toolbar-button relative grid"
          aria-label={`Мэдэгдлийн төв${unread ? `, ${unread} уншаагүй` : ""}`}>
          <Bell className="h-5 w-5" />
          {unread > 0 && <span className="orkhon-notification-dot" aria-hidden="true" />}
        </button>
        <div className="hidden items-center gap-2.5 min-[480px]:flex">
          <AccountButton />
          <ThemeSwitch />
        </div>
      </div>
      {menu && (
        <nav id="orkhon-compact-nav" aria-label="Үндсэн цэс" className="orkhon-compact-menu max-h-[70dvh] overflow-y-auto p-3 min-[960px]:hidden">
          <div className="mb-2 flex gap-3 border-b border-line px-2 pb-3 min-[480px]:hidden">
            <AccountButton />
            <ThemeSwitch />
          </div>
          {[HOME, NEWS, ...LINKS].map(({ href, label, Icon }) => (
            <a key={href} className="orkhon-nav-link" href={href} onClick={() => {
              if (href === "#notices") selectNewsCategory("all");
              setMenu(false);
            }}>
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              {label}
            </a>
          ))}
        </nav>
      )}
      <NotificationCenter open={open} fresh={fresh} onClose={() => setOpen(false)} />
    </header>
  );
}
