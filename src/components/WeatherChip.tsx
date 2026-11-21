"use client";

import { ChevronDown, Wind } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { weatherLabel, type Weather } from "@/lib/civic";
import { cn } from "./ui";

const DAY = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];
const dayName = (date: string, i: number) => (i === 0 ? "Өнөөдөр" : i === 1 ? "Маргааш" : DAY[new Date(date + "T12:00:00+08:00").getDay()]);

/** Small weather pill: one glance for now, a tap for the next 3 days. Refreshes every 15 minutes. */
export function WeatherChip() {
  const [w, setW] = useState<Weather | null>(null);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    const load = () => fetch("/api/weather").then((r) => r.json()).then((d: Weather) => { if (alive) setW(d); }).catch(() => { /* keep last */ });
    load();
    const id = window.setInterval(load, 15 * 60_000);
    return () => { alive = false; window.clearInterval(id); };
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close); document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);

  if (!w) return <span className="inline-block h-7 w-28 animate-pulse rounded-md bg-snow/5" aria-hidden />;
  if (!w.ok || !w.now) return null;
  const n = w.now;
  const l = weatherLabel(n.code, n.isDay);

  return (
    <div ref={box} className="relative inline-block">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        aria-label={`Эрдэнэтийн цаг агаар: ${n.temp} хэм, ${l.text}. Дэлгэрэнгүй харах`}
        className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-1 text-[13px] font-semibold text-snow transition hover:border-cyan/50">
        <span aria-hidden>{l.icon}</span>
        <span className="tabular-nums">{n.temp > 0 ? "+" : ""}{n.temp}°</span>
        <span className="hidden font-normal text-muted sm:inline">{l.text}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted transition", open && "rotate-180")} />
      </button>
      {open && (
        <div className="glass absolute left-0 top-full z-30 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-lg p-4 text-sm" role="dialog" aria-label="Цаг агаарын дэлгэрэнгүй">
          <p className="font-semibold">Эрдэнэт · одоо</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-3xl" aria-hidden>{l.icon}</span>
            <div>
              <p className="font-display text-2xl font-bold tabular-nums">{n.temp > 0 ? "+" : ""}{n.temp}°C</p>
              <p className="text-muted">Мэдрэгдэх {n.feels > 0 ? "+" : ""}{n.feels}° · {l.text}</p>
            </div>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-muted"><Wind className="h-4 w-4" />Салхи {n.wind} м/с</p>
          <ul className="mt-3 grid grid-cols-3 gap-2">
            {(w.days ?? []).map((d, i) => {
              const dl = weatherLabel(d.code);
              return (
                <li key={d.date} className="rounded-xl border border-line p-2 text-center">
                  <p className="text-xs text-muted">{dayName(d.date, i)}</p>
                  <p className="text-xl" aria-hidden>{dl.icon}</p>
                  <p className="tabular-nums text-[13px] font-semibold">{d.min}° / {d.max}°</p>
                  <p className="sr-only">{dl.text}</p>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-muted">Open-Meteo загварын урьдчилсан мэдээ, 15 минут тутам шинэчилнэ. Албан ёсны анхааруулгыг Цаг уур, орчны шинжилгээний газраас (УЦУОШГ) лавлана уу.</p>
        </div>
      )}
    </div>
  );
}
