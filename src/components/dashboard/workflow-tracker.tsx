"use client";

import { CheckCircle2, Circle, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ActiveTab } from "@/types";

interface WorkflowTrackerProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  hasBaseline: boolean;
  hasTasks: boolean;
}

const STEPS = [
  { id: 1, name: "Extraction", phase: "phase1", desc: "AI task extraction" },
  { id: 2, name: "Review", phase: "phase1", desc: "Task validation" },
  { id: 3, name: "Baseline", phase: "phase2", desc: "SOW definition" },
  { id: 4, name: "Scope Check", phase: "phase2", desc: "AI comparison" },
  { id: 5, name: "Pushback Email", phase: "phase2", desc: "Client response" },
];

export function WorkflowTracker({
  activeTab,
  onTabChange,
  hasBaseline,
  hasTasks,
}: WorkflowTrackerProps) {
  return (
    <div className="space-y-4">
      {/* Tab Selector */}
      <div className="flex gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-xs">
        <button
          onClick={() => onTabChange("phase1")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-semibold transition-all duration-200 ${
            activeTab === "phase1"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          Phase 1: Extraction & Review
          {hasTasks && <Badge tone="info" size="sm" className="ml-1">Ready</Badge>}
        </button>
        <button
          onClick={() => onTabChange("phase2")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-semibold transition-all duration-200 ${
            activeTab === "phase2"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          Phase 2: Baseline, Scope Check & Email
          {hasBaseline && <Badge tone="success" size="sm" className="ml-1">Baseline Set</Badge>}
        </button>
      </div>

      {/* Steps Visualizer */}
      <div className="hidden lg:grid grid-cols-5 gap-2 rounded-2xl border border-border bg-card/60 p-3">
        {STEPS.map((step, idx) => {
          const isPhase1 = step.phase === "phase1";
          const isActive =
            (activeTab === "phase1" && isPhase1) ||
            (activeTab === "phase2" && !isPhase1);

          return (
            <div key={step.id} className="flex items-center gap-2">
              <div
                className={`flex-1 flex items-center gap-2.5 rounded-xl border p-2.5 transition-all ${
                  isActive
                    ? "border-indigo-200 bg-indigo-50/60 dark:border-indigo-900 dark:bg-indigo-950/40"
                    : "border-border/60 bg-muted/20 text-muted-foreground"
                }`}
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.id}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground truncate">
                    {step.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {step.desc}
                  </div>
                </div>
              </div>
              {idx < STEPS.length - 1 && (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
