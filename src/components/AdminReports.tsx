"use client";

import { ImageIcon, RefreshCw, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { ISSUE_CAT, STATUS, fmtDate } from "@/lib/labels";
import type { IssueCategory, IssueStatus } from "@/lib/types";
import { Badge, Button, Card, Empty, cn, inputCls } from "./ui";
import { useShowMore } from "./ShowMore";

type Item = {
  tracking: string; title: string; category: IssueCategory; area: string; description: string; hasPhoto: boolean;
  status: IssueStatus; history: { at: string; status: IssueStatus; note: string }[]; createdAt: string; updatedAt: string;
};
type Filter = IssueStatus | "all";

// Ready-made notes so the admin only edits the details. Whatever is saved is shown to the citizen as written.
const PRESETS: Record<IssueStatus, string> = {
  new: "Мэдээллийг дахин шалгаж байна.",
  progress: "Хариуцах байгууллагад шилжүүлсэн. Шийдвэрлэх ажил эхэлсэн.",
  resolved: "Асуудлыг шийдвэрлэсэн.",
};

async function fetchList(f: Filter): Promise<{ items: Item[]; counts: Record<IssueStatus, number> }> {
  const r = await fetch(`/api/reports/admin${f === "all" ? "" : `?status=${f}`}`);
  const d = await r.json();
  if (!r.ok) throw new Error(d.error);
  return d;
}

/** Admin-only list of citizen reports with a status + note form; each change shows up under «Явц шалгах». */
export function AdminReports() {
  const { showToast } = useStore();
  const [items, setItems] = useState<Item[] | null>(null);
  const [counts, setCounts] = useState<Record<IssueStatus, number>>({ new: 0, progress: 0, resolved: 0 });
  const [filter, setFilter] = useState<Filter>("new");
  const [error, setError] = useState("");

  const load = useCallback((f: Filter) => fetchList(f)
    .then((d) => { setError(""); setItems(d.items); setCounts(d.counts); })
    .catch((ex) => setError(ex instanceof Error ? ex.message : "Ачаалж чадсангүй.")), []);
  useEffect(() => {
    fetchList(filter).then((d) => { setError(""); setItems(d.items); setCounts(d.counts); })
      .catch((ex) => setError(ex instanceof Error ? ex.message : "Ачаалж чадсангүй."));
  }, [filter]);

  const more = useShowMore(items ?? [], 5, "Бусад мэдээлэл");
  const total = counts.new + counts.progress + counts.resolved;

  return (
    <Card className="mt-6 p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-lg font-semibold"><ShieldCheck className="h-5 w-5 text-cyan" />Ирсэн мэдээллүүд (админ)</h3>
        <button type="button" onClick={() => void load(filter)} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-muted hover:text-snow"><RefreshCw className="h-4 w-4" />Шинэчлэх</button>
      </div>
      <p className="mb-4 text-sm text-muted">Төлөвийг өөрчлөхөд бичсэн тайлбар тань иргэний «Явц шалгах» хэсэгт яг тэр чигээрээ харагдана. Хувийн мэдээлэл (утас, нэр, регистр) бүү бич.</p>
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Төлөвөөр шүүх">
        {(["new", "progress", "resolved", "all"] as Filter[]).map((f) => (
          <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}
            className={cn("rounded-md border px-3.5 py-1.5 text-sm font-semibold transition", filter === f ? "border-cyan bg-cyan/15 text-snow" : "border-line text-muted hover:text-snow")}>
            {f === "all" ? "Бүгд" : STATUS[f].label} <span className="ml-1 tabular-nums text-muted">{f === "all" ? total : counts[f]}</span>
          </button>
        ))}
      </div>
      {error ? <p className="text-sm text-alert">{error}</p> : items === null ? <div className="h-32 animate-pulse rounded-xl bg-snow/5" /> : !items.length ? (
        <Empty title="Энэ төлөвтэй мэдээлэл алга" text="Иргэд асуудал мэдээлэхэд энд гарч ирнэ." />
      ) : (
        <div>{more.anchor}
          <ul className="grid gap-3">
            {more.visible.map((it) => (
              <AdminItem key={it.tracking} it={it} onSaved={(u) => {
                showToast("Төлөв шинэчлэгдлээ");
                // Leave the filtered view once the item no longer matches it, and keep the counters right.
                setCounts((c) => (u.status === it.status ? c : { ...c, [it.status]: c[it.status] - 1, [u.status]: c[u.status] + 1 }));
                setItems((list) => (list ?? []).flatMap((x) => (x.tracking !== it.tracking ? [x] : filter !== "all" && filter !== u.status ? [] : [{ ...x, ...u }])));
              }} />
            ))}
          </ul>{more.button}
        </div>
      )}
    </Card>
  );
}

function AdminItem({ it, onSaved }: { it: Item; onSaved: (u: Pick<Item, "status" | "history" | "updatedAt">) => void }) {
  const [status, setStatus] = useState<IssueStatus>(it.status === "new" ? "progress" : it.status);
  const [note, setNote] = useState(PRESETS[it.status === "new" ? "progress" : it.status]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      const r = await fetch("/api/reports/admin", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tracking: it.tracking, status, note }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      onSaved({ status: d.status, history: d.history, updatedAt: d.updatedAt });
    } catch (ex) { setErr(ex instanceof Error ? ex.message : "Хадгалж чадсангүй."); } finally { setBusy(false); }
  }

  async function showPhoto() {
    try { const d = await fetch(`/api/reports?tracking=${it.tracking}`).then((r) => r.json()); setPhoto(d.report?.photo ?? null); } catch { setErr("Зургийг ачаалж чадсангүй."); }
  }

  return (
    <li className="rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold">{it.title}</p>
          <p className="text-xs text-muted"><code className="text-cyan">{it.tracking}</code> · {ISSUE_CAT[it.category]} · {it.area} · {fmtDate(it.createdAt, true)}</p>
        </div>
        <Badge className={STATUS[it.status].cls}>{STATUS[it.status].label}</Badge>
      </div>
      <p className="mt-2 whitespace-pre-line text-sm">{it.description}</p>
      {it.hasPhoto && (photo
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={photo} alt="Иргэний хавсаргасан зураг" className="mt-2 max-h-56 rounded-lg border border-line object-cover" />
        : <button type="button" onClick={showPhoto} className="mt-2 inline-flex items-center gap-1.5 text-sm text-cyan underline"><ImageIcon className="h-4 w-4" />Зураг харах</button>)}
      <details className="mt-2 text-xs text-muted">
        <summary className="cursor-pointer">Түүх ({it.history.length})</summary>
        <ul className="mt-1 space-y-0.5">{it.history.map((h, i) => <li key={i}>{fmtDate(h.at, true)} · {STATUS[h.status].label} — {h.note}</li>)}</ul>
      </details>
      <form onSubmit={save} className="mt-3 grid gap-2 sm:grid-cols-[180px_1fr_auto]">
        <label className="sr-only" htmlFor={`st-${it.tracking}`}>Шинэ төлөв</label>
        <select id={`st-${it.tracking}`} className={inputCls} value={status} onChange={(e) => { const s = e.target.value as IssueStatus; setStatus(s); setNote(PRESETS[s]); }}>
          {(Object.keys(STATUS) as IssueStatus[]).map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
        </select>
        <label className="sr-only" htmlFor={`nt-${it.tracking}`}>Иргэнд харагдах тайлбар</label>
        <input id={`nt-${it.tracking}`} className={inputCls} value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="Иргэнд харагдах тайлбар" />
        <Button type="submit" disabled={busy}>{busy ? "Хадгалж байна…" : "Хадгалах"}</Button>
      </form>
      {err && <p className="mt-2 text-sm text-alert" role="alert">{err}</p>}
    </li>
  );
}
