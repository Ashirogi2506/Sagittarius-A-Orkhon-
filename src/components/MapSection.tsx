"use client";

import dynamic from "next/dynamic";
import { AlertCircle, Bot, CalendarDays, Car, MapPin, X, Zap } from "lucide-react";
import { useState } from "react";
import { ALERT_KIND, ALERT_LEVEL, OUTAGE_KINDS, isOpen, type AlertKind } from "@/lib/civic";
import { DEMO_ISSUES } from "@/lib/data/places";
import { ISSUE_CAT, STATUS, fmtDate } from "@/lib/labels";
import type { IssueStatus } from "@/lib/types";
import { trafficColor, useStore } from "@/lib/store";
import { TRAFFIC_AREAS, trafficArea, type TrafficArea } from "@/lib/trafficAreas";

import { Badge, Button, Card, DemoTag, SectionHead, cn } from "./ui";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <div className="grid h-[380px] place-items-center rounded-[1.25rem] bg-navy-2 text-sm text-muted md:h-[520px]">Газрын зураг ачаалж байна…</div>,
});

type Layer = "issues" | "traffic" | "outages";
const LAYERS: { id: Layer; label: string; icon: typeof Car }[] = [
  { id: "issues", label: "Иргэдийн асуудал", icon: AlertCircle },
  { id: "traffic", label: "Замын ачаалал", icon: Car },
  { id: "outages", label: "Ус, цахилгаан тасралт", icon: Zap },
];

export function MapSection() {
  const { askAI, traffic, prefs, alerts } = useStore();
  // One layer at a time, so outages are never mixed up with road load or reported problems.
  const [layer, setLayer] = useState<Layer>("issues");
  const [status, setStatus] = useState<"all" | IssueStatus>("all");
  const [kinds, setKinds] = useState<AlertKind[]>(OUTAGE_KINDS);
  const [selected, setSelected] = useState<string | null>(null);
  const [camName, setCamName] = useState<string | null>(null);
  const [outageId, setOutageId] = useState<number | null>(null);
  const [trafficRegion, setTrafficRegion] = useState<TrafficArea>("all");
  const showTraffic = layer === "traffic";
  const issues = layer === "issues" ? DEMO_ISSUES.filter((i) => status === "all" || i.status === status) : [];
  const sel = DEMO_ISSUES.find((i) => i.id === selected);
  const allCameras = showTraffic && prefs.topics.traffic && traffic?.ok ? traffic.spots : [];
  const cameras = trafficRegion === "all" ? allCameras : allCameras.filter((c) => trafficArea(c.lat, c.lng) === trafficRegion);
  const cam = cameras.find((c) => c.name === camName);
  const openOutages = (alerts ?? []).filter((a) => OUTAGE_KINDS.includes(a.kind) && isOpen(a));
  const outages = layer === "outages" ? openOutages.filter((a) => kinds.includes(a.kind) && a.lat != null && a.lng != null) : [];
  const outage = outages.find((a) => a.id === outageId);
  const clear = () => { setSelected(null); setCamName(null); setOutageId(null); };

  return (
    <section id="map" className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14" aria-labelledby="map-title">
      <SectionHead id="map-title" title="Газрын зураг"
        right={layer === "issues" ? <DemoTag>Асуудлын цэгүүд жишээ байршилтай</DemoTag> : undefined} />
      <div role="tablist" aria-label="Газрын зургийн давхарга" className="mb-3 inline-flex w-full flex-wrap gap-1 rounded-lg border border-line bg-navy p-1 sm:w-auto">
        {LAYERS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" role="tab" aria-selected={layer === id} onClick={() => { clear(); setLayer(id); }}
            className={cn("flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold transition sm:flex-none",
              layer === id ? "bg-cyan text-white" : "text-muted hover:bg-snow/5 hover:text-snow")}>
            <Icon className="h-4 w-4" />{label}
            {id === "outages" && openOutages.length > 0 && <span className={cn("rounded px-1.5 text-xs font-bold", layer === id ? "bg-navy/20" : "bg-alert text-white")}>{openOutages.length}</span>}
          </button>
        ))}
      </div>
      <div className="mb-4 flex min-h-9 flex-wrap items-center gap-2">
        {layer === "issues" && (
          <>
            {(["all", "new", "progress", "resolved"] as const).map((s) => (
              <button key={s} type="button" aria-pressed={status === s} onClick={() => setStatus(s)}
                className={cn("flex items-center gap-2 rounded-md border px-3.5 py-1.5 text-sm font-semibold transition", status === s ? "border-cyan bg-cyan/15 text-snow" : "border-line text-muted hover:text-snow")}>
                {s !== "all" && <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS[s].color }} />}
                {s === "all" ? "Бүгд" : STATUS[s].label}
              </button>
            ))}
          </>
        )}
        {layer === "traffic" && (
          <div className="flex w-full items-center gap-2 overflow-x-auto" role="group" aria-label="Хотын төвөөс ойролцоох чиглэлээр шүүх">
            {TRAFFIC_AREAS.map((area) => (
              <button key={area.id} type="button" aria-pressed={trafficRegion === area.id}
                onClick={() => { clear(); setTrafficRegion(area.id); }}
                className={cn("min-h-11 shrink-0 rounded-md border px-3 text-sm font-semibold", trafficRegion === area.id ? "border-cyan bg-cyan/15 text-cyan" : "border-line text-muted hover:text-snow")}>
                {area.label}
              </button>
            ))}
            <span className="shrink-0 text-xs text-muted">Хотын төвөөс ойролцоогоор</span>
          </div>
        )}
        {layer === "outages" && OUTAGE_KINDS.map((k) => (
          <button key={k} type="button" aria-pressed={kinds.includes(k)} onClick={() => { setOutageId(null); setKinds((x) => (x.includes(k) ? x.filter((y) => y !== k) : [...x, k])); }}
            className={cn("flex items-center gap-2 rounded-md border px-3.5 py-1.5 text-sm font-semibold transition", kinds.includes(k) ? "text-snow" : "border-line text-muted line-through opacity-70")}
            style={kinds.includes(k) ? { borderColor: ALERT_KIND[k].color, background: ALERT_KIND[k].color + "22" } : undefined}>
            <span aria-hidden>{ALERT_KIND[k].icon}</span>{ALERT_KIND[k].label}
            <span className="text-xs text-muted">{openOutages.filter((a) => a.kind === k).length}</span>
          </button>
        ))}
      </div>
      {showTraffic && (!prefs.topics.traffic || (traffic && !traffic.ok)) && (
        <p className="mb-3 text-sm text-muted" aria-live="polite">
          {!prefs.topics.traffic ? "Тохиргоонд «Замын түгжрэл» унтраалттай байна." : "Замын мэдээлэл одоогоор алга."}
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="glass isolate relative min-w-0 overflow-hidden rounded-lg p-1.5">
          <LeafletMap issues={issues} selected={selected} onSelect={(id) => { clear(); setSelected(id); }} showVerified={false} onSelectSpot={() => {}}
            cameras={cameras} selectedCam={camName} onSelectCam={(n) => { clear(); setCamName(n); }}
            outages={outages} selectedOutage={outageId} onSelectOutage={(id) => { clear(); setOutageId(id); }} />
          {showTraffic && cam && (
            <div className="absolute right-3 top-3 z-[1000] max-w-[70%] rounded-lg border border-line bg-navy-2 p-3 shadow-md lg:hidden">
              <button type="button" onClick={() => setCamName(null)} aria-label="Хаах" className="float-right ml-2 rounded p-1"><X className="h-4 w-4" /></button>
              <p className="text-sm font-semibold">{cam.name}</p>
              <p className="mt-1 text-xs font-semibold" style={{ color: trafficColor(cam.rank) }}>{cam.levelLabel}</p>
              <a href="https://dedtuv.erdenet.mn/live" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-semibold text-cyan">Шууд камер ↗</a>
            </div>
          )}
          {showTraffic && (
            <div role="group" aria-label="Замын ачааллын тэмдэглэгээ"
              className="pointer-events-none absolute bottom-4 left-3 z-[1000] max-w-[calc(100%-1.5rem)] rounded-lg border border-line bg-navy-2 px-3 py-2 text-xs font-semibold shadow-md">
              <p className="mb-1 text-muted">Камерын ойролцоо</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5">{([[0, "Бага"], [1, "Дунд"], [2, "Их"], [-1, "Мэдээлэлгүй"]] as const).map(([rank, label]) => (
                <span key={rank} className="flex items-center gap-1.5">
                  <span className={cn("h-3 w-3 rounded-full border-2", rank < 0 && "border-dashed")} style={{ borderColor: trafficColor(rank) }} aria-hidden="true" />
                  {label}
                </span>
              ))}</div>
            </div>
          )}
        </div>
        <Card className={cn("flex min-w-0 flex-col p-5", showTraffic && "hidden lg:flex")}>
          {layer === "outages" ? (
            outage ? (
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5"><Badge color={ALERT_LEVEL[outage.level].color}>{ALERT_LEVEL[outage.level].label}</Badge><Badge color={ALERT_KIND[outage.kind].color}>{ALERT_KIND[outage.kind].icon} {ALERT_KIND[outage.kind].label}</Badge></div>
                  <button type="button" onClick={() => setOutageId(null)} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-snow/10" aria-label="Хаах"><X className="h-4 w-4" /></button>
                </div>
                <h3 className="mt-3 text-lg font-semibold">{outage.title}</h3>
                {outage.area && <p className="mt-1 flex items-center gap-1.5 text-sm text-muted"><MapPin className="h-4 w-4 text-cyan" />{outage.area}</p>}
                {outage.body && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{outage.body}</p>}
                <dl className="mt-3 space-y-1 text-sm text-muted">
                  {outage.startsAt && <div>Эхлэх: <span className="text-snow">{fmtDate(outage.startsAt, true)}</span></div>}
                  {outage.endsAt && <div>Дуусах (таамаг): <span className="text-snow">{fmtDate(outage.endsAt, true)}</span></div>}
                </dl>
                <a href="#alerts" className="mt-4 block text-sm font-semibold text-cyan">Бүх шуурхай мэдээлэл →</a>
                <Button className="mt-3 w-full" variant="ghost" size="sm" onClick={() => askAI(`${outage.area || outage.title} — ${ALERT_KIND[outage.kind].label.toLowerCase()} хэзээ сэргэх вэ?`)}><Bot className="h-4 w-4" />AI-аас асуух</Button>
              </div>
            ) : (
              <div className="flex h-full flex-col">
                <h3 className="font-semibold">Идэвхтэй тасралт</h3>
                {alerts === null ? <div className="mt-3 h-24 animate-pulse rounded-xl bg-snow/5" /> : outages.length ? (
                  <ul className="mt-3 space-y-1 text-sm">
                    {outages.map((a) => (
                      <li key={a.id}><button type="button" onClick={() => setOutageId(a.id)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-snow/5">
                        <span aria-hidden>{ALERT_KIND[a.kind].icon}</span><span className="truncate">{a.title}</span><span className="ml-auto shrink-0 text-xs text-muted">{a.area}</span>
                      </button></li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 rounded-xl border border-line p-3 text-sm text-muted">{openOutages.length ? "Сонгосон төрлийн, байршилтай тасралт алга." : "Одоогоор ус, цахилгаан, дулааны идэвхтэй тасралт бүртгэгдээгүй байна."}</p>
                )}
                {openOutages.some((a) => a.lat == null) && <p className="mt-3 text-sm text-muted">Байршилгүй {openOutages.filter((a) => a.lat == null).length} мэдээллийг <a href="#alerts" className="text-cyan underline">шуурхай мэдээлэл</a> хэсгээс харна уу.</p>}
                <ul className="mt-5 space-y-2 text-sm">
                  {OUTAGE_KINDS.map((k) => <li key={k} className="flex items-center gap-2.5"><span className="grid h-6 w-6 place-items-center rounded-full text-xs" style={{ background: ALERT_KIND[k].color + "33", border: `2px solid ${ALERT_KIND[k].color}` }}>{ALERT_KIND[k].icon}</span>{ALERT_KIND[k].label}</li>)}
                </ul>
                <p className="mt-auto pt-5 text-sm text-muted">Цэг дээр дарж дэлгэрэнгүйг харна.</p>
              </div>
            )
          ) : cam ? (
            <div>
              <div className="flex items-start justify-between gap-2">
                <Badge color={trafficColor(cam.rank)}>{cam.levelLabel}</Badge>
                <button type="button" onClick={() => setCamName(null)} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-snow/10" aria-label="Хаах"><X className="h-4 w-4" /></button>
              </div>
              <h3 className="mt-3 text-lg font-semibold">{cam.name}</h3>
              {(cam.vehicles == null || !cam.detectedAt) && <p className="mt-4 rounded-xl border border-line p-3 text-sm text-muted">Энэ цэгийн ачааллын мэдээлэл одоогоор алга.</p>}
              <a href="https://dedtuv.erdenet.mn/live" target="_blank" rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-cyan/15 px-3 py-2.5 text-sm font-semibold text-cyan hover:bg-cyan/25">Шууд камер харах ↗</a>
              <Button className="mt-2 w-full" variant="ghost" size="sm" onClick={() => askAI(`${cam.name} ачаалалтай юу?`)}><Bot className="h-4 w-4" />AI-аас асуух</Button>
            </div>
          ) : sel ? (
            <div>
              <div className="flex items-start justify-between gap-2">
                <Badge className={STATUS[sel.status].cls}>{STATUS[sel.status].label}</Badge>
                <button type="button" onClick={() => setSelected(null)} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-snow/10" aria-label="Хаах"><X className="h-4 w-4" /></button>
              </div>
              <h3 className="mt-3 text-lg font-semibold">{sel.title}</h3>
              <p className="mt-1 text-xs text-muted">{sel.id} · {ISSUE_CAT[sel.category]}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{sel.description}</p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex gap-2"><MapPin className="h-4 w-4 text-cyan" /><dd>{sel.area}</dd></div>
                <div className="flex gap-2"><CalendarDays className="h-4 w-4 text-cyan" /><dd>Мэдээлсэн: {fmtDate(sel.reportedAt)}</dd></div>
                {sel.organization && <div className="text-muted">Хариуцагч: {sel.organization}</div>}
                {sel.action && <div className="rounded-lg border border-emerald/30 bg-emerald/10 p-2.5 text-emerald">{sel.action}</div>}
              </dl>
              <div className="mt-4 flex flex-wrap gap-2"><DemoTag /><DemoTag>Жишээ байршил</DemoTag></div>
              <Button className="mt-4 w-full" variant="ghost" size="sm" onClick={() => askAI(`${sel.area} орчимд ямар асуудал байна?`)}><Bot className="h-4 w-4" />AI-аас асуух</Button>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              {layer === "issues" && (
                <>
                  <h3 className="font-semibold">Тэмдэглэгээ</h3>
                  <ul className="mt-3 space-y-2.5 text-sm">
                    {(["new", "progress", "resolved"] as const).map((s) => (
                      <li key={s} className="flex items-center gap-2.5"><span className="h-3 w-3 rounded-full" style={{ background: STATUS[s].color }} />{STATUS[s].label}
                        <span className="ml-auto text-muted">{DEMO_ISSUES.filter((i) => i.status === s).length}</span></li>
                    ))}
                  </ul>
                </>
              )}
              {showTraffic && (
                <>
                  <h3 className="font-semibold">Замын ачаалал</h3>
                </>
              )}
              <p className="mt-5 text-sm text-muted">{layer === "issues" ? "Цэг дээр дарж дэлгэрэнгүйг харна." : "Газрын зураг дээрх цэгийг дарна уу."}</p>
              <ul className="mt-5 space-y-1.5 overflow-y-auto text-sm">
                {issues.slice(0, 6).map((i) => (
                  <li key={i.id}><button type="button" onClick={() => setSelected(i.id)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-snow/5">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: STATUS[i.status].color }} /><span className="truncate">{i.title}</span><span className="ml-auto shrink-0 text-xs text-muted">{i.area}</span>
                  </button></li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
