"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ShieldAlert, DollarSign, Clock, Layers3 } from "lucide-react";
import type { StagedTask, BaselineItem, ScopeEvent } from "@/types";

interface DashboardMetricsProps {
  savedTasks: StagedTask[];
  baselineItems: BaselineItem[];
  currentScopeEvent: ScopeEvent | null;
}

export function DashboardMetrics({
  savedTasks,
  baselineItems,
  currentScopeEvent,
}: DashboardMetricsProps) {
  // Calculations
  const highComplexityCount = savedTasks.filter((t) => t.complexity === "high").length;
  const mediumComplexityCount = savedTasks.filter((t) => t.complexity === "medium").length;
  const lowComplexityCount = savedTasks.filter((t) => t.complexity === "low").length;

  const extraHours = currentScopeEvent?.verdict === "out_of_scope" ? currentScopeEvent.extra_hours || 0 : 0;
  const estimatedUnbilledValue = extraHours * 75; // $75/hr default

  const riskTone =
    currentScopeEvent?.verdict === "out_of_scope"
      ? "danger"
      : baselineItems.length > 0
      ? "success"
      : "warning";

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Staged Tasks Metric */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className="rounded-2xl border border-border bg-card p-4 shadow-xs hover:border-indigo-500/30 transition-all"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Staged Tasks
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
            <Layers3 className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
            {savedTasks.length}
          </span>
          <span className="text-xs text-muted-foreground">approved items</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[10px]">
          <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-rose-600 font-mono">
            {highComplexityCount} High
          </span>
          <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-600 font-mono">
            {mediumComplexityCount} Med
          </span>
          <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-600 font-mono">
            {lowComplexityCount} Low
          </span>
        </div>
      </motion.div>

      {/* 2. SOW Baseline Deliverables */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        className="rounded-2xl border border-border bg-card p-4 shadow-xs hover:border-indigo-500/30 transition-all"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            SOW Deliverables
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
            {baselineItems.length}
          </span>
          <span className="text-xs text-muted-foreground">locked clauses</span>
        </div>
        <div className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
          <span>{baselineItems.length > 0 ? "Baseline Active" : "No Baseline Set"}</span>
        </div>
      </motion.div>

      {/* 3. Scope Risk Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.15 }}
        className="rounded-2xl border border-border bg-card p-4 shadow-xs hover:border-indigo-500/30 transition-all"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Scope Risk Level
          </span>
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl ${
              riskTone === "danger"
                ? "bg-rose-500/10 text-rose-500"
                : riskTone === "success"
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-amber-500/10 text-amber-500"
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span
            className={`text-xl font-bold tracking-tight ${
              riskTone === "danger"
                ? "text-rose-500"
                : riskTone === "success"
                ? "text-emerald-500"
                : "text-amber-500"
            }`}
          >
            {riskTone === "danger"
              ? "High Risk"
              : riskTone === "success"
              ? "Protected"
              : "Pending Baseline"}
          </span>
        </div>
        <div className="mt-3 text-[11px] text-muted-foreground truncate">
          {currentScopeEvent
            ? currentScopeEvent.verdict === "out_of_scope"
              ? "Scope creep flagged"
              : "In-scope compliant"
            : "Run AI check to analyze"}
        </div>
      </motion.div>

      {/* 4. Unbilled Potential Value */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.2 }}
        className="rounded-2xl border border-border bg-card p-4 shadow-xs hover:border-indigo-500/30 transition-all"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Unbilled Change Order
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
            <DollarSign className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
            ${estimatedUnbilledValue.toLocaleString()}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span>{extraHours} extra hours calculated</span>
        </div>
      </motion.div>
    </div>
  );
}
