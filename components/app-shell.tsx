"use client";

import { BarChart3, GraduationCap, Loader2, Users } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import type { Role } from "@/lib/triage-data";

const roleMeta: Record<Role, { label: string; icon: typeof GraduationCap }> = {
  student: { label: "Student", icon: GraduationCap },
  ta: { label: "TA", icon: Users },
  instructor: { label: "Instructor", icon: BarChart3 },
};

type AppShellProps = {
  children: React.ReactNode;
  isSaving: boolean;
  questionCount: number;
  role: Role;
  onRoleChange: (role: Role) => void;
};

export function AppShell({ children, isSaving, questionCount, role, onRoleChange }: AppShellProps) {
  return (
    <main className="min-h-screen bg-[var(--app-canvas)] text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/94 backdrop-blur-xl">
        <div className="mx-auto flex h-15 max-w-[1560px] items-center justify-between px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <BrandMark className="h-7 w-7 shrink-0 text-[var(--signal)]" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-[-0.025em]">Office Hours</p>
              <p className="truncate text-[11px] text-muted-foreground">CSE 2221 · Software I</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 text-xs sm:flex">
            <span className="inline-flex items-center gap-1.5 font-medium text-[var(--signal)]">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              Live
            </span>
            <span className="text-muted-foreground">{questionCount} questions</span>
            {isSaving ? (
              <span className="ml-2 inline-flex items-center gap-1.5 text-muted-foreground">
                <Loader2 className="animate-spin" size={12} /> Saving
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex border border-border bg-[var(--panel-muted)] p-0.5" aria-label="Preview role">
              {(Object.keys(roleMeta) as Role[]).map((key) => {
                const Icon = roleMeta[key].icon;
                return (
                  <button
                    key={key}
                    aria-label={`Preview as ${roleMeta[key].label}`}
                    aria-pressed={role === key}
                    onClick={() => onRoleChange(key)}
                    className={`flex min-h-8 items-center gap-1.5 px-2.5 text-xs font-medium transition-colors ${
                      role === key
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon size={13} />
                    <span className="hidden lg:inline">{roleMeta[key].label}</span>
                  </button>
                );
              })}
            </div>
            <div className="grid h-8 w-8 place-items-center rounded-full bg-foreground text-[10px] font-semibold text-background">
              AK
            </div>
          </div>
        </div>
      </header>
      {children}
    </main>
  );
}
