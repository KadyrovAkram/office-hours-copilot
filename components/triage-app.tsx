"use client";

import { useEffect, useState, useTransition } from "react";
import { AppShell } from "@/components/app-shell";
import { ClusterCanvas } from "@/components/cluster-canvas";
import { LiveBriefing } from "@/components/live-briefing";
import { StudentQueue } from "@/components/student-queue";
import { seedState, type QueueState, type Role } from "@/lib/triage-data";

const DEMO_STORAGE_KEY = "office-hours-copilot:queue";

export function TriageApp() {
  const [role, setRole] = useState<Role>("ta");
  const [state, setState] = useState<QueueState>(seedState);
  const [selectedId, setSelectedId] = useState("recursion");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/queue").then((response) => response.json()).then((data) => {
      if (data.state) {
        let next = data.state as QueueState;
        if (data.demo) {
          const stored = window.localStorage.getItem(DEMO_STORAGE_KEY);
          if (stored) {
            try {
              const parsed = JSON.parse(stored) as QueueState;
              if (parsed.revision >= next.revision) next = parsed;
            } catch {
              window.localStorage.removeItem(DEMO_STORAGE_KEY);
            }
          }
        }
        setState(next);
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const save = (updater: (current: QueueState) => QueueState) => {
    setState((current) => {
      const next = { ...updater(current), revision: current.revision + 1 };
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(next));
      startTransition(() => {
        void fetch("/api/queue", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(next),
        });
      });
      return next;
    });
  };

  const visibleClusters = state.clusters.filter((cluster) => {
    const value = `${cluster.title} ${cluster.topic}`.toLowerCase();
    return !cluster.resolved && value.includes(search.toLowerCase());
  });

  return (
    <AppShell role={role} onRoleChange={setRole} questionCount={state.questions.length} isSaving={isPending}>
      {role === "student" ? <StudentQueue state={state} save={save} /> : null}
      {role === "ta" ? <ClusterCanvas state={state} save={save} selectedId={selectedId} setSelectedId={setSelectedId} visibleClusters={visibleClusters} search={search} setSearch={setSearch} loaded={loaded} /> : null}
      {role === "instructor" ? <LiveBriefing state={state} /> : null}
    </AppShell>
  );
}
