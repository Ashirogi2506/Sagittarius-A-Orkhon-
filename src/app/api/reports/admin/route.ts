import { currentUser } from "@/lib/server/auth";
import { all, get, nowIso, run } from "@/lib/server/db";
import { cleanText, scrubPersonal } from "@/lib/server/guard";

// Admin-only: review citizen reports and move them along new → progress → resolved with a note.
// Each change is added to the report's history, which citizens see under «Явц шалгах».

const STATUSES = ["new", "progress", "resolved"] as const;
type Status = (typeof STATUSES)[number];
const isStatus = (v: unknown): v is Status => typeof v === "string" && (STATUSES as readonly string[]).includes(v);

type Row = { tracking: string; title: string; category: string; area: string; description: string; has_photo: number; status: string; history: string; created_at: string; updated_at: string };
const toItem = (r: Row) => ({
  tracking: r.tracking, title: r.title, category: r.category, area: r.area, description: r.description,
  hasPhoto: !!r.has_photo, status: r.status, history: JSON.parse(r.history), createdAt: r.created_at, updatedAt: r.updated_at,
});

async function admin() {
  const user = await currentUser();
  return user?.role === "admin" ? user : null;
}

// Photos are left out of the list (they can be large); the card loads one through GET /api/reports?tracking=.
export async function GET(req: Request) {
  if (!(await admin())) return Response.json({ error: "Зөвхөн админ харна." }, { status: 403 });
  const s = new URL(req.url).searchParams.get("status");
  const filter = isStatus(s) ? s : null;
  const cols = "tracking, title, category, area, description, photo IS NOT NULL AS has_photo, status, history, created_at, updated_at";
  const [rows, counts] = await Promise.all([
    filter
      ? all<Row>(`SELECT ${cols} FROM reports WHERE status = ? ORDER BY created_at DESC LIMIT 100`, filter)
      : all<Row>(`SELECT ${cols} FROM reports ORDER BY created_at DESC LIMIT 100`),
    all<{ status: string; n: number }>("SELECT status, COUNT(*) AS n FROM reports GROUP BY status"),
  ]);
  const byStatus = Object.fromEntries(STATUSES.map((k) => [k, Number(counts.find((c) => c.status === k)?.n ?? 0)]));
  return Response.json({ items: rows.map(toItem), counts: byStatus });
}

export async function PATCH(req: Request) {
  if (!(await admin())) return Response.json({ error: "Зөвхөн админ төлөв өөрчилнө." }, { status: 403 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return Response.json({ error: "Хүсэлт буруу байна." }, { status: 400 }); }
  const tracking = typeof b.tracking === "string" ? b.tracking.trim().toUpperCase() : "";
  const note = scrubPersonal(cleanText(b.note, 300) ?? "");
  if (!/^OR-\d{6}-[A-Z0-9]{4,5}$/.test(tracking)) return Response.json({ error: "Хяналтын дугаар буруу байна." }, { status: 400 });
  if (!isStatus(b.status)) return Response.json({ error: "Төлөв буруу байна." }, { status: 400 });
  if (note.length < 3) return Response.json({ error: "Иргэнд харагдах тайлбар бичнэ үү (3+ тэмдэгт)." }, { status: 400 });

  const cur = await get<{ history: string }>("SELECT history FROM reports WHERE tracking = ?", tracking);
  if (!cur) return Response.json({ error: "Ийм дугаартай мэдээлэл олдсонгүй." }, { status: 404 });
  const now = nowIso();
  const history = [...JSON.parse(cur.history), { at: now, status: b.status, note }];
  await run("UPDATE reports SET status = ?, history = ?, updated_at = ? WHERE tracking = ?", b.status, JSON.stringify(history), now, tracking);
  return Response.json({ ok: true, status: b.status, history, updatedAt: now });
}
