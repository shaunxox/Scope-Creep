'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  AlertTriangle,
  FileText,
  Layers3,
  Loader2,
  LogOut,
  Mail,
  MessageSquareText,
  Plus,
  ShieldAlert,
  Sparkles,
  Users,
} from 'lucide-react'

interface Project {
  id: string
  name: string
  created_at: string
}

interface StagedTask {
  id?: string
  title: string
  description: string
  complexity: 'low' | 'medium' | 'high'
  category: string
  status?: string
}

interface BaselineItem {
  id: string
  deliverable: string
  exclusions: string | null
  assumptions: string | null
}

interface ScopeEvent {
  id: string
  request_text: string
  verdict: 'in_scope' | 'out_of_scope'
  discrepancy_note: string
  extra_hours: number
  extra_cost: number
  status: string
}


function DashboardCard({
  title,
  description,
  children,
  action,
  className = '',
}: {
  title: string
  description?: string
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
            {title}
          </h2>
          {description ? (
            <p className="text-sm leading-6 text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  )
}

function StatusBadge({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
  children: React.ReactNode
}) {
  const tones = {
    neutral: 'border-border bg-muted text-foreground',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    danger: 'border-rose-200 bg-rose-50 text-rose-700',
    info: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/25 px-6 py-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

function WorkflowStep({
  step,
  active,
  completed,
  isLast = false,
}: {
  step: string
  active?: boolean
  completed?: boolean
  isLast?: boolean
}) {
  const tone = active ? 'info' : completed ? 'success' : 'neutral'

  return (
    <div className="flex items-start gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 transition-colors duration-200 hover:border-ring/40">
        <StatusBadge tone={tone}>{completed ? 'Done' : active ? 'Current' : 'Next'}</StatusBadge>
        <span className="text-sm font-medium text-foreground">{step}</span>
      </div>
      {!isLast ? <ChevronRight className="mt-3 hidden h-4 w-4 shrink-0 text-muted-foreground lg:block" /> : null}
    </div>
  )
}
export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [newProjectName, setNewProjectName] = useState('')
  const [creatingProject, setCreatingProject] = useState(false)
  const [activeTab, setActiveTab] = useState<'phase1' | 'phase2'>('phase1')

  // Phase 1: Extraction & Staging States
  const [rawText, setRawText] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractedTasks, setExtractedTasks] = useState<StagedTask[]>([])
  const [savingTasks, setSavingTasks] = useState(false)
  const [savedTasks, setSavedTasks] = useState<StagedTask[]>([])
  const [loadingSavedTasks, setLoadingSavedTasks] = useState(false)

  // Phase 2: Baseline & Scope Creep States
  const [sowText, setSowText] = useState('')
  const [savingBaseline, setSavingBaseline] = useState(false)
  const [baselineItems, setBaselineItems] = useState<BaselineItem[]>([])
  const [loadingBaseline, setLoadingBaseline] = useState(false)
  const [clientRequestText, setClientRequestText] = useState('')
  const [checkingScope, setCheckingScope] = useState(false)
  const [scopeEvent, setScopeEvent] = useState<ScopeEvent | null>(null)
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null)
  
  // Negotiation states
  const [clientName, setClientName] = useState('')
  const [negotiationHours, setNegotiationHours] = useState(0)
  const [negotiationCost, setNegotiationCost] = useState(0)
  const [draftingEmail, setDraftingEmail] = useState(false)
  const [emailDraft, setEmailDraft] = useState<{ subject: string; body: string } | null>(null)
  
  const [copied, setCopied] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const router = useRouter()
  const supabase = createClient()

  const mapApprovedTaskToBaselineItem = (task: StagedTask): BaselineItem => ({
    id: task.id || `${task.title}-${task.category}`,
    deliverable: task.title,
    exclusions: null,
    assumptions: null,
  })
  const selectedProject = projects.find((project) => project.id === selectedProjectId)
  const reviewTasks = extractedTasks
  const comparisonCounts = comparisonResult
    ? {
        added: comparisonResult.added.length,
        modified: comparisonResult.modified.length,
        removed: comparisonResult.removed.length,
      }
    : null
  const workflowSteps = [
    'Extraction',
    'Review',
    'Baseline',
    'Scope Check',
    'Professional Email',
  ]

  // Verify auth session
  useEffect(() => {
    async function checkAuth() {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        router.push('/login')
        return
      }
      setUser(user)
      setLoadingUser(false)
      fetchProjects()
    }
    checkAuth()
  }, [])

  // Fetch saved tasks and baseline when selected project changes
  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setErrorMsg('')
    setTimeout(() => setSuccessMsg(''), 5000)
  }

  const showError = (msg: string) => {
    setErrorMsg(msg)
    setSuccessMsg('')
    setTimeout(() => setErrorMsg(''), 7000)
  }

  const fetchProjects = async () => {
    setLoadingProjects(true)
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      if (res.ok) {
        setProjects(data.projects || [])
        if (data.projects?.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data.projects[0].id)
        }
      } else {
        showError(data.error || 'Failed to fetch projects')
      }
    } catch (e: any) {
      showError(e.message)
    } finally {
      setLoadingProjects(false)
    }
  }

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim()) return
    setCreatingProject(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName })
      })
      const data = await res.json()
      if (res.ok) {
        showSuccess(`Project "${data.project.name}" created!`)
        setProjects([data.project, ...projects])
        setSelectedProjectId(data.project.id)
        setNewProjectName('')
      } else {
        showError(data.error || 'Failed to create project')
      }
    } catch (e: any) {
      showError(e.message)
    } finally {
      setCreatingProject(false)
    }
  }

  async function fetchSavedTasks() {
    if (!selectedProjectId) return
    setLoadingSavedTasks(true)
    try {
      const res = await fetch(`/api/staged-tasks?projectId=${selectedProjectId}`)
      const data = await res.json()
      if (res.ok) {
        setSavedTasks(data.tasks || [])
      } else {
        showError(data.error || 'Failed to fetch staged tasks')
      }
    } catch (e: any) {
      showError(e.message)
    } finally {
      setLoadingSavedTasks(false)
    }
  }

  async function fetchBaselineItems() {
    if (!selectedProjectId) return
    setLoadingBaseline(true)
    try {
      // Approved tasks are stored in staged_tasks after Phase 1 save.
      const { data, error } = await supabase
        .from('staged_tasks')
        .select('*')
        .eq('project_id', selectedProjectId)
        .order('id', { ascending: true })
      if (error) {
        showError(error.message)
      } else {
        setBaselineItems((data || []).map(mapApprovedTaskToBaselineItem))
      }
    } catch (e: any) {
      showError(e.message)
    } finally {
      setLoadingBaseline(false)
    }
  }

  useEffect(() => {
    if (!selectedProjectId) return

    const timeout = window.setTimeout(() => {
      fetchSavedTasks()
      fetchBaselineItems()
      // reset states
      setExtractedTasks([])
      setComparisonResult(null)
      setScopeEvent(null)
      setEmailDraft(null)
      setErrorMsg('')
      setSuccessMsg('')
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [selectedProjectId])

  const handleSignOut = async () => {
    await fetch('/auth/signout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  // Phase 1 actions
  const extractTasks = async () => {
    if (!rawText.trim()) return
    setExtracting(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText })
      })
      const data = await res.json()
      if (res.ok) {
        setExtractedTasks(data.tasks || [])
        showSuccess(`Extracted ${data.tasks?.length || 0} candidate tasks!`)
      } else {
        showError(data.error || 'Extraction failed')
      }
    } catch (e: any) {
      showError(e.message)
    } finally {
      setExtracting(false)
    }
  }

  const updateExtractedTask = (index: number, key: keyof StagedTask, value: string) => {
    const updated = [...extractedTasks]
    updated[index] = { ...updated[index], [key]: value }
    setExtractedTasks(updated)
  }

  const runScopeCheck = () => {
    setCheckingScope(true)

    const normalizeTitle = (value: string) => value.trim().toLowerCase()

    if (baselineItems.length === 0) {
      setComparisonResult({
        added: [],
        modified: [],
        removed: [],
        message: 'No baseline available',
      })
      setCheckingScope(false)
      return
    }

    if (reviewTasks.length === 0) {
      setComparisonResult({
        added: [],
        modified: [],
        removed: [],
        message: 'No comparison available',
      })
      setCheckingScope(false)
      return
    }

    const baselineByTitle = new Map(
      baselineItems.map((item) => [normalizeTitle(item.deliverable), item] as const)
    )
    const extractedByTitle = new Map(
      reviewTasks.map((task) => [normalizeTitle(task.title), task] as const)
    )

    const added = reviewTasks.filter((task) => !baselineByTitle.has(normalizeTitle(task.title)))
    const removed = baselineItems.filter(
      (item) => !extractedByTitle.has(normalizeTitle(item.deliverable))
    )
    const modified = reviewTasks.flatMap((task) => {
      const baseline = baselineByTitle.get(normalizeTitle(task.title))
      if (!baseline || baseline.deliverable.trim() === task.title.trim()) {
        return []
      }

      return [{ baseline, task }]
    })

    setComparisonResult({
      added,
      modified,
      removed,
      message: null,
    })

    setCheckingScope(false)
  }

  const saveStagedTasks = async () => {
    if (extractedTasks.length === 0 || !selectedProjectId) return
    setSavingTasks(true)
    try {
      const res = await fetch('/api/staged-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          tasks: extractedTasks
        })
      })
      const data = await res.json()
      if (res.ok) {
        showSuccess('Staged tasks saved successfully!')
        setExtractedTasks([])
        fetchSavedTasks()
        fetchBaselineItems()
      } else {
        showError(data.error || 'Failed to save tasks')
      }
    } catch (e: any) {
      showError(e.message)
    } finally {
      setSavingTasks(false)
    }
  }

  // Phase 2 actions
  const saveBaseline = async () => {
    if (!sowText.trim() || !selectedProjectId) return
    setSavingBaseline(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/baseline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          sourceText: sowText
        })
      })
      const data = await res.json()
      if (res.ok) {
        showSuccess('Baseline structured and saved to DB!')
        setSowText('')
        fetchBaselineItems()
      } else {
        showError(data.error || 'Failed to structure baseline')
      }
    } catch (e: any) {
      showError(e.message)
    } finally {
      setSavingBaseline(false)
    }
  }

  const generateDraft = async () => {
    if (!scopeEvent || !selectedProjectId) return
    setDraftingEmail(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/draft-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scopeEventId: scopeEvent.id,
          extraHours: negotiationHours,
          extraCost: negotiationCost,
          clientName
        })
      })
      const data = await res.json()
      if (res.ok) {
        setEmailDraft({
          subject: data.subject,
          body: data.body
        })
        showSuccess('Pushback email drafted successfully!')
      } else {
        showError(data.error || 'Email drafting failed')
      }
    } catch (e: any) {
      showError(e.message)
    } finally {
      setDraftingEmail(false)
    }
  }

  const copyToClipboard = () => {
    if (!emailDraft) return
    const text = `Subject: ${emailDraft.subject}\n\n${emailDraft.body}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const renderEmptyProjectState = () => (
    <EmptyState
      icon={Layers3}
      title="No project selected"
      description="Create a project or choose an existing workspace to unlock extraction, baseline setup, and scope checking."
      action={
        <Button
          type="button"
          onClick={() => document.getElementById('project-create-input')?.focus()}
          className="h-10 rounded-xl bg-foreground px-4 text-sm text-background hover:bg-zinc-800"
        >
          Create Project
        </Button>
      }
    />
  )

  const renderLoadingState = (label: string) => (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
      <span>{label}</span>
    </div>
  )

  if (loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl border border-border bg-card px-8 py-10 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted text-indigo-600">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <p className="text-sm font-medium text-foreground">Verifying session</p>
          <p className="text-sm text-muted-foreground">Loading your workspace securely.</p>
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-primary text-primary-foreground shadow-sm">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight text-foreground">
                Scope Creep
              </p>
              <p className="text-sm text-muted-foreground">
                AI Scope Management Middleware
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <div className="rounded-2xl border border-border bg-muted/40 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Current Project
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {selectedProject?.name || 'No project selected'}
              </p>
            </div>

            <StatusBadge tone={selectedProject ? 'success' : 'warning'}>
              {selectedProject ? 'Workspace ready' : 'Select a project'}
            </StatusBadge>

            <div className="rounded-full border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
              {user?.email}
            </div>

            <Button
              type="button"
              onClick={handleSignOut}
              className="h-10 rounded-xl bg-foreground px-4 text-sm text-background hover:bg-zinc-800"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {successMsg && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <DashboardCard
          title="Workspace header"
          description="Choose a project, create a new workspace, and keep the current scope context visible."
          action={<StatusBadge tone={projects.length > 0 ? 'success' : 'warning'}>{projects.length > 0 ? 'Projects loaded' : 'No projects yet'}</StatusBadge>}
        >
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Active Workspace
              </label>
              {loadingProjects ? (
                renderLoadingState('Loading projects...')
              ) : projects.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No projects found"
                  description="Create your first project to start extracting tasks, saving a baseline, and checking scope."
                />
              ) : (
                <div className="rounded-2xl border border-border bg-background p-3">
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                  >
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <form onSubmit={createProject} className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground block">
                New Project
              </label>
              <input
                id="project-create-input"
                type="text"
                placeholder="Project name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                required
              />
              <Button
                type="submit"
                disabled={creatingProject}
                className="h-12 w-full rounded-xl bg-foreground text-background hover:bg-zinc-800"
              >
                {creatingProject ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create Project
              </Button>
            </form>
          </div>
        </DashboardCard>

        {selectedProjectId ? (
          <div className="space-y-6">
            <DashboardCard
              title="Workflow"
              description="A simple, connected sequence that shows exactly where you are in the scope-management flow."
              action={
                <div className="flex items-center gap-2">
                  <StatusBadge tone={activeTab === 'phase1' ? 'info' : 'success'}>
                    {activeTab === 'phase1' ? 'Phase 1 workspace' : 'Phase 2 workspace'}
                  </StatusBadge>
                </div>
              }
            >
              <div className="grid gap-3 lg:grid-cols-5">
                {workflowSteps.map((step, index) => (
                  <WorkflowStep
                    key={step}
                    step={step}
                    active={(activeTab === 'phase1' && index < 2) || (activeTab === 'phase2' && index >= 2)}
                    completed={activeTab === 'phase2' && index < 2}
                    isLast={index === workflowSteps.length - 1}
                  />
                ))}
              </div>
            </DashboardCard>

            <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <button
                onClick={() => setActiveTab('phase1')}
                className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 ${
                  activeTab === 'phase1'
                    ? 'bg-foreground text-background'
                    : 'bg-background text-muted-foreground hover:text-foreground'
                }`}
              >
                <MessageSquareText className="h-4 w-4" />
                Phase 1: Extraction & Review
              </button>
              <button
                onClick={() => setActiveTab('phase2')}
                className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 ${
                  activeTab === 'phase2'
                    ? 'bg-foreground text-background'
                    : 'bg-background text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="h-4 w-4" />
                Phase 2: Baseline, Scope Check & Email
              </button>
            </div>

            {activeTab === 'phase1' && (
              <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
                <div className="space-y-6">
                  <DashboardCard
                    title="Requirement Extraction"
                    description="Paste client requirements or upload a document to extract structured tasks."
                    action={<StatusBadge tone="info">Extraction workspace</StatusBadge>}
                  >
                    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-border bg-muted/20 px-4 py-4 text-sm leading-6 text-muted-foreground">
                          Paste a client email, PRD, meeting note, or requirement document. The extraction flow will turn the request into structured tasks for review.
                        </div>
                        <textarea
                          placeholder="Paste client email, PRD, meeting notes or requirement document..."
                          value={rawText}
                          onChange={(e) => setRawText(e.target.value)}
                          rows={9}
                          className="min-h-[260px] w-full resize-y rounded-2xl border border-border bg-background p-4 text-sm leading-7 text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                        />
                        <Button
                          type="button"
                          onClick={extractTasks}
                          disabled={extracting || !rawText.trim()}
                          className="h-12 w-full rounded-xl bg-foreground text-background hover:bg-zinc-800"
                        >
                          {extracting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Analyzing & Extracting...
                            </>
                          ) : (
                            <>
                              <ArrowRight className="h-4 w-4" />
                              Extract Requirements
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="space-y-4 rounded-2xl border border-border bg-background p-4">
                        <div className="flex items-center gap-2">
                          <MessageSquareText className="h-4 w-4 text-indigo-600" />
                          <h3 className="text-sm font-semibold text-foreground">What gets extracted</h3>
                        </div>
                        <div className="space-y-3 text-sm leading-6 text-muted-foreground">
                          <div className="rounded-xl border border-border bg-muted/20 px-3 py-3">
                            Deliverables, action items, and clear follow-up work
                          </div>
                          <div className="rounded-xl border border-border bg-muted/20 px-3 py-3">
                            Complex tasks split into readable review cards
                          </div>
                          <div className="rounded-xl border border-border bg-muted/20 px-3 py-3">
                            Existing task status and complexity preserved when available
                          </div>
                        </div>
                        <div className="rounded-xl border border-dashed border-border bg-muted/15 px-3 py-3 text-sm text-muted-foreground">
                          Structured output remains reviewable before anything is saved.
                        </div>
                      </div>
                    </div>
                  </DashboardCard>

                  <DashboardCard
                    title="Extraction Results"
                    description="Review structured tasks extracted for the current project."
                    action={<StatusBadge tone={savedTasks.length > 0 ? 'success' : 'neutral'}>{savedTasks.length} saved</StatusBadge>}
                  >
                    {loadingSavedTasks ? (
                      renderLoadingState('Retrieving tasks...')
                    ) : savedTasks.length === 0 ? (
                      <EmptyState
                        icon={Layers3}
                        title="No requirements extracted"
                        description="Paste requirements and click Extract to begin."
                      />
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 max-h-[520px] overflow-y-auto pr-1">
                        {savedTasks.map((t, idx) => (
                          <article key={idx} className="rounded-2xl border border-border bg-background p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-ring/40 hover:shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 space-y-1">
                                <h3 className="truncate text-sm font-semibold text-foreground">{t.title}</h3>
                                <p className="text-sm leading-6 text-muted-foreground">{t.description}</p>
                              </div>
                              <div className="flex shrink-0 flex-col items-end gap-2">
                                <StatusBadge
                                  tone={t.complexity === 'high' ? 'danger' : t.complexity === 'medium' ? 'warning' : 'success'}
                                >
                                  {t.complexity}
                                </StatusBadge>
                                {t.status ? <StatusBadge tone="info">{t.status}</StatusBadge> : null}
                              </div>
                            </div>
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
                              <span className="rounded-full border border-border bg-muted px-2.5 py-1">
                                {t.category}
                              </span>
                              <span className="inline-flex items-center gap-1 text-indigo-700">
                                <Check className="h-3.5 w-3.5" />
                                Staged
                              </span>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </DashboardCard>
                </div>

                <DashboardCard
                  title="Review panel"
                  description="Review, refine, and approve extracted tasks before saving them to the database."
                  action={
                    reviewTasks.length > 0 ? (
                      <StatusBadge tone="info">{reviewTasks.length} candidates</StatusBadge>
                    ) : (
                      <StatusBadge tone="neutral">Empty</StatusBadge>
                    )
                  }
                  className="h-full"
                >
                  {reviewTasks.length === 0 ? (
                    <EmptyState
                      icon={MessageSquareText}
                      title="No requirements extracted"
                      description="Paste requirements and click Extract to begin."
                    />
                  ) : (
                    <div className="flex h-full min-h-[640px] flex-col gap-5">
                      <div className="rounded-2xl border border-border bg-muted/20 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">Task review queue</p>
                            <p className="text-sm text-muted-foreground">
                              Each extracted item can be reviewed, edited, and approved before saving.
                            </p>
                          </div>
                          <StatusBadge tone="info">{reviewTasks.length} tasks</StatusBadge>
                        </div>
                      </div>

                      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                        {reviewTasks.map((task, idx) => (
                          <article key={idx} className="rounded-2xl border border-border bg-card p-4 transition-colors duration-200 hover:border-ring/40 sm:p-5">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div className="min-w-0 flex-1 space-y-3">
                                <div className="space-y-1.5">
                                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                    Task Title
                                  </label>
                                  <input
                                    type="text"
                                    value={task.title}
                                    onChange={(e) => updateExtractedTask(idx, 'title', e.target.value)}
                                    className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                                  />
                                </div>

                                <div className="space-y-1.5">
                                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                    Description
                                  </label>
                                  <textarea
                                    value={task.description}
                                    onChange={(e) => updateExtractedTask(idx, 'description', e.target.value)}
                                    rows={4}
                                    className="min-h-[116px] w-full rounded-xl border border-border bg-background px-4 py-3 text-sm leading-7 text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                                  />
                                </div>
                              </div>

                              <div className="grid gap-3 sm:grid-cols-2 lg:w-[260px] lg:grid-cols-1">
                                <div className="rounded-2xl border border-border bg-muted/20 p-3">
                                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                    Complexity
                                  </label>
                                  <select
                                    value={task.complexity}
                                    onChange={(e) => updateExtractedTask(idx, 'complexity', e.target.value as StagedTask['complexity'])}
                                    className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                                  >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                  </select>
                                </div>

                                <div className="rounded-2xl border border-border bg-muted/20 p-3">
                                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                    Category
                                  </label>
                                  <input
                                    type="text"
                                    value={task.category}
                                    onChange={(e) => updateExtractedTask(idx, 'category', e.target.value)}
                                    className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                                  />
                                </div>

                                <div className="flex flex-wrap gap-2 lg:pt-1">
                                  <StatusBadge tone={task.complexity === 'high' ? 'danger' : task.complexity === 'medium' ? 'warning' : 'success'}>
                                    {task.complexity}
                                  </StatusBadge>
                                  {task.status ? <StatusBadge tone="info">{task.status}</StatusBadge> : null}
                                </div>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>

                      <div className="grid gap-3 border-t border-border pt-5 sm:grid-cols-2">
                        <Button
                          type="button"
                          onClick={() => setExtractedTasks([])}
                          className="h-12 rounded-xl border border-border bg-background text-foreground hover:bg-muted"
                        >
                          Clear All
                        </Button>
                        <Button
                          type="button"
                          onClick={saveStagedTasks}
                          disabled={savingTasks || reviewTasks.length === 0}
                          className="h-12 rounded-xl bg-foreground text-background hover:bg-zinc-800"
                        >
                          {savingTasks ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          Approve & Save to DB
                        </Button>
                      </div>
                    </div>
                  )}
                </DashboardCard>
              </div>
            )}

            {activeTab === 'phase2' && (
              <div className="space-y-6">
                <DashboardCard
                  title="Scope Comparison Workspace"
                  description="Review the approved baseline, prepare a new request, and compare the two in a calm workspace."
                  action={<StatusBadge tone="info">Phase 2 workspace</StatusBadge>}
                >
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    {[
                      { label: 'New Requirements', value: comparisonCounts?.added ?? '—' },
                      { label: 'Modified', value: comparisonCounts?.modified ?? '—' },
                      { label: 'Removed', value: comparisonCounts?.removed ?? '—' },
                      { label: 'Estimated Extra Hours', value: '—' },
                      { label: 'Estimated Extra Cost', value: '—' },
                    ].map((metric) => (
                      <div key={metric.label} className="rounded-2xl border border-border bg-background p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                          {metric.label}
                        </p>
                        <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{metric.value}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Pending comparison</p>
                      </div>
                    ))}
                  </div>
                </DashboardCard>

                <div className="grid gap-6 xl:grid-cols-[0.98fr_1.08fr_1.02fr]">
                  <DashboardCard
                    title="Baseline Requirements"
                    description="Read-only list of approved tasks used as the reference scope."
                    action={<StatusBadge tone="neutral">Read only</StatusBadge>}
                  >
                    {loadingBaseline ? (
                      renderLoadingState('Loading baseline requirements...')
                    ) : baselineItems.length === 0 ? (
                      <EmptyState
                        icon={FileText}
                        title="No baseline requirements"
                        description="Add an approved scope baseline to compare future client requests."
                      />
                    ) : (
                      <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                        {baselineItems.map((item, idx) => (
                          <article key={item.id} className="rounded-2xl border border-border bg-background p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <h3 className="text-sm font-semibold text-foreground">
                                  {idx + 1}. {item.deliverable}
                                </h3>
                                <p className="text-sm leading-6 text-muted-foreground">
                                  Approved requirement for this project.
                                </p>
                              </div>
                              <StatusBadge tone="success">Approved</StatusBadge>
                            </div>
                            {item.exclusions && (
                              <div className="mt-3 rounded-xl border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                                <span className="font-semibold text-foreground">Exclusions:</span> {item.exclusions}
                              </div>
                            )}
                            {item.assumptions && (
                              <div className="mt-2 rounded-xl border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                                <span className="font-semibold text-foreground">Assumptions:</span> {item.assumptions}
                              </div>
                            )}
                          </article>
                        ))}
                      </div>
                    )}
                  </DashboardCard>

                  <DashboardCard
                    title="Upload New Client Request"
                    description="Upload a document or paste raw text to compare against the baseline."
                    action={<StatusBadge tone={baselineItems.length > 0 ? 'info' : 'warning'}>{baselineItems.length > 0 ? 'Ready' : 'Add baseline first'}</StatusBadge>}
                  >
                    <div className="space-y-4">
                      <div className="rounded-3xl border border-dashed border-border bg-muted/20 px-5 py-8 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background text-indigo-600">
                          <FileText className="h-5 w-5" />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">Drag and drop a client email or document</h3>
                        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                          Drop a file here or browse from your device. You can also paste text below.
                        </p>
                        <div className="mt-5 flex justify-center">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-10 rounded-xl border-border bg-background px-4 text-sm text-foreground hover:bg-muted"
                          >
                            Browse Files
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Paste Text
                        </label>
                        <textarea
                          placeholder="Paste client email, meeting notes, or requirement document..."
                          value={clientRequestText}
                          onChange={(e) => setClientRequestText(e.target.value)}
                          rows={10}
                          className="min-h-[260px] w-full rounded-2xl border border-border bg-background p-4 text-sm leading-7 text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                        />
                      </div>

                      <Button
                        type="button"
                        onClick={runScopeCheck}
                        disabled={checkingScope}
                        className="h-12 w-full rounded-xl bg-foreground text-background hover:bg-zinc-800"
                      >
                        {checkingScope ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Comparing Scope...
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="h-4 w-4" />
                            Compare
                          </>
                        )}
                      </Button>
                    </div>
                  </DashboardCard>

                  <DashboardCard
                    title="Scope Comparison Results"
                    description="Added, modified, and removed requirements will appear here once the comparison engine is wired."
                    action={<StatusBadge tone="info">Results</StatusBadge>}
                  >
                    <div className="space-y-4">
                      {comparisonResult?.message ? (
                        <div className="rounded-2xl border border-border bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
                          {comparisonResult.message}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
                          Run a comparison to populate the result cards.
                        </div>
                      )}

                      <div className="space-y-3">
                        {[
                          {
                            label: 'Added Requirements',
                            tone: 'success' as const,
                            items: comparisonResult?.added || [],
                            emptyText: 'No added requirements yet.',
                          },
                          {
                            label: 'Modified Requirements',
                            tone: 'warning' as const,
                            items: comparisonResult?.modified || [],
                            emptyText: 'No modified requirements yet.',
                          },
                          {
                            label: 'Removed Requirements',
                            tone: 'danger' as const,
                            items: comparisonResult?.removed || [],
                            emptyText: 'No removed requirements yet.',
                          },
                        ].map((section) => (
                          <section key={section.label} className="rounded-2xl border border-border bg-background p-4">
                            <div className="flex items-center justify-between gap-3">
                              <h3 className="text-sm font-semibold text-foreground">{section.label}</h3>
                              <StatusBadge tone={section.tone}>{section.label.split(' ')[0]}</StatusBadge>
                            </div>
                            {section.items.length === 0 ? (
                              <div className="mt-3 rounded-xl border border-dashed border-border bg-muted/20 px-3 py-3 text-sm leading-6 text-muted-foreground">
                                {section.emptyText}
                              </div>
                            ) : (
                              <div className="mt-3 space-y-2">
                                {section.items.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="rounded-xl border border-border bg-muted/20 px-3 py-3 text-sm leading-6 text-foreground"
                                  >
                                    {'baseline' in item ? (
                                      <>
                                        <div className="font-medium">{item.task.title}</div>
                                        <div className="mt-1 text-muted-foreground">
                                          Baseline: {item.baseline.deliverable}
                                        </div>
                                      </>
                                    ) : (
                                      <div>{item.title}</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </section>
                        ))}
                      </div>
                    </div>
                  </DashboardCard>
                </div>

                <DashboardCard
                  title="Client Response"
                  description="Generate a client-ready response once the comparison has been reviewed."
                  action={<StatusBadge tone="info">Response draft</StatusBadge>}
                >
                  <div className="space-y-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="max-w-2xl">
                        <p className="text-sm text-muted-foreground">
                          This button keeps the current draft generation behavior and is placed at the bottom of Phase 2 as requested.
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={generateDraft}
                        disabled={draftingEmail || !scopeEvent || scopeEvent.verdict !== 'out_of_scope'}
                        className="h-12 rounded-xl bg-foreground px-5 text-background hover:bg-zinc-800"
                      >
                        {draftingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                        Generate Client Response
                      </Button>
                    </div>

                    {emailDraft && (
                      <div className="space-y-4 border-t border-border pt-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold text-foreground">
                              Generated response draft
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Review and copy the response before sending it to the client.
                            </p>
                          </div>
                          <Button
                            type="button"
                            onClick={copyToClipboard}
                            className="h-10 rounded-xl border border-border bg-background px-4 text-sm text-foreground hover:bg-muted"
                          >
                            {copied ? (
                              <>
                                <Check className="h-4 w-4 text-emerald-600" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4" />
                                Copy Draft
                              </>
                            )}
                          </Button>
                        </div>

                        <div className="rounded-2xl border border-border bg-muted/20 p-4 text-sm leading-7 text-foreground">
                          <div className="mb-3 border-b border-border pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Subject: {emailDraft.subject}
                          </div>
                          <pre className="whitespace-pre-wrap font-sans">{emailDraft.body}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                </DashboardCard>

                <button
                  type="button"
                  onClick={saveBaseline}
                  disabled={savingBaseline}
                  className="sr-only"
                  aria-hidden="true"
                  tabIndex={-1}
                >
                  Sync baseline
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-4">{renderEmptyProjectState()}</div>
        )}
      </main>
    </div>
  )
}
