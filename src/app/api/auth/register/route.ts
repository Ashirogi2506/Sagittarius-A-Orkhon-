import { createUser, EMAIL_RE, findUserByEmail, startSession } from "@/lib/server/auth";
import { cleanText, clientKey, rateLimit } from "@/lib/server/guard";

export async function POST(req: Request) {
  const rl = rateLimit("register:" + clientKey(req), 5, 10 * 60_000);
  if (!rl.ok) return Response.json({ error: `Хэт олон оролдлого. ${rl.retryAfter} секундын дараа дахин оролдоно уу.` }, { status: 429 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return Response.json({ error: "Хүсэлт буруу байна." }, { status: 400 }); }

  const name = cleanText(b.name, 60) ?? "";
  const email = (cleanText(b.email, 254) ?? "").toLowerCase();
  const password = typeof b.password === "string" ? b.password : "";
  const area = cleanText(b.area, 60);
  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Нэрээ бичнэ үү (2+ тэмдэгт).";
  if (!EMAIL_RE.test(email)) errors.email = "Имэйл хаяг буруу байна.";
  if (password.length < 8 || password.length > 200) errors.password = "Нууц үг 8-аас дээш тэмдэгт байна.";
  if (b.consent !== true) errors.consent = "Үйлчилгээний нөхцөлийг зөвшөөрнө үү.";
  if (Object.keys(errors).length) return Response.json({ error: "Мэдээллээ шалгана уу.", errors }, { status: 400 });
  if (await findUserByEmail(email)) return Response.json({ error: "Энэ имэйлээр бүртгэл үүссэн байна. Нэвтэрнэ үү.", errors: { email: "Бүртгэлтэй имэйл" } }, { status: 409 });

  const user = await createUser(name, email, password, area);
  await startSession(user.id);
  return Response.json({ user });
}
