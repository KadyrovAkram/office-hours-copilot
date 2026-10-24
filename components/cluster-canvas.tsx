"use client";

import { useMemo, useState, type CSSProperties } from "react";
import {
  CheckCircle2,
  Combine,
  Eye,
  Lightbulb,
  ListFilter,
  Map,
  Pencil,
  RefreshCw,
  Search,
  Split,
  Users,
  X,
} from "lucide-react";
import type { Cluster, QueueState } from "@/lib/triage-data";

type SaveState = (updater: (state: QueueState) => QueueState) => void;

type ClusterCanvasProps = {
  loaded: boolean;
  save: SaveState;
  search: string;
  selectedId: string;
  setSearch: (value: string) => void;
  setSelectedId: (id: string) => void;
  state: QueueState;
  visibleClusters: Cluster[];
};

const nodePositions = [
  { left: "5%", top: "12%" },
  { left: "39%", top: "28%" },
  { left: "13%", top: "54%" },
  { left: "55%", top: "64%" },
  { left: "68%", top: "8%" },
  { left: "3%", top: "80%" },
];

function openQuestions(state: QueueState, clusterId: string) {
  return state.questions.filter((question) => question.clusterId === clusterId && !question.resolved);
}

function waitMinutes(iso: string) {
  return Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

function longestWait(state: QueueState, clusterId: string) {
  const questions = openQuestions(state, clusterId);
  let longest = 0;
  for (const question of questions) longest = Math.max(longest, waitMinutes(question.submittedAt));
  return longest;
}

export function ClusterCanvas({
  loaded,
  save,
  search,
  selectedId,
  setSearch,
  setSelectedId,
  state,
  visibleClusters,
}: ClusterCanvasProps) {
  const [mergeMode, setMergeMode] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [interventionActive, setInterventionActive] = useState(false);
  const [listView, setListView] = useState(false);

  const selected = state.clusters.find((cluster) => cluster.id === selectedId) ?? state.clusters[0];
  const selectedQuestions = useMemo(() => openQuestions(state, selected.id), [selected.id, state]);
  const activeQuestionCount = state.questions.filter((question) => !question.resolved).length;

  const resolve = () => {
    const nextCluster = visibleClusters.find((cluster) => cluster.id !== selected.id);
    save((current) => ({
      ...current,
      clusters: current.clusters.map((cluster) =>
        cluster.id === selected.id ? { ...cluster, resolved: true } : cluster,
      ),
      questions: current.questions.map((question) =>
        question.clusterId === selected.id ? { ...question, resolved: true } : question,
      ),
    }));
    setInterventionActive(false);
    if (nextCluster) setSelectedId(nextCluster.id);
  };

  const merge = (targetId: string) => {
    save((current) => ({
      ...current,
      questions: current.questions.map((question) =>
        question.clusterId === selected.id ? { ...question, clusterId: targetId } : question,
      ),
      clusters: current.clusters.map((cluster) =>
        cluster.id === selected.id ? { ...cluster, resolved: true } : cluster,
      ),
    }));
    setSelectedId(targetId);
    setMergeMode(false);
  };

  const split = () => {
    if (selectedQuestions.length < 2) return;
    const movedQuestionIds = new Set(
      selectedQuestions.filter((_, index) => index % 2 === 1).map((question) => question.id),
    );
    save((current) => {
      const id = `${selected.id}-split-${current.revision + 1}`;
      return {
        ...current,
        clusters: [
          ...current.clusters,
          { ...selected, id, title: `${selected.title} · follow-up`, priority: "low" },
        ],
        questions: current.questions.map((question) =>
          movedQuestionIds.has(question.id) ? { ...question, clusterId: id } : question,
        ),
      };
    });
  };

  const rename = (title: string) => {
    if (title.trim()) {
      save((current) => ({
        ...current,
        clusters: current.clusters.map((cluster) =>
          cluster.id === selected.id ? { ...cluster, title: title.trim() } : cluster,
        ),
      }));
    }
    setRenaming(false);
  };

  const selectCluster = (clusterId: string) => {
    if (mergeMode && clusterId !== selectedId) {
      merge(clusterId);
      return;
    }
    setSelectedId(clusterId);
    setInterventionActive(false);
  };

  return (
    <section className="mx-auto max-w-[1560px] p-3 sm:p-5">
      {mergeMode ? (
        <div className="mb-3 flex items-center justify-between border border-[var(--warning)]/35 bg-[#fff8e8] px-4 py-2.5 text-sm text-[#71480f]">
          <span><strong>Merge mode:</strong> choose the cluster that should receive these questions.</span>
          <button onClick={() => setMergeMode(false)} className="p-1" aria-label="Cancel merge"><X size={16} /></button>
        </div>
      ) : null}

      <div className="overflow-hidden border border-border bg-background shadow-[0_20px_55px_rgba(33,36,30,0.08)]">
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--signal)]">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {activeQuestionCount} waiting
            </span>
            <span className="text-xs text-muted-foreground">{visibleClusters.length} active clusters</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 text-muted-foreground" size={14} />
              <input
                aria-label="Search clusters"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filter the map"
                className="h-8 w-36 border border-border bg-[var(--panel-muted)] pl-8 pr-2 text-xs outline-none focus:border-[var(--signal)] sm:w-44"
              />
            </div>
            <button onClick={() => setListView((value) => !value)} aria-pressed={listView} className="inline-flex h-8 items-center gap-1.5 border border-border px-2.5 text-xs text-muted-foreground hover:text-foreground">
              {listView ? <Map size={13} /> : <ListFilter size={13} />} <span className="hidden sm:inline">{listView ? "Map view" : "List view"}</span>
            </button>
            <span role="status" aria-label={loaded ? "Queue is current" : "Refreshing clusters"} className="grid h-8 w-8 place-items-center border border-border text-muted-foreground">
              <RefreshCw size={13} className={loaded ? "" : "animate-spin"} />
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_310px]">
          <div className={`cluster-map relative min-h-[660px] border-b border-border p-4 lg:border-r lg:border-b-0 ${listView ? "is-list" : ""}`}>
            <div className="relative z-10 flex items-start justify-between gap-4 px-1 pt-1">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Live question map</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">Where the room is stuck</h1>
              </div>
              <button
                onClick={() => setInterventionActive((active) => !active)}
                className="inline-flex min-h-10 items-center gap-2 bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm transition hover:brightness-95"
              >
                <Users size={15} />
                {interventionActive ? "Group gathered" : `Gather ${selectedQuestions.length} students`}
              </button>
            </div>

            <svg aria-hidden="true" className={`pointer-events-none absolute inset-0 hidden h-full w-full lg:block ${listView ? "lg:!hidden" : ""}`} preserveAspectRatio="none">
              <path d="M 214 178 C 344 178, 368 262, 470 268" fill="none" stroke="var(--border)" strokeWidth="1" />
              <path d="M 245 425 C 362 415, 410 362, 528 352" fill="none" stroke="var(--border)" strokeWidth="1" />
              <path d="M 710 168 C 656 206, 636 242, 602 294" fill="none" stroke="var(--border)" strokeWidth="1" />
            </svg>

            <div className={`relative z-10 mt-7 grid gap-3 sm:grid-cols-2 ${listView ? "lg:grid lg:h-auto lg:grid-cols-2" : "lg:block lg:h-[535px]"}`}>
              {visibleClusters.map((cluster, index) => {
                const questions = openQuestions(state, cluster.id);
                const isSelected = selectedId === cluster.id;
                const position = nodePositions[index % nodePositions.length];
                return (
                  <button
                    key={cluster.id}
                    onClick={() => selectCluster(cluster.id)}
                    aria-pressed={isSelected}
                    className={`cluster-node group text-left ${isSelected ? "is-selected" : ""} ${listView ? "cluster-node-list" : ""}`}
                    style={{
                      "--cluster-color": cluster.color,
                      ...(listView ? {} : { left: position.left, top: position.top }),
                    } as CSSProperties}
                  >
                    <span className="cluster-node-accent" />
                    <span className="flex items-start justify-between gap-3">
                      <span className="text-sm font-semibold leading-5">{cluster.title}</span>
                      <span className="grid h-6 min-w-6 place-items-center rounded-full bg-[var(--panel-muted)] px-1.5 text-[11px] font-semibold">
                        {questions.length}
                      </span>
                    </span>
                    <span className="mt-2 block text-xs leading-5 text-muted-foreground">{cluster.insight}</span>
                    <span className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-medium text-muted-foreground">
                      <span className="rounded-full bg-[var(--panel-muted)] px-2 py-1">{longestWait(state, cluster.id)}m wait</span>
                      <span className="rounded-full bg-[var(--panel-muted)] px-2 py-1">{cluster.priority} priority</span>
                    </span>
                  </button>
                );
              })}
              {visibleClusters.length === 0 ? (
                <div className="border border-dashed border-border bg-background/70 p-8 text-center text-sm text-muted-foreground sm:col-span-2">No active clusters match “{search}”.</div>
              ) : null}
            </div>
          </div>

          <aside className="bg-[var(--panel-muted)]/55">
            <div className="border-b border-border bg-background px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Teaching opportunity</p>
              {renaming ? (
                <input
                  autoFocus
                  defaultValue={selected.title}
                  onBlur={(event) => rename(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && rename(event.currentTarget.value)}
                  className="mt-2 w-full border-b border-[var(--signal)] bg-transparent py-1 text-base font-semibold outline-none"
                />
              ) : (
                <h2 className="mt-1.5 text-base font-semibold leading-6">{selected.title}</h2>
              )}
              <div className="mt-3 flex flex-wrap gap-1.5">
                <button onClick={() => setRenaming(true)} className="cluster-action"><Pencil size={12} /> Rename</button>
                <button onClick={() => setMergeMode(true)} className="cluster-action"><Combine size={12} /> Merge</button>
                <button onClick={split} disabled={selectedQuestions.length < 2} className="cluster-action disabled:opacity-40"><Split size={12} /> Split</button>
                <button onClick={resolve} className="cluster-action text-[var(--signal)]"><CheckCircle2 size={12} /> Resolve</button>
              </div>
            </div>

            <div className="space-y-3 p-3">
              <section className="border border-border bg-background p-3.5">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  <Eye size={13} /> Why grouped
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{selected.insight}</p>
              </section>

              <section className="border border-border bg-[#f1f5ee] p-3.5">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--signal)]">
                  <Lightbulb size={13} /> Recommended format
                </div>
                <h3 className="mt-2 text-sm font-semibold">{selectedQuestions.length > 4 ? "Seven-minute board trace" : "Focused small-group check"}</h3>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{selected.suggestedFix}</p>
                <button
                  onClick={() => setInterventionActive((active) => !active)}
                  className="mt-3 w-full bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground"
                >
                  {interventionActive ? "End group intervention" : "Start intervention"}
                </button>
              </section>

              <section className="border border-border bg-background">
                <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Students in cluster</span>
                  <span className="text-xs font-semibold">{selectedQuestions.length}</span>
                </div>
                <div className="max-h-[260px] overflow-y-auto">
                  {selectedQuestions.map((question) => (
                    <details key={question.id} className="group border-b border-border px-3.5 py-3 last:border-b-0">
                      <summary className="flex list-none items-start gap-2.5">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--panel-muted)] text-[9px] font-semibold">
                          {question.student.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <strong className="truncate text-xs">{question.student}</strong>
                            <span className="text-[10px] text-muted-foreground">{waitMinutes(question.submittedAt)}m</span>
                          </span>
                          <span className="mt-0.5 block text-[11px] leading-4 text-muted-foreground">{question.summary}</span>
                        </span>
                      </summary>
                      <p className="mt-2 pl-8 text-[11px] leading-5 text-muted-foreground">{question.detail}</p>
                      {question.code ? <pre className="mt-2 overflow-x-auto bg-[#191b1d] p-2.5 text-[10px] leading-4 text-[#d8ded9]"><code>{question.code}</code></pre> : null}
                    </details>
                  ))}
                </div>
              </section>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
