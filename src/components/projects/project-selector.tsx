"use client";

import { useState } from "react";
import { Plus, Loader2, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Project } from "@/types";

interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string) => Promise<any>;
  loading: boolean;
  creating: boolean;
}

export function ProjectSelector({
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
  loading,
  creating,
}: ProjectSelectorProps) {
  const [newProjectName, setNewProjectName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const res = await onCreateProject(newProjectName.trim());
    if (res) setNewProjectName("");
  };

  return (
    <DashboardCard
      title="Workspace Setup"
      description="Select an existing project or create a new workspace to unlock extraction, baseline setup, and scope checking."
      icon={FolderKanban}
      action={
        <Badge tone={projects.length > 0 ? "success" : "warning"} dot>
          {loading
            ? "Loading..."
            : projects.length > 0
            ? `${projects.length} Projects`
            : "No Projects"}
        </Badge>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Active Project Dropdown */}
        <div className="space-y-2.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
            Active Project Workspace
          </label>
          {loading ? (
            <Skeleton className="h-12 w-full rounded-xl" />
          ) : projects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-xs text-muted-foreground text-center">
              No projects found. Create one below to begin.
            </div>
          ) : (
            <div className="relative">
              <select
                value={selectedProjectId}
                onChange={(e) => onSelectProject(e.target.value)}
                className="input-premium h-12 text-sm font-medium cursor-pointer appearance-none bg-card pr-10"
              >
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                ▼
              </div>
            </div>
          )}
        </div>

        {/* Create Project Form */}
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
            Create New Project
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Acme Redesign SOW"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="input-premium h-12 flex-1"
              required
            />
            <Button
              type="submit"
              disabled={creating || !newProjectName.trim()}
              className="h-12 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Create</span>
            </Button>
          </div>
        </form>
      </div>
    </DashboardCard>
  );
}
