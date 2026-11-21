import type { Issue, Solution } from "../types";

// Erdenet city centre (OpenStreetMap "Эрдэнэт" city node).
export const ERDENET: [number, number] = [49.0276, 104.0444];

// Location hierarchy. Sums are the two sums of Orkhon. Bag numbers are a demo list until the
// official bag register is connected; area names come from OpenStreetMap place labels.
export const LOCATIONS = {
  province: "Орхон",
  sums: [
    {
      name: "Баян-Өндөр",
      bags: Array.from({ length: 24 }, (_, i) => `${i + 1}-р баг`),
      areas: ["1-р микро", "2-р микро", "3-р микро", "4-р микро", "5-р микро", "6-р микро", "7-р микро",
        "Төв", "Баян-Өндөр", "Цагаан чулуут", "Эрдэст ус", "Нарны", "Хабитат", "Маш залуу", "Дэнж", "Эх", "Цагаан итгэлт", "Шанд", "Гэр хороолол"],
    },
    { name: "Жаргалант", bags: Array.from({ length: 4 }, (_, i) => `${i + 1}-р баг`), areas: ["Сумын төв"] },
  ],
};

// Verified OSM coordinates for the two checked traffic spots.
export const VERIFIED_SPOTS = [
  { id: "barilgachin", name: "Барилгачдын талбайн уулзвар", lat: 49.03268, lng: 104.06018, note: "Шалгах үед түгжрэлтэй (2026.11.20)" },
  { id: "a1001", name: "А1001 зам", lat: 49.02639, lng: 104.06632, note: "Шалгах үед ачаалал их (2026.11.20)" },
];

// Demo issues. Coordinates are illustrative ("coordsDemo") and are labelled so on the map.
export const DEMO_ISSUES: Issue[] = [
  { id: "I-1024", title: "Явган хүний зам эвдэрсэн", category: "road", status: "new", lat: 49.0305, lng: 104.0512, coordsDemo: true, area: "3-р микро", description: "Сургуулийн ойролцоох явган замын хавтан хөндийрч, хүүхдүүд бүдэрч унаж байна.", reportedAt: "2026-11-19", demo: true },
  { id: "I-1025", title: "Гудамжны гэрэл асахгүй", category: "lighting", status: "progress", lat: 49.0228, lng: 104.0395, coordsDemo: true, area: "5-р микро", description: "Орой 18 цагаас хойш гудамж бүрэн харанхуй байна.", reportedAt: "2026-11-15", demo: true, organization: "Тохижилтын алба (жишээ)" },
  { id: "I-1026", title: "Хогийн цэг дүүрсэн", category: "waste", status: "new", lat: 49.0352, lng: 104.0315, coordsDemo: true, area: "Гэр хороолол", description: "Хогийн савнууд 5 хоног ачигдаагүй, эргэн тойронд хог тархсан.", reportedAt: "2026-11-18", demo: true },
  { id: "I-1027", title: "Утаа ихтэй, агаар бохир", category: "air", status: "progress", lat: 49.0392, lng: 104.0255, coordsDemo: true, area: "Дэнж", description: "Орой бүр утаа өтгөн, амьсгалахад хүнд байна.", reportedAt: "2026-11-12", demo: true, organization: "Байгаль орчны газар (жишээ)" },
  { id: "I-1028", title: "Автобусны буудлын саравч эвдэрсэн", category: "transport", status: "resolved", lat: 49.0262, lng: 104.0498, coordsDemo: true, area: "Төв", description: "Саравчны шил хагарч, зорчигчид салхинд хүлээж байсан.", reportedAt: "2026-10-28", demo: true, organization: "Нийтийн тээврийн алба (жишээ)", action: "Хагарсан шилийг сольж, вандан сандал нэмж суурилуулсан.", resolvedAt: "2026-11-06" },
  { id: "I-1029", title: "Усны худгийн ус булингартай", category: "water", status: "progress", lat: 49.0418, lng: 104.0362, coordsDemo: true, area: "Гэр хороолол", description: "Ус түгээх байрны ус булингартай, үнэртэй байна.", reportedAt: "2026-11-16", demo: true, organization: "Эрдэнэт Ус (жишээ)" },
  { id: "I-1030", title: "Сургуулийн замын гарц тэмдэглэгээгүй", category: "education", status: "resolved", lat: 49.0199, lng: 104.0452, coordsDemo: true, area: "4-р микро", description: "Сургуулийн өмнөх гарцын зурвас арилсан.", reportedAt: "2026-10-20", demo: true, organization: "Замын алба (жишээ)", action: "Явган хүний гарцын тэмдэглэгээг шинэчилж, анхааруулах тэмдэг байрлуулсан.", resolvedAt: "2026-10-30" },
  { id: "I-1031", title: "Эмнэлгийн налуу зам хальтиргаатай", category: "health", status: "new", lat: 49.0281, lng: 104.0569, coordsDemo: true, area: "2-р микро", description: "Тэргэнцэртэй иргэдэд зориулсан налуу зам мөстсөн.", reportedAt: "2026-11-20", demo: true },
  { id: "I-1032", title: "Замын нүх", category: "road", status: "resolved", lat: 49.0331, lng: 104.0433, coordsDemo: true, area: "6-р микро", description: "Гол гудамжны дунд том нүх үүссэн.", reportedAt: "2026-10-10", demo: true, organization: "Замын алба (жишээ)", action: "Нүхийг асфальтаар нөхөж, тэгшилсэн.", resolvedAt: "2026-10-18" },
  { id: "I-1033", title: "Тоглоомын талбайн хашаа эвдэрсэн", category: "road", status: "progress", lat: 49.0242, lng: 104.0318, coordsDemo: true, area: "Цагаан чулуут", description: "Хүүхдийн тоглоомын талбайн төмөр хашаа унасан.", reportedAt: "2026-11-11", demo: true, organization: "Тохижилтын алба (жишээ)" },
  { id: "I-1034", title: "Гол руу хог хаясан", category: "water", status: "resolved", lat: 49.0168, lng: 104.0601, coordsDemo: true, area: "Эрдэст ус", description: "Голын эрэгт барилгын хог хаясан байна.", reportedAt: "2026-10-05", demo: true, organization: "Байгаль орчны газар (жишээ)", action: "Хогийг цэвэрлэж, хаясан этгээдэд торгууль ногдуулсан.", resolvedAt: "2026-10-12" },
];

export const DEMO_SOLUTIONS: Solution[] = [
  { id: "S-1", issueTitle: "Гудамжны гэрэл асахгүй", idea: "Нарны зайтай LED гэрэлтүүлэг суурилуулж, хөдөлгөөн мэдрэгчтэй болгох.", author: "Иргэн (жишээ)", votes: 128, progress: "review", demo: true, comments: [{ who: "Б.Тэмүүлэн (жишээ)", text: "Манай гудамжинд ч хэрэгтэй байна.", at: "2026-11-17" }] },
  { id: "S-2", issueTitle: "Утаа ихтэй, агаар бохир", idea: "Сайжруулсан түлшний цэгийг гэр хороолол бүрт ойртуулах.", author: "Иргэн (жишээ)", votes: 96, progress: "planned", demo: true, comments: [] },
  { id: "S-3", issueTitle: "Хогийн цэг дүүрсэн", idea: "Хогийн сав дүүрэхэд мэдрэгчээр мэдээлдэг ухаалаг сав туршиж үзэх.", author: "Сурагчдын клуб (жишээ)", votes: 74, progress: "idea", demo: true, comments: [{ who: "Д.Сараа (жишээ)", text: "Сургуулийн төсөл болгож болно.", at: "2026-11-15" }] },
];
