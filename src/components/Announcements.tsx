"use client";

import {
  ArrowLeft, Bot, Bus, Car, ChevronDown, ChevronLeft, ChevronRight, Clock, Construction, Droplets, ExternalLink,
  Landmark, Leaf, List, MapPin, Search, Trash2, TriangleAlert, X, Zap, type LucideIcon,
} from "lucide-react";
import Link from "next/link";
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
  live: { label: "Шууд", cls: "border-alert bg-alert text-white" },
  ongoing: { label: "Үргэлжилж байна", cls: "border-line bg-navy-3 text-snow" },
  soon: { label: "Удахгүй", cls: "border-line bg-navy-3 text-snow" },
  ended: { label: "Дууссан", cls: "border-line bg-snow/5 text-muted" },
};

const CAT_ICON: Record<"all" | AnnouncementCategory, LucideIcon> = {
  all: List,
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

function CategoryLabel({ category, className }: { category: "all" | AnnouncementCategory; className?: string }) {
  const Icon = CAT_ICON[category];
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="news-emblem" data-category={category} aria-hidden="true">
        <Icon className="size-[15px]" strokeWidth={1.6} />
      </span>
      {category === "all" ? "Бүгд" : ANN_CAT[category].label}
    </span>
  );
}

function CityPhoto({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("news-photo block shrink-0 rounded-lg", className)} />;
}

function ArticleLink({ a, className }: { a: Announcement; className?: string }) {
  const { markRead } = useStore();
  const open = () => {
    markRead(a.id);
    if (isLive(a)) {
      try { sessionStorage.setItem("so.opened-live-notice", JSON.stringify(a)); } catch { /* The current feed is still available. */ }
    }
  };
  return (
    <Link href={"/medee/" + encodeURIComponent(a.id)} onClick={open}
      className={cn("news-link inline-flex min-h-9 items-center font-bold hover:underline", className)}>
      Бүтэн мэдээ
    </Link>
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
          <a href={a.sourceUrl} target="_blank" rel="noopener noreferrer" className="news-link inline-flex items-center gap-1 font-semibold hover:underline">
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
      {st && <Badge className={STATUS_UI[st].cls}>{STATUS_UI[st].label}</Badge>}
      {isDemo(a) && <Badge className="border-line bg-white text-muted">{VERIFY[a.verification].label}</Badge>}
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
  return (
    <article id={`ann-${a.id}`} className="news-lead scroll-mt-24 rounded-xl border border-line bg-white p-4 sm:p-5">
      <button type="button" onClick={toggle} aria-expanded={open} className="block w-full text-left">
        <span className="relative block">
          <CityPhoto className="aspect-[16/8] min-h-36 w-full" />
          <span className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
            <span className="rounded-md bg-alert px-2.5 py-1 text-xs font-bold tracking-wide text-white">Онцлох мэдээ</span>
            <span className="rounded-md bg-snow px-2 py-1 text-xs text-white">Эрдэнэт хот</span>
          </span>
        </span>
        <span className="mt-5 flex flex-wrap items-center gap-2">
          <CategoryLabel category={a.category} className="news-category" />
          <Tags a={a} st={statusOf(a, now)} mine={mine} />
        </span>
        <span className="news-headline mt-2 block font-display font-bold leading-[1.08] tracking-[-0.035em]">{a.title}</span>
        {!isLive(a) && <span className="mt-2 block text-[15px] leading-relaxed text-snow/85 md:text-base">{a.summary}</span>}
      </button>
      <div className="mt-2.5"><Byline a={a} now={now} /></div>
      {open && <div className="mt-4 border-t border-line pt-4"><Details a={a} /></div>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ArticleLink a={a} className="news-action rounded-md px-3 text-sm" />
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
    <li id={`ann-${a.id}`} className="scroll-mt-24 py-3 first:pt-0">
      <button type="button" onClick={toggle} aria-expanded={open} className="flex w-full items-start gap-3 text-left">
        <CityPhoto className="news-thumbnail h-[72px] w-[72px] lg:h-[85px] lg:w-[102px]" />
        <span className="min-w-0 flex-1">
          <CategoryLabel category={a.category} className="news-category" />
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

function Column({ a, now }: { a: Announcement; now: number | null }) {
  const [open, toggle] = useOpen(a);
  return (
    <li id={`ann-${a.id}`} className="news-card scroll-mt-24 rounded-xl border border-line bg-white p-4">
      <button type="button" onClick={toggle} aria-expanded={open} className="block w-full text-left">
        <CategoryLabel category={a.category} className="news-category" />
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
  const st = statusOf(a, now);
  return (
    <li id={`ann-${a.id}`} className="scroll-mt-24">
      <button type="button" onClick={toggle} aria-expanded={open} className="flex min-h-11 w-full items-start gap-3 py-3 text-left">
        <span className="min-w-0 flex-1">
          <span className={cn("block text-[15px] leading-snug", readIds.includes(a.id) ? "font-medium text-snow/85" : "font-semibold")}>{a.title}</span>
          <span className="mt-0.5 block text-[13px] text-muted">
            <CategoryLabel category={a.category} /> · {place(a)} · <When a={a} now={now} />
            {st === "live" && <span className="font-semibold text-alert"> · Шууд</span>}
            {isDemo(a) && <span className="text-warn"> · Жишээ</span>}
          </span>
        </span>
        <ChevronDown className={cn("mt-1 h-4 w-4 shrink-0 text-muted transition", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open && (
        <div className="grid gap-3 pb-4">
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
  const { announcements, prefs, ready, loadError, traffic } = useStore();
  const [cat, setCat] = useState<(typeof FILTERS)[number]>("all");
  const [onlyMine, setOnlyMine] = useState(false);
  const [full, setFull] = useState(false);
  const [query, setQuery] = useState("");
  const [featuredId, setFeaturedId] = useState<string | null>(null);
  const now = useNow();
  const ranked = useMemo(() => rankForUser(announcements, prefs), [announcements, prefs]);
  const mine = (a: Announcement) => (!!prefs.area && a.location.area === prefs.area) || (!!prefs.bag && a.location.bag === prefs.bag);
  const terms = query.trim().toLocaleLowerCase("mn-MN").split(/\s+/).filter(Boolean);
  const list = ranked.filter((a) => {
    const matchesCategory = cat === "all" || a.category === cat;
    if (!matchesCategory || (onlyMine && !mine(a))) return false;
    const searchText = [a.title, a.summary, a.organization, place(a), ANN_CAT[a.category].label].join(" ").toLocaleLowerCase("mn-MN");
    return terms.every((term) => searchText.includes(term));
  });
  // Real before sample, happening now or soon, then the reader's area, then the most serious category.
  const weight = (a: Announcement) => (isDemo(a) ? 0 : 40) + STATUS_WEIGHT[String(statusOf(a, now))] + (mine(a) ? 6 : 0) + (CAT_WEIGHT[a.category] ?? 1);
  const byWeight = [...list].sort((a, b) => weight(b) - weight(a)); // stable, so ties keep the personal ranking

  // Front page: the best notice of each category, so one busy topic cannot fill the page.
  const front = cat === "all" && !full && !terms.length;
  const picks: Announcement[] = [];
  for (const a of byWeight) if (!picks.some((p) => p.category === a.category)) picks.push(a);
  const featured = (front ? picks : byWeight).slice(0, 3);
  const featuredIndex = Math.max(0, featured.findIndex((item) => item.id === featuredId));
  const lead = featured[featuredIndex];
  const others = (front ? picks : byWeight).filter((item) => item.id !== lead?.id);
  const recent = [...others].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  const side = front ? recent.slice(0, 3) : [];
  const cols = front ? recent.slice(3, 6) : [];
  const moveFeature = (step: number) => {
    setFeaturedId(featured[(featuredIndex + step + featured.length) % featured.length].id);
  };
  const hiddenCount = list.length - 1 - side.length - cols.length;

  // A bell link to a notice that is not on the front page opens the full list first.
  useEffect(() => {
    const go = () => {
      const h = location.hash;
      if (!h.startsWith("#ann-") || document.getElementById(h.slice(1))) return;
      setCat("all"); setQuery(""); setOnlyMine(false); setFull(true);
      setTimeout(() => document.getElementById(h.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, [announcements.length]);

  const showAll = () => { setFull(true); setTimeout(() => document.getElementById("notices")?.scrollIntoView({ behavior: "smooth" }), 30); };

  return (
    <section id="notices" className="editorial-news mx-auto max-w-7xl scroll-mt-20 px-4 py-10 md:px-6 md:py-14" aria-labelledby="notices-title">
      <div className="news-masthead mb-5 flex flex-wrap items-end justify-between gap-4 border-b-2 border-snow pb-4">
        <h2 id="notices-title" className="font-display text-3xl font-bold tracking-tight sm:text-5xl">Эрдэнэтэд өнөөдөр</h2>
        <label className="news-search flex min-h-11 w-full items-center gap-2 rounded-lg border border-line bg-white px-3 sm:w-64">
          <Search className="size-4 shrink-0 text-muted" aria-hidden />
          <input type="search" aria-label="Мэдээ хайх" placeholder="Мэдээ хайх" value={query}
            onChange={(event) => { setQuery(event.target.value); setFeaturedId(null); }}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
          {query && <button type="button" aria-label="Хайлтыг арилгах" onClick={() => setQuery("")}><X className="size-4" /></button>}
        </label>
      </div>

      {prefs.topics.traffic && (
        <p className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm" aria-live="polite">
          <span className="inline-flex items-center gap-1.5 rounded bg-alert px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />Зам
          </span>
          <span className="text-snow/90">
            {!traffic ? "Шалгаж байна…" : !traffic.ok ? "Замын мэдээлэл одоогоор алга."
              : traffic.busy.length ? `Түгжрэлтэй: ${traffic.busy.slice(0, 3).map((b) => b.name).join(", ")}${traffic.busy.length > 3 ? ` ба өөр ${traffic.busy.length - 3}` : ""}.`
              : "Одоогоор зам түгжрэлгүй."}
          </span>
        </p>
      )}

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Ангиллаар шүүх">
        {FILTERS.map((f) => (
          <button key={f} type="button" aria-pressed={cat === f} onClick={() => { setCat(f); setFeaturedId(null); if (f === "all") setFull(false); }}
            className={cn("news-filter min-h-11 shrink-0 rounded-md border px-3.5 py-1.5 text-sm font-semibold transition",
              cat === f ? "border-cyan bg-cyan/15 text-cyan" : "border-line text-muted hover:border-cyan/40 hover:text-snow")}>
            <CategoryLabel category={f} />
          </button>
        ))}
      </div>

      {loadError ? <Empty title="Алдаа гарлаа" text={loadError} /> : !ready || !announcements.length ? (
        <div className="grid gap-6 md:grid-cols-[1.45fr_1fr]"><div className="glass aspect-[2/1] animate-pulse rounded-lg" /><div className="glass h-64 animate-pulse rounded-lg" /></div>
      ) : !lead ? (
        <Empty title="Энэ шүүлтүүрт мэдэгдэл алга" text="Хайлтын үг, ангилал эсвэл байршлаа өөрчилнө үү." />
      ) : front ? (
        <>
          <div className="grid items-start gap-6 md:grid-cols-[1.45fr_1fr]">
            <div className="min-w-0">
              <Lead key={lead.id} a={lead} now={now} mine={mine(lead)} />
              {featured.length > 1 && (
                <div className="mt-3 flex items-center gap-2" role="group" aria-label="Онцлох мэдээний сонголт">
                  <button type="button" className="news-step" aria-label="Өмнөх онцлох мэдээ" onClick={() => moveFeature(-1)}><ChevronLeft className="size-5" /></button>
                  <span className="min-w-10 text-center text-sm tabular-nums text-muted" aria-live="polite">{featuredIndex + 1} / {featured.length}</span>
                  <button type="button" className="news-step" aria-label="Дараагийн онцлох мэдээ" onClick={() => moveFeature(1)}><ChevronRight className="size-5" /></button>
                </div>
              )}
            </div>
            {side.length > 0 && (
              <aside aria-labelledby="latest-news" className="news-latest min-w-0 rounded-xl p-4 sm:p-5">
                <h3 id="latest-news" className="mb-4 border-b border-snow pb-2 text-xl font-bold">Сүүлийн мэдээ</h3>
                <ul className="divide-y divide-line">{side.map((a) => <Side key={a.id} a={a} now={now} />)}</ul>
              </aside>
            )}
          </div>
          {cols.length > 0 && (
            <ul className="mt-6 grid gap-3 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
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
        <div className="grid items-start gap-6 md:grid-cols-[1.45fr_1fr]">
          <div className="min-w-0">
              <Lead key={lead.id} a={lead} now={now} mine={mine(lead)} />
              {featured.length > 1 && (
                <div className="mt-3 flex items-center gap-2" role="group" aria-label="Онцлох мэдээний сонголт">
                  <button type="button" className="news-step" aria-label="Өмнөх онцлох мэдээ" onClick={() => moveFeature(-1)}><ChevronLeft className="size-5" /></button>
                  <span className="min-w-10 text-center text-sm tabular-nums text-muted" aria-live="polite">{featuredIndex + 1} / {featured.length}</span>
                  <button type="button" className="news-step" aria-label="Дараагийн онцлох мэдээ" onClick={() => moveFeature(1)}><ChevronRight className="size-5" /></button>
                </div>
              )}
            </div>
          <div>
            <div className="flex items-center justify-between border-b-2 border-snow pb-1.5">
              <p className="text-[13px] font-bold uppercase tracking-wider">{terms.length ? "Хайлтын үр дүн" : cat === "all" ? "Бүх мэдэгдэл" : <CategoryLabel category={cat} />}</p>
              {cat === "all" && (
                <button type="button" onClick={() => { setFull(false); setQuery(""); setFeaturedId(null); }} className="inline-flex min-h-9 items-center gap-1 text-[13px] font-semibold text-cyan">
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
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted"><input type="checkbox" className="h-4 w-4 accent-cyan" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />Зөвхөн миний бүс</label>
        </div>
        <LocationPicker compact />
      </Card>
      <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-muted">
        <p>«Жишээ» шошготой зар бодит биш.</p>
        <p>Хотын зураг: <a className="underline" href="https://commons.wikimedia.org/wiki/File:Erdenet_in_summer_-_panoramio.jpg">Alex Ang</a> · <a className="underline" href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a> · Зургийг тайрч харуулав.</p>
      </div>
    </section>
  );
}

export function NewsArticle({ id }: { id: string }) {
  const { announcements, loadError, traffic, prefs, markRead } = useStore();
  const [openedLive, setOpenedLive] = useState<Announcement | null>(null);
  const now = useNow();
  const article = openedLive?.id === id ? openedLive : announcements.find((a) => a.id === id);
  useEffect(() => {
    if (!id.startsWith("traffic-")) return;
    const recover = () => {
      try {
        const saved = JSON.parse(sessionStorage.getItem("so.opened-live-notice") || "null") as Announcement | null;
        if (saved?.id === id) setOpenedLive(saved);
      } catch { /* Ignore unavailable storage. */ }
    };
    recover();
  }, [id]);
  useEffect(() => {
    if (article) markRead(article.id);
  }, [article, markRead]);

  const loading = !loadError && (!announcements.length || (id.startsWith("traffic-") && prefs.topics.traffic && !traffic));
  return (
    <main className="editorial-news mx-auto min-h-[80vh] max-w-4xl px-4 py-8 sm:px-8">
      <a href="/#notices" className="news-link mb-5 inline-flex min-h-11 items-center gap-2 font-bold">
        <ArrowLeft className="size-4" aria-hidden />Мэдээ рүү буцах
      </a>
      {article ? (
        <article className="rounded-xl border border-line bg-white p-5 sm:p-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <CategoryLabel category={article.category} className="news-category" />
            <Tags a={article} st={statusOf(article, now)} mine={false} />
          </div>
          <h1 className="news-headline mb-4 font-display font-bold leading-tight">{article.title}</h1>
          <Byline a={article} now={now} />
          {!isLive(article) && <p className="mt-5 text-lg font-medium">{article.summary}</p>}
          <div className="mt-5 border-t border-line pt-5"><Details a={article} /></div>
          <div className="mt-4"><AiButton a={article} /></div>
        </article>
      ) : loading ? <p role="status">Мэдээг ачаалж байна…</p> :
        <Empty title={loadError ? "Алдаа гарлаа" : "Мэдээ олдсонгүй"} text={loadError || "Энэ мэдээ шинэчлэгдсэн эсвэл жагсаалтаас хасагдсан байна."} />}
    </main>
  );
}
