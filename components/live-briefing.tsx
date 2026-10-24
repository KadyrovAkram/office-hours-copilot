"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Check, Clock3, Megaphone, Users } from "lucide-react";
import type { Cluster, QueueState } from "@/lib/triage-data";

function openCount(state: QueueState, clusterId: string) {
  return state.questions.filter((question) => question.clusterId === clusterId && !question.resolved).length;
}

function longestWait(state: QueueState, clusterId: string) {
  const submitted = state.questions
    .filter((question) => question.clusterId === clusterId && !question.resolved)
    .map((question) => new Date(question.submittedAt).getTime());
  if (!submitted.length) return 0;
  return Math.max(1, Math.round((Date.now() - Math.min(...submitted)) / 60000));
}

function OpportunityRow({
  cluster,
  count,
  selected,
  wait,
  onSelect,
}: {
  cluster: Cluster;
  count: number;
  selected: boolean;
  wait: number;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      className={`group grid w-full grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 border-t border-border px-1 py-4 text-left transition sm:grid-cols-[44px_minmax(0,1fr)_90px_auto] ${selected ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
    >
      <span className="text-xl font-medium tabular-nums" style={{ color: selected ? cluster.color : undefined }}>{String(count).padStart(2, "0")}</span>
      <span>
        <span className="block text-sm font-semibold text-foreground">{cluster.title}</span>
        <span suppressHydrationWarning className="mt-0.5 block text-xs">{cluster.topic} · longest wait {wait}m</span>
      </span>
      <span className="hidden h-5 items-end gap-0.5 sm:flex" aria-hidden="true">
        {[38, 58, 44, 72, 92].map((height, index) => (
          <span key={height} className="w-1.5" style={{ height: `${Math.max(20, height - index * (7 - Math.min(count, 6)))}%`, backgroundColor: cluster.color, opacity: 0.32 + index * 0.14 }} />
        ))}
      </span>
      <ArrowUpRight size={16} className={`transition ${selected ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"}`} />
    </button>
  );
}

export function LiveBriefing({ state }: { state: QueueState }) {
  const opportunities = useMemo(
    () => state.clusters
      .filter((cluster) => !cluster.resolved)
      .map((cluster) => ({ cluster, count: openCount(state, cluster.id), wait: longestWait(state, cluster.id) }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count || b.wait - a.wait),
    [state],
  );
  const [selectedId, setSelectedId] = useState(opportunities[0]?.cluster.id ?? "");
  const [announced, setAnnounced] = useState(false);
  const selected = opportunities.find((item) => item.cluster.id === selectedId) ?? opportunities[0];
  const topThreeCount = opportunities.slice(0, 3).reduce((sum, item) => sum + item.count, 0);
  const activeCount = opportunities.reduce((sum, item) => sum + item.count, 0);

  if (!selected) {
    return <section className="mx-auto max-w-6xl px-5 py-16"><h1 className="text-3xl font-semibold">The queue is clear.</h1><p className="mt-2 text-muted-foreground">No teaching interventions are needed right now.</p></section>;
  }

  return (
    <section className="mx-auto max-w-[1320px] px-5 py-10 sm:py-14">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(310px,.75fr)] lg:gap-14">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--signal)]">
              <span className="h-1.5 w-1.5 rounded-full bg-current" /> Live briefing
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 size={13} /> Today, 2:00–4:00 PM</div>
          </div>

          <div className="py-9 sm:py-12">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Highest leverage now</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.055em] sm:text-6xl">
              Three explanations could unblock <span className="text-[var(--signal)]">{topThreeCount} students.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              The queue is concentrated, not chaotic. Address the first three patterns before taking questions one by one.
            </p>
          </div>

          <div>
            <div className="grid grid-cols-[1fr_auto] items-end gap-4 pb-3">
              <div><h2 className="text-sm font-semibold">Teaching opportunities</h2><p className="mt-1 text-xs text-muted-foreground">Ranked by students affected, then wait time</p></div>
              <span className="text-xs tabular-nums text-muted-foreground">{activeCount} waiting</span>
            </div>
            {opportunities.map((item) => (
              <OpportunityRow
                key={item.cluster.id}
                {...item}
                selected={selected.cluster.id === item.cluster.id}
                onSelect={() => { setSelectedId(item.cluster.id); setAnnounced(false); }}
              />
            ))}
          </div>
        </div>

        <aside className="lg:pt-16">
          <div className="sticky top-24 border border-border bg-background shadow-[0_18px_50px_rgba(33,36,30,0.07)]">
            <div className="border-b border-border p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Recommended move</span>
                <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ color: selected.cluster.color, backgroundColor: `${selected.cluster.color}12` }}>{selected.count} students</span>
              </div>
              <h2 className="mt-4 text-2xl font-semibold leading-8 tracking-[-0.035em]">{selected.cluster.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{selected.cluster.insight}</p>
            </div>

            <div className="p-5 sm:p-6">
              <div className="flex gap-3">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--panel-muted)] text-[var(--signal)]"><Megaphone size={14} /></span>
                <div><p className="text-xs font-semibold">Say or show this next</p><p className="mt-1.5 text-sm leading-6 text-muted-foreground">{selected.cluster.suggestedFix}</p></div>
              </div>
              <div className="mt-5 flex items-center gap-3 border-y border-border py-4 text-xs text-muted-foreground">
                <Users size={14} /><span>{selected.count} students affected</span><span>·</span><span suppressHydrationWarning>{selected.wait}m longest wait</span>
              </div>
              <button
                onClick={() => setAnnounced(true)}
                className={`mt-5 flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition ${announced ? "bg-[var(--panel-muted)] text-[var(--signal)]" : "bg-primary text-primary-foreground hover:brightness-95"}`}
              >
                {announced ? <><Check size={15} /> Announcement prepared</> : <><Megaphone size={15} /> Prepare group announcement</>}
              </button>
              <p className="mt-3 text-center text-[11px] leading-4 text-muted-foreground">Prepares the prompt for course staff; nothing is sent automatically.</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
