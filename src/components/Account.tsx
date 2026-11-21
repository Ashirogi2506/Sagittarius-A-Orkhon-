"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LogIn, LogOut, ShieldCheck, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { ISSUE_CAT, STATUS, fmtDate } from "@/lib/labels";
import type { IssueCategory, IssueStatus } from "@/lib/types";
import { Badge, Button, Field, cn, inputCls } from "./ui";

/** Header button: "Нэвтрэх" when signed out, the user's initial when signed in. */
export function AccountButton() {
  const { me } = useStore();
  const [open, setOpen] = useState(false);
  const user = me?.user;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className={cn("grid h-10 place-items-center rounded-xl border border-line bg-snow/5 text-sm font-semibold transition hover:border-cyan/50", user ? "w-10 text-cyan" : "px-3")}
        aria-label={user ? `Миний бүртгэл: ${user.name}` : "Нэвтрэх эсвэл бүртгүүлэх"}>
        {user ? user.name.trim().charAt(0).toUpperCase() : <span className="flex items-center gap-1.5"><LogIn className="h-4 w-4" /><span className="hidden sm:inline">Нэвтрэх</span></span>}
      </button>
      <AnimatePresence>{open && <AccountDialog onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}

function AccountDialog({ onClose }: { onClose: () => void }) {
  const { me } = useStore();
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <>
      <motion.div className="fixed inset-0 z-50 bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div role="dialog" aria-modal="true" aria-label="Бүртгэл"
        className="fixed inset-x-3 top-20 z-50 mx-auto max-h-[calc(100dvh-6rem)] max-w-md overflow-y-auto rounded-lg border border-line bg-white p-5 shadow-lg"
        initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
        <button type="button" onClick={onClose} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg hover:bg-snow/10" aria-label="Хаах"><X className="h-5 w-5" /></button>
        {me?.user ? <Profile onClose={onClose} /> : <AuthForm onDone={onClose} />}
      </motion.div>
    </>
  );
}

function AuthForm({ onDone }: { onDone: () => void }) {
  const { refreshMe, prefs, showToast } = useStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setMsg(""); setErrors({});
    setBusy(true);
    try {
      const body = mode === "login" ? { email, password } : { name, email, password, consent, area: prefs.area || undefined };
      const r = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) { setMsg(d.error || "Алдаа гарлаа."); setErrors(d.errors || {}); return; }
      await refreshMe();
      showToast(mode === "login" ? `Тавтай морил, ${d.user.name}` : "Бүртгэл үүслээ");
      onDone();
    } catch { setMsg("Сүлжээний алдаа."); } finally { setBusy(false); }
  }

  return (
    <div>
      <h2 className="font-display text-xl font-semibold">{mode === "login" ? "Нэвтрэх" : "Бүртгүүлэх"}</h2>
      <p className="mt-1 text-sm text-muted">Мэдээлсэн асуудлаа аль ч төхөөрөмжөөс харна.</p>
      <div className="mt-4 flex gap-1 rounded-xl border border-line p-1" role="tablist">
        {(["login", "register"] as const).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setMsg(""); setErrors({}); }}
            className={cn("flex-1 rounded-lg py-2 text-sm font-semibold", mode === m ? "bg-cyan/15 text-cyan" : "text-muted")}>{m === "login" ? "Нэвтрэх" : "Бүртгүүлэх"}</button>
        ))}
      </div>
      <form onSubmit={submit} noValidate className="mt-4 grid gap-3">
        {mode === "register" && (
          <Field label="Нэр" htmlFor="a-name"><input id="a-name" className={inputCls} value={name} maxLength={60} autoComplete="name" onChange={(e) => setName(e.target.value)} />{errors.name && <p className="text-xs text-alert">{errors.name}</p>}</Field>
        )}
        <Field label="Имэйл" htmlFor="a-email"><input id="a-email" type="email" className={inputCls} value={email} autoComplete="email" onChange={(e) => setEmail(e.target.value)} />{errors.email && <p className="text-xs text-alert">{errors.email}</p>}</Field>
        <Field label="Нууц үг" htmlFor="a-pass"><input id="a-pass" type="password" className={inputCls} value={password} autoComplete={mode === "login" ? "current-password" : "new-password"} onChange={(e) => setPassword(e.target.value)} />
          {mode === "register" && <p className="text-xs text-muted">8-аас дээш тэмдэгт</p>}{errors.password && <p className="text-xs text-alert">{errors.password}</p>}</Field>
        {mode === "register" && (
          <label className="flex cursor-pointer items-start gap-2 text-xs text-muted">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-cyan" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>Миний нэр, имэйл, мэдээлсэн асуудал хадгалагдахыг зөвшөөрч байна, хүссэн үедээ устгана (<a href="/privacy" target="_blank" className="text-cyan underline">нууцлалын бодлого</a>).</span>
          </label>
        )}
        {errors.consent && <p className="text-xs text-alert">{errors.consent}</p>}
        {msg && <p className="text-sm text-alert" role="alert">{msg}</p>}
        <Button type="submit" disabled={busy}>{busy ? "Түр хүлээнэ үү…" : mode === "login" ? "Нэвтрэх" : "Бүртгүүлэх"}</Button>
      </form>
    </div>
  );
}

function Profile({ onClose }: { onClose: () => void }) {
  const { me, logout, showToast } = useStore();
  const u = me!.user!;
  return (
    <div>
      <div className="flex items-center gap-3 pr-10">
        <span className="grid h-12 w-12 place-items-center rounded-lg bg-cyan/15 font-display text-xl font-semibold text-cyan"><User className="h-6 w-6" /></span>
        <div className="min-w-0"><p className="truncate font-semibold">{u.name}</p><p className="truncate text-xs text-muted">{u.email}</p></div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {u.role === "admin" && <Badge className="border-emerald/40 bg-emerald/10 text-emerald"><ShieldCheck className="h-3 w-3" />Админ</Badge>}
        <Badge className="border-line text-muted">Бүртгүүлсэн {fmtDate(u.createdAt)}</Badge>
      </div>

      <h3 className="mt-5 text-sm font-bold">Миний мэдээлсэн асуудал</h3>
      {me?.reports?.length ? (
        <ul className="mt-2 space-y-1.5">
          {me.reports.map((r) => (
            <li key={r.tracking} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm">
              <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{r.title}</span><span className="text-[12.5px] text-muted">{r.tracking} · {ISSUE_CAT[r.category as IssueCategory] ?? r.category}</span></span>
              <Badge className={STATUS[r.status as IssueStatus]?.cls}>{STATUS[r.status as IssueStatus]?.label ?? r.status}</Badge>
            </li>
          ))}
        </ul>
      ) : <p className="mt-2 text-sm text-muted">Одоогоор мэдээлэл алга.</p>}

      <Button className="mt-6 w-full" variant="ghost" onClick={async () => { await logout(); showToast("Гарлаа"); onClose(); }}><LogOut className="h-4 w-4" />Гарах</Button>
      <DeleteAccount onDone={onClose} />
    </div>
  );
}

function DeleteAccount({ onDone }: { onDone: () => void }) {
  const { refreshMe, showToast } = useStore();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  if (!open) {
    return <button type="button" onClick={() => setOpen(true)} className="mt-3 w-full text-center text-xs text-muted underline hover:text-alert">Бүртгэлээ устгах</button>;
  }
  return (
    <form className="mt-4 rounded-lg border border-alert/40 bg-alert/[.06] p-4" onSubmit={async (e) => {
      e.preventDefault(); setErr(""); setBusy(true);
      try {
        const r = await fetch("/api/me/account", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
        const d = await r.json();
        if (!r.ok) { setErr(d.error || "Устгаж чадсангүй."); return; }
        await refreshMe(); showToast("Бүртгэл устгагдлаа"); onDone();
      } catch { setErr("Сүлжээний алдаа."); } finally { setBusy(false); }
    }}>
      <p className="text-sm font-semibold text-alert">Бүртгэлээ бүрмөсөн устгах</p>
      <p className="mt-1 text-xs text-muted">Нэр, имэйл, нууц үг тань бүрмөсөн устгагдана, мэдээлсэн асуудлууд нэргүй үлдэнэ.</p>
      <Field label="Баталгаажуулахын тулд нууц үгээ оруулна уу" htmlFor="del-pass">
        <input id="del-pass" type="password" className={inputCls} value={password} autoComplete="current-password" onChange={(e) => setPassword(e.target.value)} />
      </Field>
      {err && <p className="mt-2 text-xs text-alert" role="alert">{err}</p>}
      <div className="mt-3 flex gap-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={() => { setOpen(false); setPassword(""); setErr(""); }}>Болих</Button>
        <Button type="submit" className="flex-1 bg-alert text-white shadow-none hover:bg-snow" disabled={busy || password.length < 1}>{busy ? "Устгаж байна…" : "Устгах"}</Button>
      </div>
    </form>
  );
}
