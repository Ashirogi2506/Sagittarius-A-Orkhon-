import QRCode from "qrcode";
import { Bell, CloudSun, Map as MapIcon, Megaphone, Siren, Smartphone, WifiOff, Zap } from "lucide-react";
import { TABS } from "@/lib/appNav";
import { Logo } from "./Header";
import { InstallPanel } from "./InstallPanel";
import { SectionHead } from "./ui";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://smart-orkhon.vercel.app";

// QR code drawn as one SVG path on the server, so the QR library never reaches the browser.
function qrPath(text: string) {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: "M" });
  let d = "";
  for (let y = 0; y < modules.size; y++) for (let x = 0; x < modules.size; x++) if (modules.get(y, x)) d += `M${x} ${y}h1v1h-1z`;
  return { d, size: modules.size };
}

const PERKS = [
  { icon: Zap, t: "Нэг товшилтоор нээгдэнэ" },
  { icon: WifiOff, t: "Сүлжээгүй үед ч нээгдэнэ" },
  { icon: Smartphone, t: "Хөнгөн, үнэгүй" },
];

/** A phone frame drawn with the site's own colours and components: the design of the app. */
function Phone({ title, children, tab, className = "" }: { title: string; children: React.ReactNode; tab: string; className?: string }) {
  return (
    <div className={`relative w-[230px] shrink-0 rounded-[2.4rem] border border-white/15 bg-[#030a14] p-2 shadow-[0_40px_80px_-30px_rgba(0,0,0,.55)] ${className}`} aria-hidden="true">
      <div className="relative flex h-[470px] flex-col overflow-hidden rounded-[2rem] bg-navy bg-grid">
        <div className="absolute left-1/2 top-2 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />
        <div className="flex items-center justify-between px-5 pt-2 text-[10px] font-semibold text-snow/80"><span>9:41</span><span>5G ▮▮▮</span></div>
        <div className="mt-3 flex items-center gap-2 border-b border-line px-3 pb-2">
          <span className="scale-75"><Logo /></span>
          <span className="flex-1 leading-tight"><span className="block text-[11px] font-bold">SMART ORKHON</span><span className="block text-[9px] text-muted">{title}</span></span>
          <span className="grid h-7 w-7 place-items-center rounded-lg border border-line"><Bell className="h-3.5 w-3.5" /></span>
        </div>
        <div className="flex-1 space-y-2 overflow-hidden p-3 text-[10.5px] leading-snug">{children}</div>
        <div className="grid h-12 grid-cols-5 border-t border-line bg-navy/90 text-[8.5px] font-semibold text-muted">
          {TABS.map(({ href, label, icon: I, primary }) => (
            <span key={href} className={`flex flex-col items-center justify-center gap-0.5 ${tab === href ? "text-cyan" : ""}`}>
              {primary ? <span className="-mt-4 grid h-8 w-8 place-items-center rounded-xl bg-cyan text-white"><I className="h-4 w-4" /></span> : <I className="h-3.5 w-3.5" />}{label}
            </span>
          ))}
          <span className="flex flex-col items-center justify-center gap-0.5"><span className="grid h-3.5 w-3.5 grid-cols-2 gap-px">{[0, 1, 2, 3].map((i) => <i key={i} className="rounded-[1px] border border-current" />)}</span>Цэс</span>
        </div>
      </div>
    </div>
  );
}

const Tile = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <div className={`glass rounded-xl p-2.5 ${className}`}>{children}</div>;

export function AppSection() {
  const qr = qrPath(SITE);
  return (
    <section id="app" className="border-y border-line bg-navy-2/60 py-10 md:py-14" aria-labelledby="app-title">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 md:px-6 lg:grid-cols-[1fr_auto]">
        <div>
          <SectionHead id="app-title" title="Апп суулгах" />
          <ul className="mb-5 flex flex-wrap gap-x-5 gap-y-2">
            {PERKS.map(({ icon: I, t }) => (
              <li key={t} className="flex items-center gap-2 text-sm font-semibold"><I className="h-4 w-4 text-cyan" />{t}</li>
            ))}
          </ul>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
            <InstallPanel />
            <div className="hidden flex-col items-center gap-2 sm:flex">
              <svg viewBox={`-2 -2 ${qr.size + 4} ${qr.size + 4}`} className="h-36 w-36 rounded-xl bg-white" role="img" aria-label={`${SITE} хаягийн QR код`}>
                <path d={qr.d} fill="#f5f7fa" shapeRendering="crispEdges" />
              </svg>
              <p className="text-xs text-muted">Утсаараа уншуулна уу</p>
            </div>
          </div>
          <p className="mt-4 text-[13px] text-muted">App Store, Google Play хувилбар бэлтгэгдэж байна.</p>
        </div>

        <div className="relative mx-auto flex justify-center lg:mx-0">
          <Phone title="Ухаалаг Орхон" tab="#home" className="z-10">
            <div className="rounded-xl border border-alert/40 bg-alert/10 p-2"><p className="flex items-center gap-1 font-bold text-alert"><Siren className="h-3 w-3" />Шуурхай мэдээ</p><p className="mt-0.5 text-snow/90">Ус, цахилгаан, дулааны тасралт энд гарна</p></div>
            <Tile className="flex items-center gap-2"><CloudSun className="h-5 w-5 text-warn" /><span><b className="block text-[12px]">Эрдэнэт</b><span className="text-muted">Цаг агаар · 7 хоног</span></span></Tile>
            <div className="grid grid-cols-2 gap-2">
              {[[Bell, "Мэдэгдэл"], [Megaphone, "Мэдээлэх"], [MapIcon, "Газрын зураг"], [Smartphone, "Үйлчилгээ"]].map(([I, l]) => {
                const Icon = I as typeof Bell;
                return <Tile key={l as string} className="flex flex-col items-start gap-1"><Icon className="h-4 w-4 text-cyan" /><b>{l as string}</b></Tile>;
              })}
            </div>
            <Tile><p className="font-semibold">Орхон AI туслах</p><p className="text-muted">«Ус хэзээ ирэх вэ?» гэж асуугаарай</p></Tile>
          </Phone>
        </div>
      </div>
    </section>
  );
}
