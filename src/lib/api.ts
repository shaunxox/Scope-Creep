/**
 * Typed API client for all Scope Creep backend endpoints.
 * Centralizes error handling and request formatting.
 */

import type {
  Project,
  StagedTask,
  BaselineItem,
  ScopeEvent,
  EmailDraft,
} from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function request<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new ApiClientError(
      data?.error ?? `Request failed with status ${res.status}`,
      res.status,
    );
  }

  return data as T;
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export const projectsApi = {
  list: (): Promise<{ projects: Project[] }> =>
    request("/api/projects"),

  create: (name: string): Promise<{ project: Project }> =>
    request("/api/projects", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
};

// ─── Staged Tasks ─────────────────────────────────────────────────────────────

export const stagedTasksApi = {
  list: (projectId: string): Promise<{ tasks: StagedTask[] }> =>
    request(`/api/staged-tasks?projectId=${encodeURIComponent(projectId)}`),

  create: (
    projectId: string,
    tasks: StagedTask[],
  ): Promise<{ tasks: StagedTask[] }> =>
    request("/api/staged-tasks", {
      method: "POST",
      body: JSON.stringify({ projectId, tasks }),
    }),
};

// ─── Extraction ──────────────────────────────────────────────────────────────

export const extractApi = {
  extract: (rawText: string): Promise<{ tasks: StagedTask[] }> =>
    request("/api/extract", {
      method: "POST",
      body: JSON.stringify({ rawText }),
    }),
};

// ─── Baseline ─────────────────────────────────────────────────────────────────

export const baselineApi = {
  create: (
    projectId: string,
    sourceText: string,
  ): Promise<{ items: BaselineItem[] }> =>
    request("/api/baseline", {
      method: "POST",
      body: JSON.stringify({ projectId, sourceText }),
    }),
};

// ─── Scope Check ─────────────────────────────────────────────────────────────

export const scopeCheckApi = {
  check: (
    projectId: string,
    requestText: string,
  ): Promise<{ scopeEvent: ScopeEvent }> =>
    request("/api/scope-check", {
      method: "POST",
      body: JSON.stringify({ projectId, requestText }),
    }),
};

// ─── Draft Email ─────────────────────────────────────────────────────────────

export const draftEmailApi = {
  draft: (params: {
    scopeEventId: string;
    extraHours: number;
    extraCost: number;
    clientName?: string;
  }): Promise<EmailDraft & { email: string }> =>
    request("/api/draft-email", {
      method: "POST",
      body: JSON.stringify(params),
    }),
};

export { ApiClientError };
