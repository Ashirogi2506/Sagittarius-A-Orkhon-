"use client";

import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import { ERDENET } from "@/lib/data/places";

const pin = L.divIcon({
  className: "",
  html: `<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#d63c3c;border:3px solid #fff;box-shadow:0 0 12px #d63c3c"></div>`,
  iconSize: [22, 22], iconAnchor: [11, 22],
});

function Clicks({ onPick }: { onPick: (p: [number, number]) => void }) {
  useMapEvents({ click: (e) => onPick([Math.round(e.latlng.lat * 1e5) / 1e5, Math.round(e.latlng.lng * 1e5) / 1e5]) });
  return null;
}

/** Small map: click to drop the outage pin. */
export default function PointPicker({ value, onPick }: { value: [number, number] | null; onPick: (p: [number, number]) => void }) {
  return (
    <MapContainer center={value ?? ERDENET} zoom={13} scrollWheelZoom={false} className="map-dark h-56 w-full cursor-crosshair rounded-xl">
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
      <Clicks onPick={onPick} />
      {value && <Marker position={value} icon={pin} />}
    </MapContainer>
  );
}
