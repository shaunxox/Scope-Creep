"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Loader2,
  Copy,
  Check,
  Sparkles,
  DollarSign,
  Clock,
  Eye,
  Code,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { draftEmailApi } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import type { ScopeEvent, EmailDraft } from "@/types";

interface Phase2EmailProps {
  scopeEvent: ScopeEvent | null;
}

export function Phase2Email({ scopeEvent }: Phase2EmailProps) {
  const [clientName, setClientName] = useState("");
  const [hourlyRate, setHourlyRate] = useState(75);
  const [extraHours, setExtraHours] = useState(0);
  const [extraCost, setExtraCost] = useState(0);
  const [drafting, setDrafting] = useState(false);
  const [emailDraft, setEmailDraft] = useState<EmailDraft | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"preview" | "markdown">("preview");
  const toast = useToast();

  useEffect(() => {
    if (scopeEvent) {
      const hrs = scopeEvent.extra_hours || 0;
      setExtraHours(hrs);
      setExtraCost(hrs * hourlyRate);
      setEmailDraft(null);
    }
  }, [scopeEvent, hourlyRate]);

  // Recalculate cost when hours or rate changes
  const handleHoursChange = (hrs: number) => {
    setExtraHours(hrs);
    setExtraCost(hrs * hourlyRate);
  };

  const handleRateChange = (rate: number) => {
    setHourlyRate(rate);
    setExtraCost(extraHours * rate);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scopeEvent || drafting) return;

    setDrafting(true);
    try {
      const data = await draftEmailApi.draft({
        scopeEventId: scopeEvent.id,
        extraHours: Number(extraHours),
        extraCost: Number(extraCost),
        clientName: clientName.trim() || "Client",
      });

      setEmailDraft({
        subject: data.subject,
        body: data.body,
      });

      toast.success(
        "Email Response Drafted!",
        "Polite pushback email created with Change Order & Timeline deferral options."
      );
    } catch (err: any) {
      toast.error("Draft generation failed", err.message);
    } finally {
      setDrafting(false);
    }
  };

  const copyToClipboard = () => {
    if (!emailDraft) return;
    const fullText = `Subject: ${emailDraft.subject}\n\n${emailDraft.body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.info("Copied to Clipboard!", "Paste directly into your email client.");
    setTimeout(() => setCopied(false), 2500);
  };

  const canDraft = scopeEvent && scopeEvent.verdict === "out_of_scope";

  return (
    <DashboardCard
      title="Generate Professional Pushback Email"
      description="Draft a calm, collaborative response giving the client two clear choices: a Change Order or timeline deferral."
      icon={Mail}
      action={<Badge tone="brand">Phase 2 — Step 3</Badge>}
    >
      {!canDraft ? (
        <EmptyState
          icon={Mail}
          title="Scope Analysis Required"
          description="Perform a scope check above that yields an 'Out of Scope' verdict to generate a pushback response email."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          {/* Form & Controls */}
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 space-y-1">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                Flagged Out-of-Scope Request
              </span>
              <p className="text-xs text-rose-200 italic truncate">
                "{scopeEvent.request_text}"
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Client Name / Organization
              </label>
              <input
                type="text"
                placeholder="e.g. Sarah / Acme Corp"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="input-premium h-10 text-xs"
              />
            </div>

            {/* Hours & Hourly Rate */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Extra Hours</span>
                  <span className="font-mono text-indigo-400 text-[11px]">{extraHours}h</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={extraHours}
                  onChange={(e) => handleHoursChange(Number(e.target.value))}
                  className="input-premium h-10 font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Hourly Rate ($)</span>
                  <span className="font-mono text-indigo-400 text-[11px]">${hourlyRate}/h</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={hourlyRate}
                  onChange={(e) => handleRateChange(Number(e.target.value))}
                  className="input-premium h-10 font-mono text-xs"
                />
              </div>
            </div>

            {/* Calculated Total Card */}
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                  Change Order Quote Value
                </span>
                <span className="text-xl font-bold font-mono text-foreground">
                  ${extraCost.toLocaleString()}
                </span>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <span className="font-mono">{extraHours} hrs × ${hourlyRate}/hr</span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={drafting}
              className="h-11 w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
            >
              {drafting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Drafting Professional Pushback Email...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Pushback Response Email
                </>
              )}
            </Button>
          </form>

          {/* Email Preview Studio */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/60">
                <button
                  type="button"
                  onClick={() => setViewMode("preview")}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                    viewMode === "preview"
                      ? "bg-background text-foreground shadow-2xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Eye className="h-3 w-3" /> Preview
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("markdown")}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                    viewMode === "markdown"
                      ? "bg-background text-foreground shadow-2xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Code className="h-3 w-3" /> Raw Text
                </button>
              </div>

              {emailDraft && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="h-8 gap-1.5 text-xs rounded-lg border-border/60"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Email
                    </>
                  )}
                </Button>
              )}
            </div>

            {!emailDraft ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-6 text-center text-xs text-muted-foreground min-h-[260px] flex items-center justify-center">
                Configure rate/hours on left and click 'Generate Pushback Response Email' to preview.
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={viewMode}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-xs text-xs"
                >
                  <div className="border-b border-border/60 pb-2">
                    <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider block">
                      Subject Line
                    </span>
                    <span className="font-semibold text-foreground text-sm">
                      {emailDraft.subject}
                    </span>
                  </div>

                  {viewMode === "preview" ? (
                    <div className="space-y-3 leading-relaxed text-foreground font-sans max-h-[320px] overflow-y-auto pr-1 whitespace-pre-wrap">
                      {emailDraft.body}
                    </div>
                  ) : (
                    <textarea
                      readOnly
                      value={`Subject: ${emailDraft.subject}\n\n${emailDraft.body}`}
                      rows={12}
                      className="w-full bg-muted/30 rounded-xl p-3 font-mono text-[11px] leading-relaxed text-foreground border border-border outline-none resize-none"
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      )}
    </DashboardCard>
  );
}
