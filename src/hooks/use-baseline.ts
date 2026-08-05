"use client";

import { useState, useEffect, useCallback } from "react";
import { baselineApi } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import type { BaselineItem } from "@/types";

export function useBaseline(projectId: string | null) {
  const [baselineItems, setBaselineItems] = useState<BaselineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const supabase = createClient();

  const fetchBaseline = useCallback(async () => {
    if (!projectId) {
      setBaselineItems([]);
      return;
    }
    setLoading(true);
    try {
      // Query the actual baseline_items table (fixing Bug #2)
      const { data, error } = await supabase
        .from("baseline_items")
        .select("*")
        .eq("project_id", projectId)
        .order("id", { ascending: true });

      if (error) {
        throw error;
      }
      setBaselineItems(data || []);
    } catch (err: any) {
      toast.error("Failed to load baseline", err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, supabase, toast]);

  useEffect(() => {
    fetchBaseline();
  }, [fetchBaseline]);

  const establishBaseline = async (sourceText: string) => {
    if (!projectId || !sourceText.trim()) return;
    setSaving(true);
    try {
      const data = await baselineApi.create(projectId, sourceText);
      toast.success(
        "Baseline established",
        `Structured ${data.items?.length || 0} baseline deliverables.`
      );
      setBaselineItems(data.items || []);
    } catch (err: any) {
      toast.error("Baseline creation failed", err.message);
    } finally {
      setSaving(false);
    }
  };

  return {
    baselineItems,
    loading,
    saving,
    establishBaseline,
    refreshBaseline: fetchBaseline,
  };
}
