"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Announcement, AnnouncementCategory, Report, Solution } from "./types";
import type { CivicAlert } from "./civic";
import { DEMO_SOLUTIONS } from "./data/places";

export interface Prefs {
  sum: string; bag: string; area: string;
  topics: Record<"water" | "electricity" | "road" | "traffic" | "transport" | "emergency", boolean>;
  browserNotify: boolean;
}

const DEFAULT_PREFS: Prefs = {
  sum: "Баян-Өндөр", bag: "", area: "",
  topics: { water: true, electricity: true, road: true, traffic: true, transport: true, emergency: true },
  browserNotify: false,
};

export const TRAFFIC_POLL_MS = 5 * 60_000;
const TRAFFIC_PAGE = "https://dedtuv.erdenet.mn/live";

/** rank: -1 = no count from this camera, 0 = free flow, 1 = medium, 2+ = heavy. */
export interface CameraSpot { id: string; name: string; level: string; levelLabel: string; rank: number; vehicles: number | null; lat: number; lng: number; detectedAt: string | null }
interface BusySpot extends CameraSpot { vehicles: number; detectedAt: string }
export interface TrafficStatus { ok: boolean; fetchedAt: string; cameras: number; total: number; spots: CameraSpot[]; busy: BusySpot[] }

/** Map colour for a camera's load rank. Grey means no data, never "free". */
export const trafficColor = (rank: number) => (rank >= 2 ? "#d63c3c" : rank === 1 ? "#b7791f" : rank === 0 ? "#22c55e" : "#64748b");

const hm = (iso: string) => new Date(iso).toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Ulaanbaatar" });

/** One alert per camera, load level and hour, so ongoing congestion does not re-alert every 5 minutes. */
function trafficToAnnouncements(t: TrafficStatus): Announcement[] {
  const hour = t.fetchedAt.slice(0, 13);
  return t.busy.map((b) => ({
    id: `traffic-${b.name.replace(/\s+/g, "_")}-${b.level}-${hour}`,
    organization: "Орхон аймгийн ТКХДТ · камерын автомат тооллого",
    title: `Түгжрэл: ${b.name} — ${b.levelLabel.toLowerCase()}`,
    category: "traffic",
    location: { province: "Орхон", sum: "Баян-Өндөр" },
    locationNote: b.name,
    start: b.detectedAt,
    description: `${b.name} камер ${hm(b.detectedAt)}-д ${b.vehicles} машин бүртгэж, ачааллыг «${b.levelLabel}» гэж үнэлсэн. Мэдээллийг 5 минут тутам шинэчилнэ.`,
    summary: `${b.vehicles} машин, ${hm(b.detectedAt)}-ийн байдлаар.`,
    sourceUrl: TRAFFIC_PAGE,
    sourceName: "Теле камерын хяналтын дэд төв",
    publishedAt: b.detectedAt,
    checkedAt: t.fetchedAt,
    verification: "live",
  }));
}

const read = <T,>(k: string, d: T): T => {
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; }
};
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } };

interface Store {
  ready: boolean;
  announcements: Announcement[];
  sourcesNote: string;
  sources: { id: string; name: string; kind: string; live: boolean; lastUpdated: string; homepage: string }[];
  loadError: string | null;
  prefs: Prefs; setPrefs: (p: Prefs) => void;
  readIds: string[]; markRead: (id: string) => void; markAllRead: () => void;
  reports: Report[]; addReport: (r: Report) => void; removeReport: (t: string) => void;
  /** Replaces the status and history of a saved report with the server's copy. */
  syncReport: (r: Pick<Report, "tracking" | "status" | "history">) => void;
  solutions: Solution[]; voted: string[]; vote: (id: string) => void; addSolution: (s: Solution) => void; addComment: (id: string, text: string) => void;
  toast: string | null; showToast: (t: string) => void;
  chatOpen: boolean; setChatOpen: (v: boolean) => void; chatSeed: string | null; askAI: (q: string) => void;
  focusIssue: string | null; setFocusIssue: (id: string | null) => void;
  traffic: TrafficStatus | null;
  /** Statistics are cached for 5 min on the server, so the visitor's own actions are counted locally right away. */
  me: Me | null; refreshMe: () => Promise<void>; logout: () => Promise<void>;
  /** Urgent notices (outages, emergencies), refreshed every 2 minutes. null = still loading. */
  alerts: CivicAlert[] | null; setAlerts: (a: CivicAlert[]) => void;
}

export interface Me {
  user: { id: number; name: string; email: string; area: string | null; role: "user" | "admin"; createdAt: string } | null;
  reports?: { tracking: string; title: string; category: string; status: string; at: string }[];
}

const Ctx = createContext<Store | null>(null);

export const TOPIC_OF: Partial<Record<AnnouncementCategory, keyof Prefs["topics"]>> = {
  water: "water", electricity: "electricity", road: "road", traffic: "traffic", transport: "transport", emergency: "emergency",
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [baseAnnouncements, setAnnouncements] = useState<Announcement[]>([]);
  const [traffic, setTraffic] = useState<TrafficStatus | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const refreshMe = useCallback(async () => {
    try { const r = await fetch("/api/me"); if (r.ok) setMe(await r.json()); } catch { /* offline */ }
  }, []);
  const logout = useCallback(async () => {
    try { await fetch("/api/auth/logout", { method: "POST" }); } finally { setMe({ user: null }); }
  }, []);
  useEffect(() => {
    // Who is signed in.
    /* eslint-disable react-hooks/set-state-in-effect */
    refreshMe();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [refreshMe]);
  const [sources, setSources] = useState<Store["sources"]>([]);
  const [sourcesNote, setNote] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [prefs, setPrefsState] = useState<Prefs>(DEFAULT_PREFS);
  const [readIds, setRead] = useState<string[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [solutions, setSolutions] = useState<Solution[]>(DEMO_SOLUTIONS);
  const [voted, setVoted] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSeed, setChatSeed] = useState<string | null>(null);
  const [focusIssue, setFocusIssue] = useState<string | null>(null);

  useEffect(() => {
    // Restore per-browser state after mount (keeps SSR markup stable).
    /* eslint-disable react-hooks/set-state-in-effect */
    const saved = read("so.prefs", DEFAULT_PREFS);
    // Area names were renamed from "N-р микрорайон" to "N-р микро".
    setPrefsState({ ...saved, topics: { ...DEFAULT_PREFS.topics, ...saved.topics }, area: (saved.area || "").replace("микрорайон", "микро") });
    setRead(read("so.read", []));
    setReports(read("so.reports", []));
    setVoted(read("so.voted", []));
    const extra = read<Solution[]>("so.solutions", []);
    const votes = read<Record<string, number>>("so.votes", {});
    setSolutions([...extra, ...DEMO_SOLUTIONS].map((s) => ({ ...s, votes: s.votes + (votes[s.id] || 0) })));
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    fetch("/api/announcements")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => { setAnnouncements(d.items); setSources(d.sources); setNote(d.note); })
      .catch(() => setLoadError("Мэдэгдлийг ачаалж чадсангүй. Хуудсаа дахин ачаална уу."));
  }, []);

  const showToast = useCallback((t: string) => { setToast(t); window.setTimeout(() => setToast(null), 2800); }, []);

  // Urgent notices: checked every 2 minutes so a new outage reaches open pages quickly.
  const [alerts, setAlerts] = useState<CivicAlert[] | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => fetch("/api/alerts").then((r) => (r.ok ? r.json() : null)).then((d) => { if (alive && d) setAlerts(d.items); }).catch(() => { /* keep last */ });
    load();
    const id = window.setInterval(load, 2 * 60_000);
    return () => { alive = false; window.clearInterval(id); };
  }, []);

  // Road load from the camera centre, refreshed every 5 minutes while the page is open.
  const trafficOn = ready && prefs.topics.traffic;
  useEffect(() => {
    if (!trafficOn) return;
    let alive = true;
    let seen: string[] | null = null; // names already busy on the previous check
    const check = () => {
      fetch("/api/traffic")
        .then((r) => (r.ok ? r.json() : null))
        .then((d: TrafficStatus | null) => {
          if (!alive || !d) return;
          setTraffic(d);
          const names = d.busy.map((b) => b.name);
          const added = seen ? names.filter((n) => !seen!.includes(n)) : [];
          if (added.length) showToast(`Шинэ түгжрэл: ${added.join(", ")}`);
          seen = names;
        })
        .catch(() => { /* keep last state; next check retries */ });
    };
    check();
    const id = window.setInterval(check, TRAFFIC_POLL_MS);
    return () => { alive = false; window.clearInterval(id); };
  }, [trafficOn, showToast]);

  const announcements = useMemo(
    () => (traffic && prefs.topics.traffic ? [...trafficToAnnouncements(traffic), ...baseAnnouncements] : baseAnnouncements),
    [traffic, prefs.topics.traffic, baseAnnouncements],
  );
  const setPrefs = useCallback((p: Prefs) => { setPrefsState(p); write("so.prefs", p); }, []);
  const markRead = useCallback((id: string) => setRead((r) => { if (r.includes(id)) return r; const n = [...r, id]; write("so.read", n); return n; }), []);
  const markAllRead = useCallback(() => setRead(() => { const n = announcements.map((a) => a.id); write("so.read", n); return n; }), [announcements]);
  const addReport = useCallback((rep: Report) => setReports((r) => { const n = [rep, ...r]; write("so.reports", n); return n; }), []);
  const removeReport = useCallback((t: string) => setReports((r) => { const n = r.filter((x) => x.tracking !== t); write("so.reports", n); return n; }), []);
  const syncReport = useCallback((s: Pick<Report, "tracking" | "status" | "history">) => setReports((r) => {
    const old = r.find((x) => x.tracking === s.tracking);
    if (!old || (old.status === s.status && old.history.length === s.history.length)) return r;
    const n = r.map((x) => (x.tracking === s.tracking ? { ...x, status: s.status, history: s.history } : x)); write("so.reports", n); return n;
  }), []);
  const vote = useCallback((id: string) => {
    if (voted.includes(id)) return;
    const n = [...voted, id]; setVoted(n); write("so.voted", n);
    const votes = read<Record<string, number>>("so.votes", {}); votes[id] = (votes[id] || 0) + 1; write("so.votes", votes);
    setSolutions((s) => s.map((x) => (x.id === id ? { ...x, votes: x.votes + 1 } : x)));
  }, [voted]);
  const addSolution = useCallback((s: Solution) => {
    setSolutions((list) => [s, ...list]);
    write("so.solutions", [s, ...read<Solution[]>("so.solutions", [])]);
  }, []);
  const addComment = useCallback((id: string, text: string) => {
    const c = { who: "Та", text, at: new Date().toISOString().slice(0, 10) };
    setSolutions((list) => list.map((s) => (s.id === id ? { ...s, comments: [...s.comments, c] } : s)));
    const extra = read<Solution[]>("so.solutions", []);
    if (extra.some((s) => s.id === id)) write("so.solutions", extra.map((s) => (s.id === id ? { ...s, comments: [...s.comments, c] } : s)));
  }, []);
  const askAI = useCallback((q: string) => { setChatSeed(q); setChatOpen(true); }, []);

  const value = useMemo<Store>(() => ({
    ready, announcements, sources, sourcesNote, loadError, prefs, setPrefs, readIds, markRead, markAllRead,
    reports, addReport, removeReport, syncReport, solutions, voted, vote, addSolution, addComment, toast, showToast,
    chatOpen, setChatOpen, chatSeed, askAI, focusIssue, setFocusIssue, traffic,
    me, refreshMe, logout, alerts, setAlerts,
  }), [ready, announcements, sources, sourcesNote, loadError, prefs, setPrefs, readIds, markRead, markAllRead, reports, addReport, removeReport, syncReport, solutions, voted, vote, addSolution, addComment, toast, showToast, chatOpen, chatSeed, askAI, focusIssue, traffic, me, refreshMe, logout, alerts]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
}

/** Announcements relevant to the user's location and topics come first. */
export function rankForUser(list: Announcement[], prefs: Prefs) {
  const score = (a: Announcement) => {
    let s = 0;
    if (prefs.area && a.location.area === prefs.area) s += 4;
    if (prefs.bag && a.location.bag === prefs.bag) s += 3;
    if (a.location.sum === prefs.sum) s += 1;
    const t = topicOf(a);
    if (t && prefs.topics[t]) s += 1;
    if (a.verification === "live") s += 5; // current congestion first
    return s;
  };
  return [...list].sort((a, b) => score(b) - score(a));
}

const topicOf = (a: Announcement) => (a.id.startsWith("traffic-") ? "traffic" : TOPIC_OF[a.category]);

export function isRelevant(a: Announcement, prefs: Prefs) {
  const t = topicOf(a);
  const topicOk = t ? prefs.topics[t] : true;
  const placeOk = !prefs.area || !a.location.area || a.location.area === prefs.area || (!!prefs.bag && a.location.bag === prefs.bag);
  return topicOk && placeOk && a.location.sum === prefs.sum;
}
