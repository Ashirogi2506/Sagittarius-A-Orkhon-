"use client";

import { Lightbulb, MessageCircle, Plus, ThumbsUp, X } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { fmtDate } from "@/lib/labels";
import type { Solution } from "@/lib/types";
import { Badge, Button, Card, DemoTag, Field, inputCls } from "./ui";
import { useShowMore } from "./ShowMore";

const PROGRESS: Record<Solution["progress"], { l: string; pct: number }> = {
  idea: { l: "Санаа", pct: 15 }, review: { l: "Хэлэлцэж байна", pct: 45 }, planned: { l: "Төлөвлөгдсөн", pct: 75 }, done: { l: "Хэрэгжсэн", pct: 100 },
};

function SolutionCard({ s }: { s: Solution }) {
  const { vote, voted, addComment } = useStore();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const did = voted.includes(s.id);
  return (
    <Card className="glass-hover flex flex-col p-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge className="border-cyan/40 bg-cyan/10 text-cyan">{PROGRESS[s.progress].l}</Badge>
        {s.demo ? <DemoTag>Жишээ</DemoTag> : <Badge className="border-line text-muted">Таны санал</Badge>}
      </div>
      <h3 className="mt-2 text-[15px] font-semibold leading-snug">{s.idea}</h3>
      <p className="mt-1 text-xs text-muted">{s.issueTitle} · {s.author}</p>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-snow/10" role="progressbar" aria-valuenow={PROGRESS[s.progress].pct} aria-valuemin={0} aria-valuemax={100} aria-label="Явц">
        <div className="h-full rounded-full bg-cyan" style={{ width: `${PROGRESS[s.progress].pct}%` }} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" variant={did ? "emerald" : "ghost"} onClick={() => vote(s.id)} disabled={did} aria-pressed={did}>
          <ThumbsUp className="h-4 w-4" />{did ? "Дэмжсэн" : "Дэмжих"} · {s.votes}
        </Button>
        <Button size="sm" variant="subtle" onClick={() => setOpen((o) => !o)} aria-expanded={open}><MessageCircle className="h-4 w-4" />{s.comments.length}</Button>
      </div>
      {open && (
        <div className="mt-3 border-t border-line pt-3">
          <ul className="space-y-2 text-sm">
            {s.comments.map((c, i) => <li key={i} className="rounded-lg bg-navy px-3 py-2"><b className="text-snow">{c.who}</b> <span className="text-xs text-muted">{fmtDate(c.at)}</span><p className="text-muted">{c.text}</p></li>)}
            {!s.comments.length && <li className="text-muted">Сэтгэгдэл алга.</li>}
          </ul>
          <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim().length > 1) { addComment(s.id, text.trim().slice(0, 240)); setText(""); } }}>
            <label htmlFor={`c-${s.id}`} className="sr-only">Сэтгэгдэл</label>
            <input id={`c-${s.id}`} className={inputCls} value={text} onChange={(e) => setText(e.target.value)} placeholder="Сэтгэгдэл бичих…" maxLength={240} />
            <Button size="sm" type="submit">Нэмэх</Button>
          </form>
        </div>
      )}
    </Card>
  );
}

/** Citizens' ideas with votes and comments, shown as a tab of «Үр дүн ба иргэдийн санаа». */
export function SolutionsPanel() {
  const { solutions, addSolution, showToast } = useStore();
  const [issue, setIssue] = useState("");
  const [idea, setIdea] = useState("");
  const [err, setErr] = useState("");
  const [form, setForm] = useState(false);
  const sorted = [...solutions].sort((a, b) => b.votes - a.votes);
  const more = useShowMore(sorted, 3, "Бусад санаа");
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Санаагаа нэмж, бусдынхыг дэмжээрэй.</p>
        <Button size="sm" variant={form ? "ghost" : "primary"} onClick={() => setForm((f) => !f)} aria-expanded={form}>
          {form ? <><X className="h-4 w-4" />Хаах</> : <><Lightbulb className="h-4 w-4" />Санаа нэмэх</>}
        </Button>
      </div>
      {form && (
        <Card className="mb-5 p-5">
          <form className="grid gap-3 md:grid-cols-[1fr_1.4fr_auto] md:items-end" onSubmit={(e) => {
            e.preventDefault();
            if (issue.trim().length < 4 || idea.trim().length < 10) { setErr("Асуудал (4+) болон санаагаа (10+ тэмдэгт) бичнэ үү."); return; }
            setErr("");
            addSolution({ id: "U-" + Date.now(), issueTitle: issue.trim(), idea: idea.trim(), author: "Та", votes: 0, progress: "idea", comments: [], demo: false });
            setIssue(""); setIdea(""); setForm(false); showToast("Санаа нэмэгдлээ");
          }}>
            <Field label="Аль асуудал?" htmlFor="s-issue"><input id="s-issue" className={inputCls} value={issue} onChange={(e) => setIssue(e.target.value)} maxLength={80} placeholder="Жишээ: Гэр хорооллын гэрэлтүүлэг" /></Field>
            <Field label="Таны санаа" htmlFor="s-idea"><input id="s-idea" className={inputCls} value={idea} onChange={(e) => setIdea(e.target.value)} maxLength={400} placeholder="Хэрхэн шийдэж болох вэ?" /></Field>
            <Button type="submit"><Plus className="h-4 w-4" />Нэмэх</Button>
            {err && <p className="text-xs text-alert md:col-span-3">{err}</p>}
          </form>
        </Card>
      )}
      {more.anchor}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {more.visible.map((s) => <SolutionCard key={s.id} s={s} />)}
      </div>
      {more.button}
    </div>
  );
}
