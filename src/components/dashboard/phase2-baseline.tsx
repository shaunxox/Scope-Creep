"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Search,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CardSkeleton } from "@/components/ui/skeleton";
import type { BaselineItem } from "@/types";

interface Phase2BaselineProps {
  baselineItems: BaselineItem[];
  loading: boolean;
  saving: boolean;
  onEstablishBaseline: (sourceText: string) => Promise<void>;
}

const PRESETS = [
  {
    label: "SaaS Web App MVP",
    text: `Agreed Deliverables:
1. User Authentication System (Email/Password, Session Cookies)
   - Exclusions: 3rd party OAuth (Google/GitHub), 2FA/MFA hardware keys.
   - Assumptions: Supabase Auth will be used as the auth provider.

2. Interactive Dashboard & Workspace Management
   - Exclusions: Multi-tenant subdomains, custom domain mapping.
   - Assumptions: Max 5 workspaces per user.

3. Core Data Processing Pipeline & CSV Export
   - Exclusions: Real-time WebSocket streaming, PDF document generation.
   - Assumptions: Data exports limited to 10,000 records per request.`,
  },
  {
    label: "E-Commerce Redesign SOW",
    text: `Agreed Deliverables:
1. Custom Storefront Layout & Product Gallery Page
   - Exclusions: 3D AR product preview models.
   - Assumptions: Client provides high-res PNG/JPG product assets.

2. Stripe Checkout Integration & Order Confirmation Page
   - Exclusions: Crypto/Web3 payments, manual wire transfer workflows.
   - Assumptions: Standard Stripe account credentials provided by client.`,
  },
];

export function Phase2Baseline({
  baselineItems,
  loading,
  saving,
  onEstablishBaseline,
}: Phase2BaselineProps) {
  const [sowText, setSowText] = useState("");
  const [filterQuery, setFilterQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sowText.trim() || saving) return;
    await onEstablishBaseline(sowText);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredItems = baselineItems.filter(
    (item) =>
      item.deliverable.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (item.exclusions && item.exclusions.toLowerCase().includes(filterQuery.toLowerCase())) ||
      (item.assumptions && item.assumptions.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      {/* SOW Baseline Input Form */}
      <DashboardCard
        title="Establish SOW Baseline"
        description="Paste your agreed Statement of Work, project proposal, or contract text. Gemini will structure explicit deliverables, boundaries, and assumptions into a locked baseline."
        icon={FileText}
        action={<Badge tone="brand">Phase 2 — Step 1</Badge>}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              1-Click SOW Templates / Presets
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setSowText(preset.text)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Sparkles className="h-3 w-3 text-indigo-500" />
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            placeholder="Paste your SOW or contract text here... (or click a template above)"
            value={sowText}
            onChange={(e) => setSowText(e.target.value)}
            rows={9}
            className="input-premium h-auto py-3 resize-y font-mono text-xs leading-relaxed"
          />

          <Button
            type="submit"
            disabled={saving || !sowText.trim()}
            className="h-11 w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Structuring SOW & Saving Baseline...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Establish & Lock Baseline
              </>
            )}
          </Button>
        </form>
      </DashboardCard>

      {/* Structured Baseline Display */}
      <DashboardCard
        title="Agreed Baseline Deliverables"
        description="Reference deliverables, boundaries, and client assumptions stored in the database."
        icon={CheckCircle2}
        action={
          <Badge tone={baselineItems.length > 0 ? "success" : "warning"}>
            {baselineItems.length} Deliverables
          </Badge>
        }
      >
        <div className="space-y-3">
          {baselineItems.length > 0 && (
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search deliverables, exclusions, assumptions..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="input-premium h-9 text-xs pl-8"
              />
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : baselineItems.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No SOW Baseline Configured"
              description="Paste your Statement of Work on the left or select a template preset to set up explicit deliverables for scope comparison."
            />
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              <AnimatePresence>
                {filteredItems.map((item, idx) => {
                  const itemId = item.id || String(idx);
                  const isExpanded = expandedIds[itemId] ?? true;

                  return (
                    <motion.div
                      key={itemId}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="rounded-2xl border border-border bg-card p-4 space-y-2 shadow-xs hover:border-indigo-500/30 transition-colors"
                    >
                      <div
                        onClick={() => toggleExpand(itemId)}
                        className="flex items-start justify-between gap-2 cursor-pointer select-none"
                      >
                        <h4 className="text-xs font-bold text-foreground leading-snug flex items-center gap-2">
                          <span className="font-mono text-indigo-500 text-[11px]">
                            #{idx + 1}
                          </span>
                          {item.deliverable}
                        </h4>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge tone="success" size="sm">
                            Agreed
                          </Badge>
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="space-y-2 pt-1 border-t border-border/40">
                          {item.exclusions && (
                            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                              <span className="font-bold flex items-center gap-1 text-[10px] uppercase tracking-wider mb-0.5 text-rose-400">
                                <AlertCircle className="h-3 w-3" /> Explicit Exclusions
                              </span>
                              {item.exclusions}
                            </div>
                          )}

                          {item.assumptions && (
                            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-300">
                              <span className="font-bold text-[10px] uppercase tracking-wider mb-0.5 block text-amber-400">
                                Assumptions & Dependencies
                              </span>
                              {item.assumptions}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </DashboardCard>
    </div>
  );
}
