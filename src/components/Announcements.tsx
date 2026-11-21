"use client";

import {
  ArrowLeft, Bot, Bus, Car, ChevronDown, ChevronRight, Clock, Construction, Droplets, ExternalLink,
  Landmark, Leaf, MapPin, Trash2, TriangleAlert, Zap, type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useStore, rankForUser } from "@/lib/store";
import { ANN_CAT, VERIFY, fmtUB, relTime } from "@/lib/labels";
import type { Announcement, AnnouncementCategory } from "@/lib/types";
import { LocationPicker } from "./LocationPicker";
import { Badge, Button, Card, Empty, cn } from "./ui";

type Status = "live" | "ongoing" | "soon" | "ended" | null;

/** Status comes only from start/end (or a live feed); nothing is guessed. */
function statusOf(a: Announcement, now: number | null): Status {
  if (a.verification === "live") return "live";
  if (now === null || !a.start) return null;
  const s = Date.parse(a.start), e = a.end ? Date.parse(a.end) : NaN;
  if (now < s) return "soon";
  if (!Number.isNaN(e) && now > e) return "ended";
  return "ongoing";
}

const STATUS_UI: Record<Exclude<Status, null>, { label: string; cls: string }> = {
  live: { label: "Шууд", cls: "border-alert/40 bg-alert/10 text-alert" },
  ongoing: { label: "Үргэлжилж байна", cls: "border-emerald/40 bg-emerald/10 text-emerald" },
  soon: { label: "Удахгүй", cls: "border-warn/40 bg-warn/10 text-warn" },
  ended: { label: "Дууссан", cls: "border-line bg-snow/5 text-muted" },
};

const CAT_ICON: Record<AnnouncementCategory, LucideIcon> = {
  water: Droplets, electricity: Zap, road: Construction, traffic: Car, transport: Bus,
  waste: Trash2, environment: Leaf, service: Landmark, emergency: TriangleAlert,
};

const CAT_WEIGHT: Partial<Record<AnnouncementCategory, number>> = { emergency: 5, water: 4, electricity: 4, traffic: 3, road: 3 };
const STATUS_WEIGHT: Record<string, number> = { live: 30, ongoing: 30, soon: 20, null: 10, ended: 0 };

const place = (a: Announcement) => a.location.area || a.location.bag || a.location.sum;
const isDemo = (a: Announcement) => a.verification === "demo" || a.verification === "unverified";
// Live camera items carry car counts and clock times in their text; the title already says enough.
const isLive = (a: Announcement) => a.verification === "live";
const aiAsk = (a: Announcement) => `"${a.title}" гэсэн мэдэгдлийг энгийнээр тайлбарлаж өгөөч.`;

/** The clock is read only after mount so the server render and the first client render match. */
function useNow() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function When({ a, now }: { a: Announcement; now: number | null }) {
  return <time dateTime={a.publishedAt} title={fmtUB(a.publishedAt)}>{now === null ? fmtUB(a.publishedAt) : relTime(a.publishedAt, now)}</time>;
}

function Byline({ a, now }: { a: Announcement; now: number | null }) {
  const st = statusOf(a, now);
  return (
    <p className="text-[13px] text-muted">
      <span className="font-semibold text-snow/90">{a.organization}</span> · <When a={a} now={now} />
      {st === "live" && <span className="font-semibold text-alert"> · Шууд</span>}
      {isDemo(a) && <span className="text-warn"> · Жишээ</span>}
    </p>
  );
}

/** A small category mark keeps headlines easy to scan without a large image. */
function Watermark({ a, className }: { a: Announcement; className?: string }) {
  const { color } = ANN_CAT[a.category];
  const Icon = CAT_ICON[a.category];
  return (
    <Icon aria-hidden="true" className={cn("pointer-events-none absolute right-3 top-3 h-5 w-5 opacity-30", className)}
      style={{ color }} strokeWidth={1.7} />
  );
}

function Details({ a }: { a: Announcement }) {
  const where = [a.location.sum + " сум", a.location.bag, a.location.area].filter(Boolean).join(", ");
  const timed = a.category !== "traffic" && (a.start || a.end);
  return (
    <div className="grid gap-2 text-[15px] leading-relaxed">
      {!isLive(a) && a.description && a.description !== a.summary && <p className="text-snow/90">{a.description}</p>}
      <p className="flex items-start gap-2 text-sm text-muted"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />{where}{a.locationNote && <span className="text-warn"> · {a.locationNote}</span>}</p>
      {timed && <p className="flex items-start gap-2 text-sm text-muted"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />{a.start ? fmtUB(a.start) : "Тодорхойгүй"} – {a.end ? fmtUB(a.end) : "Тодорхойгүй"}</p>}
      {a.sourceUrl && (
        <p className="border-t border-line pt-2 text-[13px] text-muted">
          Эх сурвалж:{" "}
          <a href={a.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-cyan hover:underline">
            {a.sourceName || "холбоос"}<ExternalLink className="h-3 w-3" />
          </a>
        </p>
      )}
    </div>
  );
}

function AiButton({ a }: { a: Announcement }) {
  const { askAI } = useStore();
  return (
    <button type="button" onClick={() => askAI(aiAsk(a))}
      className="inline-flex min-h-9 items-center gap-1.5 self-start rounded-lg px-2 text-xs font-semibold text-muted hover:bg-snow/5 hover:text-snow">
      <Bot className="h-3.5 w-3.5" />AI тайлбар
    </button>
  );
}

function Tags({ a, st, mine }: { a: Announcement; st: Status; mine: boolean }) {
  return (
    <>
      {st && <Badge className={STATUS_UI[st].cls}>{st === "live" && <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-alert" />}{STATUS_UI[st].label}</Badge>}
      {isDemo(a) && <Badge className={VERIFY[a.verification].cls}>{VERIFY[a.verification].label}</Badge>}
      {mine && <Badge className="border-cyan/40 bg-cyan/10 text-cyan">Таны бүс</Badge>}
    </>
  );
}

/** Opening any item counts as reading it. */
function useOpen(a: Announcement) {
  const [open, setOpen] = useState(false);
  const { markRead } = useStore();
  return [open, () => { setOpen((o) => !o); markRead(a.id); }] as const;
}

/** The one notice that matters most right now, shown like a lead story. */
function Lead({ a, now, mine }: { a: Announcement; now: number | null; mine: boolean }) {
  const [open, toggle] = useOpen(a);
  const cat = ANN_CAT[a.category];
  return (
    <article id={`ann-${a.id}`} className="relative scroll-mt-24 rounded-lg border border-line bg-navy-2 p-4 md:p-5">
      <Watermark a={a} />
      <button type="button" onClick={toggle} aria-expanded={open} className="block w-full pr-7 text-left">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-[13px] font-bold uppercase tracking-wider" style={{ color: cat.color }}>{cat.label}</span>
          <Tags a={a} st={statusOf(a, now)} mine={mine} />
        </span>
        <span className="mt-1.5 block font-display text-[22px] font-bold leading-tight md:text-[28px]">{a.title}</span>
        {!isLive(a) && <span className="mt-2 block text-[15px] leading-relaxed text-snow/85 md:text-base">{a.summary}</span>}
      </button>
      <div className="mt-2.5"><Byline a={a} now={now} /></div>
      {open && <div className="mt-4 border-t border-line pt-4"><Details a={a} /></div>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="ghost" onClick={toggle} aria-expanded={open}>
          <ChevronDown className={cn("h-3.5 w-3.5 transition", open && "rotate-180")} />{open ? "Хураах" : "Дэлгэрэнгүй"}
        </Button>
        <AiButton a={a} />
      </div>
    </article>
  );
}

/** Thumbnail + headline beside the lead story. */
function Side({ a, now }: { a: Announcement; now: number | null }) {
  const [open, toggle] = useOpen(a);
  return (
    <li id={`ann-${a.id}`} className="relative scroll-mt-24 py-3">
      <Watermark a={a} />
      <button type="button" onClick={toggle} aria-expanded={open} className="flex w-full items-start gap-3 pr-8 text-left">
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] font-bold uppercase tracking-wider" style={{ color: ANN_CAT[a.category].color }}>{ANN_CAT[a.category].label}</span>
          <span className="mt-0.5 line-clamp-3 text-[15px] font-semibold leading-snug md:text-base">{a.title}</span>
          <span className="mt-1 block"><Byline a={a} now={now} /></span>
        </span>
      </button>
      {open && (
        <div className="mt-3 grid gap-2">
          {!isLive(a) && <p className="text-[15px] leading-relaxed">{a.summary}</p>}
          <Details a={a} /><AiButton a={a} />
        </div>
      )}
    </li>
  );
}

/** Text-only story in the row under the lead. */
function Column({ a, now }: { a: Announcement; now: number | null }) {
  const [open, toggle] = useOpen(a);
  return (
    <li id={`ann-${a.id}`} className="relative scroll-mt-24 py-3 md:py-0">
      <Watermark a={a} className="top-3 md:top-0" />
      <button type="button" onClick={toggle} aria-expanded={open} className="block w-full pr-8 text-left">
        <span className="block text-[12px] font-bold uppercase tracking-wider" style={{ color: ANN_CAT[a.category].color }}>{ANN_CAT[a.category].label}</span>
        <span className="mt-0.5 block font-display text-[17px] font-bold leading-snug md:text-lg">{a.title}</span>
        {!isLive(a) && <span className={cn("mt-1 block text-sm leading-relaxed text-muted", !open && "line-clamp-2")}>{a.summary}</span>}
      </button>
      <div className="mt-1.5"><Byline a={a} now={now} /></div>
      {open && <div className="mt-3 grid gap-2"><Details a={a} /><AiButton a={a} /></div>}
    </li>
  );
}

/** A compact headline row for the full list. */
function Row({ a, now, mine }: { a: Announcement; now: number | null; mine: boolean }) {
  const [open, toggle] = useOpen(a);
  const { readIds } = useStore();
  const cat = ANN_CAT[a.category];
  const st = statusOf(a, now);
  return (
    <li id={`ann-${a.id}`} className="relative scroll-mt-24">
      <Watermark a={a} className="right-8" />
      <button type="button" onClick={toggle} aria-expanded={open} className="flex min-h-11 w-full items-start gap-3 py-3 text-left">
        <span className="mt-[7px] h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: cat.color }} aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className={cn("block text-[15px] leading-snug", readIds.includes(a.id) ? "font-medium text-snow/85" : "font-semibold")}>{a.title}</span>
          <span className="mt-0.5 block text-[13px] text-muted">
            {cat.label} · {place(a)} · <When a={a} now={now} />
            {st === "live" && <span className="font-semibold text-alert"> · Шууд</span>}
            {isDemo(a) && <span className="text-warn"> · Жишээ</span>}
          </span>
        </span>
        <ChevronDown className={cn("mt-1 h-4 w-4 shrink-0 text-muted transition", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open && (
        <div className="grid gap-3 pb-4 pl-[22px]">
          <div className="flex flex-wrap gap-1.5"><Tags a={a} st={st} mine={mine} /></div>
          {!isLive(a) && <p className="text-[15px] leading-relaxed">{a.summary}</p>}
          <Byline a={a} now={now} />
          <Details a={a} /><AiButton a={a} />
        </div>
      )}
    </li>
  );
}

const FILTERS: ("all" | AnnouncementCategory)[] = ["all", "traffic", "water", "electricity", "road", "transport", "waste", "environment", "service", "emergency"];

export function Announcements() {
  const { announcements, prefs, ready, loadError } = useStore();
  const [cat, setCat] = useState<(typeof FILTERS)[number]>("all");
  const [onlyMine, setOnlyMine] = useState(false);
  const [full, setFull] = useState(false);
  const now = useNow();
  const ranked = useMemo(() => rankForUser(announcements, prefs), [announcements, prefs]);
  const mine = (a: Announcement) => !!prefs.area && a.location.area === prefs.area;
  const list = ranked.filter((a) => (cat === "all" || a.category === cat) && (!onlyMine || mine(a)));
  // Real before sample, happening now or soon, then the reader's area, then the most serious category.
  const weight = (a: Announcement) => (isDemo(a) ? 0 : 40) + STATUS_WEIGHT[String(statusOf(a, now))] + (mine(a) ? 6 : 0) + (CAT_WEIGHT[a.category] ?? 1);
  const byWeight = [...list].sort((a, b) => weight(b) - weight(a)); // stable, so ties keep the personal ranking

  // Front page: the best notice of each category, so one busy topic cannot fill the page.
  const front = cat === "all" && !full;
  const picks: Announcement[] = [];
  for (const a of byWeight) if (!picks.some((p) => p.category === a.category)) picks.push(a);
  const [lead, ...others] = front ? picks : byWeight;
  const side = front ? others.slice(0, 3) : [];
  const cols = front ? others.slice(3, 6) : [];
  const hiddenCount = list.length - 1 - side.length - cols.length;

  // A bell link to a notice that is not on the front page opens the full list first.
  useEffect(() => {
    const go = () => {
      const h = location.hash;
      if (!h.startsWith("#ann-") || document.getElementById(h.slice(1))) return;
      setCat("all"); setOnlyMine(false); setFull(true);
      setTimeout(() => document.getElementById(h.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    };
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, []);

  const showAll = () => { setFull(true); setTimeout(() => document.getElementById("notices")?.scrollIntoView({ behavior: "smooth" }), 30); };

  return (
    <section id="notices" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-10 md:px-6 md:py-14" aria-labelledby="notices-title">
      <h2 id="notices-title" className="sr-only">Мэдэгдэл</h2>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Ангиллаар шүүх">
        {FILTERS.map((f) => (
          <button key={f} type="button" aria-pressed={cat === f} onClick={() => { setCat(f); if (f === "all") setFull(false); }}
            className={cn("shrink-0 rounded-md border px-3.5 py-1.5 text-sm font-semibold transition",
              cat === f ? "border-cyan bg-cyan/15 text-cyan" : "border-line text-muted hover:border-cyan/40 hover:text-snow")}>
            {f === "all" ? "Бүгд" : ANN_CAT[f].label}
          </button>
        ))}
      </div>

      {loadError ? <Empty title="Алдаа гарлаа" text={loadError} /> : !ready || !announcements.length ? (
        <div className="grid gap-4 lg:grid-cols-2"><div className="glass h-32 animate-pulse rounded-lg" /><div className="glass h-32 animate-pulse rounded-lg" /></div>
      ) : !lead ? (
        <Empty title="Энэ шүүлтүүрт мэдэгдэл алга" text="Өөр ангилал эсвэл байршил сонгоно уу." />
      ) : front ? (
        <>
          <div className="grid items-start gap-6 lg:grid-cols-[1.45fr_1fr]">
            <Lead key={lead.id} a={lead} now={now} mine={mine(lead)} />
            {side.length > 0 && <ul className="divide-y divide-line">{side.map((a) => <Side key={a.id} a={a} now={now} />)}</ul>}
          </div>
          {cols.length > 0 && (
            <ul className="mt-6 grid divide-y divide-line border-t border-line pt-3 md:grid-cols-3 md:gap-6 md:divide-y-0 md:pt-6">
              {cols.map((a) => <Column key={a.id} a={a} now={now} />)}
            </ul>
          )}
          {hiddenCount > 0 && (
            <div className="mt-6 flex justify-center">
              <button type="button" onClick={showAll}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-line bg-white px-4 text-sm font-semibold text-snow transition hover:border-cyan/50 hover:text-cyan">
                Бүх мэдэгдлийг харах (+{hiddenCount})<ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[1.45fr_1fr]">
          <Lead key={lead.id} a={lead} now={now} mine={mine(lead)} />
          <div>
            <div className="flex items-center justify-between border-b-2 border-snow pb-1.5">
              <p className="text-[13px] font-bold uppercase tracking-wider">{cat === "all" ? "Бүх мэдэгдэл" : ANN_CAT[cat].label}</p>
              {cat === "all" && (
                <button type="button" onClick={() => setFull(false)} className="inline-flex min-h-9 items-center gap-1 text-[13px] font-semibold text-cyan">
                  <ArrowLeft className="h-3.5 w-3.5" />Нүүр
                </button>
              )}
            </div>
            {others.length ? <ul className="divide-y divide-line">{others.map((a) => <Row key={a.id} a={a} now={now} mine={mine(a)} />)}</ul>
              : <p className="py-3 text-sm text-muted">Өөр мэдэгдэл алга.</p>}
          </div>
        </div>
      )}

      <Card className="mt-8 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">Миний байршил</p>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted"><input type="checkbox" className="h-4 w-4 accent-[#1f5fbf]" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />Зөвхөн миний бүс</label>
        </div>
        <LocationPicker compact />
      </Card>
    </section>
  );
}
