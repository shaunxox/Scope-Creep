"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Sparkles,
  FileText,
  ShieldAlert,
  Mail,
  Plus,
  Moon,
  Sun,
  X,
  Layers3,
} from "lucide-react";
import { useTheme } from "next-themes";
import type { ActiveTab, Project } from "@/types";

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  onTabChange: (tab: ActiveTab) => void;
  onCreateProjectClick: () => void;
}

export function CommandMenu({
  isOpen,
  onClose,
  projects,
  selectedProjectId,
  onSelectProject,
  onTabChange,
  onCreateProjectClick,
}: CommandMenuProps) {
  const [query, setQuery] = useState("");
  const { theme, setTheme } = useTheme();

  // Escape & shortcut listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          setQuery("");
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-background/80 backdrop-blur-md"
        />

        {/* Command Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -8 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden z-10"
        >
          {/* Input Header */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Type a command or search projects... (ESC to close)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Command List */}
          <div className="max-h-[340px] overflow-y-auto p-2 space-y-3">
            {/* Quick Actions */}
            <div>
              <div className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Quick Navigation
              </div>
              <div className="space-y-0.5 mt-1">
                <button
                  onClick={() => {
                    onTabChange("phase1");
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs rounded-xl hover:bg-indigo-500/10 hover:text-indigo-500 text-foreground transition-colors text-left"
                >
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                  <span>Go to Phase 1: Task Extraction & Review</span>
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">P1</span>
                </button>

                <button
                  onClick={() => {
                    onTabChange("phase2");
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs rounded-xl hover:bg-indigo-500/10 hover:text-indigo-500 text-foreground transition-colors text-left"
                >
                  <FileText className="h-4 w-4 text-indigo-500" />
                  <span>Go to Phase 2: SOW Baseline & Scope Check</span>
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">P2</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div>
              <div className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Actions & Preferences
              </div>
              <div className="space-y-0.5 mt-1">
                <button
                  onClick={() => {
                    onCreateProjectClick();
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs rounded-xl hover:bg-muted text-foreground transition-colors text-left"
                >
                  <Plus className="h-4 w-4 text-emerald-500" />
                  <span>Create New Project Workspace</span>
                </button>

                <button
                  onClick={() => {
                    setTheme(theme === "dark" ? "light" : "dark");
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs rounded-xl hover:bg-muted text-foreground transition-colors text-left"
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4 text-amber-500" />
                  ) : (
                    <Moon className="h-4 w-4 text-indigo-400" />
                  )}
                  <span>Toggle Theme ({theme === "dark" ? "Light" : "Dark"})</span>
                </button>
              </div>
            </div>

            {/* Projects List */}
            {projects.length > 0 && (
              <div>
                <div className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Switch Workspace ({filteredProjects.length})
                </div>
                <div className="space-y-0.5 mt-1">
                  {filteredProjects.map((proj) => (
                    <button
                      key={proj.id}
                      onClick={() => {
                        onSelectProject(proj.id);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-xs rounded-xl transition-colors text-left ${
                        proj.id === selectedProjectId
                          ? "bg-indigo-600/10 text-indigo-500 font-semibold"
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <Layers3 className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{proj.name}</span>
                      {proj.id === selectedProjectId && (
                        <span className="ml-auto text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-md">
                          Active
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Shortcuts */}
          <div className="border-t border-border px-4 py-2 bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Linear Command Palette</span>
            <div className="flex items-center gap-2">
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded border border-border">↑↓</span> to navigate
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded border border-border">↵</span> to select
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
