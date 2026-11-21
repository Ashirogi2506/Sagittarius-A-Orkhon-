import { ALERT_KIND, ALERT_LEVEL, isOpen, type BusRoute, type CivicAlert } from "../civic";
import { all } from "./db";
import { busHint, busStaticContext, mergeRoutes } from "../data/bus";

type AlertRow = { id: number; level: string; kind: string; title: string; body: string | null; area: string | null; lat: number | null; lng: number | null; starts_at: string | null; ends_at: string | null; closed_at: string | null; source: string | null; created_at: string; updated_at: string };

const toAlert = (r: AlertRow): CivicAlert => ({
  id: r.id, level: r.level as CivicAlert["level"], kind: r.kind as CivicAlert["kind"], title: r.title, body: r.body, area: r.area,
  lat: r.lat, lng: r.lng, startsAt: r.starts_at, endsAt: r.ends_at, closedAt: r.closed_at, source: r.source, createdAt: r.created_at, updatedAt: r.updated_at,
});

/** Open alerts first (most urgent, newest), then the last 30 days of closed ones, capped at 60 rows. */
export async function listAlerts(): Promise<CivicAlert[]> {
  const since = new Date(Date.now() - 30 * 86400_000).toISOString();
  const rows = await all<AlertRow>("SELECT * FROM alerts WHERE closed_at IS NULL OR created_at >= ? ORDER BY created_at DESC LIMIT 60", since);
  const rank = { critical: 0, warning: 1, info: 2 } as const;
  return rows.map(toAlert).sort((a, b) => Number(!isOpen(a)) - Number(!isOpen(b)) || rank[a.level] - rank[b.level] || b.createdAt.localeCompare(a.createdAt));
}

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("mn-MN", { timeZone: "Asia/Ulaanbaatar", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }) : "");

export async function alertsContext(): Promise<string> {
  const open = (await listAlerts()).filter((a) => isOpen(a));
  if (!open.length) return "ШУУРХАЙ МЭДЭЭЛЭЛ: одоогоор идэвхтэй шуурхай мэдээлэл (ус, цахилгаан, дулаан тасралт, онцгой байдал) админ оруулаагүй.";
  return ["ШУУРХАЙ МЭДЭЭЛЭЛ (админ оруулсан, идэвхтэй):", ...open.map((a) =>
    `[${ALERT_LEVEL[a.level].label}] ${ALERT_KIND[a.kind].label}: ${a.title}${a.area ? `. Байршил: ${a.area}` : ""}${a.startsAt ? `. Эхлэх: ${fmt(a.startsAt)}` : ""}${a.endsAt ? `. Дуусах: ${fmt(a.endsAt)}` : ""}${a.body ? `. ${a.body}` : ""}${a.source ? `. Эх сурвалж: ${a.source}` : ""}. Оруулсан: ${fmt(a.createdAt)}.`)].join("\n");
}

type BusRow = { id: number; number: string; name: string | null; stops: string; first_time: string | null; last_time: string | null; interval_min: number | null; fare_adult: number | null; fare_child: number | null; fare_note: string | null; source: string | null; updated_at: string };

export async function listBus(): Promise<BusRoute[]> {
  const rows = await all<BusRow>("SELECT * FROM bus_routes ORDER BY CAST(number AS INTEGER), number");
  return rows.map((r) => ({
    id: r.id, number: r.number, name: r.name, stops: r.stops.split("\n").map((s) => s.trim()).filter(Boolean),
    firstTime: r.first_time, lastTime: r.last_time, intervalMin: r.interval_min, fareAdult: r.fare_adult, fareChild: r.fare_child,
    fareNote: r.fare_note, source: r.source, updatedAt: r.updated_at,
  }));
}

export async function busQuestionHint(question: string): Promise<string> {
  return busHint(question, mergeRoutes(await listBus()));
}

export async function busContext(): Promise<string> {
  const list = mergeRoutes(await listBus());
  return [busStaticContext(), "", "АВТОБУСНЫ ЧИГЛЭЛ, ЗОГСООЛУУД (дарааллаар):", ...list.map((b) =>
    `№${b.number}${b.name ? ` ${b.name}` : ""}: ${b.stops.join(" → ")}.${b.firstTime ? ` Эхний ${b.firstTime}` : ""}${b.lastTime ? `, сүүлийн ${b.lastTime}` : ""}${b.intervalMin ? `, ${b.intervalMin} мин тутам` : ""}${b.departures?.length ? `. Хөдлөх цагууд: ${b.departures.join(", ")}` : ""}.${b.fareAdult != null ? ` Том хүн ${b.fareAdult}₮` : ""}${b.fareChild != null ? `, хүүхэд ${b.fareChild}₮` : ""}${b.fareNote ? ` (${b.fareNote})` : ""}${b.source ? ` Эх сурвалж: ${b.source}.` : ""} Шинэчилсэн ${b.updatedAt.slice(0, 10)}.`),
    "Үнэ эх сурвалжид байхгүй бол үнийг хэзээ ч зохиохгүй, Авто тээврийн төвөөс лавлахыг зөвлө."].join("\n");
}
