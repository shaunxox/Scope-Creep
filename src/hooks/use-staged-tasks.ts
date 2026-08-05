"use client";

import { useState, useEffect, useCallback } from "react";
import { stagedTasksApi, extractApi } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import type { StagedTask } from "@/types";

export function useStagedTasks(projectId: string | null) {
  const [savedTasks, setSavedTasks] = useState<StagedTask[]>([]);
  const [extractedTasks, setExtractedTasks] = useState<StagedTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const fetchTasks = useCallback(async () => {
    if (!projectId) {
      setSavedTasks([]);
      return;
    }
    setLoading(true);
    try {
      const data = await stagedTasksApi.list(projectId);
      setSavedTasks(data.tasks || []);
    } catch (err: any) {
      toast.error("Failed to load saved tasks", err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  useEffect(() => {
    fetchTasks();
    setExtractedTasks([]);
  }, [fetchTasks]);

  const extractTasks = async (rawText: string) => {
    if (!rawText.trim()) return;
    setExtracting(true);
    try {
      const data = await extractApi.extract(rawText);
      setExtractedTasks(data.tasks || []);
      toast.success(
        "Requirements extracted",
        `Identified ${data.tasks?.length || 0} actionable tasks for review.`
      );
    } catch (err: any) {
      toast.error("Extraction failed", err.message);
    } finally {
      setExtracting(false);
    }
  };

  const updateExtractedTask = (
    index: number,
    key: keyof StagedTask,
    value: any
  ) => {
    setExtractedTasks((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const saveTasks = async () => {
    if (!projectId || extractedTasks.length === 0) return;
    setSaving(true);
    try {
      await stagedTasksApi.create(projectId, extractedTasks);
      toast.success("Tasks saved", "Approved tasks saved to database.");
      setExtractedTasks([]);
      fetchTasks();
    } catch (err: any) {
      toast.error("Failed to save tasks", err.message);
    } finally {
      setSaving(false);
    }
  };

  const clearExtracted = () => setExtractedTasks([]);

  return {
    savedTasks,
    extractedTasks,
    loading,
    extracting,
    saving,
    extractTasks,
    updateExtractedTask,
    saveTasks,
    clearExtracted,
    refreshTasks: fetchTasks,
  };
}
