// Guide for people visiting Erdenet for the first time.
// Facts come from the sources listed with each entry; coordinates are from OpenStreetMap.
// Opening hours are given only where an official page states them.

export const VISITOR_CHECKED_AT = "2026-11-21";

const WIKI_EN = "https://en.wikipedia.org/wiki/Erdenet";
const WIKI_MN = "https://mn.wikipedia.org/wiki/Эрдэнэт";
const LP = "https://www.lonelyplanet.com/mongolia/northern-mongolia/erdenet";
const OSM = "https://www.openstreetmap.org";

export const osmLink = (lat: number, lng: number) => `${OSM}/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;

export type Fact = { label: string; value: string; source: string };
export const CITY_FACTS: Fact[] = [
  { label: "Байгуулагдсан", value: "1974 он, зэсийн ордын дэргэд", source: WIKI_MN },
  { label: "Хүн ам", value: "100 мянга гаруй, улсын 2 дахь том хот", source: WIKI_MN },
  { label: "Өндөр", value: "Далайн түвшнээс 1,280 м", source: WIKI_MN },
  { label: "Улаанбаатараас", value: "Замаар ~370 км, машинаар ~8 цаг", source: WIKI_EN },
  { label: "Өвөл", value: "Урт, маш хүйтэн. 1-р сард дунджаар −20°C орчим", source: WIKI_EN },
  { label: "Онгоцны буудал", value: "Хотод байхгүй, хамгийн ойр нь Улаанбаатарт", source: WIKI_EN },
];

export type SightCat = "landmark" | "culture" | "nature" | "religion" | "trip";
export const SIGHT_CAT: Record<SightCat, { label: string; icon: string }> = {
  landmark: { label: "Дурсгалт газар", icon: "🏛️" },
  culture: { label: "Музей, соёл", icon: "🎭" },
  nature: { label: "Байгаль, үзэмж", icon: "⛰️" },
  religion: { label: "Сүм хийд", icon: "🛕" },
  trip: { label: "Хотоос гадна", icon: "🚗" },
};

export type Sight = {
  id: string;
  name: string;
  cat: SightCat;
  what: string;
  tip?: string;
  hours?: string;
  phone?: string;
  lat?: number;
  lng?: number;
  source: string;
};

export const SIGHTS: Sight[] = [
  { id: "nairamdal", name: "Найрамдлын өндөрлөг (хөшөө)", cat: "landmark",
    what: "1984 онд босгосон Монгол-Оросын найрамдлын хөшөө. Толгод дээр байрладаг тул хот бүхэлдээ харагдана.",
    tip: "Хотыг дээрээс харах, зураг авахад тохиромжтой.", lat: 49.03461, lng: 104.06098, source: WIKI_EN },
  { id: "ikh-shuteen", name: "«Их шүтээн» Бурхан багшийн цогцолбор", cat: "religion",
    what: "Хотын зүүн хойд хэсэгт байрлах Бурхан багшийн том хөшөө бүхий цогцолбор. Найрамдлын өндөрлөгтэй ойрхон.", lat: 49.03893, lng: 104.06251, source: WIKI_EN },
  { id: "muzei", name: "Орхон аймгийн музей", cat: "culture",
    what: "1983 онд байгуулагдсан. Орон нутгийн түүх, соёл, байгалийн үзмэр, Эрдэнэтийн уурхайн макет.",
    hours: "Өдөр бүр 09:00–13:00, 14:00–17:00", phone: "7035-0041", lat: 49.03232, lng: 104.05862, source: "https://erdenet.mn/lavlah/org/organ/130500018" },
  { id: "uul-uurhai-muzei", name: "Уул уурхайн музей", cat: "culture",
    what: "Төв талбай дахь Соёлын ордонд байрладаг. Эрдэнэт үйлдвэр, зэсийн олборлолтын түүх.",
    tip: "Соёлын ордонд түр үзэсгэлэн ч байнга гардаг.", source: WIKI_EN },
  { id: "uurhai", name: "Эрдэнэтийн зэсийн уурхай", cat: "landmark",
    what: "Хотыг үүсгэсэн, 1978 оноос ажиллаж буй Монголын томоохон зэс-молибдены уурхай. Эрдэнэтийн овоо ууланд байрладаг.",
    tip: "Уурхайд зөвхөн урьдчилан тохиролцож орно. Дур мэдэн бүү ороорой.", source: WIKI_EN },
  { id: "bayan-undur", name: "Баян-Өндөр уулын орой", cat: "nature",
    what: "Хотын баруун хойд талын уул. Оройгоос хот болон зэсийн уурхай харагдана.",
    tip: "Зам нь бартаатай, бороотой үед шавартай. Такси хөлсөлж очиж болно.", source: LP },
  { id: "talbai", name: "Найрамдлын талбай, хөгжимт усан оргилуур", cat: "landmark",
    what: "Хотын төвийн талбай. 2009 онд тавьсан хөгжимт усан оргилуур тодорхой цагт хөгжимтэй ажилладаг.", lat: 49.03078, lng: 104.05374, source: LP },
  { id: "tsetserleg", name: "Эрдэнэт цэцэрлэгт хүрээлэн", cat: "nature",
    what: "Хотын баруун урд хэсэгт байрлах цэцэрлэгт хүрээлэн, зугаалгын газар.", lat: 49.01575, lng: 104.02477, source: WIKI_MN },
  { id: "teatr", name: "Хүүхэд залуучуудын театр", cat: "culture",
    what: "Хүүхэд, залуучуудад зориулсан тайзны бүтээл, тоглолт.",
    tip: "Тоглолтын хуваарийг Facebook хуудаснаас (erdenetteatr.mn) харна.", phone: "7035-8959", lat: 49.02693, lng: 104.05751, source: "https://erdenet.mn/lavlah/org/organ/130600016" },
  { id: "gandan", name: "Буддын шашны сүм (Ганданшадүвлин)", cat: "religion",
    what: "Хотын төвд ойрхон байрлах буддын шашны сүм.", lat: 49.03313, lng: 104.04862, source: LP },
  { id: "hivs", name: "«Эрдэнэт хивс» үйлдвэр", cat: "landmark",
    what: "1981 онд байгуулагдсан, ноосон хивсээрээ алдартай үйлдвэр. Хотын төвөөс зүүн тийш ~2 км.",
    tip: "Эрдэнэтийн бэлэг дурсгалын зүйл хайж байгаа бол.", source: WIKI_EN },
  { id: "amarbayasgalant", name: "Амарбаясгалант хийд", cat: "trip",
    what: "1727–1737 онд барьсан түүхэн хийд. 1975 оноос хойш ЮНЕСКО-гийн дэмжлэгтэйгээр сэргээсэн. Эрдэнэтээс зүүн хойш ~60 км (шулуунаар).",
    tip: "Бүтэн өдрийн аялал. Замын нөхцөлөө урьдчилан тодруулаарай.", source: WIKI_EN },
];

export type Tip = { title: string; text: string; href?: string };
export const ARRIVAL_TIPS: Tip[] = [
  { title: "Улаанбаатараас автобусаар", text: "Хот хоорондын автобус өдөрт хэд хэдэн удаа явдаг. Эрдэнэтэд хотын төвийн «Эрдэнэт» автобусны буудал дээр ирнэ. Тасалбарын мэдээллийг Авто тээврийн төвөөс (7035-4947) лавлана.", href: osmLink(49.03266, 104.06022) },
  { title: "Галт тэргээр", text: "Эрдэнэт 1977 оноос 120 км салбар замаар Транс-Монголын төмөр замтай холбогдсон. Галт тэрэгний буудал хотын төвөөс зүүн тийш ~9 км-т. Хуваарийг буудлаас лавлана.", href: osmLink(49.05976, 104.16457) },
  { title: "Цаг агаар", text: "Өвөл урт, маш хүйтэн: 1-р сард шөнөдөө дунджаар −26°C орчим. Зун дулаан, бороотой, шөнө сэрүүхэн. Өнөөдрийн цаг агаарыг сайтын дээд хэсгээс харна." },
  { title: "Яаралтай үед", text: "101 гал, 102 цагдаа, 103 түргэн тусламж, 105 онцгой байдал. Эмнэлэг: Бүсийн оношилгоо, эмчилгээний төв (7700-0040)." },
];

export function visitorContext(): string {
  return [
    `ЭРДЭНЭТЭД АНХ ИРЖ БУЙ ХҮМҮҮСТ — шошго "[Гараар шалгасан]" (${VISITOR_CHECKED_AT}-нд шалгасан, эх сурвалж: Wikipedia, Lonely Planet, erdenet.mn, байршил OpenStreetMap):`,
    "Хотын тухай: " + CITY_FACTS.map((f) => `${f.label}: ${f.value}`).join("; ") + ".",
    "Үзэх газрууд:",
    ...SIGHTS.map((s) => `- ${s.name} (${SIGHT_CAT[s.cat].label}). ${s.what}${s.tip ? " Зөвлөгөө: " + s.tip : ""}${s.hours ? " Цаг: " + s.hours + "." : " Ажлын цаг: эх сурвалжид бичигдээгүй."}${s.phone ? " Утас: " + s.phone + "." : ""}${s.lat ? ` Газрын зураг: ${osmLink(s.lat, s.lng!)}` : ""} Эх сурвалж: ${s.source}.`),
    "Хэрхэн ирэх, хэрэгтэй зүйлс:",
    ...ARRIVAL_TIPS.map((t) => `- ${t.title}: ${t.text}`),
  ].join("\n");
}
