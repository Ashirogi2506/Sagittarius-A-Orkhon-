"use client";

import { CheckCircle2, Lightbulb } from "lucide-react";
import { useEffect, useState } from "react";
import { SolvedPanel } from "./SolvedSection";
import { SolutionsPanel } from "./Community";
import { SectionHead, cn } from "./ui";

type Tab = "solved" | "ideas";

/** «Шийдвэрлэгдсэн асуудлууд» and «Шийдлүүд» in one section with two tabs. */
export function ResultsSection() {
  const [tab, setTab] = useState<Tab>("solved");

  // Old links to #solutions still open the ideas tab.
  useEffect(() => {
    const sync = () => { if (location.hash === "#solutions") setTab("ideas"); };
    const t = setTimeout(sync, 0); // the hash is only known in the browser, after hydration
    window.addEventListener("hashchange", sync);
    return () => { clearTimeout(t); window.removeEventListener("hashchange", sync); };
  }, []);

  const tabs: [Tab, string, typeof CheckCircle2][] = [["solved", "Шийдвэрлэгдсэн ажил", CheckCircle2], ["ideas", "Иргэдийн санаа", Lightbulb]];
  return (
    <section id="solved" className="border-y border-line bg-navy-2/60 py-10 md:py-14" aria-labelledby="results-title">
      <span id="solutions" className="block scroll-mt-24" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHead id="results-title" title="Үр дүн ба иргэдийн санаа" />
        <div className="mb-4 inline-flex rounded-lg border border-line bg-navy p-1" role="tablist" aria-label="Үр дүн">
          {tabs.map(([k, l, I]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
              className={cn("inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold transition", tab === k ? "bg-cyan text-white" : "text-muted hover:text-snow")}>
              <I className="h-4 w-4" />{l}
            </button>
          ))}
        </div>
        <div role="tabpanel">{tab === "solved" ? <SolvedPanel /> : <SolutionsPanel />}</div>
      </div>
    </section>
  );
}
