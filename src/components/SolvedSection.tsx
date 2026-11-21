"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useShowMore } from "./ShowMore";
import { DEMO_ISSUES } from "@/lib/data/places";
import { ISSUE_CAT, fmtDate } from "@/lib/labels";
import type { Issue, IssueCategory, IssueStatus } from "@/lib/types";
import { DemoTag, Empty, cn } from "./ui";

// Illustrated before/after scenes (not photos) for each category.
function Scene({ cat, fixed }: { cat: IssueCategory; fixed: boolean }) {
  const sky = fixed ? "#0f3b57" : "#14202c";
  const ground = fixed ? "#1b2f42" : "#20252c";
  return (
    <svg viewBox="0 0 320 180" className="h-full w-full" aria-hidden="true">
      <rect width="320" height="180" fill={sky} />
      <path d="M0 120 Q80 100 160 112 T320 108 V180 H0 Z" fill={fixed ? "#0f5a4a" : "#2a3a33"} />
      <rect y="132" width="320" height="48" fill={ground} />
      {cat === "road" && (fixed
        ? <path d="M0 156 H320" stroke="#ffd98a" strokeWidth="3" strokeDasharray="18 14" />
        : <><ellipse cx="160" cy="156" rx="46" ry="10" fill="#0b0f14" /><path d="M120 150 l14 6 -8 8 M196 152 l-10 7 9 6" stroke="#4b5563" strokeWidth="2" fill="none" /></>)}
      {cat === "lighting" && [70, 160, 250].map((x) => (
        <g key={x}>
          <rect x={x - 2} y="70" width="4" height="64" fill="#5d7690" />
          <rect x={x - 8} y="64" width="16" height="7" rx="2" fill="#5d7690" />
          {fixed && <><circle cx={x} cy="74" r="26" fill="#ffe9a8" opacity=".22" /><circle cx={x} cy="72" r="4" fill="#fff6c9" /><path d={`M${x - 30} 134 L${x} 76 L${x + 30} 134 Z`} fill="#ffe9a8" opacity=".08" /></>}
        </g>
      ))}
      {cat === "transport" && (
        <g>
          <rect x="110" y="88" width="4" height="46" fill="#5d7690" /><rect x="206" y="88" width="4" height="46" fill="#5d7690" />
          <rect x="104" y="80" width="112" height="9" rx="2" fill={fixed ? "#12805c" : "#4b5563"} />
          <rect x="118" y="92" width="84" height="34" fill={fixed ? "#6f9be0" : "#334155"} opacity={fixed ? 0.35 : 0.6} />
          {!fixed && <path d="M130 96 l18 22 M170 94 l-12 28 M184 100 l14 16" stroke="#94a3b8" strokeWidth="1.5" />}
          {fixed && <rect x="128" y="118" width="64" height="6" rx="2" fill="#b8673a" />}
        </g>
      )}
      {cat === "education" && Array.from({ length: 7 }, (_, i) => (
        <rect key={i} x={86 + i * 22} y="140" width="12" height="32" fill="#14213d" opacity={fixed ? 0.92 : 0.15} />
      ))}
      {cat === "water" && (
        <g>
          <path d="M0 150 Q80 140 160 152 T320 146 V180 H0 Z" fill={fixed ? "#1f7fa8" : "#3f4a3a"} />
          {!fixed && [40, 110, 190, 250].map((x, i) => <rect key={i} x={x} y={140 + (i % 2) * 6} width="18" height="10" rx="2" fill={["#a16207", "#64748b", "#7c2d12", "#475569"][i]} transform={`rotate(${i * 17 - 20} ${x} 145)`} />)}
          {fixed && <path d="M30 160 q10 -4 20 0 M140 166 q10 -4 20 0 M240 158 q10 -4 20 0" stroke="#c9dbf5" strokeWidth="1.5" fill="none" opacity=".6" />}
        </g>
      )}
      {cat === "waste" && (
        <g>
          {[110, 150, 190].map((x) => <g key={x}><rect x={x} y="104" width="28" height="30" rx="3" fill="#2f7f5a" /><rect x={x - 2} y="100" width="32" height="6" rx="2" fill="#256b4a" /></g>)}
          {!fixed && [96, 132, 176, 212, 228].map((x, i) => <ellipse key={i} cx={x} cy={136 - (i % 2) * 4} rx="12" ry="5" fill={["#7c2d12", "#64748b", "#a16207", "#475569", "#78350f"][i]} />)}
          {!fixed && <ellipse cx="150" cy="99" rx="26" ry="8" fill="#57534e" />}
        </g>
      )}
      {cat === "air" && (
        <g>
          {[60, 120, 200, 260].map((x) => <g key={x}><path d={`M${x - 16} 134 V112 H${x + 16} V134 Z`} fill="#eef4f8" opacity=".85" /><rect x={x + 6} y="98" width="3" height="14" fill="#5b6b78" /></g>)}
          {!fixed && <rect width="320" height="132" fill="#6b6b6b" opacity=".45" />}
          {!fixed && [70, 130, 210, 270].map((x) => <circle key={x} cx={x} cy="86" r="18" fill="#9ca3af" opacity=".5" />)}
        </g>
      )}
      {cat === "health" && (
        <g>
          <rect x="150" y="70" width="120" height="64" fill="#e6eef5" />
          <rect x="200" y="80" width="20" height="20" fill="#d63c3c" /><rect x="207" y="83" width="6" height="14" fill="#fff" /><rect x="203" y="87" width="14" height="6" fill="#fff" />
          <path d="M60 134 L150 112 V134 Z" fill="#94a3b8" />
          {!fixed && <path d="M80 130 l20 -4 M110 124 l18 -4" stroke="#dbeafe" strokeWidth="3" />}
          {fixed && <path d="M60 134 L150 112" stroke="#b7791f" strokeWidth="2" />}
        </g>
      )}
      {fixed && <circle cx="282" cy="30" r="12" fill="#12805c" opacity=".9" />}
      {fixed && <path d="M276 30 l4 4 8 -8" stroke="#f5f7fa" strokeWidth="2.5" fill="none" />}
    </svg>
  );
}

function BeforeAfter({ i }: { i: Issue }) {
  const [pos, setPos] = useState(50);
  return (
    <div className="relative aspect-[2/1] overflow-hidden rounded-md border border-line">
      <div className="absolute inset-0"><Scene cat={i.category} fixed /></div>
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}><Scene cat={i.category} fixed={false} /></div>
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-cyan" style={{ left: `${pos}%` }} />
      <span className="absolute left-2 top-2 rounded-md bg-navy/80 px-2 py-0.5 text-[12.5px] font-semibold">Өмнө</span>
      <span className="absolute right-2 top-2 rounded-md bg-emerald/90 px-2 py-0.5 text-[12.5px] font-semibold text-white">Дараа</span>
      <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))}
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" aria-label="Өмнө ба дараах зургийг харьцуулах" />
    </div>
  );
}

/** Sample before/after cases, shown as a tab of «Үр дүн ба иргэдийн санаа». */
export function SolvedPanel() {
  const [f, setF] = useState<IssueStatus>("resolved");
  const all = DEMO_ISSUES.filter((i) => i.status === f);
  const more = useShowMore(all, 3, "Бусад тохиолдол");
  const list = more.visible;
  const tabs: [IssueStatus, string][] = [["resolved", "Шийдвэрлэгдсэн"], ["progress", "Шийдвэрлэх шатанд"], ["new", "Хүлээгдэж байна"]];
  return (
      <div>
        <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label="Төлөвөөр шүүх">
          {tabs.map(([k, l]) => (
            <button key={k} type="button" aria-pressed={f === k} onClick={() => setF(k)}
              className={cn("rounded-md border px-3 py-1 text-[13px] font-semibold transition", f === k ? "border-emerald bg-emerald/15 text-emerald" : "border-line text-muted hover:text-snow")}>{l}</button>
          ))}
          <span className="ml-auto"><DemoTag>Жишээ</DemoTag></span>
        </div>
        {more.anchor}
        {list.length ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {list.map((i) => (
              <motion.article key={i.id}
                className="glass glass-hover flex flex-col rounded-lg p-3">
                {i.status === "resolved" ? <BeforeAfter i={i} /> : (
                  <div className="relative aspect-[2/1] overflow-hidden rounded-md border border-line"><Scene cat={i.category} fixed={false} /><span className="absolute left-2 top-2 rounded-md bg-navy/80 px-2 py-0.5 text-[12.5px] font-semibold">Одоогийн байдал</span></div>
                )}
                <h3 className="mt-2.5 text-[15px] font-semibold leading-snug">{i.title}</h3>
                <p className="mt-1 text-[13px] text-muted">{ISSUE_CAT[i.category]} · {i.area}{i.resolvedAt ? ` · Шийдсэн ${fmtDate(i.resolvedAt)}` : ""}</p>
                {i.action && <p className="mt-1.5 text-[13px] text-snow/90">{i.action}</p>}
              </motion.article>
            ))}
          </div>
        ) : <Empty title="Энэ төлөвт асуудал алга" />}
        {more.button}
      </div>
  );
}
