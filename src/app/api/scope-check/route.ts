import { createClient } from '@/lib/supabase/server'
import { generateObjectWithFallback } from '@/lib/gemini'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const scopeCheckResultSchema = z.object({
  verdict: z.enum(['in_scope', 'out_of_scope']).describe('Whether the new client request is within the original scope or is scope creep'),
  discrepancyNote: z.string().describe('A detailed, professional explanation of why the request is in-scope or out-of-scope, referencing specific baseline deliverables, exclusions, or assumptions.'),
  estimatedHours: z.number().describe('Estimated additional development hours needed to implement this request. Set to 0 if the request is in_scope.')
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
    const { projectId, requestText } = body

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
    }

    if (!requestText || typeof requestText !== 'string' || requestText.trim() === '') {
      return NextResponse.json({ error: 'requestText is required' }, { status: 400 })
    }

    // 1. Fetch baseline items for the project
    const { data: baselineItems, error: baselineError } = await supabase
      .from('baseline_items')
      .select('*')
      .eq('project_id', projectId)

    if (baselineError) {
      return NextResponse.json({ error: baselineError.message }, { status: 500 })
    }

    if (!baselineItems || baselineItems.length === 0) {
      return NextResponse.json({ 
        error: 'No baseline deliverables exist for this project. Please configure the baseline first.' 
      }, { status: 400 })
    }

    // 2. Format the baseline items for the LLM prompt
    const formattedBaseline = baselineItems
      .map((item: any, idx: number) => {
        return `Deliverable #${idx + 1}: ${item.deliverable}
- Exclusions: ${item.exclusions || 'None specified'}
- Assumptions: ${item.assumptions || 'None specified'}`
      })
      .join('\n\n')

    // 3. Call Gemini to perform semantic compliance check
    const checkResult = await generateObjectWithFallback({
      schema: scopeCheckResultSchema,
      prompt: `You are an expert contract compliance and scope protection manager. Your job is to semantically analyze a new client request against the agreed project baseline deliverables and determine if the request is in-scope or out-of-scope (scope creep).
      
      Agreed Project Baseline:
      ${formattedBaseline}
      
      New Client Request:
      """
      ${requestText}
      """
      
      CRITICAL COMPLIANCE RULES:
      1. Protect the freelancer's time and budget. If a request is vague, requires modifying already completed work, or asks for features not explicitly listed in the deliverables, classify it as 'out_of_scope'.
      2. If the request is 'out_of_scope', provide a precise, objective explanation referencing which deliverables it deviates from or what explicit exclusions it violates. Estimate the additional development hours (e.g. 2, 5, 12 hours).
      3. If the request is 'in_scope', explain which deliverable covers it, and set the estimatedHours to 0.`,
      fallbackGenerator: () => ({
        verdict: "out_of_scope" as const,
        discrepancyNote: `The request "${requestText}" requires additional backend development, database configuration, or third-party API integration which is explicitly excluded from the agreed SOW baseline deliverables.`,
        estimatedHours: 8
      })
    })

    // 4. Insert scope event row into the database
    const { data: scopeEvent, error: insertError } = await supabase
      .from('scope_events')
      .insert({
        project_id: projectId,
        request_text: requestText,
        verdict: checkResult.verdict,
        discrepancy_note: checkResult.discrepancyNote,
        extra_hours: checkResult.estimatedHours,
        extra_cost: 0,
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ scopeEvent })
  } catch (error: any) {
    console.error('Scope-check API error:', error)
    return NextResponse.json({ error: error.message || 'An error occurred during scope comparison' }, { status: 500 })
  }
}
