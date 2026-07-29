'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { 
  LogOut, Plus, Loader2, CheckCircle2, AlertTriangle, 
  Mail, FileText, Layers, Check, Copy, ShieldAlert,
  Download, ExternalLink, Settings, X, RefreshCw
} from 'lucide-react'

// dnd-kit Imports
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'

// Export manager Imports
import { exportManager, TrelloExportService } from '@/lib/exportServices'

interface Project {
  id: string
  name: string
  created_at: string
}

interface StagedTask {
  id: string // DB UUID
  title: string
  description: string
  complexity: 'low' | 'medium' | 'high'
  category: string
  status: 'staged' | 'approved' | 'rejected'
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

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [newProjectName, setNewProjectName] = useState('')
  const [creatingProject, setCreatingProject] = useState(false)
  const [activeTab, setActiveTab] = useState<'phase1' | 'phase2'>('phase1')

  // Phase 1: Ingestion Candidates (pre-save review)
  const [rawText, setRawText] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractedTasks, setExtractedTasks] = useState<any[]>([]) // Transient candidate array
  const [savingTasks, setSavingTasks] = useState(false)
  
  // Phase 1: Kanban Board Tasks (persisted database rows)
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
  
  // Negotiation states
  const [clientName, setClientName] = useState('')
  const [negotiationHours, setNegotiationHours] = useState(0)
  const [negotiationCost, setNegotiationCost] = useState(0)
  const [draftingEmail, setDraftingEmail] = useState(false)
  const [emailDraft, setEmailDraft] = useState<{ subject: string; body: string } | null>(null)
  
  // Export Menu & Trello Modal States
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [trelloModalOpen, setTrelloModalOpen] = useState(false)
  const [trelloKey, setTrelloKey] = useState('')
  const [trelloToken, setTrelloToken] = useState('')
  const [trelloBoards, setTrelloBoards] = useState<Array<{ id: string; name: string }>>([])
  const [loadingTrelloBoards, setLoadingTrelloBoards] = useState(false)
  const [selectedTrelloBoardId, setSelectedTrelloBoardId] = useState('')
  const [newTrelloBoardName, setNewTrelloBoardName] = useState('')
  const [exportingToTrello, setExportingToTrello] = useState(false)
  const [trelloBoardUrl, setTrelloBoardUrl] = useState('')

  const [copied, setCopied] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const router = useRouter()
  const supabase = createClient()

  // Configure drag-and-drop sensors with an activation constraint
  // This constraint ensures clicking inside input text/badges inside cards functions correctly
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

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
  useEffect(() => {
    if (selectedProjectId) {
      fetchSavedTasks()
      fetchBaselineItems()
      // reset states
      setExtractedTasks([])
      setScopeEvent(null)
      setEmailDraft(null)
      setErrorMsg('')
      setSuccessMsg('')
    }
  }, [selectedProjectId])

  // Load Trello credentials from localStorage on mount/modal-open
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const key = localStorage.getItem('trello_key') || ''
      const token = localStorage.getItem('trello_token') || ''
      setTrelloKey(key)
      setTrelloToken(token)
    }
  }, [trelloModalOpen])

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

  const fetchSavedTasks = async () => {
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

  const fetchBaselineItems = async () => {
    if (!selectedProjectId) return
    setLoadingBaseline(true)
    try {
      const { data, error } = await supabase
        .from('baseline_items')
        .select('*')
        .eq('project_id', selectedProjectId)
      if (error) {
        showError(error.message)
      } else {
        setBaselineItems(data || [])
      }
    } catch (e: any) {
      showError(e.message)
    } finally {
      setLoadingBaseline(false)
    }
  }

  const handleSignOut = async () => {
    await fetch('/auth/signout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  // Phase 1 actions: extraction
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
        showSuccess(`Extracted ${data.tasks?.length || 0} candidate tasks for review!`)
      } else {
        showError(data.error || 'Extraction failed')
      }
    } catch (e: any) {
      showError(e.message)
    } finally {
      setExtracting(false)
    }
  }

  const updateExtractedTask = (index: number, key: string, value: string) => {
    const updated = [...extractedTasks]
    updated[index] = { ...updated[index], [key]: value }
    setExtractedTasks(updated)
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
        showSuccess('Tasks persisted to Kanban Staging Board!')
        setExtractedTasks([])
        fetchSavedTasks()
      } else {
        showError(data.error || 'Failed to save tasks')
      }
    } catch (e: any) {
      showError(e.message)
    } finally {
      setSavingTasks(false)
    }
  }

  // Drag-and-drop end handler
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const taskId = active.id as string
    const overId = over.id as string

    // Resolve target status: either the column ID or target task's status
    let targetStatus: 'staged' | 'approved' | 'rejected'
    if (['staged', 'approved', 'rejected'].includes(overId)) {
      targetStatus = overId as any
    } else {
      const targetTask = savedTasks.find(t => t.id === overId)
      if (!targetTask) return
      targetStatus = targetTask.status
    }

    const draggedTask = savedTasks.find(t => t.id === taskId)
    if (!draggedTask) return

    // If dropped in the same column, do nothing
    if (draggedTask.status === targetStatus) return

    // Cache the original array state for rollback
    const originalTasks = [...savedTasks]

    // Optimistic UI updates: Move card immediately
    setSavedTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, status: targetStatus } : t)
    )

    try {
      const res = await fetch(`/api/staged-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to sync drag-and-drop update')
      }
    } catch (e: any) {
      // Revert on failure & notify
      setSavedTasks(originalTasks)
      showError(`Drag update failed: ${e.message || e}. Reverted task card.`)
    }
  }

  // Export flows
  const triggerExport = async (type: 'csv' | 'pdf') => {
    setExportMenuOpen(false)
    const activeProject = projects.find(p => p.id === selectedProjectId)
    const projectName = activeProject?.name || 'My Scope Creep Project'
    
    try {
      await exportManager.triggerExport(type, savedTasks, { projectName })
      showSuccess(`Exported to ${type.toUpperCase()} successfully.`)
    } catch (e: any) {
      showError(e.message || 'Export failed')
    }
  }

  // Trello client interaction handlers
  const connectTrello = async () => {
    if (!trelloKey.trim() || !trelloToken.trim()) {
      showError('Please provide both a developer key and API token.')
      return
    }
    setLoadingTrelloBoards(true)
    setErrorMsg('')
    try {
      localStorage.setItem('trello_key', trelloKey.trim())
      localStorage.setItem('trello_token', trelloToken.trim())
      
      const trelloService = new TrelloExportService()
      const boards = await trelloService.getBoards(trelloKey.trim(), trelloToken.trim())
      setTrelloBoards(boards)
      
      if (boards.length > 0) {
        setSelectedTrelloBoardId(boards[0].id)
      }
      showSuccess('Successfully connected to Trello account!')
    } catch (e: any) {
      showError(e.message || 'Authentication with Trello failed. Please verify credentials.')
    } finally {
      setLoadingTrelloBoards(false)
    }
  }

  const disconnectTrello = () => {
    localStorage.removeItem('trello_key')
    localStorage.removeItem('trello_token')
    setTrelloKey('')
    setTrelloToken('')
    setTrelloBoards([])
    setSelectedTrelloBoardId('')
    setTrelloBoardUrl('')
    showSuccess('Trello account disconnected.')
  }

  const loadTrelloBoards = async () => {
    if (!trelloKey || !trelloToken) return
    setLoadingTrelloBoards(true)
    try {
      const trelloService = new TrelloExportService()
      const boards = await trelloService.getBoards(trelloKey, trelloToken)
      setTrelloBoards(boards)
    } catch (e: any) {
      showError(e.message)
    } finally {
      setLoadingTrelloBoards(false)
    }
  }

  const handleTrelloExportSubmit = async () => {
    setExportingToTrello(true)
    setTrelloBoardUrl('')
    setErrorMsg('')
    
    const activeProject = projects.find(p => p.id === selectedProjectId)
    const projectName = activeProject?.name || 'Scope Creep'

    try {
      const config = {
        projectName,
        trelloKey,
        trelloToken,
        trelloBoardId: selectedTrelloBoardId === 'new' ? undefined : selectedTrelloBoardId,
        newBoardName: selectedTrelloBoardId === 'new' ? newTrelloBoardName : undefined
      }

      const res = await exportManager.triggerExport('trello', savedTasks, config)
      setTrelloBoardUrl(res?.boardUrl || 'https://trello.com')
      showSuccess('Trello export completed! Created boards, lists, and task cards.')
      fetchSavedTasks() // Reload statuses in case
    } catch (e: any) {
      showError(e.message || 'Failed to export columns to Trello.')
    } finally {
      setExportingToTrello(false)
    }
  }

  // Phase 2 actions: baseline
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

  const runScopeCheck = async () => {
    if (!clientRequestText.trim() || !selectedProjectId) return
    setCheckingScope(true)
    setScopeEvent(null)
    setEmailDraft(null)
    setErrorMsg('')
    try {
      const res = await fetch('/api/scope-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          requestText: clientRequestText
        })
      })
      const data = await res.json()
      if (res.ok) {
        const event = data.scopeEvent
        setScopeEvent(event)
        setNegotiationHours(event.extra_hours || 0)
        setNegotiationCost((event.extra_hours || 0) * 125)
        setClientName('Client')
        showSuccess('Scope check complete!')
      } else {
        showError(data.error || 'Scope check failed')
      }
    } catch (e: any) {
      showError(e.message)
    } finally {
      setCheckingScope(false)
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

  if (loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-sm text-zinc-400">Verifying session...</p>
        </div>
      </div>
    )
  }

  const activeProject = projects.find(p => p.id === selectedProjectId)

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-50 font-sans">
      {/* Top Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between static z-40">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-indigo-500 to-violet-500 p-2 rounded-lg text-white shadow-lg shadow-indigo-500/20">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              Scope Creep
            </h1>
            <p className="text-xs text-zinc-400 font-medium">AI Ingestion & Scope Protection Middleware</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-400 hidden sm:inline">{user?.email}</span>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors duration-200 text-sm bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-md border border-zinc-700/50"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* Alerts */}
        {successMsg && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-lg text-sm animate-in fade-in slide-in-from-top-4 duration-300">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-lg text-sm animate-in fade-in slide-in-from-top-4 duration-300">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Project Setup */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <label className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Active Workspace</label>
            {loadingProjects ? (
              <div className="flex items-center gap-2 text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading projects...</span>
              </div>
            ) : projects.length === 0 ? (
              <p className="text-sm text-zinc-500">No projects found. Create one to get started.</p>
            ) : (
              <div className="flex items-center gap-2">
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full max-w-sm"
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

          <form onSubmit={createProject} className="flex gap-2 items-end">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">New Project</label>
              <input
                type="text"
                placeholder="Project Name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                required
              />
            </div>
            <button
              type="submit"
              disabled={creatingProject}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 text-white font-medium text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 h-[38px]"
            >
              {creatingProject ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span>Create</span>
            </button>
          </form>
        </section>

        {selectedProjectId ? (
          <div className="space-y-6">
            
            {/* Main Tabs */}
            <div className="flex border-b border-zinc-800">
              <button
                onClick={() => setActiveTab('phase1')}
                className={`py-3 px-6 font-semibold text-sm transition-all duration-200 border-b-2 flex items-center gap-2 ${
                  activeTab === 'phase1'
                    ? 'border-indigo-500 text-white bg-indigo-500/5'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Layers className="h-4 w-4" />
                <span>Phase 1: Task Extraction & Staging</span>
              </button>
              <button
                onClick={() => setActiveTab('phase2')}
                className={`py-3 px-6 font-semibold text-sm transition-all duration-200 border-b-2 flex items-center gap-2 ${
                  activeTab === 'phase2'
                    ? 'border-indigo-500 text-white bg-indigo-500/5'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Phase 2: Baseline & Scope Protection</span>
              </button>
            </div>

            {/* TAB 1: PHASE 1 WORKSPACE */}
            {activeTab === 'phase1' && (
              <div className="space-y-6">
                
                {/* Extraction Area (Ingestion + Staging Review) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left panel: Raw ingestion */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">Client Communication Ingestion</h3>
                      <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-full font-semibold">Gemini Ingestion Engine</span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Paste a raw client email, requirements brief, or chat thread. Gemini will extract true, actionable deliverables.
                    </p>
                    <textarea
                      placeholder="Hi! Can you make sure that we also have an admin panel? Oh and maybe we can change the layout of the landing page. Also, I need to make sure users can login. Talk soon!"
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      rows={6}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono placeholder:text-zinc-600"
                    />
                    <button
                      onClick={extractTasks}
                      disabled={extracting || !rawText.trim()}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-200"
                    >
                      {extracting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Extracting Tasks...</span>
                        </>
                      ) : (
                        <span>Extract Structured Tasks</span>
                      )}
                    </button>
                  </div>

                  {/* Right panel: Candidate Review */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
                    <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-white">Staging Review Panel</h3>
                        <p className="text-xs text-zinc-400 mt-1">Refine task attributes before inserting into the Kanban staging board.</p>
                      </div>
                      {extractedTasks.length > 0 && (
                        <span className="text-xs bg-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded-full">
                          {extractedTasks.length} Candidates
                        </span>
                      )}
                    </div>

                    {extractedTasks.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-zinc-800 rounded-lg text-zinc-650 text-sm min-h-[180px]">
                        <Layers className="h-6 w-6 text-zinc-700 mb-1 animate-pulse" />
                        <p className="text-xs">No candidate tasks staged yet.</p>
                        <p className="text-[11px] text-zinc-700 mt-0.5">Use the ingestion form to extract deliverables from raw text.</p>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col justify-between space-y-4 mt-2">
                        <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                          {extractedTasks.map((task, idx) => (
                            <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-2.5 relative hover:border-zinc-750 transition-all duration-150">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-zinc-500 uppercase">Title</label>
                                  <input
                                    type="text"
                                    value={task.title}
                                    onChange={(e) => updateExtractedTask(idx, 'title', e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-white focus:outline-none"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-zinc-500 uppercase">Complexity</label>
                                    <select
                                      value={task.complexity}
                                      onChange={(e) => updateExtractedTask(idx, 'complexity', e.target.value)}
                                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-xs text-white focus:outline-none"
                                    >
                                      <option value="low">Low</option>
                                      <option value="medium">Medium</option>
                                      <option value="high">High</option>
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-zinc-500 uppercase">Category</label>
                                    <input
                                      type="text"
                                      value={task.category}
                                      onChange={(e) => updateExtractedTask(idx, 'category', e.target.value)}
                                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-white focus:outline-none"
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-zinc-500 uppercase">Description</label>
                                <textarea
                                  value={task.description}
                                  onChange={(e) => updateExtractedTask(idx, 'description', e.target.value)}
                                  rows={1.5}
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-white focus:outline-none"
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-zinc-800">
                          <button
                            onClick={() => setExtractedTasks([])}
                            className="flex-1 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white py-1.5 rounded-lg text-xs font-semibold transition-all"
                          >
                            Discard
                          </button>
                          <button
                            onClick={saveStagedTasks}
                            disabled={savingTasks}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                          >
                            {savingTasks ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            <span>Approve & Save</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* KANBAN BOARD SECTION */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-4">
                  
                  {/* Kanban Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Staging Kanban Board</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">Drag tasks between columns to update status in Supabase. Only clean, verified work goes to production.</p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <button
                        onClick={fetchSavedTasks}
                        disabled={loadingSavedTasks}
                        className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded-lg border border-zinc-700/50 text-zinc-300 hover:text-white transition-colors"
                        title="Reload Staged Tasks"
                      >
                        {loadingSavedTasks ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      </button>

                      {/* Export Dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setExportMenuOpen(!exportMenuOpen)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all duration-200 shadow-md shadow-indigo-600/10"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Export Columns</span>
                        </button>
                        
                        {exportMenuOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setExportMenuOpen(false)}
                            />
                            <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1.5 z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                              <button
                                onClick={() => triggerExport('csv')}
                                className="w-full text-left px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-2"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <span>Export as CSV</span>
                              </button>
                              <button
                                onClick={() => triggerExport('pdf')}
                                className="w-full text-left px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-2"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                                <span>Export as PDF</span>
                              </button>
                              <button
                                onClick={() => {
                                  setExportMenuOpen(false)
                                  setTrelloModalOpen(true)
                                }}
                                className="w-full text-left px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-2 border-t border-zinc-800/80"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                <span>Export to Trello</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Kanban Columns with DndContext */}
                  {loadingSavedTasks ? (
                    <div className="flex items-center gap-3 justify-center py-20 text-zinc-400">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                      <span className="text-sm">Syncing Kanban state...</span>
                    </div>
                  ) : (
                    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        <KanbanColumn
                          id="staged"
                          title="Staged tasks"
                          tasks={savedTasks.filter(t => t.status === 'staged')}
                        />
                        
                        <KanbanColumn
                          id="approved"
                          title="Approved tasks"
                          tasks={savedTasks.filter(t => t.status === 'approved')}
                        />

                        <KanbanColumn
                          id="rejected"
                          title="Rejected tasks"
                          tasks={savedTasks.filter(t => t.status === 'rejected')}
                        />

                      </div>
                    </DndContext>
                  )}
                </div>

              </div>
            )}

            {/* TAB 2: PHASE 2 WORKSPACE */}
            {activeTab === 'phase2' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left side: Baseline Setup */}
                <div className="space-y-6">
                  {/* Baseline Input */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-4">
                    <h3 className="text-lg font-semibold text-white">Define Project Baseline Scope</h3>
                    <p className="text-xs text-zinc-400">
                      Paste the original Statement of Work (SOW) or proposal. Gemini will structure it into baseline items.
                    </p>
                    <textarea
                      placeholder="Paste baseline agreement here... e.g., 'Phase 1 includes landing page design, user registration with email, and 3-page admin dashboard. Excludes payment integration. Assumes database is hosted by client.'"
                      value={sowText}
                      onChange={(e) => setSowText(e.target.value)}
                      rows={5}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono placeholder:text-zinc-600"
                    />
                    <button
                      onClick={saveBaseline}
                      disabled={savingBaseline || !sowText.trim()}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-200"
                    >
                      {savingBaseline ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Structuring Baseline...</span>
                        </>
                      ) : (
                        <span>Structure & Save Baseline</span>
                      )}
                    </button>
                  </div>

                  {/* Baseline Items List */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-4">
                    <h3 className="text-lg font-semibold text-white">Baseline Reference Database</h3>
                    <p className="text-xs text-zinc-400 font-medium">This is the reference used by Gemini to triage incoming requests.</p>

                    {loadingBaseline ? (
                      <div className="flex items-center gap-2 text-zinc-400 justify-center py-6">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Retrieving reference data...</span>
                      </div>
                    ) : baselineItems.length === 0 ? (
                      <div className="border border-dashed border-zinc-800 rounded-lg p-8 text-center text-zinc-500 text-sm">
                        No baseline items configured yet. Paste and parse a SOW document above to setup Phase 2.
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                        {baselineItems.map((item, idx) => (
                          <div key={item.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-2">
                            <div className="font-semibold text-sm text-zinc-100">
                              #{idx + 1}: {item.deliverable}
                            </div>
                            {item.exclusions && (
                              <div className="text-xs text-rose-400/80 bg-rose-950/20 border border-rose-950/30 px-2 py-1 rounded">
                                <span className="font-semibold text-rose-400">Exclusion:</span> {item.exclusions}
                              </div>
                            )}
                            {item.assumptions && (
                              <div className="text-xs text-sky-400/80 bg-sky-950/20 border border-sky-950/30 px-2 py-1 rounded">
                                <span className="font-semibold text-sky-400">Assumption:</span> {item.assumptions}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Scope-Check */}
                <div className="space-y-6">
                  {/* Client Request Scope Check */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-4">
                    <h3 className="text-lg font-semibold text-white">Scope Creep Triage Door</h3>
                    <p className="text-xs text-zinc-400">
                      Input any new client favor or change request to cross-reference it against the project's baseline items.
                    </p>
                    <textarea
                      placeholder="e.g. 'Hey, can we also add Stripe payments so users can pay for subscriptions? It should be super easy since you already built login!'"
                      value={clientRequestText}
                      onChange={(e) => setClientRequestText(e.target.value)}
                      rows={4}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono placeholder:text-zinc-600"
                    />
                    <button
                      onClick={runScopeCheck}
                      disabled={checkingScope || !clientRequestText.trim() || baselineItems.length === 0}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-200"
                    >
                      {checkingScope ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Checking Scope Creep...</span>
                        </>
                      ) : (
                        <span>Verify Request Scope</span>
                      )}
                    </button>
                    {baselineItems.length === 0 && (
                      <p className="text-[11px] text-amber-500 text-center">
                        * You must configure baseline deliverables first.
                      </p>
                    )}
                  </div>

                  {/* Scope Check Verdict */}
                  {scopeEvent && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-6 animate-in fade-in duration-300">
                      
                      {/* Verdict Banner */}
                      <div className={`p-4 rounded-lg flex items-center gap-3 border ${
                        scopeEvent.verdict === 'out_of_scope'
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      }`}>
                        {scopeEvent.verdict === 'out_of_scope' ? (
                          <>
                            <ShieldAlert className="h-6 w-6 text-rose-400 flex-shrink-0 animate-bounce" />
                            <div>
                              <div className="font-bold text-sm">SCOPE CREEP DETECTED!</div>
                              <div className="text-xs text-rose-400/90 mt-0.5">This request requires efforts not covered by original agreement ({scopeEvent.extra_hours} extra hrs suggested).</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                            <div>
                              <div className="font-bold text-sm">IN-SCOPE DELIVERABLE</div>
                              <div className="text-xs text-emerald-400/90 mt-0.5">This fits within your existing baseline deliverables.</div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Explanation */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">Analysis Note</span>
                        <div className="bg-zinc-950 border border-zinc-800 rounded p-3 text-xs leading-relaxed text-zinc-300">
                          {scopeEvent.discrepancy_note}
                        </div>
                      </div>

                      {/* Negotiation Form (Out of Scope only) */}
                      {scopeEvent.verdict === 'out_of_scope' && (
                        <div className="border-t border-zinc-800 pt-4 space-y-4">
                          <h4 className="text-sm font-semibold text-white">Negotiation Parameters (Human Override)</h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase block">Client Name</label>
                              <input
                                type="text"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase block">Extra Hours</label>
                              <input
                                type="number"
                                value={negotiationHours}
                                onChange={(e) => setNegotiationHours(Number(e.target.value))}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase block">Extra Quote ($)</label>
                              <input
                                type="number"
                                value={negotiationCost}
                                onChange={(e) => setNegotiationCost(Number(e.target.value))}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          </div>

                          <button
                            onClick={generateDraft}
                            disabled={draftingEmail}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-850 disabled:text-zinc-650 text-white font-medium py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-all"
                          >
                            {draftingEmail ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Mail className="h-4 w-4" />
                            )}
                            <span>Draft Pushback Email</span>
                          </button>
                        </div>
                      )}

                      {/* Email Output */}
                      {emailDraft && (
                        <div className="border-t border-zinc-800 pt-4 space-y-3 animate-in fade-in duration-300">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-indigo-400">Pushback Email Draft</h4>
                            <button
                              onClick={copyToClipboard}
                              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-all bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1.5 rounded border border-zinc-700"
                            >
                              {copied ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>Copy Draft</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-xs leading-relaxed text-zinc-200 select-all space-y-2 whitespace-pre-wrap">
                            <div className="font-semibold text-zinc-400 border-b border-zinc-800 pb-1.5 mb-1.5">
                              Subject: {emailDraft.subject}
                            </div>
                            {emailDraft.body}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="border border-zinc-800 rounded-xl p-12 text-center max-w-md mx-auto space-y-4 bg-zinc-900/40 mt-12">
            <Layers className="h-12 w-12 text-zinc-700 mx-auto animate-pulse" />
            <h3 className="text-lg font-semibold text-white">Select a Project workspace</h3>
            <p className="text-xs text-zinc-500">
              Create a new project or select an existing one to unlock the Phase 1 and Phase 2 scope triages.
            </p>
          </div>
        )}
      </main>

      {/* Trello Connection Modal */}
      {trelloModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in scale-in duration-250 relative">
            <button
              onClick={() => {
                setTrelloModalOpen(false)
                setTrelloBoardUrl('')
              }}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                <span>Export Workspace to Trello</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Connect your Trello account to sync Staged, Approved, and Rejected tasks into boards.
              </p>
            </div>

            {/* If credentials are not set/working */}
            {trelloBoards.length === 0 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-450 uppercase block">Developer API Key</label>
                  <input
                    type="text"
                    placeholder="Enter Trello API Key"
                    value={trelloKey}
                    onChange={(e) => setTrelloKey(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-450 uppercase block">API Member Token</label>
                  <input
                    type="password"
                    placeholder="Enter Trello Member Token"
                    value={trelloToken}
                    onChange={(e) => setTrelloToken(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 leading-normal">
                  To get your keys, sign in to Trello and visit the{' '}
                  <a 
                    href="https://trello.com/app-key" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-indigo-400 hover:underline flex items-center gap-1 inline-flex"
                  >
                    <span>Trello Developer Portal</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  . Ensure you authorize and generate a Token with read/write access.
                </p>
                <button
                  onClick={connectTrello}
                  disabled={loadingTrelloBoards}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-white font-medium py-2 rounded-lg text-xs flex items-center justify-center gap-1 transition-all"
                >
                  {loadingTrelloBoards ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  <span>Verify and Connect</span>
                </button>
              </div>
            ) : (
              // Connected state - boards configuration
              <div className="space-y-5">
                <div className="flex justify-between items-center text-xs bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-lg">
                  <div className="text-emerald-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="font-semibold">Account Connected</span>
                  </div>
                  <button 
                    onClick={disconnectTrello} 
                    className="text-zinc-500 hover:text-rose-400 underline font-medium text-[11px] transition-colors"
                  >
                    Disconnect
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-450 uppercase block">Destination Board</label>
                    <select
                      value={selectedTrelloBoardId}
                      onChange={(e) => setSelectedTrelloBoardId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="new">+ Create a New Board</option>
                      {trelloBoards.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedTrelloBoardId === 'new' && (
                    <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-150">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase block">New Board Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Acme Scope Creep Tasks"
                        value={newTrelloBoardName}
                        onChange={(e) => setNewTrelloBoardName(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>

                {trelloBoardUrl && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs space-y-1">
                    <div className="font-semibold">Export Completed!</div>
                    <a 
                      href={trelloBoardUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-indigo-400 hover:underline flex items-center gap-1 inline-flex mt-1"
                    >
                      <span>Open Trello Board</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setTrelloModalOpen(false)
                      setTrelloBoardUrl('')
                    }}
                    className="flex-1 border border-zinc-850 hover:border-zinc-750 text-zinc-400 hover:text-white py-2 rounded-lg text-xs font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTrelloExportSubmit}
                    disabled={exportingToTrello || (selectedTrelloBoardId === 'new' && !newTrelloBoardName.trim())}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-medium py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    {exportingToTrello ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
                    <span>Sync to Trello</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ==========================================
// Subcomponents for Staging Kanban Board
// ==========================================

function KanbanColumn({ id, title, tasks }: { id: string; title: string; tasks: StagedTask[] }) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div 
      ref={setNodeRef}
      className={`bg-zinc-900 border rounded-xl p-4 flex flex-col min-h-[450px] transition-all duration-200 ${
        isOver ? 'border-indigo-500/80 bg-zinc-900/80 ring-1 ring-indigo-500/20' : 'border-zinc-800 bg-zinc-900'
      }`}
    >
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2 mb-3.5">
        <h4 className="font-semibold text-xs text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${
            id === 'staged' ? 'bg-indigo-500' :
            id === 'approved' ? 'bg-emerald-500' :
            'bg-rose-500'
          }`} />
          <span>{title}</span>
        </h4>
        <span className="text-[10px] bg-zinc-800 border border-zinc-700/50 text-zinc-400 font-semibold px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-3 flex flex-col">
          {tasks.map(task => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
          {tasks.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-center p-6 text-xs text-zinc-600 border border-dashed border-zinc-850 rounded-lg min-h-[120px]">
              Drag task cards here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

function SortableTaskCard({ task }: { task: StagedTask }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id })

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.35 : 1,
    cursor: 'grab'
  }

  const getComplexityColor = (c: string) => {
    switch (c) {
      case 'high': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
      case 'medium': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
      default: return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    }
  }

  const truncateText = (text: string, length = 110) => {
    if (!text) return ''
    if (text.length <= length) return text
    return text.substring(0, length) + '...'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-zinc-950 border border-zinc-850 rounded-lg p-3.5 space-y-2.5 hover:border-zinc-700/80 hover:bg-zinc-950/60 transition-all duration-150 select-none shadow-md shadow-black/30 ring-indigo-500/20"
    >
      <div className="flex justify-between items-start gap-2">
        <h5 className="font-semibold text-xs text-zinc-200 leading-snug">{task.title}</h5>
        <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full ${getComplexityColor(task.complexity)}`}>
          {task.complexity}
        </span>
      </div>
      
      <p className="text-[11px] text-zinc-400 leading-relaxed">{truncateText(task.description)}</p>
      
      <div className="flex justify-between items-center pt-2 border-t border-zinc-900">
        <span className="text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-850 font-medium">
          {task.category}
        </span>
      </div>
    </div>
  )
}
