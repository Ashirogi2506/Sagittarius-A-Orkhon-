"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import type { ChatMessage } from "@/lib/types";
import { cn } from "./ui";

const SUGGESTED = [
  "Одоо хаана түгжрэлтэй байна?",
  "Манай багт ус тасрах уу?",
  "Өнөөдөр ямар мэдэгдэл байна?",
  "Асуудал хэрхэн мэдээлэх вэ?",
  "Манай ойролцоо ямар асуудал байна?",
  "Шийдвэрлэгдсэн асуудлуудыг харуул.",
];

function Linkify({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s)]+)/g);
  return <>{parts.map((p, i) => (/^https?:\/\//.test(p) ? <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="break-all text-cyan underline">{p}</a> : <span key={i}>{p.replace(/\*\*/g, "")}</span>))}</>;
}

export function ChatWidget() {
  const { chatOpen, setChatOpen, chatSeed, prefs } = useStore();
  const [msgs, setMsgs] = useState<ChatMessage[]>([
    { role: "assistant", text: "Сайн байна уу, Орхоны талаар асуух зүйлээ бичээрэй." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const lastSeed = useRef<string | null>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    if (t.length > 1200) { setMsgs((m) => [...m, { role: "assistant", text: "Асуулт 1200 тэмдэгтээс богино байх ёстой.", mode: "error" }]); return; }
    const next = [...msgs, { role: "user" as const, text: t }];
    setMsgs(next); setInput(""); setBusy(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        // Earlier turns are only context, so long answers are cut to keep requests small.
        body: JSON.stringify({ messages: next.slice(1).filter((m) => m.mode !== "error").slice(-10).map(({ role, text }) => ({ role, text: text.slice(0, 2000) })), area: prefs.area || undefined }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Алдаа гарлаа. Дахин оролдоно уу.");
      setMsgs((m) => [...m, { role: "assistant", text: d.reply, mode: d.mode, warning: d.warning }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", text: e instanceof Error ? e.message : "Сүлжээний алдаа. Дахин оролдоно уу.", mode: "error" }]);
    } finally { setBusy(false); }
  }

  useEffect(() => {
    if (chatOpen && chatSeed && chatSeed !== lastSeed.current) { lastSeed.current = chatSeed; send(chatSeed); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatOpen, chatSeed]);

  return (
    <>
      <AnimatePresence>
        {chatOpen && (
          <motion.div role="dialog" aria-label="Орхон AI туслах" initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="fixed inset-x-2 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-50 flex max-h-[calc(100dvh-6rem-env(safe-area-inset-bottom))] md:bottom-24 md:max-h-[min(640px,calc(100dvh-120px))] flex-col overflow-hidden rounded-[18px] border border-line bg-white shadow-[0_24px_64px_-24px_rgba(20,33,61,.35)] sm:inset-x-auto sm:right-6 sm:w-[400px]">
            <div className="flex items-center gap-3 border-b border-line bg-white px-4 py-3.5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-cyan/10 text-cyan"><Bot className="h-5 w-5" /></span>
              <div className="flex-1"><p className="font-display text-[15px] font-semibold">Орхон AI туслах</p><p className="text-[12.5px] text-muted">Gemini, баталгаажсан мэдээлэлд тулгуурлана</p></div>
              <button type="button" onClick={() => setChatOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-snow/10" aria-label="Чат хаах"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
              {msgs.map((m, i) => (
                <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[86%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    m.role === "user" ? "rounded-br-md bg-cyan text-white" : m.mode === "error" ? "rounded-bl-md border border-alert/40 bg-alert/10" : "rounded-bl-md bg-navy-3")}>
                    {m.role === "assistant" ? <Linkify text={m.text} /> : m.text}
                    {m.warning && <p className="mt-2 text-xs text-muted">({m.warning})</p>}
                    {m.mode === "demo" && <p className="mt-2 border-t border-line pt-1.5 text-xs font-semibold text-warn">Урьдчилан бэлдсэн хариулт</p>}
                    {m.role === "assistant" && m.text.includes("dedtuv.erdenet.mn/live") && (
                      <a href="https://dedtuv.erdenet.mn/live" target="_blank" rel="noopener noreferrer"
                        className="mt-2.5 flex items-center justify-center gap-1.5 rounded-xl bg-cyan/15 px-3 py-2 text-xs font-semibold text-cyan hover:bg-cyan/25">
                        Шууд камер, газрын зураг нээх ↗
                      </a>
                    )}
                                        {m.mode === "gemini" && <p className="mt-2 border-t border-line pt-1.5 text-xs text-muted">AI хариулт алдаатай байж болно.</p>}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex justify-start" aria-label="Бичиж байна">
                  <div className="flex gap-1 rounded-2xl rounded-bl-md bg-navy-3 px-4 py-3">
                    {[0, 1, 2].map((d) => <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-cyan" style={{ animationDelay: `${d * 0.15}s` }} />)}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
            {msgs.length <= 2 && (
              <div className="flex gap-2 overflow-x-auto px-4 pb-2">
                {SUGGESTED.map((s) => <button key={s} type="button" onClick={() => send(s)} className="shrink-0 rounded-full border border-line bg-white px-3 py-1.5 text-xs text-snow transition-colors hover:border-cyan/50 hover:text-cyan">{s}</button>)}
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-end gap-2 border-t border-line p-3">
              <label htmlFor="chat-in" className="sr-only">Асуулт</label>
              <textarea id="chat-in" rows={1} value={input} onChange={(e) => setInput(e.target.value)} maxLength={1200}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                placeholder="Асуултаа бичнэ үү…" className="max-h-28 flex-1 resize-none rounded-xl border border-line bg-navy px-3.5 py-2.5 text-sm placeholder:text-muted/70 focus:border-cyan/60 focus:outline-none" />
              <button type="submit" disabled={busy || !input.trim()} className="grid h-10 w-10 place-items-center rounded-xl bg-cyan text-white transition-colors hover:bg-[#184c9c] disabled:opacity-40" aria-label="Илгээх"><Send className="h-4 w-4" /></button>
            </form>
            <p className="px-4 pb-2 text-center text-xs text-muted">Асуулт хадгалагдахгүй, утас, регистрийн дугаар автоматаар нуугдана.</p>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button type="button" onClick={() => setChatOpen(!chatOpen)} whileTap={{ scale: 0.96 }}
        className={cn("fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-50 flex h-12 items-center md:bottom-6 md:right-6 md:h-14 gap-2 rounded-full bg-cyan pl-4 pr-5 font-semibold text-white shadow-[0_10px_28px_-10px_rgba(31,95,191,.6)] transition-colors hover:bg-[#184c9c]", chatOpen && "max-md:hidden")}
        aria-label={chatOpen ? "Орхон AI туслахыг хаах" : "Орхон AI туслахыг нээх"} aria-expanded={chatOpen}>
        {chatOpen ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}<span className="hidden sm:inline">Орхон AI</span>
      </motion.button>
    </>
  );
}
