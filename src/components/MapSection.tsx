"use client";

import dynamic from "next/dynamic";
import { AlertCircle, Bot, CalendarDays, Car, MapPin, Moon, ShieldCheck, Sun, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { ALERT_KIND, ALERT_LEVEL, OUTAGE_KINDS, isOpen, type AlertKind } from "@/lib/civic";
import { MICRO_DISTRICTS } from "@/lib/data/micro-districts";
import { DEMO_ISSUES, VERIFIED_SPOTS } from "@/lib/data/places";
import { ISSUE_CAT, STATUS, fmtDate } from "@/lib/labels";
import type { IssueStatus } from "@/lib/types";
import { trafficColor, useStore } from "@/lib/store";
import { useTheme } from "@/lib/theme";

import { Badge, Button, Card, DemoTag, SectionHead, cn } from "./ui";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <div className="grid h-[380px] place-items-center rounded-lg bg-navy-2 text-sm text-muted md:h-[520px]">Газрын зураг ачаалж байна…</div>,
});

const MAP_MODE_KEY = "so.map-mode";
const MAP_MODES = [
  { id: "day", label: "Өдөр", icon: Sun },
  { id: "night", label: "Шөнө", icon: Moon },
] as const;
type MapMode = (typeof MAP_MODES)[number]["id"];
type Layer = "issues" | "traffic" | "outages";
const LAYERS: { id: Layer; label: string; icon: typeof Car }[] = [
  { id: "issues", label: "Иргэдийн асуудал", icon: AlertCircle },
  { id: "traffic", label: "Замын ачаалал", icon: Car },
  { id: "outages", label: "Ус, цахилгаан тасралт", icon: Zap },
];

export function MapSection() {
  const { askAI, traffic, prefs, alerts } = useStore();
  const siteTheme = useTheme();
  const [mapTheme, setMapTheme] = useState<MapMode | null>(null);
  const mode = mapTheme ?? siteTheme;
  const [districtNumber, setDistrictNumber] = useState<number | null>(null);
  const district = MICRO_DISTRICTS.find((item) => item.number === districtNumber);

  useEffect(() => {
    const restoreMode = () => {
      try {
        const saved = localStorage.getItem(MAP_MODE_KEY);
        if (saved === "night" || saved === "day") setMapTheme(saved);
      } catch { /* The map still works when local storage is unavailable. */ }
    };
    restoreMode();
  }, []);

  const changeMode = (nextMode: MapMode) => {
    setMapTheme(nextMode);
    try { localStorage.setItem(MAP_MODE_KEY, nextMode); } catch { /* The current selection still applies. */ }
  };
  // One layer at a time, so outages are never mixed up with road load or reported problems.
  const [layer, setLayer] = useState<Layer>("issues");
  const [status, setStatus] = useState<"all" | IssueStatus>("all");
  const [kinds, setKinds] = useState<AlertKind[]>(OUTAGE_KINDS);
  const [selected, setSelected] = useState<string | null>(null);
  const [spot, setSpot] = useState<string | null>(null);
  const [camName, setCamName] = useState<string | null>(null);
  const [outageId, setOutageId] = useState<number | null>(null);
  const [showVerified, setShowVerified] = useState(false);
  const showTraffic = layer === "traffic";
  const districtIssues = district ? DEMO_ISSUES.filter((issue) => issue.area === district.name) : DEMO_ISSUES;
  const issues = layer === "issues" ? districtIssues.filter((i) => status === "all" || i.status === status) : [];
  const sel = issues.find((i) => i.id === selected);
  const sp = VERIFIED_SPOTS.find((s) => s.id === spot);
  const cameras = showTraffic && traffic?.ok ? traffic.spots : [];
  const cam = cameras.find((c) => c.name === camName);
  const openOutages = (alerts ?? []).filter((a) => OUTAGE_KINDS.includes(a.kind) && isOpen(a));
  const outages = layer === "outages" ? openOutages.filter((a) => kinds.includes(a.kind) && a.lat != null && a.lng != null) : [];
  const outage = outages.find((a) => a.id === outageId);
  const clear = () => { setSelected(null); setSpot(null); setCamName(null); setOutageId(null); };
  const selectDistrict = (number: number | null) => {
    clear();
    setDistrictNumber(number);
  };

  return (
    <section id="map" data-mode={mode} className="city-map-section mx-auto max-w-7xl rounded-xl px-4 py-10 md:px-6 md:py-14" aria-labelledby="map-title">
      <SectionHead id="map-title" title="Газрын зураг"
        right={layer === "issues" ? <DemoTag>Асуудлын цэгүүд жишээ байршилтай</DemoTag> : undefined} />
      <div className="mb-4 rounded-lg border border-line bg-navy-2 px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 font-semibold"><MapPin className="size-4 text-cyan" aria-hidden="true" />Микро хороолол</h3>
          <div role="group" aria-label="Газрын зургийн горим" className="map-mode-toggle inline-flex gap-0.5 rounded-lg border border-line bg-navy p-0.5">
            {MAP_MODES.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" aria-pressed={mode === id} onClick={() => changeMode(id)}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-md px-3 text-sm font-semibold">
                <Icon className="size-4" aria-hidden="true" />{label}
              </button>
            ))}
          </div>
        </div>
        <div role="group" aria-label="Микро хороолол сонгох" className="mt-2.5 flex flex-wrap gap-1.5">
          <button type="button" aria-pressed={districtNumber === null} onClick={() => selectDistrict(null)} className="map-district-button">
            Хот бүхэлдээ
          </button>
          {MICRO_DISTRICTS.map((item) => (
            <button key={item.number} type="button" aria-pressed={districtNumber === item.number}
              onClick={() => selectDistrict(item.number)} className="map-district-button">
              {item.name}
            </button>
          ))}
        </div>
      </div>
      <div role="tablist" aria-label="Газрын зургийн давхарга" className="mb-3 inline-flex w-full flex-wrap gap-1 rounded-lg border border-line bg-navy p-1 sm:w-auto">
        {LAYERS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" role="tab" aria-selected={layer === id} onClick={() => { clear(); setLayer(id); }}
            className={cn("flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold transition sm:flex-none",
              layer === id ? "bg-action text-snow" : "text-muted hover:bg-snow/5 hover:text-snow")}>
            <Icon className="h-4 w-4" />{label}
            {id === "outages" && openOutages.length > 0 && <span className={cn("rounded px-1.5 text-xs font-bold", layer === id ? "bg-navy/20" : "bg-alert text-white")}>{openOutages.length}</span>}
          </button>
        ))}
      </div>
      <div className="mb-4 flex min-h-9 flex-wrap items-center gap-2">
        {layer === "issues" && (
          <>
            {(["all", "new", "progress", "resolved"] as const).map((s) => (
              <button key={s} type="button" aria-pressed={status === s} onClick={() => { setSelected(null); setStatus(s); }}
                className={cn("flex items-center gap-2 rounded-md border px-3.5 py-1.5 text-sm font-semibold transition", status === s ? "border-cyan bg-cyan/15 text-snow" : "border-line text-muted hover:text-snow")}>
                {s !== "all" && <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS[s].color }} />}
                {s === "all" ? "Бүгд" : STATUS[s].label}
              </button>
            ))}
          </>
        )}
        {layer === "traffic" && (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted"><input type="checkbox" className="h-4 w-4 accent-cyan" checked={showVerified} onChange={(e) => setShowVerified(e.target.checked)} />Шалгасан замын цэгүүд</label>
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
        <div className="glass relative min-w-0 overflow-hidden rounded-lg p-1.5">
          <LeafletMap issues={issues} selected={selected} onSelect={(id) => { clear(); setSelected(id); }} showVerified={showTraffic && showVerified} onSelectSpot={(id) => { clear(); setSpot(id); }}
            cameras={cameras} selectedCam={camName} onSelectCam={(n) => { clear(); setCamName(n); }}
            outages={outages} selectedOutage={outageId} onSelectOutage={(id) => { clear(); setOutageId(id); }}
            district={district} onSelectDistrict={selectDistrict} />
          <p className="px-2 pb-0.5 pt-2 text-xs text-muted">
            Микрогийн хүрээ нь <a href="https://www.openstreetmap.org/copyright" className="underline">OpenStreetMap</a>-ийн зураглал.
            7-р микрог байршлын цэгээр харуулав.
          </p>
        </div>
        <Card className="flex min-w-0 flex-col p-5">
          {district && <p className="mb-3 border-b border-line pb-2 text-sm font-semibold" aria-live="polite">{district.name}</p>}
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
          ) : sp ? (
            <div>
              <div className="flex items-start justify-between gap-2">
                <Badge className="border-emerald/40 bg-emerald/10 text-emerald"><ShieldCheck className="h-3 w-3" />Баталгаатай байршил</Badge>
                <button type="button" onClick={() => setSpot(null)} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-snow/10" aria-label="Хаах"><X className="h-4 w-4" /></button>
              </div>
              <h3 className="mt-3 text-lg font-semibold">{sp.name}</h3>
              <p className="mt-2 text-sm text-muted">{sp.note}</p>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              {layer === "issues" && (
                <>
                  <h3 className="font-semibold">Тэмдэглэгээ</h3>
                  <ul className="mt-3 space-y-2.5 text-sm">
                    {(["new", "progress", "resolved"] as const).map((s) => (
                      <li key={s} className="flex items-center gap-2.5"><span className="h-3 w-3 rounded-full" style={{ background: STATUS[s].color }} />{STATUS[s].label}
                        <span className="ml-auto text-muted">{districtIssues.filter((i) => i.status === s).length}</span></li>
                    ))}
                  </ul>
                </>
              )}
              {showTraffic && (
                <>
                  <h3 className="font-semibold">Замын ачаалал (камер)</h3>
                  <ul className="mt-3 space-y-2.5 text-sm">
                    {([[0, "Ачаалалгүй"], [1, "Дунд зэргийн ачаалалтай"], [2, "Ачаалал ихтэй"], [-1, "Мэдээлэлгүй (тооллогогүй)"]] as const).map(([r, l]) => (
                      <li key={r} className="flex items-center gap-2.5"><span className={cn("h-3.5 w-3.5 rounded-full border-[3px] bg-navy", r < 0 && "border-dashed")} style={{ borderColor: trafficColor(r) }} />{l}
                        <span className="ml-auto text-muted">{cameras.filter((c) => (r === 2 ? c.rank >= 2 : c.rank === r)).length}</span></li>
                    ))}
                    <li className="flex items-center gap-2.5"><span className="h-1.5 w-5 rounded-full" style={{ background: "linear-gradient(90deg,#22c55e,#b7791f,#d63c3c)" }} />Гол зам: камерын {250} м радиуст өнгөтэй</li>
                    <li className="flex items-center gap-2.5"><span className="h-1 w-5 rounded-full bg-[#64748b] opacity-60" />Камергүй хэсэг (мэдээлэлгүй)</li>
                    <li className="flex items-center gap-2.5"><span className="grid h-4 w-4 place-items-center rounded border border-cyan text-[11px] text-cyan">✓</span>Шалгасан замын цэг (OSM)</li>
                  </ul>
                  {cameras.some((c) => c.rank >= 1) && (
                    <ul className="mt-3 space-y-1 text-sm">
                      {cameras.filter((c) => c.rank >= 1).map((c) => (
                        <li key={c.name}><button type="button" onClick={() => { clear(); setCamName(c.name); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-snow/5">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: trafficColor(c.rank) }} /><span className="truncate">{c.name}</span>
                        </button></li>
                      ))}
                    </ul>
                  )}
                </>
              )}
              <p className="mt-5 text-sm text-muted">{layer === "issues" ? "Цэг дээр дарж дэлгэрэнгүйг харна." : "Камер эсвэл өнгөтэй зам дээр дарж дэлгэрэнгүйг харна."}</p>
              {layer === "issues" && district && !issues.length && <p className="mt-3 text-sm text-muted">Сонгосон шүүлтүүрт тохирох асуудал алга.</p>}
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
