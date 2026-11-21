"use client";

import { ChevronDown } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { cn } from "./ui";

/**
 * Shows the first `initial` items and a «Бүгдийг харах (+N)» button for the rest.
 * Collapsing scrolls back to the list so the reader does not lose their place.
 */
export function useShowMore<T>(items: T[], initial: number, label = "Бүгдийг харах") {
  const [all, setAll] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  // Hiding a single item saves no space, so only collapse when two or more would be hidden.
  const hidden = items.length - initial > 1 ? items.length - initial : 0;
  const visible = all || hidden <= 0 ? items : items.slice(0, initial);
  const anchor = <div ref={top} className="scroll-mt-24" aria-hidden="true" />;
  const button = hidden > 0 ? (
    <div className="mt-4 flex justify-center">
      <button type="button" aria-expanded={all}
        onClick={() => { if (all) top.current?.scrollIntoView({ behavior: "smooth", block: "start" }); setAll(!all); }}
        className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-snow transition hover:border-cyan/50 hover:text-cyan">
        {all ? "Хураах" : `${label} (+${hidden})`}
        <ChevronDown className={cn("h-4 w-4 transition", all && "rotate-180")} />
      </button>
    </div>
  ) : null;
  return { visible, button, anchor };
}

/** A titled block that starts closed; used for secondary details under a section. */
export function Collapsible({ title, children, className, defaultOpen = false }: { title: ReactNode; children: ReactNode; className?: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn("glass rounded-lg", className)}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 p-4 text-left font-semibold md:p-5">
        <span className="flex items-center gap-2">{title}</span>
        <ChevronDown className={cn("h-5 w-5 shrink-0 text-muted transition", open && "rotate-180")} />
      </button>
      {open && <div className="px-4 pb-4 md:px-5 md:pb-5">{children}</div>}
    </div>
  );
}
