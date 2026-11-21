"use client";

import { CheckCircle2, Download, EllipsisVertical, PlusSquare, Share } from "lucide-react";
import { useState } from "react";
import { promptInstall, useInstall } from "@/lib/install";
import { useStore } from "@/lib/store";
import { Button } from "./ui";

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="mt-3 space-y-2 text-sm">
      {items.map((t, i) => (
        <li key={i} className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-cyan/15 text-xs font-bold text-cyan">{i + 1}</span><span className="pt-0.5">{t}</span></li>
      ))}
    </ol>
  );
}

const Key = ({ children }: { children: React.ReactNode }) => <b className="inline-flex items-center gap-1 rounded-md border border-line bg-snow/5 px-1.5 py-px font-semibold text-snow">{children}</b>;

/** Install button where the browser allows it, otherwise step-by-step instructions for this phone. */
export function InstallPanel() {
  const { ready, platform, installed, canPrompt } = useInstall();
  const { showToast } = useStore();
  const [tab, setTab] = useState<"ios" | "android" | null>(null);
  const shown = tab ?? (platform === "ios" ? "ios" : "android");

  if (installed) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-emerald/40 bg-emerald/[.08] p-4">
        <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald" />
        <div><p className="font-semibold">Апп суулгагдсан байна</p><p className="text-sm text-muted">Та одоо «Ухаалаг Орхон» аппаас үзэж байна. Шинэчлэл автоматаар орно.</p></div>
      </div>
    );
  }

  return (
    <div className="glass rounded-lg p-5">
      {canPrompt && (
        <>
          <Button size="lg" className="w-full" onClick={async () => { if (await promptInstall()) showToast("Апп суулгагдлаа"); }}>
            <Download className="h-5 w-5" />Апп суулгах
          </Button>
          <p className="mt-2 text-center text-xs text-muted">Үнэгүй · дэлгүүр, бүртгэл шаардлагагүй</p>
        </>
      )}
      {!canPrompt && (
        <>
          <p className="font-semibold">Утсандаа суулгах заавар</p>
          <div className="mt-3 flex gap-2" role="group" aria-label="Утасны төрөл">
            {(["android", "ios"] as const).map((k) => (
              <button key={k} type="button" aria-pressed={shown === k} onClick={() => setTab(k)}
                className={`rounded-md border px-3.5 py-1.5 text-sm font-semibold transition ${shown === k ? "border-cyan bg-cyan/15 text-snow" : "border-line text-muted hover:text-snow"}`}>
                {k === "ios" ? "iPhone, iPad" : "Android"}
              </button>
            ))}
          </div>
          {shown === "ios" ? (
            <Steps items={[
              <>Энэ сайтыг <b>Safari</b> хөтчөөр нээнэ.</>,
              <>Доод талын <Key><Share className="h-3.5 w-3.5" />Хуваалцах</Key> товчийг дарна.</>,
              <><Key><PlusSquare className="h-3.5 w-3.5" />Add to Home Screen</Key> (Нүүр дэлгэцэнд нэмэх)-ийг сонгоно.</>,
              <>Баруун дээд буланд <Key>Add</Key> дарна. Нүүр дэлгэцэнд «Ухаалаг Орхон» гарч ирнэ.</>,
            ]} />
          ) : (
            <Steps items={[
              <>Энэ сайтыг <b>Chrome</b> хөтчөөр нээнэ.</>,
              <>Баруун дээд буланд <Key><EllipsisVertical className="h-3.5 w-3.5" /></Key> цэсийг дарна.</>,
              <><Key>Install app</Key> эсвэл <Key>Add to Home screen</Key> (Апп суулгах)-ыг сонгоно.</>,
              <><Key>Install</Key> дарахад апп утсанд суугдана.</>,
            ]} />
          )}
          {ready && platform === "desktop" && <p className="mt-4 rounded-xl border border-line bg-navy p-3 text-sm text-muted">Компьютер дээр байгаа бол хажуугийн QR кодыг утасныхаа камераар уншуулж нээгээд, дээрх заавраар суулгаарай.</p>}
        </>
      )}
    </div>
  );
}
