"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { useStore } from "@/lib/store";
import { Logo } from "./Header";

// Every outside source the site uses, in one place, so the cards themselves stay short.
const SOURCES: [string, string][] = [
  ["Эрдэнэт хот, Орхон аймаг", "https://erdenet.mn/"],
  ["Эрдэнэт Ус", "https://erdenetus.mn/"],
  ["Цахилгаан түгээх сүлжээ", "https://www.edc.mn/"],
  ["Замын камер", "https://dedtuv.erdenet.mn/live"],
  ["Улсын бүртгэл", "https://burtgel.gov.mn/"],
  ["Төрийн үйлчилгээ", "https://www.gov.mn/"],
  ["Цаг агаар", "https://open-meteo.com/"],
  ["Газрын зураг", "https://www.openstreetmap.org/copyright"],
  ["Wikipedia", "https://en.wikipedia.org/wiki/Erdenet"],
  ["Lonely Planet", "https://www.lonelyplanet.com/mongolia/northern-mongolia/erdenet"],
];

/** News-site style footer: about, emergency numbers, sources and credits in one place. */
export function Footer() {
  return (
    <footer id="about" className="scroll-mt-20 border-t-2 border-snow bg-[var(--deep)]" aria-labelledby="about-title">
      <h2 id="about-title" className="sr-only">Бидний тухай</h2>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.3fr_1fr_1fr] md:px-6">
        <div>
          <div className="flex items-center gap-2.5"><Logo /><span className="font-display font-semibold">SMART ORKHON</span></div>
          <p className="mt-3 max-w-sm text-sm text-muted">Орхоны мэдээллийг нэг дор, Sagittarius багийн хакатоны төсөл.</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted">Sagittarius · 2026 · MVP</p>
          <p className="mt-3 text-sm"><a href="/privacy" className="text-cyan underline">Нууцлалын бодлого</a> · <a href="/privacy#delete" className="text-cyan underline">Бүртгэл устгах</a></p>
        </div>
        <div>
          <p className="mb-3 text-[13px] font-bold uppercase tracking-wider">Яаралтай утас</p>
          <ul className="space-y-1.5 text-sm text-muted"><li>101 · Гал унтраах, аврах</li><li>102 · Цагдаа</li><li>103 · Түргэн тусламж</li><li>105 · Онцгой байдал</li><li>11-11 · Санал, гомдол</li></ul>
        </div>
        <div>
          <p className="mb-3 text-[13px] font-bold uppercase tracking-wider">Анхааруулга</p>
          <p className="text-sm leading-relaxed text-muted">«Жишээ» шошготой мэдээлэл бодит биш.</p>
        </div>
      </div>
      <div id="sources" className="mx-auto max-w-7xl scroll-mt-20 border-t border-line px-4 py-6 md:px-6">
        <p className="text-[13px] font-bold uppercase tracking-wider">Эх сурвалж</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {SOURCES.map(([name, url]) => (
            <li key={url}>
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-line bg-white px-3 text-[13px] text-muted transition-colors hover:border-cyan/50 hover:text-snow">
                {name}<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </div>
      <p className="mx-auto max-w-7xl border-t border-line px-4 py-4 text-xs text-muted md:px-6">© 2026 SMART ORKHON · Газрын зураг © OpenStreetMap contributors</p>
    </footer>
  );
}

export function Toast() {
  const { toast } = useStore();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4" role="status" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="rounded-xl border border-cyan/30 bg-[#ffffff] px-4 py-2.5 text-sm font-semibold shadow-xl">{toast}</motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
