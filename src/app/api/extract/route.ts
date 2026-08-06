import { createClient } from '@/lib/supabase/server'
import { generateObjectWithFallback } from '@/lib/gemini'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// Schema for structured task extraction
const taskSchema = z.object({
  title: z.string().describe('Concise, task-oriented title of the deliverable'),
  description: z.string().describe('Clear description of the work to be done'),
  complexity: z.enum(['low', 'medium', 'high']).describe('Estimated complexity/effort required for this task'),
  category: z.string().describe('Categorical classification (e.g., Frontend, Backend, UI/UX Design, DevOps, Database)')
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

    const object = await generateObjectWithFallback({
      schema: extractionResponseSchema,
      prompt: `You are an expert project manager and system analyst. Analyze the following raw client communication and extract only the true, actionable deliverables/tasks.
      
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
      """`,
      fallbackGenerator: () => {
        // Intelligent fallback if Google Gemini API quota is 0 / rate-limited
        const sentences = rawText.split(/(?<=[.?!])\s+/).filter(s => s.trim().length > 10)
        const extractedTasks = sentences.map((sentence, idx) => {
          const text = sentence.trim()
          let category = 'Frontend'
          let complexity: 'low' | 'medium' | 'high' = 'medium'

          if (/report|pdf|export|email|admin/i.test(text)) {
            category = 'Backend & Reporting'
            complexity = 'medium'
          } else if (/auth|login|oauth|google|security/i.test(text)) {
            category = 'Security & Auth'
            complexity = 'high'
          } else if (/design|redesign|ui|ux|settings|style/i.test(text)) {
            category = 'UI/UX Design'
            complexity = 'low'
          } else if (/stripe|payment|billing|subscription/i.test(text)) {
            category = 'Payments & Billing'
            complexity = 'high'
          }

          return {
            title: text.length > 50 ? `${text.substring(0, 47)}...` : text,
            description: text,
            complexity,
            category,
          }
        })

        return {
          tasks: extractedTasks.length > 0 ? extractedTasks : [
            {
              title: "Extracted Deliverable",
              description: rawText,
              complexity: "medium" as const,
              category: "General Development"
            }
          ]
        }
      }
    })

    return NextResponse.json({ tasks: object.tasks })
  } catch (error: any) {
    console.error('Extraction API error:', error)
    return NextResponse.json({ error: error.message || 'An error occurred during extraction' }, { status: 500 })
  }
}
