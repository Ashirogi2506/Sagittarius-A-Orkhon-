"use client";

import L from "leaflet";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import { ERDENET, VERIFIED_SPOTS } from "@/lib/data/places";
import { ROADS } from "@/lib/data/roads";
import { STATUS } from "@/lib/labels";
import type { Issue } from "@/lib/types";
import { ALERT_KIND, type CivicAlert } from "@/lib/civic";
import { trafficColor, type CameraSpot } from "@/lib/store";

const icon = (color: string, ring = true) => L.divIcon({
  className: "",
  html: `<div class="marker-dot" style="background:${color};color:${color};box-shadow:0 0 14px ${color}${ring ? "" : ";"}"></div>`,
  iconSize: [18, 18], iconAnchor: [9, 9],
});
const verifiedIcon = L.divIcon({
  className: "",
  html: `<div style="width:26px;height:26px;border-radius:8px;background:#f5f7fa;border:2px solid #1f5fbf;display:grid;place-items:center;color:#1f5fbf;font:700 13px/1 sans-serif;box-shadow:0 0 16px rgba(31,95,191,.7)">✓</div>`,
  iconSize: [26, 26], iconAnchor: [13, 13],
});

// Camera marker: coloured by load, shows the vehicle count, pulses when congested. Grey "–" = no count.
const camIcon = (c: CameraSpot, active: boolean) => {
  const col = trafficColor(c.rank);
  const size = (active ? 34 : 28) - (c.rank < 0 ? 6 : 0);
  return L.divIcon({
    className: "",
    html: `<div class="${c.rank >= 1 ? "marker-dot" : ""}" style="position:relative;width:${size}px;height:${size}px;border-radius:50%;background:#f5f7fa;border:3px ${c.rank < 0 ? "dashed" : "solid"} ${col};color:${c.rank < 0 ? "#5b6b82" : col};display:grid;place-items:center;font:700 12px/1 sans-serif;box-shadow:0 0 ${c.rank >= 1 ? 18 : c.rank === 0 ? 8 : 0}px ${col}">${c.vehicles ?? "–"}</div>`,
    iconSize: [size, size], iconAnchor: [size / 2, size / 2],
  });
};
const hm = (iso: string) => new Date(iso).toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Ulaanbaatar" });

// Road sections within NEAR_M of a counting camera take that camera's colour; everything else stays grey (no data).
const NEAR_M = 250;
const metres = (a: [number, number], lat: number, lng: number) => Math.hypot((a[0] - lat) * 110574, (a[1] - lng) * 73030);
interface Run { key: string; rank: number; cam: string | null; trunk: boolean; pts: [number, number][] }
function roadRuns(cams: CameraSpot[]): Run[] {
  const counted = cams.filter((c) => c.rank >= 0);
  const runs: Run[] = [];
  ROADS.forEach((road, ri) => {
    let cur: Run | null = null;
    road.p.forEach((pt, i) => {
      let best: CameraSpot | null = null, bd = NEAR_M;
      for (const c of counted) { const d = metres(pt, c.lat, c.lng); if (d < bd) { bd = d; best = c; } }
      const rank = best ? best.rank : -1;
      const cam = best ? best.name : null;
      if (!cur || cur.rank !== rank || cur.cam !== cam) {
        const prev = cur?.pts[cur.pts.length - 1];
        cur = { key: `${ri}-${i}`, rank, cam, trunk: road.c === 1, pts: prev ? [prev] : [] };
        runs.push(cur);
      }
      cur.pts.push(pt);
    });
  });
  return runs.filter((r) => r.pts.length >= 2);
}

function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => { if (target) map.flyTo(target, 16, { duration: 0.8 }); }, [target, map]);
  return null;
}

// Outage marker: emoji in a ring of the outage colour; a pulsing halo marks the urgent ones.
const outageIcon = (a: CivicAlert, active: boolean) => {
  const k = ALERT_KIND[a.kind];
  const size = active ? 40 : 34;
  return L.divIcon({
    className: "",
    html: `<div class="${a.level === "critical" ? "marker-dot" : ""}" style="width:${size}px;height:${size}px;border-radius:50%;background:#f5f7fa;border:3px solid ${k.color};color:${k.color};display:grid;place-items:center;font-size:${active ? 20 : 17}px;line-height:1;box-shadow:0 0 16px ${k.color}">${k.icon}</div>`,
    iconSize: [size, size], iconAnchor: [size / 2, size / 2],
  });
};

export default function LeafletMap({ issues, selected, onSelect, showVerified, onSelectSpot, cameras = [], selectedCam = null, onSelectCam, outages = [], selectedOutage = null, onSelectOutage}: {
  issues: Issue[]; selected: string | null; onSelect: (id: string) => void; showVerified: boolean; onSelectSpot: (id: string) => void;
  cameras?: CameraSpot[]; selectedCam?: string | null; onSelectCam?: (name: string) => void;
  outages?: CivicAlert[]; selectedOutage?: number | null; onSelectOutage?: (id: number) => void;
}) {
  const sel = issues.find((i) => i.id === selected);
  const cam = cameras.find((c) => c.name === selectedCam);
  const out = outages.find((a) => a.id === selectedOutage);
  const runs = useMemo(() => (cameras.length ? roadRuns(cameras) : []), [cameras]);
  return (
    <MapContainer center={ERDENET} zoom={14} scrollWheelZoom={false} className="map-dark h-[380px] w-full md:h-[520px]" attributionControl>
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
      {runs.map((r) => (
        <Polyline key={r.key} positions={r.pts}
          pathOptions={{ color: trafficColor(r.rank), weight: r.rank < 0 ? (r.trunk ? 4 : 3) : (r.trunk ? 7 : 5), opacity: r.rank < 0 ? 0.45 : 0.9, lineCap: "round" }}
          eventHandlers={r.cam ? { click: () => onSelectCam?.(r.cam!) } : undefined}>
          {r.cam && <Tooltip sticky>{r.cam} камерын ойролцоо ({NEAR_M} м) · {cameras.find((c) => c.name === r.cam)?.levelLabel.toLowerCase()}</Tooltip>}
        </Polyline>
      ))}
      {issues.map((i) => (
        <Marker key={i.id} position={[i.lat, i.lng]} icon={icon(STATUS[i.status].color)} eventHandlers={{ click: () => onSelect(i.id) }}
          keyboard title={`${i.title} (${STATUS[i.status].label})`}>
          <Tooltip direction="top" offset={[0, -8]}>{i.title}{i.coordsDemo ? " · жишээ байршил" : ""}</Tooltip>
        </Marker>
      ))}
      {showVerified && VERIFIED_SPOTS.map((s) => (
        <Marker key={s.id} position={[s.lat, s.lng]} icon={verifiedIcon} eventHandlers={{ click: () => onSelectSpot(s.id) }} title={s.name}>
          <Tooltip direction="top" offset={[0, -12]}>{s.name} · баталгаатай байршил</Tooltip>
        </Marker>
      ))}
      {cameras.map((c) => (
        <Marker key={c.name} position={[c.lat, c.lng]} icon={camIcon(c, c.name === selectedCam)} zIndexOffset={c.rank * 100 + 500}
          eventHandlers={{ click: () => onSelectCam?.(c.name) }} keyboard title={c.vehicles == null ? `${c.name}: ${c.levelLabel}` : `${c.name}: ${c.levelLabel}, ${c.vehicles} машин`}>
          <Tooltip direction="top" offset={[0, -14]}>{c.vehicles == null || !c.detectedAt ? `${c.name} · ${c.levelLabel.toLowerCase()} (шууд бичлэгийг dedtuv дээр харна)` : `${c.name} · ${c.levelLabel.toLowerCase()} · ${c.vehicles} машин (${hm(c.detectedAt)})`}</Tooltip>
        </Marker>
      ))}
      {outages.map((a) => (
        <Marker key={a.id} position={[a.lat!, a.lng!]} icon={outageIcon(a, a.id === selectedOutage)} zIndexOffset={a.level === "critical" ? 900 : 700}
          eventHandlers={{ click: () => onSelectOutage?.(a.id) }} keyboard title={`${ALERT_KIND[a.kind].label}: ${a.title}`}>
          <Tooltip direction="top" offset={[0, -16]}>{ALERT_KIND[a.kind].icon} {a.title}{a.area ? ` · ${a.area}` : ""}</Tooltip>
        </Marker>
      ))}
      <FlyTo target={sel ? [sel.lat, sel.lng] : cam ? [cam.lat, cam.lng] : out ? [out.lat!, out.lng!] : null} />
    </MapContainer>
  );
}
