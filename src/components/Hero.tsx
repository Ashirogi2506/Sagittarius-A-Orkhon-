"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Bot, Map as MapIcon, MapPin, Megaphone, X } from "lucide-react";
import { useState } from "react";
import { CityIllustration, type ZoneId } from "./CityIllustration";
import { useStore } from "@/lib/store";
import { DEMO_ISSUES } from "@/lib/data/places";
import { Badge, Button, DemoTag, buttonVariants } from "./ui";
import { WeatherChip } from "./WeatherChip";

const ZONES: Record<ZoneId, { title: string; text: string; area?: string; tags: string[]; ask: string }> = {
  mine: { title: "Эрдэнэтийн ил уурхай", text: "Зэс, молибдены ил уурхай, хотын эдийн засгийн гол тулгуур.", tags: ["Байгаль орчин", "Аюулгүй байдал"], ask: "Байгаль орчны ямар мэдэгдэл байна?" },
  plant: { title: "Эрдэнэт үйлдвэр", text: "Баяжуулах фабрик, хотын цахилгаан, усны томоохон хэрэглэгч.", tags: ["Цахилгаан", "Ус"], ask: "Цахилгаан тасрах мэдэгдэл байна уу?" },
  center: { title: "Хотын төв, орон сууцны хороолол", text: "Орон сууцны хороолол, ус, дулааны тасралт хамгийн их нөлөөлдөг бүс.", area: "3-р микро", tags: ["Ус, дулаан", "Гэрэлтүүлэг"], ask: "Манай багт ус тасрах уу?" },
  ger: { title: "Гэр хороолол", text: "Агаар, хог, ус түгээх байрны асуудал түлхүү гардаг бүс.", area: "Гэр хороолол", tags: ["Агаар", "Хог", "Ус түгээх байр"], ask: "Манай ойролцоо ямар асуудал байна?" },
  junction: { title: "Гол зам, Барилгачин уулзвар", text: "Хотын гол уулзвар, одоогийн ачааллыг газрын зургаас харна.", tags: ["Замын хөдөлгөөн", "Нийтийн тээвэр"], ask: "Замын ямар мэдээ байна?" },
  hills: { title: "Ногоон толгод, байгаль", text: "Хотыг тойрсон ой, толгод, түймэр, хог хаягдлыг мэдээлж болно.", tags: ["Байгаль орчин"], ask: "Шийдвэрлэгдсэн асуудлуудыг харуул." },
};

export function Hero() {
  const [zone, setZone] = useState<ZoneId | null>(null);
  const { askAI, prefs, setPrefs } = useStore();
  const z = zone ? ZONES[zone] : null;
  const issues = z?.area ? DEMO_ISSUES.filter((i) => i.area === z.area && i.status !== "resolved").length : 0;

  return (
    <section id="home" className="bg-grid relative overflow-hidden" aria-labelledby="hero-title">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-8 md:px-6 md:pb-14 md:pt-12">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.35fr]">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-muted"><MapPin className="h-4 w-4 text-cyan" aria-hidden="true" />Эрдэнэт хот, Орхон аймаг</span>
              <WeatherChip />
            </div>
            <h1 id="hero-title" className="font-display text-[2rem] font-semibold leading-[1.08] tracking-[-0.03em] md:text-[3rem]">
              Орхон аймгийн ирээдүйг хамтдаа бүтээе.
            </h1>
            <p className="mt-4 max-w-[46ch] text-base leading-relaxed text-muted md:text-lg">Хотын хэрэгтэй мэдээлэл нэг дор, асуудлаа шууд мэдээлээрэй.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#report" className={buttonVariants({ size: "lg" })}><Megaphone className="h-5 w-5" />Асуудал мэдээлэх</a>
              <a href="#map" className={buttonVariants({ size: "lg", variant: "ghost" })}><MapIcon className="h-5 w-5" />Газрын зураг</a>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.1 }} className="relative">
            <div className="relative overflow-hidden rounded-lg border border-line bg-navy-3 p-1">
              <span className="pointer-events-none absolute left-3 top-3 z-[1] rounded-md bg-white/90 px-2 py-1 text-[12.5px] font-semibold text-snow shadow-sm">Бүсэд дарж мэдээллийг харна</span>
              <div className="overflow-hidden rounded-md">
                <CityIllustration onZone={setZone} active={zone} />
              </div>
            </div>
            <p className="mt-2 text-right text-[12.5px] text-muted">Уран сайхны дүрслэл, яг байршил биш.</p>

            <AnimatePresence>
              {z && (
                <motion.div key={zone} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="glass absolute bottom-10 left-3 right-3 z-10 rounded-lg p-4 sm:left-auto sm:w-[360px]" role="dialog" aria-label={z.title}>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-base font-semibold">{z.title}</h3>
                    <button type="button" onClick={() => setZone(null)} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg hover:bg-snow/10" aria-label="Хаах"><X className="h-4 w-4" /></button>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{z.text}</p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">{z.tags.map((t) => <Badge key={t} className="border-line text-snow">{t}</Badge>)}</div>
                  {z.area && <p className="mt-2 text-xs text-muted">Идэвхтэй асуудал: <b className="text-snow">{issues}</b> <DemoTag>жишээ</DemoTag></p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {z.area && <Button size="sm" variant="ghost" onClick={() => { setPrefs({ ...prefs, area: z.area! }); document.getElementById("notices")?.scrollIntoView({ behavior: "smooth" }); }}><ArrowRight className="h-3.5 w-3.5" />Энэ бүсийн мэдэгдэл</Button>}
                    <Button size="sm" onClick={() => askAI(z.ask)}><Bot className="h-3.5 w-3.5" />AI-аас асуух</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
