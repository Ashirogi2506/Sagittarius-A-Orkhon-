"use client";

import { ChevronDown, ChevronRight, Clock, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { CITY_FACTS, SIGHTS, SIGHT_CAT, osmLink, type Sight, type SightCat } from "@/lib/data/visitor";
import { useStore } from "@/lib/store";
import { SectionHead, cn } from "./ui";
import { useShowMore } from "./ShowMore";

export function VisitorSection() {
  const { askAI } = useStore();
  const [cat, setCat] = useState<SightCat | "all">("all");
  const list = SIGHTS.filter((s) => cat === "all" || s.cat === cat);
  const more = useShowMore(list, cat === "all" ? 6 : list.length, "Бусад үзэх газар");

  return (
    <section id="visit" className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14" aria-labelledby="visit-title">
      <SectionHead id="visit-title" title="Эрдэнэттэй танилцах"
        right={<button type="button" onClick={() => askAI("Эрдэнэтэд нэг өдөр байхад юу үзэх вэ?")} className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-cyan">AI-аас зөвлөгөө авах<ChevronRight className="h-4 w-4" /></button>} />

      <dl className="mb-5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {CITY_FACTS.slice(0, 4).map((f) => (
          <div key={f.label} className="flex gap-1"><dt className="text-muted">{f.label}:</dt><dd className="font-semibold">{f.value}</dd></div>
        ))}
      </dl>

      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Үзэх газрын төрөл">
        {(["all", ...Object.keys(SIGHT_CAT)] as (SightCat | "all")[]).map((k) => (
          <button key={k} type="button" aria-pressed={cat === k} onClick={() => setCat(k)}
            className={cn("rounded-md border px-3 py-1.5 text-[13px] transition", cat === k ? "border-cyan bg-cyan/15 text-snow" : "border-line text-muted hover:text-snow")}>
            {k === "all" ? "Бүгд" : `${SIGHT_CAT[k].icon} ${SIGHT_CAT[k].label}`}
          </button>
        ))}
      </div>

      {more.anchor}
      <ul className="grid gap-x-6 gap-y-5 sm:grid-cols-2 sm:gap-y-6 xl:grid-cols-3">
        {more.visible.map((s) => <SightCard key={s.id} s={s} />)}
      </ul>
      {more.button}

    </section>
  );
}

function SightCard({ s }: { s: Sight }) {
  const [open, setOpen] = useState(false);
  const hasMore = !!(s.tip || s.hours || s.phone);
  return (
    <li className="flex gap-3 sm:flex-col sm:gap-0">
      <span className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-md bg-gradient-to-br from-cyan/15 to-emerald/10 text-3xl sm:aspect-[2/1] sm:h-auto sm:w-full sm:text-5xl" aria-hidden="true">{SIGHT_CAT[s.cat].icon}</span>
      <div className="flex min-w-0 flex-1 flex-col">
      <p className="text-[12px] font-bold uppercase tracking-wider text-cyan sm:mt-2.5">{SIGHT_CAT[s.cat].label}</p>
      <h3 className="mt-0.5 font-display text-[17px] font-bold leading-snug">{s.name}</h3>
      <p className={cn("mt-1 text-sm text-muted", !open && "line-clamp-2")}>{s.what}</p>
      {open && (
        <div className="mt-3 grid gap-1.5 text-sm">
          {s.tip && <p className="rounded-lg bg-cyan/[.07] px-3 py-2 text-snow/90">💡 {s.tip}</p>}
          {s.hours && <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-cyan" />{s.hours}</p>}
          {s.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-cyan" /><a href={"tel:" + s.phone.replace(/\D/g, "")} className="hover:text-cyan">{s.phone}</a></p>}
        </div>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-xs">
        {(hasMore || s.what.length > 90) && (
          <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="inline-flex items-center gap-1 font-semibold text-cyan">
            {open ? "Хураах" : "Дэлгэрэнгүй"}<ChevronDown className={cn("h-3.5 w-3.5 transition", open && "rotate-180")} />
          </button>
        )}
        {s.lat != null && s.lng != null && (
          <a href={osmLink(s.lat, s.lng)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-muted hover:text-cyan"><MapPin className="h-3 w-3" />Газрын зураг</a>
        )}
      </div>
      </div>
    </li>
  );
}
