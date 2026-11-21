import { env } from "./env";

// Minimal in-memory rate limiting and input hygiene for the AI endpoints.
// Fine for a single-instance hackathon demo; use a shared store (e.g. Redis) when scaling out.
const hits = new Map<string, number[]>();

export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0].trim() : req.headers.get("x-real-ip")) || "local";
}

export function rateLimit(key: string, limit = 12, windowMs = 60_000): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (list.length >= limit) {
    hits.set(key, list);
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - list[0])) / 1000) };
  }
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return { ok: true, retryAfter: 0 };
}

// Remove things that look like phone numbers, e-mails or national ID numbers before text goes to the model.
export function scrubPersonal(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[имэйл]")
    // Mongolian register number: 2 Cyrillic letters + 8 digits. \b is ASCII-only in JS, so use lookarounds.
    .replace(/(?<![\p{L}\d])[А-ЯЁӨҮ]{2}\d{8}(?!\d)/giu, "[регистр]")
    .replace(/(\+?976[\s-]?)?\b\d{4}[\s-]?\d{4}\b/g, "[утас]");
}

export function cleanText(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
  if (!t || t.length > max) return null;
  return t;
}

// Lite first: its free daily quota is much larger, so most questions are answered on the first try.
export const GEMINI_MODEL = env("GEMINI_MODEL") || "gemini-3.5-flash-lite";
// Free-tier models change over time; when the configured one is unavailable we try these in order.
const FALLBACKS = ["gemini-flash-lite-latest", "gemini-3.5-flash", "gemini-flash-latest"];
const SKIP_MS = 5 * 60_000;
const QUOTA_SKIP_MS = 60 * 60_000;   // a used-up daily quota will not come back in 5 minutes
const skipUntil = new Map<string, number>();

export async function callGemini(system: string, contents: { role: "user" | "model"; text: string }[], json = false): Promise<{ text: string; model: string }> {
  const all = [...new Set([GEMINI_MODEL, ...FALLBACKS])];
  const now = Date.now();
  const healthy = all.filter((m) => (skipUntil.get(m) ?? 0) <= now);
  const models = healthy.length ? healthy : all;
  let last: Error = new Error("UPSTREAM");
  for (const m of models) {
    try { return { text: await callModel(m, system, contents, json), model: m }; } catch (e) {
      last = e instanceof Error ? e : new Error("UPSTREAM");
      // A timed-out or overloaded model is skipped for a while so users don't wait 15 s on every question.
      if (last.message !== "AUTH" && last.message !== "NO_KEY") skipUntil.set(m, Date.now() + (last.message === "RATE" ? QUOTA_SKIP_MS : SKIP_MS));
      if (last.message === "AUTH" || last.message === "NO_KEY") throw last;   // retrying will not help
    }
  }
  throw last;
}

async function callModel(model: string, system: string, contents: { role: "user" | "model"; text: string }[], json: boolean): Promise<string> {
  const key = env("GEMINI_API_KEY");
  if (!key) throw new Error("NO_KEY");
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: contents.map((c) => ({ role: c.role, parts: [{ text: c.text }] })),
      generationConfig: { temperature: 0.3, maxOutputTokens: 900, ...(json ? { responseMimeType: "application/json" } : {}) },
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const status = res.status;
    // Google's own reason (never includes the key) so a rejected key can be diagnosed from the server logs.
    const err = await res.json().catch(() => null);
    console.error(`[gemini] ${model} HTTP ${status} ${err?.error?.status ?? ""} ${err?.error?.details?.[0]?.reason ?? ""} ${String(err?.error?.message ?? "").slice(0, 200)}`);
    if (status === 429) throw new Error("RATE");
    if (status === 400 || status === 403) throw new Error("AUTH");
    throw new Error("UPSTREAM_" + status);
  }
  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("");
  if (!text) throw new Error("EMPTY");
  return text;
}

export function geminiErrorMessage(code: string): string {
  if (code === "RATE") return "Gemini-ийн үнэгүй хязгаарт хүрлээ. Хэсэг хугацааны дараа дахин оролдоно уу.";
  if (code === "AUTH") return "Gemini API түлхүүр буруу эсвэл эрхгүй байна. Серверийн GEMINI_API_KEY-г шалгана уу.";
  if (code === "EMPTY") return "Gemini хоосон хариу өглөө. Асуултаа өөрөөр бичээд үзнэ үү.";
  return "Gemini-тэй холбогдоход алдаа гарлаа. Түр хүлээгээд дахин оролдоно уу.";
}
