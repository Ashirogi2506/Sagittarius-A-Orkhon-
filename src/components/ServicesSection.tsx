"use client";

import { ChevronDown, Clock, ExternalLink, MapPin, Phone, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  FEES, SERVICE_CAT, SERVICE_ORGS, feeTotal, hoursText, openState, tg,
  type Fee, type OpenState, type ServiceCat, type ServiceOrg,
} from "@/lib/data/services";
import { useShowMore } from "./ShowMore";
import { useStore } from "@/lib/store";
import { Button, Card, Empty, SectionHead, cn, inputCls } from "./ui";

const STATE: Record<OpenState, { label: string; cls: string }> = {
  open: { label: "Одоо ажиллаж байна", cls: "border-emerald/40 bg-emerald/10 text-emerald" },
  lunch: { label: "Цайны цаг", cls: "border-warn/40 bg-warn/10 text-warn" },
  closed: { label: "Одоо хаалттай", cls: "border-line bg-snow/5 text-muted" },
  unknown: { label: "Цаг тодорхойгүй", cls: "border-line bg-snow/5 text-muted" },
};

const norm = (s: string) => s.toLowerCase().replace(/ё/g, "е");
const telHref = (p: string) => "tel:" + p.replace(/\(.*\)/, "").replace(/[^\d]/g, "");
const host = (u: string) => u.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "").slice(0, 32);

export function ServicesSection() {
  const { askAI } = useStore();
  const [tab, setTab] = useState<"orgs" | "fees">("orgs");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<ServiceCat | "all">("all");
  // The clock is read only after mount so the server render and the first client render match.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, []);

  const orgs = useMemo(() => {
    const n = norm(q.trim());
    return SERVICE_ORGS.filter((o) => (cat === "all" || o.cat === cat)
      && (!n || norm([o.name, o.does, ...o.services, o.address].join(" ")).includes(n)));
  }, [q, cat]);

  const fees = useMemo(() => {
    const n = norm(q.trim());
    return FEES.filter((f) => !n || norm([f.group, f.name, f.note ?? ""].join(" ")).includes(n));
  }, [q]);
  const groups = [...new Set(fees.map((f) => f.group))];
  // While searching or filtering, show every match; otherwise start with six cards.
  const moreOrgs = useShowMore(orgs, q.trim() || cat !== "all" ? orgs.length : 6, "Бүх байгууллага");

  return (
    <section id="services" className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14" aria-labelledby="services-title">
      <SectionHead id="services-title" title="Төрийн үйлчилгээ" />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="Төрийн үйлчилгээ" className="flex rounded-xl border border-line bg-snow/5 p-1">
          {([["orgs", "Байгууллагууд"], ["fees", "Үйлчилгээний хураамж"]] as const).map(([k, l]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
              className={cn("rounded-lg px-3.5 py-2 text-sm font-medium transition", tab === k ? "bg-cyan text-white" : "text-muted hover:text-snow")}>{l}</button>
          ))}
        </div>
        <label className="relative min-w-[220px] flex-1">
          <span className="sr-only">Хайх</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className={cn(inputCls, "pl-9")} value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={tab === "orgs" ? "Жишээ: иргэний үнэмлэх, тэтгэвэр, тоолуур" : "Жишээ: паспорт, төрсний гэрчилгээ"} />
        </label>
      </div>

      {tab === "orgs" ? (
        <>
          <div className="mb-4 flex flex-wrap gap-2" aria-label="Ангилал">
            {(["all", ...Object.keys(SERVICE_CAT)] as (ServiceCat | "all")[]).map((k) => (
              <button key={k} type="button" aria-pressed={cat === k} onClick={() => setCat(k)}
                className={cn("rounded-md border px-3 py-1.5 text-[13px] transition", cat === k ? "border-cyan bg-cyan/15 text-snow" : "border-line text-muted hover:text-snow")}>
                {k === "all" ? "Бүгд" : `${SERVICE_CAT[k].icon} ${SERVICE_CAT[k].label}`}
              </button>
            ))}
          </div>
          {orgs.length ? (
            <>
              {moreOrgs.anchor}
              <ul className="grid border-t border-line md:grid-cols-2 md:gap-x-8 xl:grid-cols-3">
                {moreOrgs.visible.map((o) => <OrgCard key={o.id} o={o} state={now === null ? null : openState(o.hours, now)} />)}
              </ul>
              {moreOrgs.button}
            </>
          ) : (
            <Card className="p-5"><Empty title="Олдсонгүй" text="Өөр үгээр хайж үзнэ үү, эсвэл Орхон AI туслахаас асуугаарай."
              action={<Button variant="ghost" size="sm" onClick={() => askAI(q ? `${q} хаана хийлгэх вэ?` : "Эрдэнэтэд төрийн үйлчилгээ хаана авах вэ?")}>AI-аас асуух</Button>} /></Card>
          )}
        </>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="grid gap-5">
            {groups.length ? groups.map((g) => <FeeGroup key={g} title={g} fees={fees.filter((f) => f.group === g)} all={!!q.trim()} />)
              : <Card className="p-5"><Empty title="Олдсонгүй" text="Өөр үгээр хайж үзнэ үү." /></Card>}
          </div>
          <Card className="h-fit p-5 text-sm text-muted">
            Хураамж өөрчлөгдөж болох тул очихоосоо өмнө <a href="tel:70358118" className="font-semibold text-cyan">7035-8118</a> утсаар лавлаарай.
          </Card>
        </div>
      )}

    </section>
  );
}

function FeeGroup({ title, fees, all }: { title: string; fees: Fee[]; all: boolean }) {
  const more = useShowMore(fees, all ? fees.length : 3, "Бусад");
  return (
    <Card className="p-4 md:p-5">
      {more.anchor}
      <h3 className="mb-3 font-display text-lg font-bold">{title}</h3>
      <ul className="divide-y divide-line">
        {more.visible.map((f) => (
          <li key={f.id} className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium leading-snug">{f.name}</p>
              <p className="shrink-0 font-display text-lg font-bold tabular-nums text-cyan">{tg(feeTotal(f))}</p>
            </div>
            {f.items.length > 1 && <p className="mt-1 text-[13px] text-muted">{f.items.map((i) => `${i.label} ${tg(i.amount)}`).join(" + ")}</p>}
            {f.note && <p className="mt-1 text-[13px] text-muted">{f.note}</p>}
            <p className="mt-1 text-xs text-muted">{f.where}</p>
          </li>
        ))}
      </ul>
      {more.button}
    </Card>
  );
}

function OrgCard({ o, state }: { o: ServiceOrg; state: OpenState | null }) {
  const [open, setOpen] = useState(false);
  const st = state ? STATE[state] : null;
  return (
    <li className="flex flex-col border-b border-line">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="flex min-h-11 items-start gap-3 py-3.5 text-left">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-snow/5 text-xl" aria-hidden="true">{SERVICE_CAT[o.cat].icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold leading-snug">{o.name}</span>
          <span className="mt-0.5 block text-[14px] leading-snug text-muted">{o.does}</span>
        </span>
        <ChevronDown className={cn("mt-1 h-5 w-5 shrink-0 text-cyan transition", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open && (
        <div className="grid gap-1.5 pb-4 pl-[52px] text-sm">
          <p className="flex items-start gap-2"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
            <span>{hoursText(o.hours)}{st && <span className={cn("ml-2 inline-block rounded-md border px-2 py-0.5 align-middle text-xs", st.cls)}>{st.label}</span>}</span></p>
          {o.hoursNote && <p className="pl-6 text-[13px] text-muted">{o.hoursNote}</p>}
          <p className="flex items-start gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
            <span className="flex flex-wrap gap-x-3">{o.phones.map((p) => <a key={p} href={telHref(p)} className="hover:text-cyan">{p}</a>)}</span></p>
          <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan" /><span>{o.address}</span></p>
          <p className="mt-2 font-semibold">Үзүүлдэг үйлчилгээ</p>
          <ul className="list-disc space-y-1 pl-5 text-muted">{o.services.map((s) => <li key={s}>{s}</li>)}</ul>
          {o.web && <a href={o.web} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 self-start text-cyan hover:underline"><ExternalLink className="h-3.5 w-3.5" />{host(o.web)}</a>}
        </div>
      )}
    </li>
  );
}
