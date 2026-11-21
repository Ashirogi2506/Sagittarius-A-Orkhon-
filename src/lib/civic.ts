// Shared (client + server) types and labels for urgent alerts, bus routes and weather.

export type AlertLevel = "critical" | "warning" | "info";
export type AlertKind = "water" | "electricity" | "heating" | "road" | "weather" | "emergency" | "other";

export interface CivicAlert {
  id: number;
  level: AlertLevel;
  kind: AlertKind;
  title: string;
  body: string | null;
  area: string | null;
  lat: number | null;
  lng: number | null;
  startsAt: string | null;
  endsAt: string | null;
  closedAt: string | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
}

export const ALERT_LEVEL: Record<AlertLevel, { label: string; color: string }> = {
  critical: { label: "Яаралтай", color: "#d63c3c" },
  warning: { label: "Анхааруулга", color: "#b7791f" },
  info: { label: "Мэдээлэл", color: "#1f5fbf" },
};

export const ALERT_KIND: Record<AlertKind, { label: string; icon: string; color: string }> = {
  water: { label: "Ус тасралт", icon: "💧", color: "#38bdf8" },
  electricity: { label: "Цахилгаан тасралт", icon: "⚡", color: "#facc15" },
  heating: { label: "Дулаан тасралт", icon: "🔥", color: "#fb923c" },
  road: { label: "Зам хаалт", icon: "🚧", color: "#f97316" },
  weather: { label: "Цаг агаарын аюул", icon: "🌨", color: "#a5b4fc" },
  emergency: { label: "Онцгой байдал", icon: "🚨", color: "#d63c3c" },
  other: { label: "Бусад", icon: "📢", color: "#5b6b82" },
};

/** Kinds that are drawn on the map's separate "outages" layer. */
export const OUTAGE_KINDS: AlertKind[] = ["water", "electricity", "heating"];

/** Open = not closed by an admin and not past its end time. */
export const isOpen = (a: CivicAlert, now = Date.now()) => !a.closedAt && (!a.endsAt || Date.parse(a.endsAt) > now);

export interface BusRoute {
  id: number;
  number: string;
  name: string | null;
  stops: string[];
  firstTime: string | null;
  lastTime: string | null;
  intervalMin: number | null;
  fareAdult: number | null;
  fareChild: number | null;
  fareNote: string | null;
  source: string | null;
  updatedAt: string;
}

/** Index of the first stop whose name contains `q` (case-insensitive), or -1. */
export function stopIndex(stops: string[], q: string): number {
  const n = q.trim().toLowerCase();
  return n ? stops.findIndex((s) => s.toLowerCase().includes(n)) : -1;
}

export interface Weather {
  ok: boolean;
  fetchedAt: string;
  now?: { temp: number; feels: number; wind: number; code: number; isDay: boolean };
  days?: { date: string; min: number; max: number; code: number; precip: number }[];
}

/** WMO weather code → Mongolian label + emoji (Open-Meteo uses WMO codes). */
export function weatherLabel(code: number, isDay = true): { text: string; icon: string } {
  if (code === 0) return { text: "Цэлмэг", icon: isDay ? "☀️" : "🌙" };
  if (code <= 2) return { text: "Багавтар үүлтэй", icon: isDay ? "🌤️" : "☁️" };
  if (code === 3) return { text: "Үүлэрхэг", icon: "☁️" };
  if (code === 45 || code === 48) return { text: "Манантай", icon: "🌫️" };
  if (code >= 51 && code <= 57) return { text: "Шивэрдэг бороо", icon: "🌦️" };
  if (code >= 61 && code <= 67) return { text: "Бороотой", icon: "🌧️" };
  if (code >= 71 && code <= 77) return { text: "Цастай", icon: "🌨️" };
  if (code >= 80 && code <= 82) return { text: "Аадар бороо", icon: "🌧️" };
  if (code === 85 || code === 86) return { text: "Цасан шуурга", icon: "❄️" };
  if (code >= 95) return { text: "Аянга цахилгаантай", icon: "⛈️" };
  return { text: "—", icon: "🌡️" };
}
