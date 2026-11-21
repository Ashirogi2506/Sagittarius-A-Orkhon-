// Public service offices in Erdenet and state-service fees.
// Every entry is copied from an official page (see `source`) and was checked on CHECKED_AT.
// Do not add numbers, hours or fees that are not on an official page.

export const CHECKED_AT = "2026-11-21";
const ORG = "https://erdenet.mn/lavlah/org/organ/";

export type Range = [string, string];
/** Days use 1 = Monday … 7 = Sunday. */
export type Hours = { days: number[]; ranges: Range[] };

export type ServiceCat = "docs" | "social" | "health" | "utility" | "safety" | "transport" | "land" | "city" | "culture";
export const SERVICE_CAT: Record<ServiceCat, { label: string; icon: string }> = {
  docs: { label: "Бичиг баримт, бүртгэл", icon: "🪪" },
  social: { label: "Даатгал, халамж", icon: "🤝" },
  health: { label: "Эрүүл мэнд", icon: "🏥" },
  utility: { label: "Ус, дулаан, цахилгаан", icon: "💡" },
  safety: { label: "Аюулгүй байдал", icon: "🚨" },
  transport: { label: "Тээвэр", icon: "🚌" },
  land: { label: "Газар, барилга", icon: "🏗️" },
  city: { label: "Хот, захиргаа", icon: "🏛️" },
  culture: { label: "Соёл, мэдээлэл", icon: "📚" },
};

export type ServiceOrg = {
  id: string;
  name: string;
  cat: ServiceCat;
  does: string;
  services: string[];
  address: string;
  phones: string[];
  web?: string;
  hours: Hours | null;
  hoursNote?: string;
  source: string;
};

const WEEK = [1, 2, 3, 4, 5];
const ALL = [1, 2, 3, 4, 5, 6, 7];
const H8_17: Hours = { days: WEEK, ranges: [["08:00", "12:00"], ["13:00", "17:00"]] };
const H8_18: Hours = { days: WEEK, ranges: [["08:00", "12:00"], ["14:00", "18:00"]] };

export const SERVICE_ORGS: ServiceOrg[] = [
  {
    id: "burtgel", name: "Улсын бүртгэлийн хэлтэс", cat: "docs",
    does: "Иргэний, эд хөрөнгийн эрхийн, хуулийн этгээдийн улсын бүртгэл.",
    services: ["Иргэний үнэмлэх анх авах, 25, 45 насанд солих, дахин авах", "Гадаад паспорт", "Төрсний, гэрлэлтийн бүртгэл, гэрчилгээ дахин авах", "Лавлагаа (төрсний, гэрлэсний, хаягийн г.м.)", "Эд хөрөнгийн эрхийн бүртгэл", "Хуулийн этгээдийн бүртгэл, өөрчлөлт"],
    address: "Оюут баг, Захиргааны 2-р байр, 1 давхар", phones: ["7035-8118", "1800-1890 (УБЕГ)"], web: "http://orkhon.burtgel.gov.mn",
    hours: H8_17, source: ORG + "130500015",
  },
  {
    id: "ndaatgal", name: "Нийгмийн даатгалын газар", cat: "social",
    does: "Нийгмийн даатгалын шимтгэл, тэтгэвэр, тэтгэмж тогтоох, олгох.",
    services: ["Өндөр насны тэтгэвэр", "Жирэмсний болон амаржсаны тэтгэмж", "Ажилгүйдлийн тэтгэмж", "Хөдөлмөрийн чадвар түр алдсаны тэтгэмж", "Сайн дурын даатгал (portal.ndaatgal.mn, «Нийгмийн даатгал» апп)", "Тэжээгчээ алдсаны тэтгэвэр"],
    address: "Хүрэнбулаг баг, Оросын консулын зүүн талд", phones: ["7577-6699"], web: "https://orhon.ndaatgal.mn/",
    hours: H8_18, source: ORG + "130600024",
  },
  {
    id: "emd", name: "Эрүүл мэндийн даатгалын хэлтэс", cat: "social",
    does: "Эрүүл мэндийн даатгалын шимтгэл, лавлагаа, төр хариуцах иргэдийн бүртгэл.",
    services: ["ЭМД-ын лавлагаа, бүртгэл", "Шимтгэлийг цахимаар төлөх", "Төр хариуцах иргэд (хүүхэд, төрсөн эх г.м.): төрсний гэрчилгээ, иргэний үнэмлэхтэй ирнэ", "Гэрээт эмнэлгийн мэдээлэл"],
    address: "Зэст баг, Төрийн захиргааны 3-р байр, 205, 211 тоот", phones: ["7035-1819"],
    hours: { days: WEEK, ranges: [["07:30", "11:30"], ["13:30", "17:30"]] }, source: ORG + "230800008",
  },
  {
    id: "halamj", name: "Хөдөлмөр, халамжийн үйлчилгээний газар", cat: "social",
    does: "Ажил олгох, хөдөлмөр эрхлэлтийг дэмжих хөтөлбөр, нийгмийн халамжийн үйлчилгээ.",
    services: ["Ажил хайгчийн бүртгэл, хөдөлмөр эрхлэлтийн хөтөлбөрүүд (залуучууд, ахмад, хөгжлийн бэрхшээлтэй иргэн)", "Байнгын асаргаа шаардлагатай иргэний асаргааны тэтгэмж", "Өрх толгойлсон эх, эцэгт олгох тэтгэмж", "Гэнэтийн аюулд өртөж орон гэргүй болсон иргэнд туслах"],
    address: "Баянбулаг баг, Булаг багийн хажууд", phones: ["7735-1220"], web: "http://orkhon.hudulmur-halamj.gov.mn",
    hours: H8_18, source: ORG + "130600001",
  },
  {
    id: "huuhed", name: "Хүүхэд, гэр бүлийн хөгжил, хамгааллын газар", cat: "social",
    does: "Хүүхэд, гэр бүлийн хамгаалал, гэр бүлийн хүчирхийллээс урьдчилан сэргийлэх, эцэг эхийн сургалт.",
    services: ["Хүүхэд хамгааллын үйлчилгээ", "Гэр бүлийн боловсролын сургалт", "Гэр бүлийн хүчирхийллийн асуудлаар зөвлөгөө"],
    address: "Цагаанчулуут баг, Хүүхдийн ордон", phones: ["7035-7200"], web: "https://orkhon.cfga.gov.mn/",
    hours: H8_18, source: ORG + "130600029",
  },
  {
    id: "boet", name: "Бүсийн оношилгоо, эмчилгээний төв (БОЭТ)", cat: "health",
    does: "Аймгийн нэгдсэн эмнэлэг: нарийн мэргэжлийн эмчийн үзлэг, оношилгоо, хэвтэн эмчлүүлэх.",
    services: ["Нарийн мэргэжлийн эмчийн үзлэгийн цаг захиалга (утсаар эсвэл e-mongolia.mn)", "Шинжилгээний хариу e-mongolia.mn-ээс", "Эхлээд Өрхийн эрүүл мэндийн төвд үзүүлж, шаардлагатай бол БОЭТ-д илгээлгэнэ"],
    address: "Зэст баг, Хангайн гудамж", phones: ["7700-0040 (цаг захиалга)", "103 (түргэн тусламж)"], web: "https://www.gov.mn/org/orkh-boet",
    hours: H8_17, hoursNote: "Цаг захиалга ажлын өдөр 08:00–12:00, 13:00–16:00. Яаралтай үед 103.", source: ORG + "130500012",
  },
  {
    id: "us", name: "Эрдэнэт ус, дулаан түгээх сүлжээ ОНӨХК", cat: "utility",
    does: "Хотын ус хангамж, ариутгах татуурга, дулаан түгээх.",
    services: ["Ус, дулааны асуудал, гэмтэл мэдээлэх", "Халуун, хүйтэн ус, дулааны тоолуур суурилуулах, засварлах", "Цахилгаан шатны засвар үйлчилгээ"],
    address: "Хүрэнбулаг баг, өөрийн байр", phones: ["7035-0916"], web: "https://erdenet-us.gov.mn/",
    hours: H8_18, source: ORG + "221100002",
  },
  {
    id: "edc", name: "Эрдэнэт-Булганы цахилгаан түгээх сүлжээ ТӨХК", cat: "utility",
    does: "Цахилгаан эрчим хүч түгээх, хэрэглэгчийг хангах.",
    services: ["Цахилгаан тасралт, гэмтэл мэдээлэх", "Цахилгааны тоолуур суурилуулах, засварлах, худалдах", "Шинээр холбогдох, шугамын ажил"],
    address: "Баянцагаан баг, Эрчим хүчний гудамж", phones: ["7595-7008"], web: "http://www.edc.mn/",
    hours: H8_17, source: ORG + "130900004",
  },
  {
    id: "police", name: "Цагдаагийн газар", cat: "safety",
    does: "Гэмт хэрэгтэй тэмцэх, нийтийн хэв журам, олон нийтийн аюулгүй байдлыг хангах.",
    services: ["Гэмт хэрэг, зөрчил мэдээлэх: 102", "Гээгдсэн бичиг баримтын талаар мэдэгдэх"],
    address: "Баянцагаан баг", phones: ["102"], web: "http://orkhon.police.gov.mn",
    hours: H8_18, hoursNote: "Ажлын цаг нь албан өрөөнийх. 102 нь 24 цаг ажиллана.", source: ORG + "130900005",
  },
  {
    id: "ontsgoi", name: "Онцгой байдлын газар", cat: "safety",
    does: "Гал түймэр, гамшгаас хамгаалах, эрэн хайх, аврах.",
    services: ["Гал түймэр: 101", "Онцгой байдал, аврах: 105", "Гамшгаас хамгаалах сургалт"],
    address: "Баянцагаан баг", phones: ["101", "105"], web: "http://or.nema.gov.mn/",
    hours: H8_18, hoursNote: "Ажлын цаг нь албан өрөөнийх. 101, 105 нь 24 цаг ажиллана.", source: ORG + "130600018",
  },
  {
    id: "auto", name: "Авто тээврийн төв", cat: "transport",
    does: "Тээврийн хэрэгслийн бүртгэл, техникийн хяналтын үзлэг, нийтийн зорчигч тээврийн зохицуулалт.",
    services: ["Техникийн хяналтын үзлэг", "Улсын дугаар олгох, шилжилт хөдөлгөөн бүртгэх", "Тээврийн хэрэгслийн гэрчилгээ", "Хот доторх нийтийн тээвэр (автобус)-ийн зохицуулалт"],
    address: "Баянцагаан баг", phones: ["7035-4947", "7035-4942"], web: "https://www.transdep.mn",
    hours: H8_17, source: ORG + "130600026",
  },
  {
    id: "gazar", name: "Газрын харилцаа, барилга, хот байгуулалтын газар", cat: "land",
    does: "Газар олгох, өмчлүүлэх, эзэмших эрх, барилгын зөвшөөрөл, зураг төсөл.",
    services: ["Гэр бүлийн хэрэгцээнд газар өмчлүүлэх", "Газар эзэмших эрхийн гэрчилгээний хугацаа сунгах", "Газар ашиглалтын зориулалт өөрчлөх", "Зураг төсөл хянаж баталгаажуулах"],
    address: "Уурхайчин баг, Захиргааны IV байр, 1 давхар", phones: ["7035-7917"], web: "https://www.gov.mn/org/erdenetgazar",
    hours: H8_18, source: ORG + "130900010",
  },
  {
    id: "tatvar", name: "Татварын газар", cat: "city",
    does: "Татвар хураах, татвар төлөгчид зөвлөгөө өгөх.",
    services: ["Татварын бүртгэл, тайлан", "Үл хөдлөх эд хөрөнгө, авто машины татвар", "Татварын зөвлөгөө"],
    address: "Хүрэнбулаг баг", phones: ["7511-1288 (дотуур 234)"], web: "https://orkhon.mta.mn/",
    hours: H8_18, source: ORG + "130800010",
  },
  {
    id: "hza", name: "Эрдэнэт хотын захирагчийн алба", cat: "city",
    does: "Хотын дэд бүтэц, эрчим хүч, авто зам, тохижилт, ногоон байгууламж, өдөр тутмын асуудал.",
    services: ["Хотын тохижилт, зам, гудамжны асуудал", "Хотын өдөр тутмын асуудлаар хандах"],
    address: "Зэст баг, Захиргааны 3-р байр, 2 давхар", phones: ["7035-8012"], web: "https://www.gov.mn/org/orkh-hza",
    hours: H8_18, source: ORG + "130600015",
  },
  {
    id: "htg", name: "Хот тохижуулах газар", cat: "city",
    does: "Хотын гудамж, талбай, авто болон явган замын цэвэрлэгээ, тохижилт.",
    services: ["Гудамж, талбайн цэвэрлэгээ", "Хотын болон гэр хорооллын замын арчлалт"],
    address: "Баянцагаан баг, Тосгон", phones: ["7035-8944", "7714-5454"], web: "https://htg.or.gov.mn/",
    hours: H8_18, source: ORG + "130800011",
  },
  {
    id: "zdtg", name: "Аймгийн Засаг даргын Тамгын газар", cat: "city",
    does: "Аймгийн удирдлага, иргэд хүлээн авах, өргөдөл, гомдол.",
    services: ["Иргэд хүлээн авах, өргөдөл гомдол", "Засаг даргын шийдвэр, журам (erdenet.mn)"],
    address: "Хүрэнбулаг баг, Нутгийн удирдлагын ордон", phones: ["7035-3511 (лавлах)", "7035-7319"], web: "http://www.erdenet.mn/",
    hours: null, hoursNote: "Ажлын цагийг лавлах утсаар тодруулна уу.", source: ORG + "141000001",
  },
  {
    id: "bolovsrol", name: "Боловсролын газар", cat: "docs",
    does: "Ерөнхий боловсролын сургууль, цэцэрлэгийн удирдлага, боловсролын баримт бичиг.",
    services: ["Боловсролын баримт бичиг (гэрчилгээ, үнэмлэх) дахин олгох: 16,500₮, нөөц байвал 1–3 хоногт"],
    address: "Оюут баг, Захиргааны IV байр, 2 давхар", phones: ["7035-0792", "7735-1122"], web: "https://www.gov.mn/org/orkh-bolovsrol",
    hours: H8_18, source: ORG + "250400001",
  },
  {
    id: "shuudan", name: "Монгол Шуудан, Орхон салбар", cat: "culture",
    does: "Шуудан, илгээмж, хэвлэлийн захиалга.",
    services: ["Захидал, илгээмж илгээх, хүлээн авах", "Гадаад, дотоод хэвлэл захиалах"],
    address: "Зэст баг, Мэдээлэл холбооны сүлжээний байр, 1 давхар", phones: ["7035-4949", "7511-1613"], web: "https://www.mongolpost.mn/",
    hours: H8_18, source: ORG + "230800012",
  },
  {
    id: "tsaguur", name: "Ус цаг уур, орчны шинжилгээний төв", cat: "culture",
    does: "Цаг агаарын албан ёсны урьдчилсан мэдээ, аюултай үзэгдлээс сэрэмжлүүлэх.",
    services: ["Цаг агаарын албан ёсны мэдээ", "Агаар, орчны бохирдлын мэдээлэл"],
    address: "Баянцагаан баг, Тосгон, «Эрдэнэт хивс»-ийн баруун талд", phones: ["7035-7258"], web: "https://orkhon.weather.gov.mn/",
    hours: { days: ALL, ranges: [["09:00", "13:00"], ["14:00", "17:00"]] }, source: ORG + "130600027",
  },
  {
    id: "nomiin-san", name: "Нийтийн номын сан", cat: "culture",
    does: "Ном унших, зээлэх, цахим мэдээллийн үйлчилгээ.",
    services: ["Ном зээлэх, уншлагын танхим", "Цахим мэдээллийн үйлчилгээ"],
    address: "Хүрэнбулаг баг", phones: ["7035-9064"], web: "https://www.facebook.com/nomiin.tuv",
    hours: null, hoursNote: "Ажлын цаг албан хуудсанд бичигдээгүй, утсаар лавлана уу.", source: ORG + "130600017",
  },
  {
    id: "muzei", name: "Орхон аймгийн музей", cat: "culture",
    does: "Орон нутгийн түүх, соёл, байгалийн өвийн үзмэр, үзэсгэлэн.",
    services: ["Музейн үзмэр үзэх", "Үзэсгэлэн, танин мэдэхүйн арга хэмжээ"],
    address: "Зэст баг, 21-р байр", phones: ["7035-0041"], web: "https://www.facebook.com/profile.php?id=100008222825732",
    hours: { days: ALL, ranges: [["09:00", "13:00"], ["14:00", "17:00"]] }, source: ORG + "130500018",
  },
  {
    id: "teatr", name: "Хүүхэд залуучуудын театр", cat: "culture",
    does: "Тайзны бүтээл, хүүхдийн авьяас хөгжүүлэх.",
    services: ["Тоглолт, тасалбар (Facebook хуудсаар)", "Хүүхдийн дугуйлан"],
    address: "Уурхайчин баг, Тюряковын гудамж", phones: ["7035-8959"], web: "https://www.facebook.com/erdenetteatr.mn",
    hours: H8_18, hoursNote: "Ажлын цаг нь албан өрөөнийх; тоглолтын цаг өөр.", source: ORG + "130600016",
  },
];

// ─── State-service fees ───────────────────────────────────────────────

export type FeeItem = { label: string; amount: number };
export type Fee = { id: string; group: string; name: string; items: FeeItem[]; note?: string; where: string; source: string };

const BURTGEL_ID = "https://burtgel.gov.mn/post/67143";
const BURTGEL_PASS = "https://burtgel.gov.mn/post/67144";
const BURTGEL_CIVIL = "https://burtgel.gov.mn/post/67141";
const BURTGEL_REF = "https://burtgel.gov.mn/post/67139";
const UB = "Улсын бүртгэлийн хэлтэс";

export const FEES: Fee[] = [
  { id: "id-new", group: "Иргэний үнэмлэх", name: "Анх авах (16 нас), 25, 45 насанд солих",
    items: [{ label: "Үйлчилгээний хураамж", amount: 15000 }, { label: "Улсын тэмдэгтийн хураамж", amount: 3300 }],
    note: "Хугацаа хэтэрсэн бол нэмж 20,000₮ торгууль.", where: UB, source: BURTGEL_ID },
  { id: "id-again", group: "Иргэний үнэмлэх", name: "Дахин авах (гээсэн, хаясан)",
    items: [{ label: "Үйлчилгээний хураамж", amount: 30000 }, { label: "Улсын тэмдэгтийн хураамж", amount: 3300 }, { label: "Торгууль", amount: 30000 }],
    where: UB, source: BURTGEL_ID },
  { id: "id-damaged", group: "Иргэний үнэмлэх", name: "Хүчинтэй байдлыг алдагдуулсан (гэмтээсэн г.м.)",
    items: [{ label: "Үйлчилгээний хураамж", amount: 30000 }, { label: "Улсын тэмдэгтийн хураамж", amount: 3300 }, { label: "Торгууль", amount: 25000 }],
    where: UB, source: BURTGEL_ID },
  { id: "pass-new", group: "Гадаад паспорт", name: "Энгийн гадаад паспорт шинээр авах",
    items: [{ label: "Үйлчилгээний хураамж", amount: 29500 }, { label: "Бичилтийн үнэ", amount: 5500 }, { label: "Улсын тэмдэгтийн хураамж", amount: 5000 }],
    where: UB, source: BURTGEL_PASS },
  { id: "pass-lost", group: "Гадаад паспорт", name: "Энгийн гадаад паспорт дахин авах (хаясан, гэмтээсэн)",
    items: [{ label: "Үйлчилгээний хураамж", amount: 59000 }, { label: "Бичилтийн үнэ", amount: 11000 }, { label: "Торгууль", amount: 25000 }, { label: "Улсын тэмдэгтийн хураамж", amount: 5000 }],
    where: UB, source: BURTGEL_PASS },
  { id: "epass-new", group: "Гадаад паспорт", name: "Цахим гадаад паспорт авах (шинээр, хуудас, хугацаа дууссан)",
    items: [{ label: "Үйлчилгээний хураамж", amount: 70000 }, { label: "Бичилтийн үнэ", amount: 7500 }, { label: "Улсын тэмдэгтийн хураамж", amount: 5000 }],
    where: UB, source: BURTGEL_PASS },
  { id: "epass-lost", group: "Гадаад паспорт", name: "Цахим гадаад паспорт дахин авах (хаясан, гэмтээсэн)",
    items: [{ label: "Үйлчилгээний хураамж", amount: 140000 }, { label: "Бичилтийн үнэ", amount: 15000 }, { label: "Торгууль", amount: 25000 }, { label: "Улсын тэмдэгтийн хураамж", amount: 5000 }],
    where: UB, source: BURTGEL_PASS },
  { id: "marriage", group: "Иргэний бүртгэл", name: "Гэрлэлт бүртгүүлэх", items: [{ label: "Үйлчилгээний хураамж", amount: 2500 }], where: UB, source: BURTGEL_CIVIL },
  { id: "divorce", group: "Иргэний бүртгэл", name: "Гэрлэлт дуусгавар болсныг бүртгүүлэх", items: [{ label: "Үйлчилгээний хураамж", amount: 2500 }], where: UB, source: BURTGEL_CIVIL },
  { id: "rename", group: "Иргэний бүртгэл", name: "Овог, эцэг (эх)-ийн нэр, өөрийн нэр солих", items: [{ label: "Үйлчилгээний хураамж", amount: 2500 }], where: UB, source: BURTGEL_CIVIL },
  { id: "birth-again", group: "Иргэний бүртгэл", name: "Төрсний гэрчилгээ дахин авах", items: [{ label: "Үйлчилгээний хураамж", amount: 10000 }], where: UB, source: BURTGEL_CIVIL },
  { id: "birth-swap", group: "Иргэний бүртгэл", name: "Төрсний гэрчилгээ сольж авах", items: [{ label: "Үйлчилгээний хураамж", amount: 5000 }], where: UB, source: BURTGEL_CIVIL },
  { id: "marriage-again", group: "Иргэний бүртгэл", name: "Гэрлэлтийн гэрчилгээ дахин авах", items: [{ label: "Үйлчилгээний хураамж", amount: 10000 }], where: UB, source: BURTGEL_CIVIL },
  { id: "birth-late", group: "Иргэний бүртгэл", name: "Төрсний нөхөн бүртгэл", items: [{ label: "Үйлчилгээний хураамж", amount: 2500 }], where: UB, source: BURTGEL_CIVIL },
  { id: "ref", group: "Лавлагаа", name: "Улсын бүртгэлийн лавлагаа (төрсний, гэрлэсний, оршин суугаа хаягийн, иргэний үнэмлэхний г.м.)",
    items: [{ label: "Нэг лавлагаа", amount: 1000 }], where: "Улсын бүртгэлийн хэлтэс, лавлагааны киоск", source: BURTGEL_REF },
  { id: "edu-doc", group: "Боловсрол", name: "Боловсролын баримт бичиг (гэрчилгээ, үнэмлэх) дахин авах",
    items: [{ label: "Баримт бичгийн үнэ", amount: 16500 }], note: "Нөөц байгаа бол 1–3 хоногт. Иргэний үнэмлэх, хүсэлт, сургуулийн лавлагаатай очно.", where: "Боловсролын газар", source: ORG.replace("org/organ/", "servicedetail/") + "250400001" },
];

export const feeTotal = (f: Fee) => f.items.reduce((s, i) => s + i.amount, 0);
export const tg = (n: number) => `${n.toLocaleString("en-US")}₮`;

// ─── Opening hours (Ulaanbaatar time, UTC+8, no DST) ───────────────────

const DAY = ["", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба", "Ням"];

export function hoursText(h: Hours | null): string {
  if (!h) return "Цагийн хуваарь тодорхойгүй";
  const d = h.days.length === 7 ? "Өдөр бүр" : h.days.join() === "1,2,3,4,5" ? "Даваа–Баасан" : h.days.map((x) => DAY[x]).join(", ");
  return `${d} ${h.ranges.map(([a, b]) => `${a}–${b}`).join(", ")}`;
}

/** Day 1–7 and minutes since midnight in Mongolia for a given instant. */
export function mnClock(ms: number): { day: number; min: number } {
  const t = new Date(ms + 8 * 3600_000);
  return { day: ((t.getUTCDay() + 6) % 7) + 1, min: t.getUTCHours() * 60 + t.getUTCMinutes() };
}

const toMin = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));

export type OpenState = "open" | "lunch" | "closed" | "unknown";
export function openState(h: Hours | null, ms: number): OpenState {
  if (!h) return "unknown";
  const { day, min } = mnClock(ms);
  if (!h.days.includes(day)) return "closed";
  const r = h.ranges.map(([a, b]) => [toMin(a), toMin(b)]);
  if (r.some(([a, b]) => min >= a && min < b)) return "open";
  if (min >= r[0][0] && min < r[r.length - 1][1]) return "lunch";
  return "closed";
}

// ─── Text for the AI assistant ─────────────────────────────────────────

export function servicesContext(ms: number): string {
  const orgs = SERVICE_ORGS.map((o) => {
    const st = openState(o.hours, ms);
    const now = st === "open" ? "одоо ажиллаж байна" : st === "lunch" ? "одоо цайны цаг" : st === "closed" ? "одоо хаалттай" : "ажлын цаг тодорхойгүй";
    return `- ${o.name} (${SERVICE_CAT[o.cat].label}). ${o.does} Үйлчилгээ: ${o.services.join("; ")}. Хаяг: ${o.address}. Утас: ${o.phones.join(", ")}. Цаг: ${hoursText(o.hours)}${o.hoursNote ? ` (${o.hoursNote})` : ""}; ${now}.${o.web ? ` Вэб: ${o.web}.` : ""} Эх сурвалж: ${o.source}.`;
  });
  const fees = FEES.map((f) => `- ${f.group}: ${f.name} — нийт ${tg(feeTotal(f))} (${f.items.map((i) => `${i.label} ${tg(i.amount)}`).join(" + ")}).${f.note ? " " + f.note : ""} Хаана: ${f.where}. Эх сурвалж: ${f.source}.`);
  return [
    `ТӨРИЙН ҮЙЛЧИЛГЭЭНИЙ БАЙГУУЛЛАГУУД — шошго "[Гараар шалгасан]" (жишээ биш, бодит мэдээлэл). Эрдэнэт, ${CHECKED_AT}-нд erdenet.mn лавлахаас шалгасан; бүгд Баян-Өндөр сумд:`,
    ...orgs,
    "",
    `ТӨРИЙН ҮЙЛЧИЛГЭЭНИЙ ХУРААМЖ — шошго "[Гараар шалгасан]" (Улсын бүртгэлийн ерөнхий газрын 2025-03-20-ны албан мэдээлэл, ${CHECKED_AT}-нд шалгасан). Төлөх дансыг Орхон аймгийн Улсын бүртгэлийн хэлтсээс (7035-8118) тодруулна:`,
    ...fees,
  ].join("\n");
}
