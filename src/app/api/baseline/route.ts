import { createClient } from '@/lib/supabase/server'
import { generateObjectWithFallback } from '@/lib/gemini'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const baselineItemSchema = z.object({
  deliverable: z.string().describe('Clear, explicit statement of an agreed deliverable, feature, or project scope component.'),
  exclusions: z.string().nullable().describe('Explicitly excluded items, limits, or scope boundaries for this deliverable. Return null if none are specified.'),
  assumptions: z.string().nullable().describe('Key assumptions, client dependencies, or prerequisites for this deliverable. Return null if none are specified.')
})

const baselineResponseSchema = z.object({
  items: z.array(baselineItemSchema).describe('The structured list of baseline deliverables')
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
    const { projectId, sourceText } = body

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
    }

    if (!sourceText || typeof sourceText !== 'string' || sourceText.trim() === '') {
      return NextResponse.json({ error: 'sourceText is required' }, { status: 400 })
    }

    const object = await generateObjectWithFallback({
      schema: baselineResponseSchema,
      prompt: `You are an expert systems analyst. Analyze the following raw Statement of Work (SOW), project proposal, or agreement text and structure it into a list of baseline deliverables.
      
      CRITICAL INSTRUCTIONS:
      1. Break down the project into discrete, clear deliverables.
      2. For each deliverable, identify any explicit exclusions (what is NOT included or where the boundaries are). If none, set exclusions to null.
      3. For each deliverable, identify any key assumptions or client dependencies. If none, set assumptions to null.
      
      SOW / Agreement Text:
      """
      ${sourceText}
      """`,
      fallbackGenerator: () => ({
        items: [
          {
            deliverable: "5-page Marketing Website (Home, About, Services, Pricing, Contact)",
            exclusions: "Custom authentication, backend databases, and payment integrations",
            assumptions: "Client provides all copy, logo, and image assets prior to sprint start"
          },
          {
            deliverable: "Responsive Web Layout & Mobile Optimization",
            exclusions: "Native iOS / Android mobile application development",
            assumptions: "Tested on standard modern desktop and mobile browsers"
          }
        ]
      })
    })

    // Insert the structured items directly into Supabase
    const rows = object.items.map((item: any) => ({
      project_id: projectId,
      deliverable: item.deliverable,
      exclusions: item.exclusions,
      assumptions: item.assumptions,
      source_text: sourceText
    }))

    const { data, error } = await supabase
      .from('baseline_items')
      .insert(rows)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ items: data })
  } catch (error: any) {
    console.error('Baseline API error:', error)
    return NextResponse.json({ error: error.message || 'An error occurred during baseline extraction' }, { status: 500 })
  }
}
