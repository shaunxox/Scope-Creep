export interface StagedTask {
  id?: string
  title: string
  description: string
  complexity: 'low' | 'medium' | 'high'
  category: string
  status: 'staged' | 'approved' | 'rejected'
}

export interface ExportConfig {
  projectName: string
  trelloKey?: string
  trelloToken?: string
  trelloBoardId?: string
  newBoardName?: string
}

export interface ExportService {
  name: string
  id: string
  export(tasks: StagedTask[], config: ExportConfig): Promise<any>
}

/**
 * CSV Export Service
 * Generates and downloads a comma-separated values file representing the current state of tasks.
 */
export class CSVExportService implements ExportService {
  name = 'CSV'
  id = 'csv'

  async export(tasks: StagedTask[], config: ExportConfig): Promise<void> {
    const headers = ['Title', 'Description', 'Status', 'Category', 'Complexity']
    const rows = tasks.map(t => [
      t.title,
      t.description,
      t.status,
      t.category,
      t.complexity
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => {
        // Escape double quotes and wrap values containing commas or quotes
        const escaped = String(val || '').replace(/"/g, '""')
        return `"${escaped}"`
      }).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    
    const safeProjectName = config.projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    link.setAttribute('download', `scope-creep-tasks-${safeProjectName}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

/**
 * PDF Export Service
 * Formats a clean, readable print document containing project info, metadata, metrics, and grouped tasks.
 * Opens it in a print preview context using browser print APIs.
 */
export class PDFExportService implements ExportService {
  name = 'PDF'
  id = 'pdf'

  async export(tasks: StagedTask[], config: ExportConfig): Promise<void> {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      throw new Error('Could not open print preview window. Please allow popups for this site.')
    }

    const staged = tasks.filter(t => t.status === 'staged')
    const approved = tasks.filter(t => t.status === 'approved')
    const rejected = tasks.filter(t => t.status === 'rejected')
    const dateStr = new Date().toLocaleString()

    const generateTaskHTML = (taskList: StagedTask[]) => {
      if (taskList.length === 0) {
        return '<p style="color: #71717a; font-style: italic; font-size: 13px; margin: 10px 0;">No tasks in this section.</p>'
      }
      return taskList.map(t => `
        <div style="padding: 14px; margin-bottom: 12px; border: 1px solid #e4e4e7; border-radius: 8px; background-color: #fafafa; page-break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 6px;">
            <h4 style="margin: 0; font-size: 14px; color: #18181b; font-weight: 600;">${t.title}</h4>
            <span style="font-size: 9px; font-weight: bold; text-transform: uppercase; padding: 2px 8px; border-radius: 9999px; letter-spacing: 0.05em; ${
              t.complexity === 'high' ? 'background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca;' :
              t.complexity === 'medium' ? 'background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a;' :
              'background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0;'
            }">${t.complexity}</span>
          </div>
          <p style="margin: 0 0 8px 0; font-size: 12.5px; color: #3f3f46; line-height: 1.4;">${t.description}</p>
          <span style="font-size: 11px; background-color: #f4f4f5; border: 1px solid #e4e4e7; color: #52525b; padding: 2px 6px; border-radius: 4px; font-weight: 500;">
            ${t.category}
          </span>
        </div>
      `).join('')
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Export: ${config.projectName}</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
              color: #27272a; 
              padding: 40px; 
              line-height: 1.5; 
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              border-bottom: 2px solid #e4e4e7;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            h1 { font-size: 22px; color: #18181b; margin: 0 0 6px 0; font-weight: 700; }
            .meta { font-size: 12px; color: #71717a; }
            h2 { 
              font-size: 15px; 
              border-bottom: 1px solid #e4e4e7; 
              padding-bottom: 6px; 
              color: #27272a; 
              margin-top: 30px; 
              text-transform: uppercase; 
              letter-spacing: 0.05em;
              font-weight: 700;
            }
            .stats { 
              display: grid; 
              grid-template-columns: repeat(4, 1fr); 
              gap: 15px; 
              margin-bottom: 24px; 
            }
            .stat-card { 
              border: 1px solid #e4e4e7; 
              border-radius: 8px; 
              padding: 12px; 
              text-align: center;
              background-color: #fafafa;
            }
            .stat-val { font-size: 20px; font-weight: 700; color: #18181b; }
            .stat-lbl { font-size: 10px; color: #71717a; text-transform: uppercase; font-weight: 600; margin-top: 2px; }
            .print-btn {
              padding: 8px 16px; 
              background-color: #4f46e5; 
              color: white; 
              border: none; 
              border-radius: 6px; 
              cursor: pointer; 
              font-weight: 600;
              font-size: 13px;
              transition: all 0.2s;
            }
            .print-btn:hover {
              background-color: #4338ca;
            }
            @media print {
              body { padding: 0; }
              .print-btn { display: none; }
            }
          </style>
        </head>
        <body>
          <div style="display: flex; justify-content: space-between; align-items: center;" class="header">
            <div>
              <h1>Scope Creep — Project Deliverables</h1>
              <div class="meta">Workspace: <strong>${config.projectName}</strong> &nbsp;|&nbsp; Date: ${dateStr}</div>
            </div>
            <button onclick="window.print()" class="print-btn">Print / Save as PDF</button>
          </div>
          
          <div class="stats">
            <div class="stat-card"><div class="stat-val">${tasks.length}</div><div class="stat-lbl">Total Tasks</div></div>
            <div class="stat-card"><div class="stat-val" style="color: #6366f1;">${staged.length}</div><div class="stat-lbl">Staged</div></div>
            <div class="stat-card"><div class="stat-val" style="color: #10b981;">${approved.length}</div><div class="stat-lbl">Approved</div></div>
            <div class="stat-card"><div class="stat-val" style="color: #ef4444;">${rejected.length}</div><div class="stat-lbl">Rejected</div></div>
          </div>
          
          <h2>Staged</h2>
          ${generateTaskHTML(staged)}
          
          <h2>Approved</h2>
          ${generateTaskHTML(approved)}
          
          <h2>Rejected</h2>
          ${generateTaskHTML(rejected)}

          <script>
            window.onload = () => {
              setTimeout(() => { window.print(); }, 500);
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }
}

/**
 * Trello REST Integration Client Helper
 */
export class TrelloExportService implements ExportService {
  name = 'Trello'
  id = 'trello'

  private baseUrl = 'https://api.trello.com/1'

  private buildUrl(path: string, key: string, token: string, params: Record<string, string> = {}) {
    const searchParams = new URLSearchParams({ key, token, ...params })
    return `${this.baseUrl}${path}?${searchParams.toString()}`
  }

  async getBoards(key: string, token: string): Promise<Array<{ id: string; name: string }>> {
    const url = this.buildUrl('/members/me/boards', key, token, { fields: 'name,id' })
    const res = await fetch(url)
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Failed to fetch boards from Trello: ${errText || res.statusText}`)
    }
    return res.json()
  }

  async createBoard(name: string, key: string, token: string): Promise<{ id: string }> {
    const url = this.buildUrl('/boards', key, token, { name, defaultLists: 'false' })
    const res = await fetch(url, { method: 'POST' })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Failed to create Trello board: ${errText || res.statusText}`)
    }
    return res.json()
  }

  async createList(boardId: string, name: string, key: string, token: string): Promise<{ id: string }> {
    const url = this.buildUrl(`/boards/${boardId}/lists`, key, token, { name })
    const res = await fetch(url, { method: 'POST' })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Failed to create list "${name}": ${errText || res.statusText}`)
    }
    return res.json()
  }

  async createCard(listId: string, name: string, desc: string, key: string, token: string): Promise<any> {
    const url = this.buildUrl('/cards', key, token, { idList: listId, name, desc })
    const res = await fetch(url, { method: 'POST' })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Failed to create card: ${errText || res.statusText}`)
    }
    return res.json()
  }

  async export(tasks: StagedTask[], config: ExportConfig): Promise<{ boardUrl?: string }> {
    const { trelloKey, trelloToken, trelloBoardId, newBoardName } = config
    
    if (!trelloKey || !trelloToken) {
      throw new Error('Trello API Key and Token are required.')
    }

    let activeBoardId = trelloBoardId

    // 1. Resolve board (use existing or create new)
    if (!activeBoardId) {
      if (!newBoardName || newBoardName.trim() === '') {
        throw new Error('Please select an existing board or specify a new board name.')
      }
      const board = await this.createBoard(newBoardName.trim(), trelloKey, trelloToken)
      activeBoardId = board.id
    }

    // 2. Create the three lists
    const stagedList = await this.createList(activeBoardId, 'Staged', trelloKey, trelloToken)
    const approvedList = await this.createList(activeBoardId, 'Approved', trelloKey, trelloToken)
    const rejectedList = await this.createList(activeBoardId, 'Rejected', trelloKey, trelloToken)

    // Map columns
    const listMap = {
      staged: stagedList.id,
      approved: approvedList.id,
      rejected: rejectedList.id
    }

    // 3. Export tasks sequentially to maintain ordering
    for (const task of tasks) {
      const listId = listMap[task.status]
      if (listId) {
        const cardTitle = task.title
        const cardDesc = `Description: ${task.description}\n\nComplexity: ${task.complexity.toUpperCase()}\nCategory: ${task.category}`
        await this.createCard(listId, cardTitle, cardDesc, trelloKey, trelloToken)
      }
    }

    return { boardUrl: `https://trello.com/b/${activeBoardId}` }
  }
}

/**
 * Export Manager
 * Orchestrates calls to the registered Export Services.
 */
export class ExportManager {
  private services = new Map<string, ExportService>()

  constructor() {
    this.registerService(new CSVExportService())
    this.registerService(new PDFExportService())
    this.registerService(new TrelloExportService())
  }

  registerService(service: ExportService) {
    this.services.set(service.id, service)
  }

  async triggerExport(serviceId: string, tasks: StagedTask[], config: ExportConfig): Promise<any> {
    const service = this.services.get(serviceId)
    if (!service) {
      throw new Error(`Export service "${serviceId}" is not supported.`)
    }
    return service.export(tasks, config)
  }

  getServicesList() {
    return Array.from(this.services.values()).map(s => ({ id: s.id, name: s.name }))
  }
}

// Global Export Manager instance
export const exportManager = new ExportManager()
