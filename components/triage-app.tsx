"use client";

import { useEffect, useState, useTransition } from "react";
import {
  ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown,
  Clock3, Code2, Lightbulb, Sparkles, Users,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/app-shell";
import { ClusterCanvas } from "@/components/cluster-canvas";
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
      {role === "instructor" ? <InstructorView state={state} /> : null}
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

function InstructorView({ state }: { state: QueueState }) {
  const data = state.clusters.filter((c) => !c.resolved).map((c) => ({ topic: c.topic, students: countOpen(state, c.id), color: c.color })).sort((a, b) => b.students - a.students);
  return <section className="mx-auto max-w-[1320px] px-5 py-9"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-[#6257e8]">Instructor overview</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Where the class is getting stuck.</h1><p className="mt-2 text-slate-500">Live concept signals from today’s office hours.</p></div><button className="flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium"><Clock3 size={15} /> Today, 2:00–4:00 PM <ChevronDown size={14} /></button></div><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={Users} label="Active questions" value={String(activeCount(state))} note={`${state.questions.length} submitted today`} /><Metric icon={BookOpen} label="Concept clusters" value={String(data.length)} note="2 need attention" /><Metric icon={Sparkles} label="Questions grouped" value="93%" note="2 need TA review" /><Metric icon={CheckCircle2} label="Groups resolved" value={String(state.clusters.filter((c) => c.resolved).length)} note="Across this session" /></div><div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]"><div className="rounded-[24px] border border-black/6 bg-white p-5 sm:p-7"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Concept demand</h2><p className="mt-1 text-sm text-slate-400">Students currently waiting by topic</p></div><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">Live</span></div><div className="mt-6 h-[310px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}><CartesianGrid horizontal={false} stroke="#edf0f4" /><XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} /><YAxis type="category" dataKey="topic" width={95} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#475569" }} /><Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0", fontSize: 12 }} /><Bar dataKey="students" fill="#6d5dfc" radius={[0, 7, 7, 0]} barSize={22} /></BarChart></ResponsiveContainer></div></div><div className="rounded-[24px] border border-black/6 bg-white p-5 sm:p-7"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Teaching opportunities</h2><p className="mt-1 text-sm text-slate-400">Highest-leverage interventions</p></div><Lightbulb className="text-amber-500" size={20} /></div><div className="mt-5 space-y-3">{data.slice(0, 3).map((item, index) => { const cluster = state.clusters.find((c) => c.topic === item.topic)!; return <div key={item.topic} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-400">0{index + 1}</span><span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ color: cluster.color, background: `${cluster.color}14` }}>{item.students} students</span></div><h3 className="mt-2 text-sm font-semibold">{cluster.title}</h3><p className="mt-1.5 text-xs leading-5 text-slate-500">{cluster.suggestedFix}</p></div>; })}</div></div></div></section>;
}

function activeCount(state: QueueState) { return state.questions.filter((q) => !q.resolved).length; }
function Metric({ icon: Icon, label, value, note }: { icon: typeof Users; label: string; value: string; note: string }) { return <div className="rounded-[22px] border border-black/6 bg-white p-5"><div className="flex items-center justify-between"><p className="text-sm text-slate-500">{label}</p><div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500"><Icon size={16} /></div></div><p className="mt-4 text-3xl font-semibold tracking-[-.04em]">{value}</p><p className="mt-1 text-xs text-slate-400">{note}</p></div>; }
