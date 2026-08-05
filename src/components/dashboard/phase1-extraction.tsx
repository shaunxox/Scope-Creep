"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Loader2,
  Check,
  ArrowRight,
  Layers3,
  Trash2,
  Download,
  Plus,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskSkeleton } from "@/components/ui/skeleton";
import { ExportModal } from "@/components/dashboard/export-modal";
import type { StagedTask } from "@/types";

interface Phase1ExtractionProps {
  extractedTasks: StagedTask[];
  savedTasks: StagedTask[];
  extracting: boolean;
  saving: boolean;
  loadingSaved: boolean;
  projectName: string;
  onExtract: (rawText: string) => Promise<void>;
  onUpdateTask: (index: number, key: keyof StagedTask, value: any) => void;
  onSaveTasks: () => Promise<void>;
  onClearExtracted: () => void;
}

export function Phase1Extraction({
  extractedTasks,
  savedTasks,
  extracting,
  saving,
  loadingSaved,
  projectName,
  onExtract,
  onUpdateTask,
  onSaveTasks,
  onClearExtracted,
}: Phase1ExtractionProps) {
  const [rawText, setRawText] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [isExportOpen, setIsExportOpen] = useState(false);

  const handleExtractSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim() || extracting) return;
    await onExtract(rawText);
  };

  const filteredSavedTasks = savedTasks.filter(
    (t) =>
      t.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.category.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.description.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      {/* Left Column: Extraction Input & Saved Tasks */}
      <div className="space-y-6">
        {/* Input Card */}
        <DashboardCard
          title="Requirement Extraction"
          description="Paste raw client messages, emails, PRDs, or meeting notes to extract structured tasks."
          icon={Sparkles}
          action={<Badge tone="brand">Phase 1 — Step 1</Badge>}
        >
          <form onSubmit={handleExtractSubmit} className="space-y-4">
            <textarea
              placeholder="Paste raw client communication here... (e.g. 'Hi team, can we also add a search bar, redesign the hero section, and export user reports to CSV?')"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={7}
              className="input-premium h-auto py-3 resize-y font-mono text-xs leading-relaxed"
            />
            <Button
              type="submit"
              disabled={extracting || !rawText.trim()}
              className="h-11 w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
            >
              {extracting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Analyzing & Extracting Tasks...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Extract Requirements
                </>
              )}
            </Button>
          </form>
        </DashboardCard>

        {/* Saved Tasks Card */}
        <DashboardCard
          title="Saved Project Tasks"
          description="Persisted requirements for this workspace."
          icon={Layers3}
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExportOpen(true)}
                disabled={savedTasks.length === 0}
                className="h-8 text-xs gap-1.5 rounded-lg border-border/60"
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
              <Badge tone={savedTasks.length > 0 ? "success" : "neutral"}>
                {savedTasks.length} Saved
              </Badge>
            </div>
          }
        >
          <div className="space-y-3">
            {savedTasks.length > 0 && (
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter saved tasks by title, category..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="input-premium h-9 text-xs pl-8"
                />
              </div>
            )}

            {loadingSaved ? (
              <div className="space-y-3">
                <TaskSkeleton />
                <TaskSkeleton />
              </div>
            ) : savedTasks.length === 0 ? (
              <EmptyState
                icon={Layers3}
                title="No saved tasks"
                description="Extract requirements and approve them to persist tasks for this project."
              />
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                <AnimatePresence>
                  {filteredSavedTasks.map((t, idx) => (
                    <motion.div
                      key={t.id || idx}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="rounded-2xl border border-border bg-card p-4 space-y-2 transition-all hover:border-indigo-500/30 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-foreground leading-snug">
                          {t.title}
                        </h4>
                        <Badge
                          tone={
                            t.complexity === "high"
                              ? "danger"
                              : t.complexity === "medium"
                              ? "warning"
                              : "success"
                          }
                          size="sm"
                        >
                          {t.complexity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {t.description}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                        <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[10px]">
                          {t.category}
                        </span>
                        <span className="text-emerald-500 font-semibold flex items-center gap-1">
                          ✓ Staged
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </DashboardCard>
      </div>

      {/* Right Column: Interactive Review Queue */}
      <DashboardCard
        title="Extraction Review Queue"
        description="Review, edit complexity/category, and approve AI-extracted tasks before saving."
        icon={Check}
        action={
          extractedTasks.length > 0 ? (
            <Badge tone="brand">{extractedTasks.length} Pending Review</Badge>
          ) : (
            <Badge tone="neutral">Queue Empty</Badge>
          )
        }
      >
        {extractedTasks.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Review Queue is Empty"
            description="Paste raw client text on the left and click 'Extract Requirements' to populate candidate tasks."
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Review & Edit Candidates
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearExtracted}
                className="h-8 text-xs text-rose-500 hover:bg-rose-500/10"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Clear All
              </Button>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              <AnimatePresence>
                {extractedTasks.map((task, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-xs hover:border-indigo-500/40 transition-colors"
                  >
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Task Title
                      </label>
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => onUpdateTask(idx, "title", e.target.value)}
                        className="input-premium h-9 font-semibold text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Description
                      </label>
                      <textarea
                        value={task.description}
                        onChange={(e) =>
                          onUpdateTask(idx, "description", e.target.value)
                        }
                        rows={2}
                        className="input-premium h-auto py-2 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Complexity
                        </label>
                        <select
                          value={task.complexity}
                          onChange={(e) =>
                            onUpdateTask(
                              idx,
                              "complexity",
                              e.target.value as StagedTask["complexity"]
                            )
                          }
                          className="input-premium h-9 text-xs"
                        >
                          <option value="low">Low Effort</option>
                          <option value="medium">Medium Effort</option>
                          <option value="high">High Effort</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Category
                        </label>
                        <input
                          type="text"
                          value={task.category}
                          onChange={(e) =>
                            onUpdateTask(idx, "category", e.target.value)
                          }
                          className="input-premium h-9 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <Button
              onClick={onSaveTasks}
              disabled={saving || extractedTasks.length === 0}
              className="h-11 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Approve & Save {extractedTasks.length} Tasks to Database
            </Button>
          </div>
        )}
      </DashboardCard>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        tasks={savedTasks}
        projectName={projectName}
      />
    </div>
  );
}
