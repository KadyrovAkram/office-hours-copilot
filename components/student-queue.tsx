"use client";

import { useState } from "react";
import { ArrowRight, Check, Code2, LockKeyhole, Users } from "lucide-react";
import { classifyQuestion, type QueueState } from "@/lib/triage-data";

type SaveState = (updater: (state: QueueState) => QueueState) => void;

function countOpen(state: QueueState, clusterId: string) {
  return state.questions.filter((question) => question.clusterId === clusterId && !question.resolved).length;
}

export function StudentQueue({ state, save }: { state: QueueState; save: SaveState }) {
  const [summary, setSummary] = useState("");
  const [detail, setDetail] = useState("");
  const [code, setCode] = useState("");
  const [submittedQuestionId, setSubmittedQuestionId] = useState<string>();

  const reset = () => {
    setSubmittedQuestionId(undefined);
    setSummary("");
    setDetail("");
    setCode("");
  };

  const submit = () => {
    if (!summary.trim()) return;
    const id = `q-${Date.now()}`;
    const clusterId = classifyQuestion(`${summary} ${detail} ${code}`);
    save((current) => ({
      ...current,
      questions: [{ id, student: "You", summary: summary.trim(), detail: detail.trim(), code: code.trim() || undefined, clusterId, submittedAt: new Date().toISOString(), resolved: false }, ...current.questions],
    }));
    setSubmittedQuestionId(id);
  };

  if (submittedQuestionId) {
    const question = state.questions.find((item) => item.id === submittedQuestionId);
    const cluster = state.clusters.find((item) => item.id === question?.clusterId);
    const groupSize = countOpen(state, cluster?.id ?? "");
    return (
      <section className="mx-auto max-w-4xl px-5 py-12 sm:py-20">
        <div className="grid overflow-hidden border border-border bg-background shadow-[0_22px_60px_rgba(33,36,30,.08)] md:grid-cols-[1fr_240px]">
          <div className="p-7 sm:p-10">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--signal-soft)] text-[var(--signal)]"><Check size={19} /></span>
            <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--signal)]">Added to the live queue</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">You’re not the only one stuck here.</h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">Your question joined a group of {groupSize} students. A TA can now explain the shared issue once while still seeing your specific context.</p>
            <button onClick={reset} className="mt-8 inline-flex items-center gap-2 bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Ask another question <ArrowRight size={15} /></button>
          </div>
          <aside className="border-t border-border bg-[var(--panel-muted)] p-6 md:border-t-0 md:border-l">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Your group</p>
            <h2 className="mt-3 text-base font-semibold leading-6">{cluster?.title}</h2>
            <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><Users size={14} /> {groupSize} students waiting</div>
            <div className="mt-6 border-t border-border pt-5"><p className="text-xs font-semibold">Likely next step</p><p className="mt-1.5 text-xs leading-5 text-muted-foreground">{cluster?.suggestedFix}</p></div>
          </aside>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-5 py-10 sm:py-16">
      <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:gap-14">
        <div className="pt-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--signal)]"><span className="h-1.5 w-1.5 rounded-full bg-current" /> Live help queue</div>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-5xl">Give your TA the useful part first.</h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground">A short, specific question helps the queue group related problems and lets course staff respond to patterns sooner.</p>
          <div className="mt-8 border-t border-border pt-5">
            <p className="text-xs font-semibold">A useful question includes</p>
            <ol className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground">
              <li><span className="mr-2 font-mono text-[var(--signal)]">01</span> What you expected to happen</li>
              <li><span className="mr-2 font-mono text-[var(--signal)]">02</span> What happened instead</li>
              <li><span className="mr-2 font-mono text-[var(--signal)]">03</span> The smallest relevant code sample</li>
            </ol>
          </div>
        </div>

        <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="border border-border bg-background p-5 shadow-[0_22px_60px_rgba(33,36,30,.07)] sm:p-8">
          <div className="flex items-center justify-between border-b border-border pb-4"><h2 className="text-sm font-semibold">Join the queue</h2><span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">CS 201 · Room 304</span></div>
          <label className="mt-6 block text-xs font-semibold" htmlFor="summary">What are you stuck on?</label>
          <input id="summary" required value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="My recursive method always returns 0" className="mt-2 w-full border border-border bg-[var(--panel-muted)] px-3.5 py-3 text-sm outline-none transition focus:border-[var(--signal)] focus:bg-background" />
          <label className="mt-5 block text-xs font-semibold" htmlFor="detail">What did you try?</label>
          <textarea id="detail" value={detail} onChange={(event) => setDetail(event.target.value)} rows={4} placeholder="I traced the smaller calls, but the original call still returns zero…" className="mt-2 w-full resize-none border border-border bg-[var(--panel-muted)] px-3.5 py-3 text-sm leading-6 outline-none transition focus:border-[var(--signal)] focus:bg-background" />
          <label className="mt-5 flex items-center gap-2 text-xs font-semibold" htmlFor="code"><Code2 size={14} /> Small code sample <span className="font-normal text-muted-foreground">optional</span></label>
          <textarea id="code" value={code} onChange={(event) => setCode(event.target.value)} rows={4} spellCheck={false} placeholder={'return count(input.substring(1));'} className="mt-2 w-full resize-none border border-[#31352e] bg-[#20231f] px-3.5 py-3 font-mono text-[12px] leading-6 text-[#e9eee4] outline-none transition focus:border-[#83b879]" />
          <div className="mt-6 flex flex-col-reverse gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><LockKeyhole size={12} /> Details are visible only to course staff.</p>
            <button type="submit" disabled={!summary.trim()} className="inline-flex items-center justify-center gap-2 bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40">Join the queue <ArrowRight size={15} /></button>
          </div>
        </form>
      </div>
    </section>
  );
}
