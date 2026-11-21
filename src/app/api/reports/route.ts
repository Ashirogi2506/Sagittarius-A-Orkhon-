import { randomBytes } from "node:crypto";
import { currentUser } from "@/lib/server/auth";
import { get, nowIso, run } from "@/lib/server/db";
import { cleanText, clientKey, rateLimit, scrubPersonal } from "@/lib/server/guard";

const CATS = ["road", "air", "waste", "transport", "lighting", "water", "education", "health"];
const MAX_PHOTO = 600_000; // characters of a compressed JPEG data URL (~450 KB)

type Row = { tracking: string; title: string; category: string; area: string; description: string; photo: string | null; status: string; history: string; created_at: string };
const toReport = (r: Row) => ({
  tracking: r.tracking, title: r.title, category: r.category, area: r.area, description: r.description,
  photo: r.photo ?? undefined, status: r.status, history: JSON.parse(r.history), createdAt: r.created_at,
});

function tracking() {
  const d = new Date(Date.now() + 8 * 3600_000); // Ulaanbaatar date
  const p = (n: number) => String(n).padStart(2, "0");
  const rand = randomBytes(3).toString("hex").toUpperCase().slice(0, 5);
  return `OR-${String(d.getUTCFullYear()).slice(2)}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}-${rand}`;
}

export async function POST(req: Request) {
  const rl = rateLimit("report:" + clientKey(req), 6, 10 * 60_000);
  if (!rl.ok) return Response.json({ error: `Хэт олон мэдээлэл илгээлээ. ${rl.retryAfter} секундын дараа дахин оролдоно уу.` }, { status: 429 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return Response.json({ error: "Хүсэлт буруу байна." }, { status: 400 }); }

  const title = scrubPersonal(cleanText(b.title, 90) ?? "");
  const category = typeof b.category === "string" && CATS.includes(b.category) ? b.category : "";
  const area = cleanText(b.area, 160) ?? "";
  const description = scrubPersonal(cleanText(b.description, 600) ?? "");
  const photo = typeof b.photo === "string" && b.photo ? b.photo : null;
  if (title.length < 4 || !category || !area || description.length < 10) return Response.json({ error: "Гарчиг, ангилал, байршил, тайлбараа бөглөнө үү." }, { status: 400 });
  if (photo && (!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(photo) || photo.length > MAX_PHOTO)) return Response.json({ error: "Зураг буруу эсвэл хэт том байна." }, { status: 400 });

  const user = await currentUser();
  const now = nowIso();
  const history = [{ at: now, status: "new", note: "SMART ORKHON-д бүртгэгдлээ. Албан байгууллагад автоматаар илгээгдэхгүй (одоогоор холболтгүй)." }];
  let t = tracking();
  for (let i = 0; i < 3; i++) {
    try {
      await run("INSERT INTO reports (tracking, user_id, title, category, area, description, photo, status, history, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?)",
        t, user?.id ?? null, title, category, area, description, photo, JSON.stringify(history), now, now);
      break;
    } catch (e) { if (i === 2) throw e; t = tracking(); }
  }
  return Response.json({ report: { tracking: t, title, category, area, description, photo: photo ?? undefined, status: "new", history, createdAt: now } });
}

// Look up one report by its tracking number (the number acts as the key; no personal data is returned).
export async function GET(req: Request) {
  const rl = rateLimit("report-get:" + clientKey(req), 30, 60_000);
  if (!rl.ok) return Response.json({ error: "Хэт олон хүсэлт." }, { status: 429 });
  const t = (new URL(req.url).searchParams.get("tracking") || "").trim().toUpperCase();
  if (!/^OR-\d{6}-[A-Z0-9]{4,5}$/.test(t)) return Response.json({ error: "Хяналтын дугаар буруу байна." }, { status: 400 });
  const r = await get<Row>("SELECT tracking, title, category, area, description, photo, status, history, created_at FROM reports WHERE tracking = ?", t);
  if (!r) return Response.json({ report: null }, { status: 404 });
  return Response.json({ report: toReport(r) });
}
