"use client";

import {
  ArrowLeft, ArrowRight, Bot, Bus, Car, ChevronDown, ChevronLeft, ChevronRight, Clock, Construction, Droplets, ExternalLink, Search,
  Landmark, Leaf, MapPin, Trash2, TriangleAlert, X, Zap, type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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
const articleHref = (a: Announcement) => `/news/${encodeURIComponent(a.id)}`;
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
  return <Link href={articleHref(a)} className="inline-flex min-h-9 items-center gap-1 text-xs font-bold text-cyan hover:underline">Мэдээг нээх <ArrowRight className="h-3.5 w-3.5" /></Link>;
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
    <li id={`ann-${a.id}`} className="scroll-mt-24 border-b border-line py-3 first:pt-0">
      <button type="button" onClick={toggle} aria-expanded={open} className="news-hover flex w-full items-center gap-3 text-left">
        <TopicArt category={a.category} compact />
        <span className="min-w-0 flex-1">
          <span className="line-clamp-3 font-bold leading-snug">{a.title}</span>
          <span className="mt-1.5 flex flex-wrap items-center gap-1 text-xs text-muted">
            <Clock aria-hidden="true" className="h-3.5 w-3.5" /><When a={a} now={now} />
            {isLive(a) && " · Шууд"}{isDemo(a) && " · Жишээ"}
          </span>
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

function TopicArt({ category, compact = false }: { category: AnnouncementCategory; compact?: boolean }) {
  const Icon = CAT_ICON[category];
  return (
    <span aria-hidden="true" className={cn("news-topic-art", compact && "news-topic-art--compact")} data-topic={category}>
      <Icon strokeWidth={1.5} />
    </span>
  );
}

function Column({ a, now, wide }: { a: Announcement; now: number | null; wide: boolean }) {
  const [open, toggle] = useOpen(a);
  return (
    <li id={`ann-${a.id}`} className={cn("relative scroll-mt-24 rounded-xl border border-line bg-navy-2", wide && "sm:col-span-2")}>
      <button type="button" onClick={toggle} aria-expanded={open} className="news-hover flex w-full items-stretch text-left sm:block">
        {wide ? <span className="news-city-art" role="img" aria-label="Эрдэнэт хотын төвийн ерөнхий зураг" /> : <TopicArt category={a.category} />}
        <span className="relative block min-w-0 flex-1 px-3 py-3 sm:px-4">
          <Watermark a={a} className="hidden sm:block" />
          <span className="news-tag">{ANN_CAT[a.category].label}</span>
          <span className={cn("mt-1.5 block font-bold leading-tight tracking-tight sm:pr-5", wide ? "text-base sm:text-[23px]" : "text-sm sm:text-base")}>{a.title}</span>
          <span className="mt-1.5 block text-xs text-muted"><When a={a} now={now} />{isDemo(a) && " · Жишээ"}{isLive(a) && " · Шууд"}</span>
        </span>
      </button>
      {open && (
        <div className="grid gap-2 border-t border-line px-4 py-3">
          {!isLive(a) && <p className="text-sm">{a.summary}</p>}
          <Byline a={a} now={now} /><Details a={a} />
          <div className="flex flex-wrap gap-3"><AiButton a={a} /><ArticleLink a={a} /></div>
        </div>
      )}
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

type NewsFilter = "all" | AnnouncementCategory;
const PRIMARY_FILTERS = ["all", "traffic", "water", "electricity", "transport", "environment"] as const;
const MORE_FILTERS = ["road", "waste", "service", "emergency"] as const;
const ALL_FILTERS: readonly NewsFilter[] = [...PRIMARY_FILTERS, ...MORE_FILTERS];

function NewsSearch({ query, onChange }: { query: string; onChange: (value: string) => void }) {
  return (
    <form role="search" className="news-search" onSubmit={(e) => {
      e.preventDefault();
      document.getElementById("notices")?.scrollIntoView({ block: "start" });
    }}>
      <Search className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
      <input aria-label="Мэдээлэл хайх" value={query} onChange={(e) => onChange(e.target.value)} placeholder="Мэдээ, мэдээлэл хайх…" />
      {query && <button type="button" aria-label="Хайлтыг цэвэрлэх" onClick={() => onChange("")}><X className="h-4 w-4" /></button>}
    </form>
  );
}

function NewsHeading({ children }: { children: string }) {
  return <h3 className="news-heading">{children}</h3>;
}

function Featured({ features, index, setIndex, now }: {
  features: Announcement[];
  index: number;
  setIndex: (index: number) => void;
  now: number | null;
}) {
  const a = features[index];
  return (
    <div aria-label="Онцлох мэдээлэл">
      <article className="news-feature">
        <div className="news-feature-photo" aria-hidden="true" />
        <div className="news-feature-copy" aria-live="polite">
          <span className="news-feature-label">Онцлох мэдээ</span>
          <h3>{a.title}</h3>
          <p className="line-clamp-3">{a.summary}</p>
          <div className="news-feature-meta">
            <span className="flex items-center gap-2"><Clock className="h-4 w-4" aria-hidden="true" /><When a={a} now={now} />{isDemo(a) && " · Жишээ"}</span>
            <Link href={articleHref(a)} aria-label={`Дэлгэрэнгүй: ${a.title}`} className="news-feature-link"><ArrowRight className="h-5 w-5" /></Link>
          </div>
        </div>
      </article>
      <div className="news-feature-toolbar">
        <a href="/news/credits.txt" target="_blank" rel="noreferrer" className="text-xs text-muted underline">Эрдэнэтийн зураг · Зохиогч ба лиценз</a>
        {features.length > 1 && (
          <div className="news-feature-controls" role="group" aria-label="Онцлох мэдээ солих">
            <button type="button" aria-label="Өмнөх мэдээ" onClick={() => setIndex((index + features.length - 1) % features.length)}><ChevronLeft className="h-4 w-4" /></button>
            {features.map((feature, i) => (
              <button key={feature.id} className="news-feature-dot" type="button" aria-label={feature.title} aria-pressed={i === index} onClick={() => setIndex(i)}><span /></button>
            ))}
            <button type="button" aria-label="Дараагийн мэдээ" onClick={() => setIndex((index + 1) % features.length)}><ChevronRight className="h-4 w-4" /></button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Announcements() {
  const { announcements, prefs, ready, loadError } = useStore();
  const [cat, setCat] = useState<NewsFilter>("all");
  const [onlyMine, setOnlyMine] = useState(false);
  const [full, setFull] = useState(false);
  const [query, setQuery] = useState("");
  const [featureIndex, setFeatureIndex] = useState(0);
  const [searchTarget, setSearchTarget] = useState<HTMLElement | null>(null);
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
  const features = [...picks.filter((a) => !isLive(a) && !isDemo(a)), ...picks.filter((a) => isLive(a) || isDemo(a))].slice(0, 3);
  const slide = featureIndex % Math.max(features.length, 1);
  const lead = byWeight[0];
  const others = byWeight.slice(1);
  const cards = picks.filter((a) => a.id !== features[slide]?.id).slice(0, 3);
  const used = new Set([...cards.map((a) => a.id), features[slide]?.id]);
  const latest = list.filter((a) => !used.has(a.id)).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 4);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setSearchTarget(document.getElementById("news-search-desktop")));
    const onCategory = (event: Event) => {
      const { detail } = event as CustomEvent<NewsFilter>;
      if (!ALL_FILTERS.includes(detail)) return;
      setCat(detail); setQuery(""); setFull(false); setFeatureIndex(0);
    };
    window.addEventListener("smart-orkhon-news-category", onCategory);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("smart-orkhon-news-category", onCategory);
    };
  }, []);

  // A bell link to a notice that is not on the front page opens the full list first.
  useEffect(() => {
    const go = () => {
      const h = location.hash;
      if (!h.startsWith("#ann-")) return;
      let id = h.slice(1);
      try { id = decodeURIComponent(id); } catch { /* keep the literal ID */ }
      if (document.getElementById(id)) return;
      setCat("all"); setOnlyMine(false); setQuery(""); setFull(true);
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    };
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, []);

  const showAll = () => { setFull(true); setTimeout(() => document.getElementById("notices")?.scrollIntoView({ behavior: "smooth" }), 30); };
  const selectCategory = (filter: NewsFilter) => { setCat(filter); setFull(false); setFeatureIndex(0); };

  return (
    <section id="notices" className="editorial news-section mx-auto max-w-7xl scroll-mt-20 px-4 pb-10 pt-4 md:px-6" aria-labelledby="notices-title">
      <h2 id="notices-title" className="sr-only">Хотын мэдээлэл</h2>
      <div className={cn("mb-3", searchTarget && "min-[960px]:hidden")}>
        <NewsSearch query={query} onChange={setQuery} />
      </div>
      {searchTarget && createPortal(<NewsSearch query={query} onChange={setQuery} />, searchTarget)}

      <div className="news-categories" role="group" aria-label="Ангиллаар шүүх">
        <span className="news-categories-label">Ангилал</span>
        <div className="news-categories-scroll">
          {PRIMARY_FILTERS.map((f) => {
            const Icon = f === "all" ? null : CAT_ICON[f];
            return (
              <button className="news-category" key={f} type="button" aria-pressed={cat === f} onClick={() => selectCategory(f)}>
                {Icon && <Icon className="h-[17px] w-[17px]" aria-hidden="true" />}
                {f === "all" ? "Бүгд" : ANN_CAT[f].label}
              </button>
            );
          })}
        </div>
        <details className="news-categories-more">
          <summary className="news-category">{cat !== "all" && MORE_FILTERS.some((filter) => filter === cat) ? ANN_CAT[cat].label : "Бусад"}<ChevronDown className="h-4 w-4" aria-hidden="true" /></summary>
          <div className="news-categories-menu">
            {MORE_FILTERS.map((f) => {
              const Icon = CAT_ICON[f];
              return (
                <button type="button" key={f} aria-pressed={cat === f} onClick={(e) => {
                  selectCategory(f);
                  const menu = e.currentTarget.closest("details");
                  if (menu) { menu.open = false; menu.querySelector("summary")?.focus(); }
                }}>
                  <Icon className="h-4 w-4" aria-hidden="true" />{ANN_CAT[f].label}
                </button>
              );
            })}
          </div>
        </details>
      </div>

      {loadError ? <Empty title="Алдаа гарлаа" text={loadError} /> : !ready || !announcements.length ? (
        <div className="news-feature animate-pulse" role="status"><span className="sr-only">Мэдээлэл ачаалж байна</span></div>
      ) : !lead ? (
        <Empty title="Энэ шүүлтүүрт мэдэгдэл алга" text="Өөр ангилал эсвэл байршил сонгоно уу." />
      ) : front ? (
        <>
          <Featured features={features} index={slide} setIndex={setFeatureIndex} now={now} />
          <div className="news-columns">
            {cards.length > 0 && (
              <div className="min-w-0">
                <NewsHeading>Онцлох мэдээ</NewsHeading>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {cards.map((a, i) => <Column key={a.id} a={a} now={now} wide={i === 0} />)}
                </ul>
              </div>
            )}
            <div className="news-latest min-w-0">
              <NewsHeading>Сүүлийн мэдээ</NewsHeading>
              <ul>{latest.map((a) => <Side key={a.id} a={a} now={now} />)}</ul>
              <div className="mt-4 flex justify-end">
                <button type="button" onClick={showAll} className="news-all-link">
                  Бүх мэдээг үзэх <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[1.45fr_1fr]">
          <Lead key={lead.id} a={lead} now={now} mine={mine(lead)} />
          <div>
            <div className="flex items-center justify-between border-b-2 border-snow pb-1.5">
              <p className="text-[13px] font-bold uppercase tracking-wider">{cat === "all" ? "Бүх мэдэгдэл" : ANN_CAT[cat].label}</p>
              {cat === "all" && full && (
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
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted"><input type="checkbox" className="h-4 w-4 accent-[var(--news-accent)]" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />Зөвхөн миний бүс</label>
        </div>
        <LocationPicker compact />
      </Card>
    </section>
  );
}
