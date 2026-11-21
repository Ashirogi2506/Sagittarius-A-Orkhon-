import { ALERT_KIND, ALERT_LEVEL, type AlertKind, type AlertLevel } from "@/lib/civic";
import { listAlerts } from "@/lib/server/alerts";
import { currentUser } from "@/lib/server/auth";
import { nowIso, run } from "@/lib/server/db";
import { cleanText } from "@/lib/server/guard";

export async function GET() {
  return Response.json({ items: await listAlerts() }, { headers: { "Cache-Control": "no-store" } });
}

const isoOrNull = (v: unknown) => {
  if (typeof v !== "string" || !v) return null;
  const t = Date.parse(v);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
};
// Erdenet area only, so a typo can't drop a pin in another country.
const inErdenet = (lat: number, lng: number) => lat > 48.9 && lat < 49.15 && lng > 103.85 && lng < 104.25;

async function admin() {
  const user = await currentUser();
  return user?.role === "admin" ? user : null;
}

// Only admins post urgent notices: a wrong outage notice misleads the whole city.
export async function POST(req: Request) {
  const user = await admin();
  if (!user) return Response.json({ error: "Зөвхөн админ шуурхай мэдээлэл оруулна." }, { status: 403 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return Response.json({ error: "Хүсэлт буруу байна." }, { status: 400 }); }
  const level = (Object.keys(ALERT_LEVEL) as AlertLevel[]).find((k) => k === b.level);
  const kind = (Object.keys(ALERT_KIND) as AlertKind[]).find((k) => k === b.kind);
  const title = cleanText(b.title, 140);
  const body = cleanText(b.body, 1000) || null;
  const area = cleanText(b.area, 140) || null;
  const source = cleanText(b.source, 300) || null;
  const startsAt = isoOrNull(b.startsAt);
  const endsAt = isoOrNull(b.endsAt);
  let lat = typeof b.lat === "number" ? b.lat : null;
  let lng = typeof b.lng === "number" ? b.lng : null;
  if (lat == null || lng == null || !inErdenet(lat, lng)) { lat = null; lng = null; }
  if (!level || !kind || !title) return Response.json({ error: "Түвшин, төрөл, гарчгаа заавал оруулна." }, { status: 400 });
  if (startsAt && endsAt && endsAt <= startsAt) return Response.json({ error: "Дуусах цаг эхлэх цагаас хойш байх ёстой." }, { status: 400 });
  const now = nowIso();
  await run("INSERT INTO alerts (level, kind, title, body, area, lat, lng, starts_at, ends_at, source, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    level, kind, title, body, area, lat, lng, startsAt, endsAt, source, user.id, now, now);
  return Response.json({ items: await listAlerts() });
}

/** ?id=…&action=close marks a notice as resolved (kept in history); action=delete removes a mistake. */
export async function DELETE(req: Request) {
  if (!(await admin())) return Response.json({ error: "Зөвхөн админ." }, { status: 403 });
  const u = new URL(req.url);
  const id = Number(u.searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) return Response.json({ error: "id буруу." }, { status: 400 });
  if (u.searchParams.get("action") === "delete") await run("DELETE FROM alerts WHERE id = ?", id);
  else await run("UPDATE alerts SET closed_at = ?, updated_at = ? WHERE id = ? AND closed_at IS NULL", nowIso(), nowIso(), id);
  return Response.json({ items: await listAlerts() });
}
