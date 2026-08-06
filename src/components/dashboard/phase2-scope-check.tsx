"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { scopeCheckApi } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import type { ScopeEvent } from "@/types";

interface Phase2ScopeCheckProps {
  projectId: string;
  hasBaseline: boolean;
  onScopeEventCreated: (scopeEvent: ScopeEvent) => void;
  currentScopeEvent: ScopeEvent | null;
}

const REQUEST_PRESETS = [
  {
    label: "Out-of-Scope Request (Scope Creep)",
    text: "Hey team! In addition to the agreed dashboard, can you also build a custom analytics export module that generates downloadable CSV reports by tomorrow morning?",
  },
  {
    label: "In-Scope Request (Compliant)",
    text: "Can you fix the login button alignment and update the dashboard welcome text as originally agreed in the mockups?",
  },
];

export function Phase2ScopeCheck({
  projectId,
  hasBaseline,
  onScopeEventCreated,
  currentScopeEvent,
}: Phase2ScopeCheckProps) {
  const [requestText, setRequestText] = useState("");
  const [checking, setChecking] = useState(false);
  const toast = useToast();

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestText.trim() || checking) return;
    if (!hasBaseline) {
      toast.warning("Baseline Required", "Please establish a baseline SOW first before checking new client requests.");
      return;
    }

    setChecking(true);
    try {
      const data = await scopeCheckApi.check(projectId, requestText);
      onScopeEventCreated(data.scopeEvent);

      if (data.scopeEvent.verdict === "out_of_scope") {
        toast.warning(
          "Scope Creep Flagged!",
          `Out-of-scope request detected (~${data.scopeEvent.extra_hours} extra hours estimated).`
        );
      } else {
        toast.success(
          "In-Scope Request",
          "This request complies with the baseline deliverables."
        );
      }
    } catch (err: any) {
      toast.error("Scope check failed", err.message);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      {/* Scope Check Request Input */}
      <DashboardCard
        title="Check Client Request"
        description="Paste a new client message, email, or feature request. Gemini compares it against your baseline to flag scope creep and estimate extra hours."
        icon={ShieldAlert}
        action={<Badge tone="brand">Phase 2 — Step 2</Badge>}
      >
        <form onSubmit={handleCheck} className="space-y-4">
          {/* Presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              1-Click Request Presets
            </span>
            <div className="flex flex-wrap gap-2">
              {REQUEST_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setRequestText(preset.text)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-left"
                >
                  <Zap className="h-3 w-3 text-amber-500 shrink-0" />
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            placeholder="Paste new client request... (or click a sample request above)"
            value={requestText}
            onChange={(e) => setRequestText(e.target.value)}
            rows={7}
            className="input-premium h-auto py-3 resize-y font-mono text-xs leading-relaxed"
          />

          <Button
            type="submit"
            disabled={checking || !requestText.trim() || !hasBaseline}
            className="h-11 w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs"
          >
            {checking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Comparing Against Baseline...
              </>
            ) : (
              <>
                <ShieldAlert className="h-4 w-4 mr-2" />
                Run AI Scope Compliance Check
              </>
            )}
          </Button>

          {!hasBaseline && (
            <p className="text-xs text-amber-500 text-center font-medium">
              ⚠️ Please configure an agreed baseline SOW above before performing a scope check.
            </p>
          )}
        </form>
      </DashboardCard>

      {/* AI Scope Analysis Results */}
      <DashboardCard
        title="AI Compliance Report"
        description="Semantic analysis comparing incoming request against agreed baseline bounds."
        icon={ShieldAlert}
        action={
          currentScopeEvent ? (
            <Badge
              tone={
                currentScopeEvent.verdict === "out_of_scope"
                  ? "danger"
                  : "success"
              }
            >
              {currentScopeEvent.verdict === "out_of_scope"
                ? "Out of Scope"
                : "In Scope"}
            </Badge>
          ) : (
            <Badge tone="neutral">No Analysis Yet</Badge>
          )
        }
      >
        {!currentScopeEvent ? (
          <EmptyState
            icon={ShieldAlert}
            title="No Scope Analysis Performed"
            description="Paste a new client request on the left and click 'Run AI Scope Compliance Check' to inspect potential scope drift."
          />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScopeEvent.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Verdict Header Banner */}
              <div
                className={`rounded-2xl border p-4 flex items-center justify-between gap-4 shadow-xs ${
                  currentScopeEvent.verdict === "out_of_scope"
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  {currentScopeEvent.verdict === "out_of_scope" ? (
                    <AlertTriangle className="h-6 w-6 text-rose-500 shrink-0" />
                  ) : (
                    <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0" />
                  )}
                  <div>
                    <h4 className="text-sm font-bold tracking-tight text-foreground">
                      {currentScopeEvent.verdict === "out_of_scope"
                        ? "Scope Expansion Flagged!"
                        : "Compliant In-Scope Request"}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {currentScopeEvent.verdict === "out_of_scope"
                        ? "This request violates baseline deliverables or explicit exclusions."
                        : "This request is fully covered under existing scope."}
                    </p>
                  </div>
                </div>

                {currentScopeEvent.verdict === "out_of_scope" && (
                  <div className="flex items-center gap-1.5 rounded-xl bg-rose-500/20 border border-rose-500/30 px-3 py-1.5 text-xs font-mono font-bold text-rose-400 shrink-0">
                    <Clock className="h-4 w-4" />
                    ~{currentScopeEvent.extra_hours} Hours
                  </div>
                )}
              </div>

              {/* Request Summary */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Analyzed Request Text
                </label>
                <div className="rounded-xl border border-border bg-muted/20 p-3 text-xs italic text-foreground leading-relaxed">
                  "{currentScopeEvent.request_text}"
                </div>
              </div>

              {/* AI Discrepancy Breakdown */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Discrepancy & Compliance Analysis
                </label>
                <div className="rounded-xl border border-border bg-card p-3.5 text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                  {currentScopeEvent.discrepancy_note}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </DashboardCard>
    </div>
  );
}
