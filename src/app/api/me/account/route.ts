import { cookies } from "next/headers";
import { currentUser, findUserByEmail, verifyPassword } from "@/lib/server/auth";
import { batch, bump } from "@/lib/server/db";
import { clientKey, rateLimit } from "@/lib/server/guard";

// Deletes the signed-in account (Google Play requires in-app account deletion).
// Removed: the account, its sessions and its AI question history.
// Kept without a name: reports the person filed, so the tracking numbers and city statistics stay correct.
export async function DELETE(req: Request) {
  const rl = rateLimit("acct-del:" + clientKey(req), 5, 10 * 60_000);
  if (!rl.ok) return Response.json({ error: `Хэт олон оролдлого. ${rl.retryAfter} секундын дараа дахин оролдоно уу.` }, { status: 429 });
  const user = await currentUser();
  if (!user) return Response.json({ error: "Нэвтэрнэ үү." }, { status: 401 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return Response.json({ error: "Хүсэлт буруу байна." }, { status: 400 }); }
  const row = await findUserByEmail(user.email);
  if (!row || typeof b.password !== "string" || !verifyPassword(b.password, row.pass)) {
    return Response.json({ error: "Нууц үг буруу байна." }, { status: 403 });
  }
  await batch([
    { sql: "DELETE FROM sessions WHERE user_id = ?", args: [user.id] },
    { sql: "UPDATE reports SET user_id = NULL WHERE user_id = ?", args: [user.id] },
    { sql: "DELETE FROM users WHERE id = ?", args: [user.id] },
    bump("users", -1),
  ]);
  (await cookies()).delete("so_session");
  return Response.json({ ok: true });
}
