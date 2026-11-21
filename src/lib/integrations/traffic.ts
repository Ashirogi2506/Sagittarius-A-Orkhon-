// Live road load from Орхон аймгийн ТКХДТ (dedtuv.erdenet.mn) camera detections.
// Public JSON used by their own /live page. Fetched server-side only and cached briefly.
import { CAMERAS } from "../data/cameras";

export const TRAFFIC_PAGE = "https://dedtuv.erdenet.mn/live";
const TRAFFIC_API = "https://dedtuv.erdenet.mn/api/traffic";
const CACHE_MS = 60_000;
const STALE_MS = 30 * 60_000;

export interface TrafficSpot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  vehicles: number;
  level: string; // LOW | MEDIUM | HIGH | ... as reported by the source
  detectedAt: string;
  stale: boolean;
}

export interface TrafficSnapshot {
  ok: boolean;
  spots: TrafficSpot[];
  fetchedAt: string;
  source: string;
}

export const LEVEL_LABEL: Record<string, string> = {
  LOW: "Ачаалалгүй",
  MEDIUM: "Дунд зэргийн ачаалалтай",
  HIGH: "Ачаалал ихтэй",
  VERY_HIGH: "Маш их ачаалалтай",
  JAM: "Түгжрэлтэй",
};
const LEVEL_RANK: Record<string, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, VERY_HIGH: 3, JAM: 3 };
export const levelLabel = (l: string) => LEVEL_LABEL[l] ?? l;
export const levelRank = (l: string) => LEVEL_RANK[l] ?? 1;

let cache: { at: number; snap: TrafficSnapshot } | null = null;

function parse(raw: unknown, now: number): TrafficSpot[] {
  if (!Array.isArray(raw)) throw new Error("BAD_SHAPE");
  const out: TrafficSpot[] = [];
  for (const r of raw.slice(0, 200)) {
    const o = r as Record<string, unknown>;
    if (typeof o.name !== "string" || typeof o.lat !== "number" || typeof o.lng !== "number") continue;
    const detectedAt = typeof o.detectedAt === "string" ? o.detectedAt : "";
    const t = Date.parse(detectedAt);
    out.push({
      id: typeof o.id === "string" ? o.id.slice(0, 64) : o.name.trim(),
      name: o.name.trim().slice(0, 80),
      lat: o.lat,
      lng: o.lng,
      vehicles: typeof o.vehicleCount === "number" ? o.vehicleCount : 0,
      level: typeof o.loadLevel === "string" ? o.loadLevel.toUpperCase().slice(0, 20) : "UNKNOWN",
      detectedAt,
      stale: !Number.isFinite(t) || now - t > STALE_MS,
    });
  }
  return out;
}

export async function getTraffic(): Promise<TrafficSnapshot> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_MS) return cache.snap;
  try {
    const r = await fetch(TRAFFIC_API, { cache: "no-store", headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8_000) });
    if (!r.ok) throw new Error("HTTP_" + r.status);
    const spots = parse(await r.json(), now);
    const snap = { ok: true, spots, fetchedAt: new Date(now).toISOString(), source: TRAFFIC_PAGE };
    cache = { at: now, snap };
    return snap;
  } catch {
    // Keep the last good snapshot for a few minutes rather than nothing; otherwise report failure.
    if (cache && now - cache.at < 5 * 60_000) return cache.snap;
    return { ok: false, spots: [], fetchedAt: new Date(now).toISOString(), source: TRAFFIC_PAGE };
  }
}

/** Text block for the AI context. Only fresh readings count as current. */
export function trafficContext(s: TrafficSnapshot): string {
  if (!s.ok) return "ЗАМЫН АЧААЛАЛ (шууд): одоогоор мэдээлэл алга.";
  const fresh = s.spots.filter((x) => !x.stale).sort((a, b) => levelRank(b.level) - levelRank(a.level) || b.vehicles - a.vehicles);
  const stale = s.spots.filter((x) => x.stale);
  const busy = fresh.filter((x) => levelRank(x.level) >= 1);
  return [
    "ЗАМЫН АЧААЛАЛ (шууд):",
    busy.length ? `Ачаалалтай цэгүүд: ${busy.map((x) => `${x.name} — ${levelLabel(x.level)}`).join("; ")}.` : "Ачаалалтай цэг одоогоор бүртгэгдээгүй.",
    `Ачаалалгүй цэгүүд: ${fresh.filter((x) => levelRank(x.level) < 1).map((x) => x.name).join(", ") || "байхгүй"}.`,
    stale.length ? `Хуучирсан (30 минутаас дээш шинэчлэгдээгүй, одоогийн байдал гэж бүү хэл): ${stale.map((x) => x.name).join(", ")}.` : "",
    `Машин тоолдоггүй камерууд (ачааллыг нь мэдэхгүй, таамаглаж болохгүй): ${CAMERAS.filter((c) => !s.spots.some((x) => x.id === c.id)).map((c) => c.name).join(", ") || "байхгүй"}.`,
    "Эдгээр камер, цэгээс бусад замын ачааллын мэдээлэл байхгүй.",
  ].filter(Boolean).join("\n");
}

/** Deterministic answer used in demo mode or when Gemini fails. Real data, no AI. At most 2 sentences, like Gemini's. */
export function trafficAnswer(s: TrafficSnapshot): string {
  if (!s.ok) return "Замын ачааллын мэдээлэл одоогоор алга.";
  const fresh = s.spots.filter((x) => !x.stale).sort((a, b) => levelRank(b.level) - levelRank(a.level) || b.vehicles - a.vehicles);
  const busy = fresh.filter((x) => levelRank(x.level) >= 1);
  return busy.length
    ? `${busy.slice(0, 3).map((x) => x.name).join(", ")}-д одоо түгжрэлтэй байна.`
    : "Одоогоор зам түгжрэлгүй байна.";
}

export const isTrafficQuestion = (q: string) => /түгжр|ачаалал|замын хөдөлгөөн|бөглөр|машин ихтэй|зам хаагд|хаалттай зам|камер/i.test(q);
