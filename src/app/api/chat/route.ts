import { buildContext, SYSTEM_PROMPT } from "@/lib/server/knowledge";
import { demoAnswer } from "@/lib/server/demoBot";
import { busQuestionHint } from "@/lib/server/alerts";
import { isTrafficQuestion, trafficAnswer } from "@/lib/integrations/traffic";
import { currentUser } from "@/lib/server/auth";
import { callGemini, cleanText, clientKey, geminiErrorMessage, rateLimit, scrubPersonal } from "@/lib/server/guard";

// Earlier turns longer than this are cut, not rejected.
const HISTORY_MAX = 2000;

const URL_RE = /https?:\/\/[^\s)\]"«»,]+/g;
const trimUrl = (u: string) => u.replace(/[.;:!?]+$/, "");
const hostStem = (u: string) => u.replace(/^https?:\/\//, "").split("/")[0].split(".").slice(0, -1).join(".");

// Gemini Lite sometimes rewrites a domain it copies (burtgel.gov.mn → burtgel.gov.vn), which sends people to a
// wrong site. Every link in a reply must come from the prompt, so a link that is not there is replaced by the
// prompt link with the same path, or else the same host apart from the last domain label. Unmatched links stay.
function fixLinks(reply: string, source: string): string {
  const known = [...new Set((source.match(URL_RE) ?? []).map(trimUrl))];
  return reply.replace(URL_RE, (raw) => {
    const url = trimUrl(raw);
    if (known.includes(url)) return raw;
    const path = url.replace(/^https?:\/\/[^/]+/, "");
    const match = (path.length > 1 && known.find((k) => k.endsWith(path)))
      || (!path.replace("/", "") && known.find((k) => hostStem(k) === hostStem(url) && !k.replace(/^https?:\/\/[^/]+/, "").replace("/", "")))
      || undefined;
    return match ? match + raw.slice(url.length) : raw;
  });
}

// Hard limit: whatever the model writes, at most this many sentences reach the user.
const MAX_SENTENCES = 2;

// A sentence ends at a line break, or at . ! ? … followed by a space and a character that is not a lowercase letter
// (so "г.м. зэрэг" stays whole). Dots inside links and numbers (2026.11.20, -6.5°C) have no space after them.
function capSentences(text: string, max = MAX_SENTENCES): string {
  const parts = text
    .split(/\n+/)
    .flatMap((line) => line.trim().split(/(?<=[.!?…])\s+(?=[^\sa-zа-яёөү])/u))
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length <= max) return text.trim();
  console.warn(`[chat] reply had ${parts.length} sentences, cut to ${max}`);
  return parts.slice(0, max).join(" ");
}

export async function POST(req: Request) {
  const rl = rateLimit("chat:" + clientKey(req), 12, 60_000);
  if (!rl.ok) return Response.json({ error: `Хэт олон хүсэлт илгээлээ. ${rl.retryAfter} секундын дараа дахин оролдоно уу.` }, { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch { return Response.json({ error: "Хүсэлт буруу байна." }, { status: 400 }); }
  const b = body as { messages?: unknown; area?: unknown };
  if (!Array.isArray(b.messages) || b.messages.length === 0 || b.messages.length > 20) {
    return Response.json({ error: "Мессеж буруу байна." }, { status: 400 });
  }
  // Only the new question has a hard length limit. Earlier turns are context: the assistant's own replies are
  // often longer than 1200 characters, and rejecting them used to break the chat for good after one long answer.
  const raw = b.messages.slice(-10) as { role?: unknown; text?: unknown }[];
  const last = raw[raw.length - 1];
  if (last.role !== "user") return Response.json({ error: "Сүүлийн мессеж хэрэглэгчийнх байх ёстой." }, { status: 400 });
  if (!cleanText(last.text, 1200)) return Response.json({ error: "Асуулт хоосон эсвэл хэт урт байна (1200 тэмдэгтээс бага)." }, { status: 400 });
  const msgs: { role: "user" | "model"; text: string }[] = [];
  for (const mm of raw) {
    if (mm.role !== "user" && mm.role !== "assistant") continue;
    const text = cleanText(typeof mm.text === "string" ? mm.text.slice(0, HISTORY_MAX) : mm.text, HISTORY_MAX);
    if (!text) continue;
    const role = mm.role === "user" ? "user" : "model";
    const clean = role === "user" ? scrubPersonal(text) : text;
    // Keep turns alternating (a failed request leaves two user turns in a row) and start with the user.
    const prev = msgs[msgs.length - 1];
    if (prev?.role === role) prev.text += "\n\n" + clean;
    else if (msgs.length || role === "user") msgs.push({ role, text: clean });
  }
  const area = cleanText(b.area, 60) || undefined;

  const question = scrubPersonal(cleanText(last.text, 1200)!);
  const [{ text: baseCtx, anns, traffic }, hint] = await Promise.all([buildContext(), busQuestionHint(question).catch(() => "")]);
  const ctx = hint ? `${hint}\n\n${baseCtx}` : baseCtx;
  // Without Gemini, traffic questions still get the real camera data (rule-based, labelled "live").
  const fallback = () => (isTrafficQuestion(question) ? { reply: capSentences(trafficAnswer(traffic)), mode: "live" } : { reply: capSentences(demoAnswer(question, anns, area)), mode: "demo" });

  // Questions are not stored anywhere: the chat lives only in the open browser tab.
  const user = await currentUser().catch(() => null);

  if (!process.env.GEMINI_API_KEY) { return Response.json(fallback()); }
  try {
    const system = `${SYSTEM_PROMPT}\n\nХэрэглэгчийн сонгосон байршил: ${area || user?.area || "сонгоогүй"}.\n\nКОНТЕКСТ:\n${ctx}`;
    const { text: rawReply, model } = await callGemini(system, msgs);
    const reply = capSentences(fixLinks(rawReply, system));
    return Response.json({ reply, mode: "gemini", model });
  } catch (e) {
    const code = e instanceof Error ? e.message : "ERR";
    const f = fallback();
    return Response.json({ ...f, warning: geminiErrorMessage(code) });
  }
}
