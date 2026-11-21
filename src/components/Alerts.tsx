"use client";

import dynamic from "next/dynamic";
import { CheckCircle2, MapPin, Plus, Siren, Trash2, X } from "lucide-react";
import { useState } from "react";
import { ALERT_KIND, ALERT_LEVEL, isOpen, type AlertKind, type AlertLevel, type CivicAlert } from "@/lib/civic";
import { useStore } from "@/lib/store";
import { Button, Card, Field, cn, inputCls } from "./ui";

const PointPicker = dynamic(() => import("./PointPicker"), { ssr: false, loading: () => <div className="h-56 animate-pulse rounded-xl bg-snow/5" /> });

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("mn-MN", { timeZone: "Asia/Ulaanbaatar", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }) : "");

/** Thin strip under the header for open critical/warning notices. Each can be hidden for this visit. */
export function AlertBanner() {
  const { alerts } = useStore();
  const [hidden, setHidden] = useState<number[]>([]);
  const urgent = (alerts ?? []).filter((a) => isOpen(a) && a.level !== "info" && !hidden.includes(a.id));
  if (!urgent.length) return null;
  const top = urgent[0];
  const lv = ALERT_LEVEL[top.level];
  return (
    <div role="alert" className="border-b" style={{ background: lv.color + "1f", borderColor: lv.color + "55" }}>
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 md:px-6">
        <Siren className="h-5 w-5 shrink-0" style={{ color: lv.color }} />
        <a href="#alerts" className="min-w-0 flex-1 text-sm hover:underline">
          <b style={{ color: lv.color }}>{lv.label}:</b> {ALERT_KIND[top.kind].icon} {top.title}{top.area ? ` — ${top.area}` : ""}
          {urgent.length > 1 && <span className="ml-2 text-muted">+{urgent.length - 1} мэдээлэл</span>}
        </a>
        <button type="button" onClick={() => setHidden((h) => [...h, top.id])} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg hover:bg-snow/10" aria-label="Энэ мэдээллийг нуух"><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

function AlertCard({ a, admin, onChange }: { a: CivicAlert; admin: boolean; onChange: (items: CivicAlert[]) => void }) {
  const { showToast } = useStore();
  const open = isOpen(a);
  const lv = ALERT_LEVEL[a.level];
  const k = ALERT_KIND[a.kind];
  const act = async (action: "close" | "delete") => {
    if (action === "delete" && !window.confirm("Энэ мэдээллийг бүр мөсөн устгах уу?")) return;
    const r = await fetch(`/api/alerts?id=${a.id}&action=${action}`, { method: "DELETE" });
    const d = await r.json();
    if (r.ok) { onChange(d.items); showToast(action === "close" ? "Шийдэгдсэн гэж тэмдэглэлээ" : "Устгалаа"); } else showToast(d.error);
  };
  const color = open ? lv.color : "#5b6b82";
  const time = [a.startsAt && when(a.startsAt), a.endsAt && when(a.endsAt)].filter(Boolean).join(" – ");
  const meta = [time, a.area].filter(Boolean).join(" · ");
  return (
    <li className={cn("overflow-hidden rounded-lg border-2", !open && "opacity-60")} style={{ borderColor: color }}>
      <p className="flex flex-wrap items-center gap-x-2 px-4 py-1.5 text-[13px] font-bold uppercase tracking-wider text-white md:px-5" style={{ background: color }}>
        <Siren className="h-4 w-4" aria-hidden="true" />{open ? "Яаралтай" : "Шийдэгдсэн"}
        <span className="font-semibold normal-case tracking-normal opacity-90">· {open && lv.label !== "Яаралтай" ? lv.label + " · " : ""}{k.icon} {k.label}</span>
      </p>
      <div className="p-4 md:p-5" style={{ background: color + "0d" }}>
      <h3 className="font-display text-2xl font-bold leading-tight md:text-3xl">{a.title}</h3>
      {meta && <p className="mt-2 text-[15px] font-medium">{meta}</p>}
      {a.body && <p className="mt-1.5 whitespace-pre-line text-[15px] leading-relaxed">{a.body}</p>}
      {a.lat != null && <a href="#map" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-cyan"><MapPin className="h-4 w-4" />Газрын зураг дээр</a>}
      {admin && (
        <div className="mt-3 flex flex-wrap gap-2">
          {open && <Button size="sm" variant="ghost" onClick={() => act("close")}><CheckCircle2 className="h-4 w-4" />Шийдэгдсэн</Button>}
          <Button size="sm" variant="subtle" onClick={() => act("delete")}><Trash2 className="h-4 w-4" />Устгах</Button>
        </div>
      )}
      </div>
    </li>
  );
}

/** Shown only while an urgent notice is open; admins always see it so they can post one. */
export function AlertsSection() {
  const { alerts, setAlerts, me, showToast } = useStore();
  const [showClosed, setShowClosed] = useState(false);
  const admin = me?.user?.role === "admin";
  const open = (alerts ?? []).filter((a) => isOpen(a));
  const closed = (alerts ?? []).filter((a) => !isOpen(a));
  if (!admin && !open.length) return null;
  return (
    <section id="alerts" className="mx-auto max-w-7xl px-4 pt-8 md:px-6" aria-labelledby="alerts-title">
      <h2 id="alerts-title" className="sr-only">Яаралтай мэдээ</h2>
      <div className={cn("grid gap-5", admin && "lg:grid-cols-[1fr_400px]")}>
        <div>
          {open.length ? <ul className="grid gap-3">{open.map((a) => <AlertCard key={a.id} a={a} admin={admin} onChange={setAlerts} />)}</ul>
            : <p className="rounded-lg border border-line p-4 text-sm text-muted">Идэвхтэй яаралтай мэдээ алга, иргэдэд энэ хэсэг харагдахгүй.</p>}
          <p className="mt-3 text-sm text-muted">Аюул тулгарвал <b className="text-snow">101, 102, 103, 105</b> руу залгана уу.</p>
          {admin && closed.length > 0 && (
            <div className="mt-5">
              <button type="button" className="text-sm font-semibold text-cyan" onClick={() => setShowClosed((s) => !s)} aria-expanded={showClosed}>
                {showClosed ? "Шийдэгдсэнийг нуух" : `Шийдэгдсэн / дууссан (${closed.length})`}
              </button>
              {showClosed && <ul className="mt-3 grid gap-3">{closed.map((a) => <AlertCard key={a.id} a={a} admin={admin} onChange={setAlerts} />)}</ul>}
            </div>
          )}
        </div>
        {admin && <AlertForm onSaved={(it) => { setAlerts(it); showToast("Шуурхай мэдээлэл нийтлэгдлээ"); }} />}
      </div>
    </section>
  );
}

function AlertForm({ onSaved }: { onSaved: (items: CivicAlert[]) => void }) {
  const [level, setLevel] = useState<AlertLevel>("warning");
  const [kind, setKind] = useState<AlertKind>("water");
  const [title, setTitle] = useState("");
  const [area, setArea] = useState("");
  const [body, setBody] = useState("");
  const [startsAt, setStarts] = useState("");
  const [endsAt, setEnds] = useState("");
  const [source, setSource] = useState("");
  const [point, setPoint] = useState<[number, number] | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // datetime-local has no zone; the city runs on Ulaanbaatar time (+08:00).
  const iso = (v: string) => (v ? `${v}:00+08:00` : "");

  async function save(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    if (!title.trim()) { setErr("Гарчиг бичнэ үү."); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/alerts", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, kind, title, area, body, startsAt: iso(startsAt), endsAt: iso(endsAt), source, lat: point?.[0], lng: point?.[1] }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      onSaved(d.items); setTitle(""); setBody(""); setArea(""); setPoint(null); setStarts(""); setEnds("");
    } catch (ex) { setErr(ex instanceof Error ? ex.message : "Хадгалж чадсангүй."); } finally { setBusy(false); }
  }

  return (
    <Card className="p-5">
      <h3 className="mb-3 flex items-center gap-2 font-semibold"><Plus className="h-4 w-4 text-cyan" />Шуурхай мэдээлэл нийтлэх (админ)</h3>
      <form onSubmit={save} className="grid gap-3">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Түвшин" htmlFor="a-level"><select id="a-level" className={inputCls} value={level} onChange={(e) => setLevel(e.target.value as AlertLevel)}>{(Object.keys(ALERT_LEVEL) as AlertLevel[]).map((k) => <option key={k} value={k}>{ALERT_LEVEL[k].label}</option>)}</select></Field>
          <Field label="Төрөл" htmlFor="a-kind"><select id="a-kind" className={inputCls} value={kind} onChange={(e) => setKind(e.target.value as AlertKind)}>{(Object.keys(ALERT_KIND) as AlertKind[]).map((k) => <option key={k} value={k}>{ALERT_KIND[k].icon} {ALERT_KIND[k].label}</option>)}</select></Field>
        </div>
        <Field label="Гарчиг (богино, 60 тэмдэгт хүртэл)" htmlFor="a-title"><input id="a-title" className={inputCls} value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} placeholder="Жишээ: 3-р микрод ус тасарна" /></Field>
        <Field label="Хамрах бүс" htmlFor="a-area"><input id="a-area" className={inputCls} value={area} maxLength={140} onChange={(e) => setArea(e.target.value)} placeholder="Жишээ: 3-р микро, 12-р баг" /></Field>
        <Field label="Дэлгэрэнгүй" htmlFor="a-body"><textarea id="a-body" rows={3} className={inputCls} value={body} maxLength={1000} onChange={(e) => setBody(e.target.value)} placeholder="Иргэд юу хийх вэ, жишээ нь: Ус нөөцлөөрэй." /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Эхлэх" htmlFor="a-start"><input id="a-start" type="datetime-local" className={inputCls} value={startsAt} onChange={(e) => setStarts(e.target.value)} /></Field>
          <Field label="Дуусах (таамаг)" htmlFor="a-end"><input id="a-end" type="datetime-local" className={inputCls} value={endsAt} onChange={(e) => setEnds(e.target.value)} /></Field>
        </div>
        <div>
          <p className="mb-1.5 text-sm font-semibold">Газрын зураг дээрх байршил <span className="font-normal text-muted">(дарж сонгоно, заавал биш)</span></p>
          <PointPicker value={point} onPick={setPoint} />
          {point && <p className="mt-1 flex items-center justify-between text-xs text-muted">{point[0]}, {point[1]}<button type="button" className="text-cyan" onClick={() => setPoint(null)}>Арилгах</button></p>}
        </div>
        <Field label="Эх сурвалж" htmlFor="a-src"><input id="a-src" className={inputCls} value={source} maxLength={300} onChange={(e) => setSource(e.target.value)} placeholder="Байгууллагын нэр эсвэл холбоос" /></Field>
        {err && <p className="text-sm text-alert" role="alert">{err}</p>}
        <Button type="submit" disabled={busy}>{busy ? "Нийтэлж байна…" : "Нийтлэх"}</Button>
      </form>
    </Card>
  );
}
