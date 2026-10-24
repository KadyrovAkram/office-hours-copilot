"use client";

import { useEffect, useState, useTransition } from "react";
import {
  ArrowRight, Check, Code2, Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ClusterCanvas } from "@/components/cluster-canvas";
import { LiveBriefing } from "@/components/live-briefing";
import { classifyQuestion, seedState, type QueueState, type Role } from "@/lib/triage-data";

function countOpen(state: QueueState, clusterId: string) {
  return state.questions.filter((q) => q.clusterId === clusterId && !q.resolved).length;
}
export function TriageApp() {
  const [role, setRole] = useState<Role>("ta");
  const [state, setState] = useState<QueueState>(seedState);
  const [selectedId, setSelectedId] = useState("recursion");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/queue").then((r) => r.json()).then((data) => {
      if (data.state) setState(data.state);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const save = (updater: (current: QueueState) => QueueState) => {
    setState((current) => {
      const next = { ...updater(current), revision: current.revision + 1 };
      startTransition(() => { void fetch("/api/queue", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(next) }); });
      return next;
    });
  };

  const visibleClusters = state.clusters.filter((cluster) => {
    const value = `${cluster.title} ${cluster.topic}`.toLowerCase();
    return !cluster.resolved && value.includes(search.toLowerCase());
  });

  return (
    <AppShell role={role} onRoleChange={setRole} questionCount={state.questions.length} isSaving={isPending}>
      {role === "student" ? <StudentView state={state} save={save} /> : null}
      {role === "ta" ? <ClusterCanvas state={state} save={save} selectedId={selectedId} setSelectedId={setSelectedId} visibleClusters={visibleClusters} search={search} setSearch={setSearch} loaded={loaded} /> : null}
      {role === "instructor" ? <LiveBriefing state={state} /> : null}
    </AppShell>
  );
}

function StudentView({ state, save }: { state: QueueState; save: (u: (s: QueueState) => QueueState) => void }) {
  const [summary, setSummary] = useState("");
  const [detail, setDetail] = useState("");
  const [code, setCode] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    if (!summary.trim()) return;
    const clusterId = classifyQuestion(`${summary} ${detail} ${code}`);
    save((current) => ({ ...current, questions: [{ id: `q-${Date.now()}`, student: "You", summary: summary.trim(), detail: detail.trim(), code: code.trim() || undefined, clusterId, submittedAt: new Date().toISOString(), resolved: false }, ...current.questions] }));
    setSubmitted(true);
  };

  if (submitted) {
    const cluster = state.clusters.find((item) => item.id === classifyQuestion(`${summary} ${detail} ${code}`));
    const position = state.questions.filter((q) => !q.resolved).findIndex((q) => q.student === "You") + 1;
    return <section className="mx-auto max-w-3xl px-5 py-16"><div className="rounded-[30px] border border-black/6 bg-white p-8 shadow-[0_24px_70px_rgba(22,32,50,.08)] sm:p-12"><div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><Check size={28} /></div><p className="text-sm font-semibold text-[#6257e8]">You’re in the queue</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.04em]">Your question found a group.</h1><p className="mt-3 text-slate-500">The copilot matched you with {countOpen(state, cluster?.id ?? "")} students working through a similar issue.</p><div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Matched cluster</span><span className="rounded-full bg-white px-3 py-1 text-xs text-slate-500">Position {position}</span></div><h2 className="mt-3 text-lg font-semibold">{cluster?.title}</h2><p className="mt-1 text-sm text-slate-500">{cluster?.suggestedFix}</p></div><button onClick={() => { setSubmitted(false); setSummary(""); setDetail(""); setCode(""); }} className="mt-7 rounded-xl bg-[#18212f] px-5 py-3 text-sm font-medium text-white">Submit another question</button></div></section>;
  }

  return <section className="mx-auto max-w-3xl px-5 py-12 sm:py-16"><div className="mb-9"><span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700"><Sparkles size={13} /> Smart queue is active</span><h1 className="mt-5 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">What are you stuck on?</h1><p className="mt-3 max-w-xl text-base leading-7 text-slate-500">Give your TA enough context to help. We’ll quietly group you with classmates facing the same issue.</p></div><div className="rounded-[28px] border border-black/6 bg-white p-5 shadow-[0_24px_70px_rgba(22,32,50,.07)] sm:p-8"><label className="text-sm font-semibold" htmlFor="summary">Short description</label><input id="summary" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="e.g. My recursive method always returns 0" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100" /><label className="mt-5 block text-sm font-semibold" htmlFor="detail">What have you tried?</label><textarea id="detail" value={detail} onChange={(e) => setDetail(e.target.value)} rows={4} placeholder="Tell us what you expected and what happened instead…" className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100" /><label className="mt-5 flex items-center gap-2 text-sm font-semibold" htmlFor="code"><Code2 size={15} /> Code snippet <span className="font-normal text-slate-400">optional</span></label><textarea id="code" value={code} onChange={(e) => setCode(e.target.value)} rows={5} spellCheck={false} placeholder={'public int count(String s) {\n  // paste the smallest useful part\n}'} className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-[#151a23] px-4 py-3 font-mono text-[13px] leading-6 text-slate-200 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" /><div className="mt-6 flex items-center justify-between gap-4"><p className="hidden text-xs leading-5 text-slate-400 sm:block">Your code is only visible to course staff.</p><button disabled={!summary.trim()} onClick={submit} className="ml-auto flex items-center gap-2 rounded-xl bg-[#6257e8] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40">Join the queue <ArrowRight size={16} /></button></div></div></section>;
}

