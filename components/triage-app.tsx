"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Activity, ArrowRight, BarChart3, BookOpen, Check, CheckCircle2, ChevronDown,
  Clock3, Code2, Combine, GraduationCap, Lightbulb, Loader2,
  MoreHorizontal, Radio, RefreshCw, Search, Sparkles, Split, Users, WandSparkles,
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { classifyQuestion, seedState, type Cluster, type QueueState, type Role } from "@/lib/triage-data";

const roleMeta: Record<Role, { label: string; icon: typeof GraduationCap }> = {
  student: { label: "Student", icon: GraduationCap },
  ta: { label: "TA", icon: Users },
  instructor: { label: "Instructor", icon: BarChart3 },
};

function timeAgo(iso: string) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h`;
}

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

  const selected = state.clusters.find((cluster) => cluster.id === selectedId) ?? state.clusters[0];
  const visibleClusters = state.clusters.filter((cluster) => {
    const value = `${cluster.title} ${cluster.topic}`.toLowerCase();
    return !cluster.resolved && value.includes(search.toLowerCase());
  });

  return (
    <main className="min-h-screen bg-[#f4f5f7] text-[#18212f]">
      <header className="sticky top-0 z-30 border-b border-black/6 bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1480px] items-center justify-between px-4 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#6257e8] text-white shadow-sm"><WandSparkles size={18} /></div>
            <div><p className="font-semibold tracking-[-.02em]">Office Hours Copilot</p><p className="text-[11px] text-slate-500">CSE 2221 · Software I</p></div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:flex"><Radio size={13} /> Live session · {state.questions.length} questions</div>
          <div className="flex items-center gap-2">
            {isPending ? <span className="hidden items-center gap-1.5 text-xs text-slate-400 md:flex"><Loader2 className="animate-spin" size={13} /> Saving</span> : null}
            <div className="flex rounded-xl bg-slate-100 p-1" aria-label="Preview role">
              {(Object.keys(roleMeta) as Role[]).map((key) => {
                const Icon = roleMeta[key].icon;
                return <button key={key} aria-label={`Preview as ${roleMeta[key].label}`} aria-pressed={role === key} onClick={() => setRole(key)} className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${role === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}><Icon size={14} /><span className="hidden md:inline">{roleMeta[key].label}</span></button>;
              })}
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#18212f] text-xs font-semibold text-white">AK</div>
          </div>
        </div>
      </header>

      {role === "student" ? <StudentView state={state} save={save} /> : null}
      {role === "ta" ? <TAView state={state} save={save} selected={selected} selectedId={selectedId} setSelectedId={setSelectedId} visibleClusters={visibleClusters} search={search} setSearch={setSearch} loaded={loaded} /> : null}
      {role === "instructor" ? <InstructorView state={state} /> : null}
    </main>
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

function TAView({ state, save, selected, selectedId, setSelectedId, visibleClusters, search, setSearch, loaded }: { state: QueueState; save: (u: (s: QueueState) => QueueState) => void; selected: Cluster; selectedId: string; setSelectedId: (id: string) => void; visibleClusters: Cluster[]; search: string; setSearch: (v: string) => void; loaded: boolean }) {
  const [renaming, setRenaming] = useState(false);
  const [mergeMode, setMergeMode] = useState(false);
  const selectedQuestions = state.questions.filter((q) => q.clusterId === selected?.id && !q.resolved);
  const resolve = () => save((current) => ({ ...current, clusters: current.clusters.map((c) => c.id === selected.id ? { ...c, resolved: true } : c), questions: current.questions.map((q) => q.clusterId === selected.id ? { ...q, resolved: true } : q) }));
  const merge = (targetId: string) => { save((current) => ({ ...current, questions: current.questions.map((q) => q.clusterId === selected.id ? { ...q, clusterId: targetId } : q), clusters: current.clusters.map((c) => c.id === selected.id ? { ...c, resolved: true } : c) })); setSelectedId(targetId); setMergeMode(false); };
  const split = () => { if (selectedQuestions.length < 2) return; const moved = new Set(selectedQuestions.filter((_, i) => i % 2 === 1).map((q) => q.id)); save((current) => { const id = `${selected.id}-split-${current.revision + 1}`; return { ...current, clusters: [...current.clusters, { ...selected, id, title: `${selected.title} · follow-up`, priority: "low" }], questions: current.questions.map((q) => moved.has(q.id) ? { ...q, clusterId: id } : q) }; }); };
  const rename = (title: string) => { if (title.trim()) save((current) => ({ ...current, clusters: current.clusters.map((c) => c.id === selected.id ? { ...c, title: title.trim() } : c) })); setRenaming(false); };

  return <div className="mx-auto grid max-w-[1480px] grid-cols-1 gap-0 px-4 py-5 lg:grid-cols-[320px_minmax(0,1fr)_330px] lg:px-7">
    <aside className="rounded-l-[24px] border border-black/6 bg-white lg:min-h-[calc(100vh-106px)]"><div className="border-b border-slate-100 p-4"><div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-slate-400">Live clusters</p><p className="mt-1 text-sm text-slate-500">{activeCount(state)} students · {visibleClusters.length} groups</p></div><button className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500"><RefreshCw size={14} className={loaded ? "" : "animate-spin"} /></button></div><div className="relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={15} /><input aria-label="Search clusters" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search topics" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-violet-300" /></div></div><div className="max-h-[calc(100vh-260px)] space-y-1 overflow-y-auto p-2">{visibleClusters.map((cluster) => { const count = countOpen(state, cluster.id); return <button key={cluster.id} onClick={() => mergeMode && cluster.id !== selectedId ? merge(cluster.id) : setSelectedId(cluster.id)} className={`w-full rounded-2xl p-3 text-left transition ${selectedId === cluster.id ? "bg-[#f0efff] ring-1 ring-violet-200" : "hover:bg-slate-50"}`}><div className="flex items-start gap-3"><span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: cluster.color }} /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold">{cluster.title}</span><span className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 shadow-sm">{count}</span></div><p className="mt-1 text-xs text-slate-400">{cluster.topic} · {cluster.priority} priority</p></div></div></button>; })}</div></aside>

    <section className="border-x border-y border-black/6 bg-white lg:min-h-[calc(100vh-106px)]"><div className="border-b border-slate-100 p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: selected?.color }} /><span className="text-xs font-semibold uppercase tracking-[.12em] text-slate-400">{selected?.topic}</span></div>{renaming ? <input autoFocus defaultValue={selected?.title} onBlur={(e) => rename(e.target.value)} onKeyDown={(e) => e.key === "Enter" && rename(e.currentTarget.value)} className="mt-2 w-full border-b-2 border-violet-400 bg-transparent text-2xl font-semibold tracking-[-.03em] outline-none" /> : <h1 onDoubleClick={() => setRenaming(true)} className="mt-2 text-2xl font-semibold tracking-[-.03em]">{selected?.title}</h1>}<p className="mt-2 text-sm text-slate-500">{selectedQuestions.length} similar questions · newest {selectedQuestions[0] ? timeAgo(selectedQuestions[0].submittedAt) : "now"} ago</p></div><button className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500"><MoreHorizontal size={17} /></button></div><div className="mt-5 flex flex-wrap gap-2"><button onClick={() => setRenaming(true)} className="action-button"><Sparkles size={14} /> Rename</button><button onClick={() => setMergeMode(!mergeMode)} className={`action-button ${mergeMode ? "border-violet-300 bg-violet-50 text-violet-700" : ""}`}><Combine size={14} /> {mergeMode ? "Choose cluster" : "Merge"}</button><button onClick={split} className="action-button"><Split size={14} /> Split</button><button onClick={resolve} className="action-button border-emerald-200 bg-emerald-50 text-emerald-700"><CheckCircle2 size={14} /> Resolve group</button></div></div><div className="border-b border-violet-100 bg-violet-50/65 p-5 sm:p-6"><div className="flex gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-600 text-white"><Sparkles size={17} /></div><div><p className="text-xs font-semibold uppercase tracking-wider text-violet-600">Copilot read</p><p className="mt-1 text-sm leading-6 text-slate-700">{selected?.insight}</p><div className="mt-3 flex items-start gap-2 rounded-xl bg-white/80 p-3 text-sm text-slate-600"><Lightbulb className="mt-0.5 shrink-0 text-amber-500" size={16} /><span><strong className="text-slate-800">Suggested move:</strong> {selected?.suggestedFix}</span></div></div></div></div><div className="space-y-3 p-4 sm:p-6">{selectedQuestions.map((question, index) => <article key={question.id} className="rounded-2xl border border-slate-200 p-4 transition hover:border-slate-300 hover:shadow-sm"><div className="flex items-start gap-3"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{question.student.slice(0, 1)}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold">{question.student} · {question.summary}</h2><span className="text-xs text-slate-400">{index + 1} · {timeAgo(question.submittedAt)} ago</span></div><p className="mt-1.5 text-sm leading-6 text-slate-500">{question.detail}</p>{question.code ? <pre className="mt-3 overflow-x-auto rounded-xl bg-[#171c25] p-3 font-mono text-xs leading-5 text-slate-200"><code>{question.code}</code></pre> : null}</div></div></article>)}</div></section>

    <aside className="rounded-r-[24px] border border-black/6 bg-[#fafbfc] lg:min-h-[calc(100vh-106px)]"><div className="border-b border-slate-200 p-5"><p className="text-xs font-semibold uppercase tracking-[.12em] text-slate-400">Session pulse</p><div className="mt-4 grid grid-cols-2 gap-3"><Stat label="In queue" value={String(activeCount(state))} change="+8 this hour" /><Stat label="Grouped" value={`${Math.round((activeCount(state) / Math.max(1, state.questions.length)) * 100)}%`} change="6 clear topics" /></div></div><div className="p-5"><div className="mb-4 flex items-center justify-between"><p className="text-sm font-semibold">Queue activity</p><span className="text-xs text-slate-400">Last 60 min</span></div><div className="h-36"><ResponsiveContainer width="100%" height="100%"><AreaChart data={[{ t: "-60", q: 9 }, { t: "-50", q: 12 }, { t: "-40", q: 11 }, { t: "-30", q: 18 }, { t: "-20", q: 21 }, { t: "-10", q: 27 }, { t: "Now", q: activeCount(state) }]}><defs><linearGradient id="queueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6d5dfc" stopOpacity={0.28}/><stop offset="100%" stopColor="#6d5dfc" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#e9edf2" /><XAxis dataKey="t" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} /><YAxis hide /><Tooltip contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0", fontSize: 12 }} /><Area type="monotone" dataKey="q" stroke="#6d5dfc" strokeWidth={2} fill="url(#queueFill)" /></AreaChart></ResponsiveContainer></div><div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-center gap-2 text-amber-800"><Activity size={16} /><p className="text-sm font-semibold">Pattern spike detected</p></div><p className="mt-2 text-xs leading-5 text-amber-700">Recursion questions doubled in 18 minutes. A 5-minute mini-lesson could unblock 6 students.</p><button className="mt-3 flex items-center gap-1 text-xs font-semibold text-amber-900">Draft announcement <ArrowRight size={12} /></button></div></div></aside>
  </div>;
}

function InstructorView({ state }: { state: QueueState }) {
  const data = state.clusters.filter((c) => !c.resolved).map((c) => ({ topic: c.topic, students: countOpen(state, c.id), color: c.color })).sort((a, b) => b.students - a.students);
  return <section className="mx-auto max-w-[1320px] px-5 py-9"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-[#6257e8]">Instructor overview</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Where the class is getting stuck.</h1><p className="mt-2 text-slate-500">Live concept signals from today’s office hours.</p></div><button className="flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium"><Clock3 size={15} /> Today, 2:00–4:00 PM <ChevronDown size={14} /></button></div><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={Users} label="Active questions" value={String(activeCount(state))} note={`${state.questions.length} submitted today`} /><Metric icon={BookOpen} label="Concept clusters" value={String(data.length)} note="2 need attention" /><Metric icon={Sparkles} label="Questions grouped" value="93%" note="2 need TA review" /><Metric icon={CheckCircle2} label="Groups resolved" value={String(state.clusters.filter((c) => c.resolved).length)} note="Across this session" /></div><div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]"><div className="rounded-[24px] border border-black/6 bg-white p-5 sm:p-7"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Concept demand</h2><p className="mt-1 text-sm text-slate-400">Students currently waiting by topic</p></div><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">Live</span></div><div className="mt-6 h-[310px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}><CartesianGrid horizontal={false} stroke="#edf0f4" /><XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} /><YAxis type="category" dataKey="topic" width={95} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#475569" }} /><Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0", fontSize: 12 }} /><Bar dataKey="students" fill="#6d5dfc" radius={[0, 7, 7, 0]} barSize={22} /></BarChart></ResponsiveContainer></div></div><div className="rounded-[24px] border border-black/6 bg-white p-5 sm:p-7"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Teaching opportunities</h2><p className="mt-1 text-sm text-slate-400">Highest-leverage interventions</p></div><Lightbulb className="text-amber-500" size={20} /></div><div className="mt-5 space-y-3">{data.slice(0, 3).map((item, index) => { const cluster = state.clusters.find((c) => c.topic === item.topic)!; return <div key={item.topic} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-400">0{index + 1}</span><span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ color: cluster.color, background: `${cluster.color}14` }}>{item.students} students</span></div><h3 className="mt-2 text-sm font-semibold">{cluster.title}</h3><p className="mt-1.5 text-xs leading-5 text-slate-500">{cluster.suggestedFix}</p></div>; })}</div></div></div></section>;
}

function activeCount(state: QueueState) { return state.questions.filter((q) => !q.resolved).length; }
function Stat({ label, value, change }: { label: string; value: string; change: string }) { return <div className="rounded-2xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-[10px] text-emerald-600">{change}</p></div>; }
function Metric({ icon: Icon, label, value, note }: { icon: typeof Users; label: string; value: string; note: string }) { return <div className="rounded-[22px] border border-black/6 bg-white p-5"><div className="flex items-center justify-between"><p className="text-sm text-slate-500">{label}</p><div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500"><Icon size={16} /></div></div><p className="mt-4 text-3xl font-semibold tracking-[-.04em]">{value}</p><p className="mt-1 text-xs text-slate-400">{note}</p></div>; }
