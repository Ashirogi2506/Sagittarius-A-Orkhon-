"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Camera, CheckCircle2, ClipboardCopy, Plus, Search, Send, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AdminReports } from "./AdminReports";
import { useStore } from "@/lib/store";
import { LOCATIONS } from "@/lib/data/places";
import { ISSUE_CAT, STATUS, fmtDate } from "@/lib/labels";
import type { IssueCategory, Report } from "@/lib/types";
import { Badge, Button, Card, Field, SectionHead, inputCls } from "./ui";

const AREAS = LOCATIONS.sums.flatMap((s) => s.areas.map((a) => `${s.name} · ${a}`));

async function compress(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const s = Math.min(1, 900 / Math.max(img.width, img.height));
    const c = document.createElement("canvas"); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.72);
  } finally { URL.revokeObjectURL(url); }
}

function Timeline({ r }: { r: Report }) {
  const steps: [Report["status"], string][] = [["new", "Бүртгэгдсэн"], ["progress", "Шийдвэрлэх шатанд"], ["resolved", "Шийдвэрлэгдсэн"]];
  const idx = steps.findIndex(([s]) => s === r.status);
  return (
    <ol className="mt-3 flex items-center gap-2" aria-label="Явц">
      {steps.map(([s, l], i) => (
        <li key={s} className="flex flex-1 items-center gap-2">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[12.5px] font-bold"
            style={i <= idx ? { background: STATUS[s].color, borderColor: STATUS[s].color, color: "#f5f7fa" } : { borderColor: "rgba(20,33,61,.25)", color: "#5b6b82" }}>{i + 1}</span>
          <span className={i <= idx ? "text-xs font-semibold" : "text-xs text-muted"}>{l}</span>
          {i < 2 && <span className="h-px flex-1 bg-line" />}
        </li>
      ))}
    </ol>
  );
}

export function ReportSection() {
  const { reports, addReport, removeReport, syncReport, showToast, me } = useStore();
  const admin = me?.user?.role === "admin";
  // Saved reports are copies in this browser; fetch their current status once so admin updates show up here too.
  const synced = useRef(false);
  useEffect(() => {
    if (synced.current || !reports.length) return;
    synced.current = true;
    for (const r of reports.slice(0, 10)) {
      fetch(`/api/reports?tracking=${encodeURIComponent(r.tracking)}`).then((res) => res.json())
        .then((d) => { if (d.report) syncReport(d.report); }).catch(() => {});
    }
  }, [reports, syncReport]);
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState<IssueCategory>("road");
  const [area, setArea] = useState(AREAS[0]);
  const [detail, setDetail] = useState("");
  const [desc, setDesc] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  // Photo and exact place are optional, so they stay folded until asked for.
  const [more, setMore] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Report | null>(null);
  const [q, setQ] = useState("");
  const [found, setFound] = useState<Report | null | undefined>(undefined);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPhoto(f?: File) {
    if (!f) return;
    if (!f.type.startsWith("image/")) { setErrors((e) => ({ ...e, photo: "Зөвхөн зураг оруулна уу." })); return; }
    if (f.size > 12 * 1024 * 1024) { setErrors((e) => ({ ...e, photo: "Зураг 12 МБ-аас бага байх ёстой." })); return; }
    try { setPhoto(await compress(f)); setErrors((e) => { const rest = { ...e }; delete rest.photo; return rest; }); } catch { setErrors((e) => ({ ...e, photo: "Зургийг уншиж чадсангүй." })); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (title.trim().length < 4) err.title = "Гарчиг дор хаяж 4 тэмдэгт байна.";
    if (desc.trim().length < 10) err.desc = "Тайлбараа арай дэлгэрэнгүй бичнэ үү (10+ тэмдэгт).";
    setErrors(err);
    if (Object.keys(err).length) return;
    setBusy(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), category: cat, area: detail.trim() ? `${area}, ${detail.trim()}` : area, description: desc.trim(), photo }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Илгээж чадсангүй.");
      const r = d.report as Report;
      addReport(r); setDone(r);
      setTitle(""); setDesc(""); setDetail(""); setPhoto(undefined); setMore(false); if (fileRef.current) fileRef.current.value = "";
    } catch (ex) {
      setErrors({ form: ex instanceof Error ? ex.message : "Илгээж чадсангүй." });
    } finally { setBusy(false); }
  }

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    const t = q.trim().toUpperCase();
    if (!t) return;
    try {
      const res = await fetch(`/api/reports?tracking=${encodeURIComponent(t)}`);
      const d = await res.json();
      setFound(d.report ?? reports.find((r) => r.tracking === t) ?? null);
      if (d.report) syncReport(d.report);
    } catch { setFound(reports.find((r) => r.tracking === t) || null); }
  }

  return (
    <section id="report" className="border-y border-line bg-navy-2/60 py-10 md:py-14" aria-labelledby="report-title">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHead id="report-title" title="Асуудал мэдээлэх" />
        <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
          <Card className="p-4 md:p-5">
            <form onSubmit={submit} noValidate className="grid gap-3">
              <Field label="Асуудлын гарчиг" htmlFor="r-title">
                <input id="r-title" className={inputCls} value={title} maxLength={90} onChange={(e) => setTitle(e.target.value)} placeholder="Жишээ: Гудамжны гэрэл асахгүй байна" aria-invalid={!!errors.title} />
                {errors.title && <p className="text-xs text-alert">{errors.title}</p>}
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Ангилал" htmlFor="r-cat">
                  <select id="r-cat" className={inputCls} value={cat} onChange={(e) => setCat(e.target.value as IssueCategory)}>
                    {Object.entries(ISSUE_CAT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </Field>
                <Field label="Байршил" htmlFor="r-area">
                  <select id="r-area" className={inputCls} value={area} onChange={(e) => setArea(e.target.value)}>
                    {AREAS.map((a) => <option key={a}>{a}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Тайлбар" htmlFor="r-desc">
                <textarea id="r-desc" rows={3} className={inputCls} value={desc} maxLength={600} onChange={(e) => setDesc(e.target.value)} placeholder="Юу болсон, хэзээнээс, хэнд нөлөөлж байгааг бичнэ үү." aria-invalid={!!errors.desc} />
                <div className="flex justify-between text-xs">{errors.desc ? <span className="text-alert">{errors.desc}</span> : <span />}<span className="text-muted">{desc.length}/600</span></div>
              </Field>
              {!more && !photo && !detail ? (
                <button type="button" onClick={() => setMore(true)} className="flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-cyan">
                  <Plus className="h-4 w-4" />Зураг, яг байршил нэмэх
                </button>
              ) : (
              <>
              <Field label="Яг байршил" htmlFor="r-detail">
                <input id="r-detail" className={inputCls} value={detail} maxLength={80} onChange={(e) => setDetail(e.target.value)} placeholder="Жишээ: 12-р байрны урд" />
              </Field>
              <div>
                <p className="mb-1.5 text-sm font-semibold">Зураг</p>
                {photo ? (
                  <div className="relative w-fit">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo} alt="Хавсаргасан зураг" className="h-36 rounded-xl border border-line object-cover" />
                    <button type="button" onClick={() => { setPhoto(undefined); if (fileRef.current) fileRef.current.value = ""; }} className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-navy/80" aria-label="Зураг хасах"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line px-4 py-2.5 text-sm text-muted transition hover:border-cyan/50 hover:text-snow">
                    <Camera className="h-5 w-5 text-cyan" />Зураг сонгох
                    <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => onPhoto(e.target.files?.[0])} />
                  </label>
                )}
                {errors.photo && <p className="mt-1 text-xs text-alert">{errors.photo}</p>}
              </div>
              </>
              )}
              {errors.form && <p className="text-sm text-alert" role="alert">{errors.form}</p>}
              <Button type="submit" disabled={busy}><Send className="h-4 w-4" />{busy ? "Хадгалж байна…" : "Илгээх"}</Button>
              <p className="text-xs text-muted">Мэдээлэл байгууллагад автоматаар очихгүй, яаралтай бол 101–105 руу залгана уу.</p>
            </form>
          </Card>

          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {done && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-lg border border-emerald/40 bg-emerald/[.08] p-5" role="status">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald" />
                    <div className="flex-1">
                      <p className="font-semibold">Таны мэдээлэл бүртгэгдлээ</p>
                      <p className="mt-1 text-sm text-muted">Хяналтын дугаар:</p>
                      <div className="mt-1 flex items-center gap-2">
                        <code className="rounded-lg bg-navy px-3 py-1.5 font-mono text-lg font-bold tracking-wider text-cyan">{done.tracking}</code>
                        <button type="button" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-snow/10" aria-label="Дугаар хуулах"
                          onClick={async () => { try { await navigator.clipboard.writeText(done.tracking); showToast("Хууллаа"); } catch { showToast(done.tracking); } }}><ClipboardCopy className="h-4 w-4" /></button>
                      </div>
                      <p className="mt-2 text-xs text-muted">Энэ дугаараар явцаа шалгана.</p>
                    </div>
                    <button type="button" onClick={() => setDone(null)} aria-label="Хаах" className="grid h-7 w-7 place-items-center rounded-lg hover:bg-snow/10"><X className="h-4 w-4" /></button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Card className="p-4">
              <h3 className="mb-2 font-semibold">Явц шалгах</h3>
              <form onSubmit={lookup} className="flex gap-2">
                <label htmlFor="track" className="sr-only">Хяналтын дугаар</label>
                <input id="track" className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} placeholder="OR-261120-XXXX" />
                <Button type="submit" variant="ghost"><Search className="h-4 w-4" />Шалгах</Button>
              </form>
              {found === null && <p className="mt-3 text-sm text-alert">Энэ дугаартай мэдээлэл олдсонгүй.</p>}
              {found && (
                <div className="mt-4 rounded-xl border border-line p-3.5">
                  <p className="font-semibold">{found.title}</p>
                  <p className="text-xs text-muted">{ISSUE_CAT[found.category]} · {found.area}</p>
                  <Timeline r={found} />
                  <ul className="mt-3 space-y-1 text-xs text-muted">{found.history.map((h, i) => <li key={i}>{fmtDate(h.at, true)} — {h.note}</li>)}</ul>
                </div>
              )}
            </Card>

            {reports.length > 0 && <Card className="p-4">
              <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Миний мэдээллүүд</h3><Badge className="border-line text-muted">{reports.length}</Badge></div>
              {reports.length ? (
                <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
                  {reports.map((r) => (
                    <li key={r.tracking} className="flex items-start gap-3 rounded-xl border border-line p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {r.photo && <img src={r.photo} alt="" className="h-12 w-12 rounded-lg object-cover" />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{r.title}</p>
                        <p className="text-xs text-muted">{r.tracking} · {fmtDate(r.createdAt)}</p>
                        {r.history.length > 1 && <p className="mt-0.5 line-clamp-2 text-xs">{r.history[r.history.length - 1].note}</p>}
                        <Badge className={`mt-1 ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</Badge>
                      </div>
                      <button type="button" onClick={() => { removeReport(r.tracking); showToast("Устгалаа"); }} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-snow/10 hover:text-alert" aria-label={`${r.title} устгах`}><Trash2 className="h-4 w-4" /></button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Card>}
          </div>
        </div>
        {admin && <AdminReports />}
      </div>
    </section>
  );
}
