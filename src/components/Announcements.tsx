"use client";

import {
  ArrowLeft, ArrowRight, Bot, Bus, Car, ChevronDown, ChevronLeft, ChevronRight, Clock, Construction, Droplets, ExternalLink, Search,
  Landmark, Leaf, MapPin, Trash2, TriangleAlert, Zap, type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useStore, rankForUser } from "@/lib/store";
import { ANN_CAT, VERIFY, fmtUB, relTime } from "@/lib/labels";
import type { Announcement, AnnouncementCategory } from "@/lib/types";
import { LocationPicker } from "./LocationPicker";
import { Badge, Button, Card, Empty, cn } from "./ui";
import Link from "next/link";

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
    <span className="block text-[13px] text-muted">
      <span className="font-semibold text-snow/90">{a.organization}</span> · <When a={a} now={now} />
      {st === "live" && <span className="font-semibold text-alert"> · Шууд</span>}
      {isDemo(a) && <span className="text-warn"> · Жишээ</span>}
    </span>
  );
}

/** A small category mark keeps headlines easy to scan without a large image. */
function Watermark({ a, className }: { a: Announcement; className?: string }) {
  const Icon = CAT_ICON[a.category];
  return (
    <Icon aria-hidden="true" className={cn("pointer-events-none absolute right-3 top-3 h-5 w-5 opacity-30", className)}
      strokeWidth={1.7} />
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

function ArticleLink({ a }: { a: Announcement }) {
  return <Link href={`/news/${encodeURIComponent(a.id)}`} className="inline-flex min-h-9 items-center gap-1 text-xs font-bold text-cyan hover:underline">Мэдээг нээх <ArrowRight className="h-3.5 w-3.5" /></Link>;
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
    <article id={`ann-${a.id}`} className="relative scroll-mt-24 rounded-2xl border border-line bg-navy-2 p-5 md:p-8">
      <Watermark a={a} />
      <button type="button" onClick={toggle} aria-expanded={open} className="block w-full pr-7 text-left">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-[13px] font-bold uppercase tracking-wider text-cyan">{cat.label}</span>
          <Tags a={a} st={statusOf(a, now)} mine={mine} />
        </span>
        <span className="mt-3 block font-display text-[25px] font-bold leading-[1.15] tracking-tight md:text-[38px]">{a.title}</span>
        {!isLive(a) && <span className="mt-2 block text-[15px] leading-relaxed text-snow/85 md:text-base">{a.summary}</span>}
      </button>
      <div className="mt-2.5"><Byline a={a} now={now} /></div>
      {open && <div className="mt-4 border-t border-line pt-4"><Details a={a} /></div>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="ghost" onClick={toggle} aria-expanded={open}>
          <ChevronDown className={cn("h-3.5 w-3.5 transition", open && "rotate-180")} />{open ? "Хураах" : "Дэлгэрэнгүй"}
        </Button>
        <AiButton a={a} />
        <ArticleLink a={a} />
      </div>
    </article>
  );
}

/** Thumbnail + headline beside the lead story. */
function Side({ a, now }: { a: Announcement; now: number | null }) {
  const [open, toggle] = useOpen(a);
  return (
    <li id={`ann-${a.id}`} className="relative scroll-mt-24 py-4">
      <Watermark a={a} />
      <button type="button" onClick={toggle} aria-expanded={open} className="flex w-full items-start gap-3 pr-8 text-left">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-[#AFDDE5]/40 text-[#024950]" aria-hidden="true">{(() => { const Icon = CAT_ICON[a.category]; return <Icon className="h-5 w-5" />; })()}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] font-bold uppercase tracking-wider text-cyan">{ANN_CAT[a.category].label}</span>
          <span className="mt-0.5 line-clamp-3 text-[15px] font-semibold leading-snug md:text-base">{a.title}</span>
          <span className="mt-1 block"><Byline a={a} now={now} /></span>
        </span>
      </button>
      {open && (
        <div className="mt-3 grid gap-2">
          {!isLive(a) && <p className="text-[15px] leading-relaxed">{a.summary}</p>}
          <Details a={a} /><AiButton a={a} /><ArticleLink a={a} />
        </div>
      )}
    </li>
  );
}

/** Text-only story in the row under the lead. */
function Column({ a, now }: { a: Announcement; now: number | null }) {
  const [open, toggle] = useOpen(a);
  return (
    <li id={`ann-${a.id}`} className="relative scroll-mt-24 rounded-xl border border-line bg-navy-2 p-5">
      <Watermark a={a} className="top-3 md:top-0" />
      <button type="button" onClick={toggle} aria-expanded={open} className="block w-full pr-8 text-left">
        <span className="block text-[12px] font-bold uppercase tracking-wider text-cyan">{ANN_CAT[a.category].label}</span>
        <span className="mt-0.5 block font-display text-[17px] font-bold leading-snug md:text-lg">{a.title}</span>
        {!isLive(a) && <span className={cn("mt-1 block text-sm leading-relaxed text-muted", !open && "line-clamp-2")}>{a.summary}</span>}
      </button>
      <div className="mt-1.5"><Byline a={a} now={now} /></div>
      {open && <div className="mt-3 grid gap-2"><Details a={a} /><AiButton a={a} /><ArticleLink a={a} /></div>}
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
        <span className="mt-[7px] h-2.5 w-2.5 shrink-0 rounded-full bg-cyan" aria-hidden="true" />
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
          <Details a={a} /><AiButton a={a} /><ArticleLink a={a} />
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
  const [query, setQuery] = useState("");
  const [featureIndex, setFeatureIndex] = useState(0);
  const now = useNow();
  const ranked = useMemo(() => rankForUser(announcements, prefs), [announcements, prefs]);
  const mine = (a: Announcement) => !!prefs.area && a.location.area === prefs.area;
  const term = query.trim().toLocaleLowerCase("mn");
  const list = ranked.filter((a) => (cat === "all" || a.category === cat) && (!onlyMine || mine(a)) && (!term || [a.title, a.summary, a.description, a.organization, place(a)].some((value) => value.toLocaleLowerCase("mn").includes(term))));
  // Real before sample, happening now or soon, then the reader's area, then the most serious category.
  const weight = (a: Announcement) => (isDemo(a) ? 0 : 40) + STATUS_WEIGHT[String(statusOf(a, now))] + (mine(a) ? 6 : 0) + (CAT_WEIGHT[a.category] ?? 1);
  const byWeight = [...list].sort((a, b) => weight(b) - weight(a)); // stable, so ties keep the personal ranking

  // Front page: the best notice of each category, so one busy topic cannot fill the page.
  const front = cat === "all" && !full && !term;
  const picks: Announcement[] = [];
  for (const a of byWeight) if (!picks.some((p) => p.category === a.category)) picks.push(a);
  const features = picks.slice(0, 3);
  const lead = front ? features[featureIndex % Math.max(features.length, 1)] : byWeight[0];
  const others = (front ? picks : byWeight).filter((a) => a.id !== lead?.id);
  const side = front ? [...others].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 3) : [];
  const cols = front ? others.filter((a) => !side.some((s) => s.id === a.id)).slice(0, 3) : [];
  const hiddenCount = list.length - 1 - side.length - cols.length;

  // A bell link to a notice that is not on the front page opens the full list first.
  useEffect(() => {
    const go = () => {
      const h = location.hash;
      if (!h.startsWith("#ann-") || document.getElementById(h.slice(1))) return;
      setCat("all"); setOnlyMine(false); setQuery(""); setFull(true);
      setTimeout(() => document.getElementById(h.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    };
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, []);

  const showAll = () => { setFull(true); setTimeout(() => document.getElementById("notices")?.scrollIntoView({ behavior: "smooth" }), 30); };

  return (
    <section id="notices" className="editorial mx-auto max-w-7xl scroll-mt-20 px-4 py-10 md:px-6 md:py-14" aria-labelledby="notices-title">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-cyan">SMART ORKHON / МЭДЭЭЛЭЛ</p><h2 id="notices-title" className="font-display text-3xl font-bold tracking-tight md:text-4xl">Хотын мэдээлэл</h2><p className="mt-2 text-sm text-muted">Таны хотод болж буй үйл явдал, чухал мэдэгдэл.</p></div>
        <label className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-line bg-navy-2 px-3 text-muted sm:w-72"><Search className="h-4 w-4 shrink-0" /><span className="sr-only">Мэдээлэл хайх</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Мэдээлэл хайх..." className="w-full bg-transparent text-sm text-snow outline-none placeholder:text-muted" /></label>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Ангиллаар шүүх">
        {FILTERS.map((f) => (
          <button key={f} type="button" aria-pressed={cat === f} onClick={() => { setCat(f); if (f === "all") setFull(false); }}
            className={cn("shrink-0 rounded-md border px-3.5 py-1.5 text-sm font-semibold transition",
              cat === f ? "border-[#0FA4AF] bg-[#AFDDE5]/40 text-snow" : "border-line text-muted hover:border-[#0FA4AF] hover:text-snow")}>
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
          <div className="relative flex min-h-[360px] items-end overflow-hidden rounded-2xl bg-[#024950] bg-cover bg-center md:min-h-[400px] md:items-stretch" style={{ backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Erdenet_town_aerial_view.jpg/1280px-Erdenet_town_aerial_view.jpg')" }}>
            <div className="w-full bg-[#003135]/95 p-5 text-white md:flex md:w-[62%] md:flex-col md:justify-center md:p-9">
              <span className="inline-flex self-start rounded-md bg-[#964734] px-3 py-1 text-xs font-bold text-white">ОНЦЛОХ МЭДЭЭЛЭЛ</span>
              <h3 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-white md:text-4xl">{lead.title}</h3>
              {!isLive(lead) && <p className="mt-3 line-clamp-3 max-w-xl text-sm text-white/90 md:text-base">{lead.summary}</p>}
              <p className="mt-4 text-xs text-white/80">{lead.organization} · <When a={lead} now={now} />{isDemo(lead) && " · Жишээ"}</p>
              <Link href={`/news/${encodeURIComponent(lead.id)}`} className="mt-4 inline-flex min-h-10 items-center gap-2 self-start rounded-lg bg-[#0FA4AF] px-4 text-sm font-bold text-[#003135]">Дэлгэрэнгүй <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted"><a href="https://commons.wikimedia.org/wiki/File:Erdenet_town_aerial_view.jpg" target="_blank" rel="noopener noreferrer" className="underline">Эрдэнэт хотын ерөнхий зураг · Erdii123</a> / <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer" className="underline">CC BY-SA 4.0</a> · Зургийг тайрч харуулав</p>
            {features.length > 1 && <div className="flex items-center gap-2"><span className="text-xs font-semibold text-muted">{featureIndex % features.length + 1} / {features.length}</span><button type="button" aria-label="Өмнөх мэдээлэл" onClick={() => setFeatureIndex((i) => (i + features.length - 1) % features.length)} className="grid h-9 w-9 place-items-center rounded-full border border-line hover:border-cyan"><ChevronLeft className="h-4 w-4" /></button><button type="button" aria-label="Дараагийн мэдээлэл" onClick={() => setFeatureIndex((i) => (i + 1) % features.length)} className="grid h-9 w-9 place-items-center rounded-full border border-line hover:border-cyan"><ChevronRight className="h-4 w-4" /></button></div>}
          </div>
          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.55fr_1fr]">
            <div><h3 className="mb-4 border-b-2 border-snow pb-3 text-lg font-bold">Онцлох мэдээ</h3><Lead key={lead.id} a={lead} now={now} mine={mine(lead)} /></div>
            {side.length > 0 && <div><h3 className="border-b-2 border-snow pb-3 text-lg font-bold">Сүүлийн мэдээлэл</h3><ul className="divide-y divide-line">{side.map((a) => <Side key={a.id} a={a} now={now} />)}</ul></div>}
          </div>
          {cols.length > 0 && (
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted"><input type="checkbox" className="h-4 w-4 accent-[#0FA4AF]" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />Зөвхөн миний бүс</label>
        </div>
        <LocationPicker compact />
      </Card>
    </section>
  );
}
