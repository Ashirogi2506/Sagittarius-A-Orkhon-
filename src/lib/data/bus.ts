// Erdenet city bus information taken from official Orkhon aimag pages.
// The "Erdenet BUS" app has no public data feed, so nothing here comes from it.
// Admin-entered routes (bus_routes table) with the same number replace a seeded route.

import type { BusRoute } from "../civic";

export const BUS_CHECKED_AT = "2026-11-21";
const ATT = "https://erdenet.mn/lavlah/org/organ/130600026";
const NEWS_CH8 = "https://erdenet.mn/medee/show/240700009";
const NEWS_FLEET = "https://erdenet.mn/medee/show/240600033";
const EPASS = "https://erdenetlife.mn/article/1921";

/** Routes approved by Governor's orders A/621 (2018-10-08) and A/91 (2019-02-25), plus Ч8 from July 2024. */
export type OfficialLine = { code: string; name: string; operator?: string; source: string };
export const OFFICIAL_LINES: OfficialLine[] = [
  { code: "Ч1, Ч2", name: "Ихзалуу – Шанд", operator: "«Тод од транс» ХХК", source: ATT },
  { code: "Ч3", name: "Дэнж", operator: "«ББ-ОД» ХХК", source: ATT },
  { code: "Ч4", name: "Хороолол", operator: "«ББ-ОД» ХХК", source: ATT },
  { code: "Ч5", name: "Говил", operator: "«ББ-ОД» ХХК", source: ATT },
  { code: "Ч6", name: "Тосгон – Зээл", operator: "«Тод од транс» ХХК", source: ATT },
  { code: "Ч7", name: "Вокзал – Төгөл", operator: "«Автомастер төв» ХХК", source: ATT },
  { code: "Ч8", name: "Даниста – Урд хабитат – Дэнж – Уртын гол", source: NEWS_CH8 },
];

export type SeededRoute = BusRoute & { departures?: string[] };

// Stops and times read from the route map published with the 2024-07-03 news item (map by Хот тохижуулах газар).
// It is a loop that starts and ends at Кувейтын тойрог.
export const SEEDED_ROUTES: SeededRoute[] = [
  {
    id: -8, number: "Ч8", name: "Даниста – Урд хабитат – Дэнж – Уртын гол (тойрог)",
    stops: ["Кувейтын тойрог", "Даниста", "Мэнд-Амар", "Их хаадын цуваа", "Сансар ХТ", "Танил", "Номун далай", "Оөдол", "Хангай дэлгүүр",
      "Баян тал", "Цагаан худаг", "Авто задаргаа", "Петровис ШТС", "Онцгой байдал", "20-р сургууль", "Пинк", "Дунд буудал",
      "Уртын гол баг", "Сансар ХТ (буцах)", "14-р сургууль", "Кувейтын тойрог (эцэс)"],
    firstTime: "07:00", lastTime: "21:00", intervalMin: null,
    departures: ["07:00", "07:30", "08:00", "08:30", "11:30", "12:00", "13:00", "14:00", "15:00", "16:00", "18:00", "19:00", "20:00", "21:00"],
    fareAdult: null, fareChild: null,
    fareNote: "2024 оны 7-р сард туршилтаар эхэлсэн. Нэг талдаа 7 буудал, бүтэн эргэлт ~60 минут. Үнийг эх сурвалжид заагаагүй.",
    source: NEWS_CH8, updatedAt: "2024-07-03",
  },
];

export const BUS_FACTS: { title: string; text: string; source: string }[] = [
  { title: "Хөнгөлөлт", text: "Баян-Өндөр суманд 2015 оноос «Автобус» хөтөлбөрөөр ахмад настан, хөгжлийн бэрхшээлтэй иргэдийг үнэ төлбөргүй тээвэрлэдэг.", source: ATT },
  { title: "Цахим карт (EPASS)", text: "Энгийн, хүүхэд (ЕБС-ийн насны), хөнгөлөлттэй (оюутан, ахмад настан, хөгжлийн бэрхшээлтэй иргэн г.м.) гэсэн 3 төрлийн карт 2022 онд туршилтаар нэвтэрсэн.", source: EPASS },
  { title: "Шинэ автобус", text: "2024 онд 40–45 хүний багтаамжтай, хөгжлийн бэрхшээлтэй иргэн саадгүй зорчих боломжтой шинэ автобуснууд нэмэгдсэн. Бүх автобус GPS-тэй.", source: NEWS_FLEET },
  { title: "Үнэ, хуваарь лавлах", text: "Зорчих үнэ албан сайтад нийтлэгдээгүй байна. Авто тээврийн төв: 7035-4947, 7035-4942 (Даваа–Баасан 08:00–17:00).", source: ATT },
];

/** Seeded routes first, unless an admin entered a route with the same number. */
export function mergeRoutes(db: BusRoute[]): SeededRoute[] {
  const norm = (n: string) => n.replace(/^ч/i, "").trim();
  return [...SEEDED_ROUTES.filter((s) => !db.some((d) => norm(d.number) === norm(s.number))), ...db];
}

// Stop names as people write them: "Уртын голоос" should still find "Уртын гол баг".
const GENERIC = new Set(["баг", "хт", "штс"]);
function mentions(question: string, stop: string): boolean {
  const words = stop.replace(/\s*\(.*\)/, "").toLowerCase().split(/\s+/).filter((w) => w && !GENERIC.has(w));
  return words.length > 0 && words.every((w) => question.includes(w.length > 5 ? w.slice(0, w.length - 2) : w));
}

/** Routes that pass the stops named in a question, worked out on the server so the AI does not have to match names. */
export function busHint(question: string, routes: SeededRoute[]): string {
  const q = question.toLowerCase();
  const lines = routes.flatMap((r) => {
    const hit = [...new Set(r.stops.filter((s) => mentions(q, s)).map((s) => s.replace(/\s*\(.*\)/, "")))];
    if (!hit.length) return [];
    const times = r.departures?.length ? ` Эхний буудлаас хөдлөх цаг: ${r.departures.join(", ")}.` : r.firstTime ? ` ${r.firstTime}–${r.lastTime ?? "?"}.` : "";
    return [`№${r.number} (${r.name ?? ""}) нь ${hit.map((s) => `«${s}»`).join(", ")} зогсоолыг дайрдаг.${times} Эх сурвалж: ${r.source ?? ""}.`];
  });
  return lines.length ? ["АСУУЛТАД ДУРДСАН ЗОГСООЛООР ЯВДАГ ЧИГЛЭЛ (сервер зогсоолын нэрээр тулгасан, [Гараар шалгасан]):", ...lines].join("\n") : "";
}

export function busStaticContext(): string {
  return [
    `АВТОБУСНЫ АЛБАН ЧИГЛЭЛҮҮД — шошго "[Гараар шалгасан]" (${BUS_CHECKED_AT}-нд erdenet.mn-ээс шалгасан). Засаг даргын 2018 оны А/621, 2019 оны А/91 захирамжаар баталсан:`,
    ...OFFICIAL_LINES.map((l) => `- ${l.code}: ${l.name}${l.operator ? `, гүйцэтгэгч ${l.operator}` : ""}. Эх сурвалж: ${l.source}.`),
    "Ч1–Ч7-ийн зогсоолын дэлгэрэнгүй жагсаалт албан сайтад нийтлэгдээгүй; асуувал Авто тээврийн төвөөс (7035-4947) лавлахыг зөвлө.",
    ...SEEDED_ROUTES.map((r) => `ЗОГСООЛТОЙ ЧИГЛЭЛ ${r.number} (тойрог тул доорх аль ч хоёр газрын хооронд хоёр чиглэлд явна; хэрэглэгч газрын нэрийг товчилж бичиж болно, жишээ нь "Уртын гол" = "Уртын гол баг"): ${r.stops.join(", ")}. Хөдлөх цаг: ${r.departures?.join(", ") ?? "тодорхойгүй"}.`),
    ...BUS_FACTS.map((f) => `- ${f.title}: ${f.text} Эх сурвалж: ${f.source}.`),
  ].join("\n");
}
