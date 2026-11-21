"use client";

import { MapPin } from "lucide-react";
import { LOCATIONS } from "@/lib/data/places";
import { useStore } from "@/lib/store";
import { inputCls } from "./ui";

export function LocationPicker({ compact = false }: { compact?: boolean }) {
  const { prefs, setPrefs } = useStore();
  const sum = LOCATIONS.sums.find((s) => s.name === prefs.sum) || LOCATIONS.sums[0];
  return (
    <div className={compact ? "grid gap-2 sm:grid-cols-4" : "grid gap-3 sm:grid-cols-2"}>
      <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
        Аймаг
        <span className={`${inputCls} flex items-center gap-2 text-snow`}><MapPin className="h-3.5 w-3.5 text-cyan" />{LOCATIONS.province}</span>
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
        Сум
        <select className={inputCls} value={prefs.sum} onChange={(e) => setPrefs({ ...prefs, sum: e.target.value, bag: "", area: "" })}>
          {LOCATIONS.sums.map((s) => <option key={s.name}>{s.name}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
        Баг
        <select className={inputCls} value="" disabled aria-label="Багийн мэдээлэл холбогдоогүй">
          <option value="">Мэдээлэлгүй</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
        Хороолол
        <select className={inputCls} value={prefs.area} onChange={(e) => setPrefs({ ...prefs, bag: "", area: e.target.value })}>
          <option value="">Бүх хороолол</option>
          {sum.areas.map((a) => <option key={a}>{a}</option>)}
        </select>
      </label>
    </div>
  );
}
