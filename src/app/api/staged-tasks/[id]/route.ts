import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Protect the route
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body

    if (!status || !['staged', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ 
        error: "Invalid status. Must be one of 'staged', 'approved', or 'rejected'." 
      }, { status: 400 })
    }

    const { data: updatedTask, error } = await supabase
      .from('staged_tasks')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ task: updatedTask })
  } catch (error: any) {
    console.error('PATCH staged task error:', error)
    return NextResponse.json({ error: error.message || 'An error occurred during update' }, { status: 500 })
  }
}
