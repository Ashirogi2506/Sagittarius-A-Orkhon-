"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BellRing, Mail, MessageSquare, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useStore, isRelevant, rankForUser, type Prefs } from "@/lib/store";
import { ANN_CAT, VERIFY, fmtDate } from "@/lib/labels";
import { LocationPicker } from "./LocationPicker";
import { Badge, Button, cn } from "./ui";

const TOPICS: [keyof Prefs["topics"], string][] = [
  ["traffic", "Замын түгжрэл (камер, 5 мин тутам)"],
  ["water", "Усны мэдэгдэл"], ["electricity", "Цахилгааны мэдэгдэл"], ["road", "Замын мэдээ"],
  ["transport", "Нийтийн тээвэр"], ["emergency", "Онцгой байдлын анхааруулга"],
];

export function NotificationCenter({ open, fresh, onClose }: { open: boolean; fresh: string[]; onClose: () => void }) {
  const { announcements, readIds, markRead, prefs, setPrefs, showToast } = useStore();
  const [tab, setTab] = useState<"inbox" | "history" | "prefs">("inbox");
  const relevant = rankForUser(announcements.filter((a) => isRelevant(a, prefs)), prefs);
  const unread = relevant.filter((a) => !readIds.includes(a.id));
  // «Шинэ» keeps what was new when the bell was opened, even though it is now marked read.
  const inbox = relevant.filter((a) => fresh.includes(a.id) || !readIds.includes(a.id));
  const history = announcements.filter((a) => readIds.includes(a.id) && !fresh.includes(a.id));
  const list = tab === "inbox" ? inbox : history;

  // Browser notifications for new relevant items (only after the user grants permission).
  useEffect(() => {
    if (!prefs.browserNotify || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    let done: string[] = [];
    try { done = JSON.parse(localStorage.getItem("so.notified") || "[]"); } catch { /* ignore */ }
    const fresh = unread.filter((a) => !done.includes(a.id)).slice(0, 3);
    for (const a of fresh) {
      try { new Notification(`SMART ORKHON · ${ANN_CAT[a.category].label}`, { body: `${a.title}${a.verification === "demo" ? " (жишээ)" : ""}`, tag: a.id }); } catch { /* unsupported */ }
    }
    if (fresh.length) try { localStorage.setItem("so.notified", JSON.stringify([...done, ...fresh.map((a) => a.id)])); } catch { /* ignore */ }
  }, [unread, prefs.browserNotify]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function enableBrowser(on: boolean) {
    if (!on) { setPrefs({ ...prefs, browserNotify: false }); return; }
    if (typeof Notification === "undefined") { showToast("Энэ хөтөч мэдэгдэл дэмжихгүй байна."); return; }
    const p = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
    if (p === "granted") { setPrefs({ ...prefs, browserNotify: true }); showToast("Хөтчийн мэдэгдэл асаалаа."); }
    else showToast("Хөтчийн мэдэгдлийн зөвшөөрөл өгөгдөөгүй байна.");
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-50 bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside role="dialog" aria-modal="true" aria-label="Мэдэгдлийн төв"
            className="fixed right-0 top-0 z-50 flex h-dvh w-full max-w-md flex-col border-l border-line bg-white"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 280 }}>
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div className="flex items-center gap-2"><BellRing className="h-5 w-5 text-cyan" /><h2 className="font-display text-lg font-semibold">Мэдэгдлийн төв</h2></div>
              <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-snow/10" aria-label="Хаах"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex gap-1 border-b border-line px-4 py-2" role="tablist">
              {([["inbox", `Шинэ (${inbox.length})`], ["history", "Түүх"], ["prefs", "Тохиргоо"]] as const).map(([k, l]) => (
                <button key={k} role="tab" aria-selected={tab === k} type="button" onClick={() => setTab(k)}
                  className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", tab === k ? "bg-cyan/15 text-cyan" : "text-muted hover:text-snow")}>{l}</button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {tab !== "prefs" ? (
                list.length ? (
                  <ul className="flex flex-col gap-2.5">
                    {list.map((a) => (
                      <li key={a.id}>
                        <a href={`#ann-${a.id}`} onClick={() => { markRead(a.id); onClose(); }}
                          className="block rounded-xl border border-line bg-navy p-3.5 transition hover:border-cyan/40">
                          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                            <Badge color={ANN_CAT[a.category].color}>{ANN_CAT[a.category].label}</Badge>
                            <Badge className={VERIFY[a.verification].cls}>{VERIFY[a.verification].label}</Badge>
                          </div>
                          <p className="text-sm font-semibold leading-snug">{a.title}</p>
                          <p className="mt-1 text-xs text-muted">{a.organization} · {fmtDate(a.publishedAt)}</p>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-12 text-center text-sm text-muted">{tab === "inbox" ? "Таны байршилд шинэ мэдэгдэл алга." : "Уншсан мэдэгдэл хараахан алга."}</p>
                )
              ) : (
                <div className="flex flex-col gap-6">
                  <section>
                    <h3 className="mb-3 text-sm font-bold">Миний байршил</h3>
                    <LocationPicker />
                    <p className="mt-2 text-xs text-muted">Таны байршилд хамаарах мэдэгдэл эхэнд харагдана.</p>
                  </section>
                  <section>
                    <h3 className="mb-3 text-sm font-bold">Захиалах сэдэв</h3>
                    <div className="flex flex-col gap-2">
                      {TOPICS.map(([k, l]) => (
                        <label key={k} className="flex cursor-pointer items-center justify-between rounded-xl border border-line px-3.5 py-2.5 text-sm">
                          {l}
                          <input type="checkbox" className="h-4 w-4 accent-[#1f5fbf]" checked={prefs.topics[k]} onChange={(e) => setPrefs({ ...prefs, topics: { ...prefs.topics, [k]: e.target.checked } })} />
                        </label>
                      ))}
                    </div>
                  </section>
                  <section>
                    <h3 className="mb-3 text-sm font-bold">Мэдэгдэл хүлээн авах суваг</h3>
                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-cyan/30 bg-cyan/5 px-3.5 py-2.5 text-sm">
                      <span className="flex items-center gap-2"><BellRing className="h-4 w-4 text-cyan" />Хөтчийн мэдэгдэл</span>
                      <input type="checkbox" className="h-4 w-4 accent-[#1f5fbf]" checked={prefs.browserNotify} onChange={(e) => enableBrowser(e.target.checked)} />
                    </label>
                    {[[Smartphone, "SMS"], [Mail, "Имэйл"], [MessageSquare, "Push мэдэгдэл (апп)"]].map(([Icon, l]) => {
                      const I = Icon as typeof Mail;
                      return (
                        <div key={l as string} className="mt-2 flex items-center justify-between rounded-xl border border-line px-3.5 py-2.5 text-sm text-muted">
                          <span className="flex items-center gap-2"><I className="h-4 w-4" />{l as string}</span>
                          <span className="text-xs">Үйлчилгээ үзүүлэгч холбогдоогүй</span>
                        </div>
                      );
                    })}
                    <p className="mt-2 text-xs text-muted">SMS, имэйлийн сувгийн бүтэц бэлэн боловч бодит үйлчилгээ үзүүлэгч холбогдоогүй тул одоогоор ажиллахгүй.</p>
                  </section>
                  <Button variant="ghost" onClick={() => { setTab("inbox"); showToast("Тохиргоо хадгалагдлаа."); }}>Хадгалах</Button>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
