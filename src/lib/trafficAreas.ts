import { ERDENET } from "./data/places";

export type TrafficArea = "all" | "center" | "north" | "south" | "east" | "west";

export const TRAFFIC_AREAS: { id: TrafficArea; label: string }[] = [
  { id: "all", label: "Бүгд" },
  { id: "center", label: "Төв" },
  { id: "north", label: "Хойд" },
  { id: "south", label: "Өмнөд" },
  { id: "east", label: "Зүүн" },
  { id: "west", label: "Баруун" },
];

/** Approximate directions from the OSM city centre, not administrative boundaries. */
export function trafficArea(lat: number, lng: number): Exclude<TrafficArea, "all"> {
  const north = lat - ERDENET[0];
  const east = (lng - ERDENET[1]) * 0.66;
  if (Math.hypot(north, east) < 0.006) return "center";
  if (Math.abs(north) >= Math.abs(east)) return north >= 0 ? "north" : "south";
  return east >= 0 ? "east" : "west";
}
