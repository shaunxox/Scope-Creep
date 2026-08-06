"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, FileText, Kanban, X, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportManager } from "@/lib/exportServices";
import { useToast } from "@/components/ui/toast";
import type { StagedTask } from "@/types";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: StagedTask[];
  projectName: string;
}

export function ExportModal({
  isOpen,
  onClose,
  tasks,
  projectName,
}: ExportModalProps) {
  const [activeService, setActiveService] = useState<string>("csv");
  const [exporting, setExporting] = useState(false);
  const [trelloKey, setTrelloKey] = useState("");
  const [trelloToken, setTrelloToken] = useState("");
  const [trelloBoardName, setTrelloBoardName] = useState("");
  const toast = useToast();

  if (!isOpen) return null;

  const handleExport = async () => {
    if (tasks.length === 0) {
      toast.warning("No tasks to export", "Please extract or save tasks first.");
      return;
    }

    setExporting(true);
    try {
      const result = await exportManager.triggerExport(activeService, tasks as any, {
        projectName,
        trelloKey: trelloKey.trim(),
        trelloToken: trelloToken.trim(),
        newBoardName: trelloBoardName.trim() || `${projectName} Tasks`,
      });

      if (activeService === "trello" && result?.boardUrl) {
        toast.success("Trello Export Successful!", "Board created. Opening Trello...");
        window.open(result.boardUrl, "_blank");
      } else if (activeService === "pdf") {
        toast.success("Print Preview Opened", "Save as PDF from print dialog.");
      } else {
        toast.success("CSV File Exported", "Download started automatically.");
      }
      onClose();
    } catch (err: any) {
      toast.error("Export Failed", err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-background/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg rounded-3xl border border-border bg-card shadow-2xl p-6 overflow-hidden z-10 space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Export Deliverables
                </h3>
                <p className="text-xs text-muted-foreground">
                  Export {tasks.length} tasks from <span className="font-semibold text-foreground">{projectName}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Service Selector */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "csv", name: "CSV File", icon: Download, desc: "Excel & Sheets" },
              { id: "pdf", name: "PDF Report", icon: FileText, desc: "Print preview" },
              { id: "trello", name: "Trello Board", icon: Kanban, desc: "REST Sync" },
            ].map((srv) => {
              const Icon = srv.icon;
              const isSelected = activeService === srv.id;
              return (
                <button
                  key={srv.id}
                  onClick={() => setActiveService(srv.id)}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border text-center transition-all ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-500/10 text-indigo-500 font-semibold shadow-xs"
                      : "border-border/60 bg-muted/20 hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5 mb-1.5" />
                  <span className="text-xs">{srv.name}</span>
                  <span className="text-[10px] text-muted-foreground">{srv.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Trello Extra Fields */}
          {activeService === "trello" && (
            <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-4 animate-fade-in-up text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Trello API Key</label>
                <input
                  type="text"
                  placeholder="Paste Trello Key"
                  value={trelloKey}
                  onChange={(e) => setTrelloKey(e.target.value)}
                  className="input-premium h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Trello Token</label>
                <input
                  type="password"
                  placeholder="Paste Trello Token"
                  value={trelloToken}
                  onChange={(e) => setTrelloToken(e.target.value)}
                  className="input-premium h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">New Board Name</label>
                <input
                  type="text"
                  placeholder={`${projectName} Deliverables`}
                  value={trelloBoardName}
                  onChange={(e) => setTrelloBoardName(e.target.value)}
                  className="input-premium h-9 text-xs"
                />
              </div>
            </div>
          )}

          {/* Action */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={exporting || tasks.length === 0}
              className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Export Now
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
