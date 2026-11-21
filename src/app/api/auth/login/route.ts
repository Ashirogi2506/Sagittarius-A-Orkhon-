import { findUserByEmail, publicUser, startSession, verifyPassword } from "@/lib/server/auth";
import { cleanText, clientKey, rateLimit } from "@/lib/server/guard";

export async function POST(req: Request) {
  const rl = rateLimit("login:" + clientKey(req), 10, 10 * 60_000);
  if (!rl.ok) return Response.json({ error: `Хэт олон оролдлого. ${rl.retryAfter} секундын дараа дахин оролдоно уу.` }, { status: 429 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return Response.json({ error: "Хүсэлт буруу байна." }, { status: 400 }); }
  const email = (cleanText(b.email, 254) ?? "").toLowerCase();
  const password = typeof b.password === "string" ? b.password.slice(0, 200) : "";
  const row = email && password ? await findUserByEmail(email) : undefined;
  // Same message for unknown email and wrong password, so accounts cannot be enumerated.
  if (!row || !verifyPassword(password, row.pass)) return Response.json({ error: "Имэйл эсвэл нууц үг буруу байна." }, { status: 401 });
  await startSession(row.id);
  return Response.json({ user: publicUser(row) });
}
