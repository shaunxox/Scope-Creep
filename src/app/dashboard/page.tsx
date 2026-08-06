"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/layout/navbar";
import { ProjectSelector } from "@/components/projects/project-selector";
import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics";
import { WorkflowTracker } from "@/components/dashboard/workflow-tracker";
import { Phase1Extraction } from "@/components/dashboard/phase1-extraction";
import { Phase2Baseline } from "@/components/dashboard/phase2-baseline";
import { Phase2ScopeCheck } from "@/components/dashboard/phase2-scope-check";
import { Phase2Email } from "@/components/dashboard/phase2-email";
import { CommandMenu } from "@/components/ui/command-menu";
import { useProjects } from "@/hooks/use-projects";
import { useStagedTasks } from "@/hooks/use-staged-tasks";
import { useBaseline } from "@/hooks/use-baseline";
import { CardSkeleton } from "@/components/ui/skeleton";
import type { ActiveTab, ScopeEvent } from "@/types";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("phase1");
  const [currentScopeEvent, setCurrentScopeEvent] = useState<ScopeEvent | null>(
    null
  );
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  // Custom Hooks
  const {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    selectedProject,
    loading: loadingProjects,
    creating: creatingProject,
    createProject,
  } = useProjects();

  const {
    savedTasks,
    extractedTasks,
    extracting,
    saving: savingTasks,
    loading: loadingTasks,
    extractTasks,
    updateExtractedTask,
    saveTasks,
    clearExtracted,
  } = useStagedTasks(selectedProjectId);

  const {
    baselineItems,
    loading: loadingBaseline,
    saving: savingBaseline,
    establishBaseline,
  } = useBaseline(selectedProjectId);

  // Authenticate user session
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.push("/login");
        return;
      }

      setUser(user);
      setLoadingUser(false);
    }

    checkAuth();
  }, [router, supabase]);

  if (loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <CardSkeleton />
          <p className="text-xs text-muted-foreground animate-pulse font-mono">
            Loading secure workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Sticky Navbar */}
      <Navbar
        userEmail={user?.email}
        selectedProject={selectedProject}
        onOpenCommandMenu={() => setIsCommandMenuOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Project Workspace Selector */}
        <ProjectSelector
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          onCreateProject={createProject}
          loading={loadingProjects}
          creating={creatingProject}
        />

        {/* Project Active Workspace View */}
        {selectedProjectId ? (
          <div className="space-y-6">
            {/* Informative KPI Metrics Dashboard */}
            <DashboardMetrics
              savedTasks={savedTasks}
              baselineItems={baselineItems}
              currentScopeEvent={currentScopeEvent}
            />

            {/* Step & Phase Progress Tracker */}
            <WorkflowTracker
              activeTab={activeTab}
              onTabChange={setActiveTab}
              hasBaseline={baselineItems.length > 0}
              hasTasks={savedTasks.length > 0 || extractedTasks.length > 0}
            />

            {/* Tab Views with Framer Motion Layout Animation */}
            <AnimatePresence mode="wait">
              {activeTab === "phase1" && (
                <motion.div
                  key="phase1"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Phase1Extraction
                    extractedTasks={extractedTasks}
                    savedTasks={savedTasks}
                    extracting={extracting}
                    saving={savingTasks}
                    loadingSaved={loadingTasks}
                    projectName={selectedProject?.name || "Project"}
                    onExtract={extractTasks}
                    onUpdateTask={updateExtractedTask}
                    onSaveTasks={saveTasks}
                    onClearExtracted={clearExtracted}
                  />
                </motion.div>
              )}

              {activeTab === "phase2" && (
                <motion.div
                  key="phase2"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <Phase2Baseline
                    baselineItems={baselineItems}
                    loading={loadingBaseline}
                    saving={savingBaseline}
                    onEstablishBaseline={establishBaseline}
                  />

                  <Phase2ScopeCheck
                    projectId={selectedProjectId}
                    hasBaseline={baselineItems.length > 0}
                    onScopeEventCreated={setCurrentScopeEvent}
                    currentScopeEvent={currentScopeEvent}
                  />

                  <Phase2Email scopeEvent={currentScopeEvent} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : null}
      </main>

      {/* Command Palette (Cmd+K) */}
      <CommandMenu
        isOpen={isCommandMenuOpen}
        onClose={() => setIsCommandMenuOpen(false)}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        onTabChange={setActiveTab}
        onCreateProjectClick={() => {
          document.getElementById("project-create-input")?.focus();
        }}
      />
    </div>
  );
}
