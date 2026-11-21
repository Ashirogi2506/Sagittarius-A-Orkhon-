import type { AnnouncementCategory, IssueCategory, IssueStatus, Verification } from "./types";

export const ANN_CAT: Record<AnnouncementCategory, { label: string; color: string }> = {
  water: { label: "Ус", color: "#38bdf8" },
  electricity: { label: "Цахилгаан", color: "#facc15" },
  road: { label: "Зам засвар", color: "#fb923c" },
  traffic: { label: "Замын түгжрэл", color: "#f43f5e" },
  transport: { label: "Нийтийн тээвэр", color: "#a78bfa" },
  waste: { label: "Хог хаягдал", color: "#4ade80" },
  environment: { label: "Байгаль орчин", color: "#12805c" },
  service: { label: "Төрийн үйлчилгээ", color: "#1f5fbf" },
  emergency: { label: "Онцгой байдал", color: "#d63c3c" },
};

export const ISSUE_CAT: Record<IssueCategory, string> = {
  road: "Зам, дэд бүтэц",
  air: "Агаарын бохирдол",
  waste: "Хог хаягдал",
  transport: "Нийтийн тээвэр",
  lighting: "Гэрэлтүүлэг",
  water: "Ус, байгаль орчин",
  education: "Боловсрол",
  health: "Эрүүл мэнд",
};

export const STATUS: Record<IssueStatus, { label: string; color: string; cls: string }> = {
  new: { label: "Шинээр бүртгэгдсэн", color: "#d63c3c", cls: "text-alert border-alert/40 bg-alert/10" },
  progress: { label: "Шийдвэрлэх шатанд", color: "#b7791f", cls: "text-warn border-warn/40 bg-warn/10" },
  resolved: { label: "Шийдвэрлэгдсэн", color: "#12805c", cls: "text-emerald border-emerald/40 bg-emerald/10" },
};

export const VERIFY: Record<Verification, { label: string; cls: string }> = {
  "verified-note": { label: "Гараар шалгасан", cls: "text-emerald border-emerald/40 bg-emerald/10" },
  demo: { label: "Жишээ мэдээлэл", cls: "text-warn border-warn/40 bg-warn/10" },
  unverified: { label: "Баталгаажаагүй", cls: "text-alert border-alert/40 bg-alert/10" },
  live: { label: "Шууд мэдээлэл (камер)", cls: "text-cyan border-cyan/40 bg-cyan/10" },
};

export function fmtDate(iso?: string, withTime = false): string {
  if (!iso) return "Тодорхойгүй";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Тодорхойгүй";
  const p = (n: number) => String(n).padStart(2, "0");
  const s = `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
  return withTime ? `${s} ${p(d.getHours())}:${p(d.getMinutes())}` : s;
}

const UB = "Asia/Ulaanbaatar";
const ubDay = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: UB, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

/** Full date in Ulaanbaatar time, e.g. "2026.11.20 14:30" (date only when the source gives no time). */
export function fmtUB(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Тодорхойгүй";
  const day = ubDay(d).replace(/-/g, ".");
  if (iso.length <= 10) return day;
  const t = new Intl.DateTimeFormat("en-GB", { timeZone: UB, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
  return `${day} ${t}`;
}

/** News-style relative time in Mongolian ("2 цагийн өмнө"). Date-only values are never given an hour. */
export function relTime(iso: string, now: number): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Тодорхойгүй";
  const days = Math.round((Date.parse(ubDay(new Date(now))) - Date.parse(ubDay(d))) / 86_400_000);
  if (iso.length > 10) {
    const min = Math.floor((now - d.getTime()) / 60_000);
    if (min < 0) return fmtUB(iso);
    if (min < 1) return "Дөнгөж сая";
    if (min < 60) return `${min} минутын өмнө`;
    if (min < 24 * 60 && days === 0) return `${Math.floor(min / 60)} цагийн өмнө`;
  }
  if (days < 0) return fmtUB(iso);
  if (days === 0) return "Өнөөдөр";
  if (days === 1) return "Өчигдөр";
  if (days < 7) return `${days} өдрийн өмнө`;
  return fmtUB(iso);
}
