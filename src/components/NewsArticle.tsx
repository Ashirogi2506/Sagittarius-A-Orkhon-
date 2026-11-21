"use client";

import Link from "next/link";
import { ArrowLeft, Bot, ExternalLink, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { ANN_CAT, fmtUB, VERIFY } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { ThemeSwitch } from "./ThemeSwitch";
import { Logo } from "./Header";
import { ChatWidget } from "./ChatWidget";

export function NewsArticle({ id }: { id: string }) {
  const { announcements, ready, loadError, markRead, askAI } = useStore();
  const [timedOut, setTimedOut] = useState(false);
  const article = announcements.find((a) => a.id === id);

  useEffect(() => {
    const timeout = window.setTimeout(() => setTimedOut(true), 12000);
    return () => window.clearTimeout(timeout);
  }, [id]);
  useEffect(() => { if (article) markRead(article.id); }, [article, markRead]);

  return (
    <div className="editorial min-h-screen bg-navy">
      <header className="border-b border-line bg-navy-2">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <Link href="/#home" className="flex items-center gap-2 font-bold"><Logo />SMART ORKHON</Link>
          <ThemeSwitch />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-16">
        <Link href="/#notices" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan hover:underline"><ArrowLeft className="h-4 w-4" />Мэдээлэл рүү буцах</Link>
        {!article ? (
          <div className="mt-10 rounded-xl border border-line bg-navy-2 p-6 text-muted" role="status">
            {loadError || (ready && timedOut ? "Энэ мэдээлэл одоогоор олдсонгүй." : "Мэдээлэл ачаалж байна…")}
          </div>
        ) : (
          <article className="mt-10">
            <div className="flex flex-wrap gap-2 text-xs font-bold"><span className="rounded-full bg-[#AFDDE5] px-3 py-1 text-[#003135]">{ANN_CAT[article.category].label}</span>{(article.verification === "demo" || article.verification === "unverified") && <span className="rounded-full border border-line px-3 py-1 text-warn">{VERIFY[article.verification].label}</span>}</div>
            <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight md:text-5xl">{article.title}</h1>
            <p className="mt-5 text-sm text-muted">{article.organization} · <time dateTime={article.publishedAt}>{fmtUB(article.publishedAt)}</time></p>
            <div className="mt-8 border-t border-line pt-8 text-lg leading-relaxed">
              {article.summary && <p className="font-semibold">{article.summary}</p>}
              {article.description && article.description !== article.summary && <p className="mt-5 whitespace-pre-line">{article.description}</p>}
            </div>
            <div className="mt-8 space-y-3 rounded-xl border border-line bg-navy-2 p-5 text-sm">
              <p className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-cyan" />{[article.location.sum, article.location.bag, article.location.area, article.locationNote].filter(Boolean).join(" · ")}</p>
              {(article.start || article.end) && <p>Хугацаа: {article.start ? fmtUB(article.start) : "Тодорхойгүй"} – {article.end ? fmtUB(article.end) : "Тодорхойгүй"}</p>}
              {article.sourceUrl && <p>Эх сурвалж: <a className="inline-flex items-center gap-1 font-semibold text-cyan underline" href={article.sourceUrl} target="_blank" rel="noopener noreferrer">{article.sourceName || "Холбоос"}<ExternalLink className="h-3 w-3" /></a></p>}
            </div>
            <button type="button" onClick={() => askAI(`"${article.title}" гэсэн мэдэгдлийг энгийнээр тайлбарлаж өгөөч.`)} className="mt-6 inline-flex items-center gap-2 rounded-xl border border-line bg-navy-2 px-4 py-3 text-sm font-semibold text-cyan"><Bot className="h-4 w-4" />AI тайлбар</button>
          </article>
        )}
      </main>
      <ChatWidget />
    </div>
  );
}
