// Small shadcn/ui-style primitives (cva + tailwind-merge) shared across sections.
import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export const cn = (...v: ClassValue[]) => twMerge(clsx(v));

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap",
  {
    variants: {
      variant: {
        primary: "bg-cyan text-white hover:bg-[#184c9c] active:bg-[#143f82]",
        emerald: "bg-emerald text-white hover:bg-[#0e6b4c]",
        ghost: "border border-line bg-white text-snow hover:border-cyan/50 hover:text-cyan",
        subtle: "text-muted hover:text-snow hover:bg-snow/5",
      },
      size: { sm: "h-8 px-3 text-xs", md: "h-10 px-4 text-sm", lg: "h-12 px-6 text-base" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({ className, variant, size, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...p} />;
}

export function Card({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("glass rounded-lg", className)} {...p} />;
}

export function Badge({ className, children, color }: { className?: string; children: ReactNode; color?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded border px-1.5 py-0 text-[12.5px] font-semibold leading-5", className)}
      style={color ? { color, borderColor: color + "66", background: color + "1a" } : undefined}>
      {children}
    </span>
  );
}

// The section name sits on a short blue rule: it repeats the nav label, so people can see where they landed.
/** News-style section heading: one bold label over a thick rule, with an optional link or tag on the right. */
export function SectionHead({ id, title, right }: { id?: string; title: string; right?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b-2 border-snow pb-2">
      <h2 id={id} className="font-display text-lg font-bold uppercase tracking-wide text-snow md:text-xl">{title}</h2>
      {right}
    </div>
  );
}

export function DemoTag({ children = "Жишээ мэдээлэл" }: { children?: ReactNode }) {
  return <Badge className="border-warn/40 bg-warn/10 text-warn">{children}</Badge>;
}

export function Empty({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line px-6 py-10 text-center">
      <p className="font-semibold text-snow">{title}</p>
      {text && <p className="max-w-sm text-sm text-muted">{text}</p>}
      {action}
    </div>
  );
}

export function Field({ label, htmlFor, children, hint }: { label: string; htmlFor: string; children: ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-snow">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

export const inputCls = "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-snow placeholder:text-muted/70 transition-colors focus:border-cyan focus:outline-none focus:ring-3 focus:ring-cyan/15";
