"use client";

import { useState, useEffect, useCallback } from "react";
import { projectsApi } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import type { Project } from "@/types";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const toast = useToast();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await projectsApi.list();
      setProjects(data.projects || []);
      if (data.projects && data.projects.length > 0) {
        setSelectedProjectId((prev) => prev || data.projects[0].id);
      }
    } catch (err: any) {
      toast.error("Failed to load projects", err.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (name: string) => {
    if (!name.trim()) return null;
    setCreating(true);
    try {
      const data = await projectsApi.create(name);
      toast.success("Project created", `"${data.project.name}" is ready.`);
      setProjects((prev) => [data.project, ...prev]);
      setSelectedProjectId(data.project.id);
      return data.project;
    } catch (err: any) {
      toast.error("Failed to create project", err.message);
      return null;
    } finally {
      setCreating(false);
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || null;

  return {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    selectedProject,
    loading,
    creating,
    fetchProjects,
    createProject,
  };
}
