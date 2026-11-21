import { all } from "./db";

export const WEEKDAYS = ["Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба", "Ням"];

export interface GarbageEntry { id: number; sum: string; bag: string | null; area: string | null; days: string[]; timeFrom: string | null; timeTo: string | null; note: string | null; source: string | null; updatedAt: string }

type Row = { id: number; sum: string; bag: string | null; area: string | null; days: string; time_from: string | null; time_to: string | null; note: string | null; source: string | null; updated_at: string };

export async function listGarbage(): Promise<GarbageEntry[]> {
  return (await all<Row>("SELECT * FROM garbage_schedule ORDER BY sum, bag, area")).map((r) => ({
    id: r.id, sum: r.sum, bag: r.bag, area: r.area, days: r.days ? r.days.split(",") : [], timeFrom: r.time_from, timeTo: r.time_to,
    note: r.note, source: r.source, updatedAt: r.updated_at,
  }));
}

/** Text for the AI context. Empty schedule means the bot must say there is no verified schedule. */
export async function garbageContext(): Promise<string> {
  const list = await listGarbage();
  if (!list.length) return "ХОГ АЧИЛТЫН ХУВААРЬ: системд албан ёсны хуваарь хараахан оруулаагүй. Хуваарь асуувал баталгаажсан мэдээлэл байхгүй гэж хэлээд баг, хорооны ажилтан эсвэл тохижилтын байгууллагаас лавлахыг зөвлө.";
  return ["ХОГ АЧИЛТЫН ХУВААРЬ (админ оруулсан):", ...list.map((g) =>
    `${g.sum}${g.bag ? ", " + g.bag : ""}${g.area ? ", " + g.area : ""}: ${g.days.join(", ")}${g.timeFrom ? ` ${g.timeFrom}${g.timeTo ? "–" + g.timeTo : ""}` : ""}${g.note ? `. ${g.note}` : ""}${g.source ? `. Эх сурвалж: ${g.source}` : ""}. Шинэчилсэн: ${g.updatedAt.slice(0, 10)}.`)].join("\n");
}
