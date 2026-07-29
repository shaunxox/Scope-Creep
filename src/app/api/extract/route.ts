import { createClient } from '@/lib/supabase/server'
import { getGeminiModel } from '@/lib/gemini'
import { generateObject } from 'ai'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// Schema for structured task extraction
const taskSchema = z.object({
  title: z.string().describe('Concise, task-oriented title of the deliverable (e.g., "Implement user login screen")'),
  description: z.string().describe('Clear description of the work to be done, ignoring conversational filler or pleasantries'),
  complexity: z.enum(['low', 'medium', 'high']).describe('Estimated complexity/effort required for this task'),
  category: z.string().describe('Categorical classification (e.g., Frontend, Backend, UI/UX Design, DevOps, Content, Database)')
})

const extractionResponseSchema = z.object({
  tasks: z.array(taskSchema).describe('The list of extracted actionable tasks')
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Protect the route
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { rawText } = body

    if (!rawText || typeof rawText !== 'string' || rawText.trim() === '') {
      return NextResponse.json({ error: 'Raw text input is required' }, { status: 400 })
    }

    const model = getGeminiModel()

    const { object } = await generateObject({
      model,
      schema: extractionResponseSchema,
      prompt: `You are an expert project manager and system analyst. Analyze the following raw client communication (which may contain emails, notes, slack messages, or transcripts) and extract only the true, actionable deliverables/tasks.
      
      CRITICAL INSTRUCTIONS:
      1. Ignore all pleasantries, greetings, excuses, conversational context, and fluff.
      2. Identify true intent. Do not just look for keyword matches.
      3. For each deliverable, provide:
         - A concise title.
         - A detailed, actionable description of the work.
         - Complexity estimate ('low', 'medium', or 'high').
         - A clean category tag (e.g. Frontend, Backend, Design, Database, DevOps, etc.).
      
      Client Communication:
      """
      ${rawText}
      """`
    })

    return NextResponse.json({ tasks: object.tasks })
  } catch (error: any) {
    console.error('Extraction API error:', error)
    return NextResponse.json({ error: error.message || 'An error occurred during extraction' }, { status: 500 })
  }
}
