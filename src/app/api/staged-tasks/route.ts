import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Protect the route
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'projectId query parameter is required' }, { status: 400 })
    }

    const { data: tasks, error } = await supabase
      .from('staged_tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('id', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tasks })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Protect the route
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, tasks } = body

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
    }

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: 'An array of tasks is required' }, { status: 400 })
    }

    // Insert the tasks
    const rows = tasks.map((task: any) => ({
      project_id: projectId,
      title: task.title,
      description: task.description,
      complexity: task.complexity || 'medium',
      category: task.category || 'General',
      status: task.status || 'staged'
    }))

    const { data, error } = await supabase
      .from('staged_tasks')
      .insert(rows)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tasks: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
