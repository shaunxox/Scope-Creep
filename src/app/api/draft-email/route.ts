import { createClient } from '@/lib/supabase/server'
import { getGeminiModel } from '@/lib/gemini'
import { generateObject } from 'ai'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const emailDraftSchema = z.object({
  subject: z.string().describe('Professional email subject line acknowledging the project name'),
  body: z.string().describe('Polite, professional, and friendly email body that clearly explains the scope discrepancy, presents the two choices, and outlines the additional cost and hours.')
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
    const { scopeEventId, extraHours, extraCost, clientName = 'Client' } = body

    if (!scopeEventId) {
      return NextResponse.json({ error: 'scopeEventId is required' }, { status: 400 })
    }

    if (extraHours === undefined || extraHours === null) {
      return NextResponse.json({ error: 'extraHours is required' }, { status: 400 })
    }

    if (extraCost === undefined || extraCost === null) {
      return NextResponse.json({ error: 'extraCost is required' }, { status: 400 })
    }

    // 1. Fetch scope event and its project name
    const { data: scopeEvent, error: fetchError } = await supabase
      .from('scope_events')
      .select(`
        id,
        project_id,
        request_text,
        verdict,
        discrepancy_note,
        status,
        projects (
          name
        )
      `)
      .eq('id', scopeEventId)
      .single()

    if (fetchError || !scopeEvent) {
      return NextResponse.json({ 
        error: fetchError ? fetchError.message : 'Scope event not found or unauthorized' 
      }, { status: 404 })
    }

    const projectData = scopeEvent.projects as any
    const projectName = projectData?.name || 'our active project'

    const model = getGeminiModel()

    // 2. Draft the negotiation email using Gemini
    const { object: draft } = await generateObject({
      model,
      schema: emailDraftSchema,
      prompt: `You are a polite, professional client manager helping a freelancer push back on scope creep.
      
      Context:
      - Project Name: ${projectName}
      - Client Name: ${clientName}
      - New request from client: "${scopeEvent.request_text}"
      - Why it is out of scope (discrepancy): "${scopeEvent.discrepancy_note}"
      - Additional hours required: ${extraHours} hours
      - Additional cost: $${extraCost}
      
      TONE RULES:
      1. Extremely friendly, professional, and collaborative. Do NOT sound defensive, rude, or accusatory.
      2. Frame it as "I would love to help you build this, and here is how we can do it."
      
      EMAIL FORMAT RULES:
      Offer two clear choices to the client:
      - Option A: Proceed with this extra work as a change order for $${extraCost} (estimated ${extraHours} extra hours), billed separately.
      - Option B: Stay within the original project timeline and agreed budget, skipping this feature for now or deferring it to a future phase.
      
      Generate a professional Subject line and Email Body.`
    })

    // 3. Update the scope event row with the quote parameters and set status to 'quoted'
    const { error: updateError } = await supabase
      .from('scope_events')
      .update({
        extra_hours: extraHours,
        extra_cost: extraCost,
        status: 'quoted'
      })
      .eq('id', scopeEventId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Combine for backwards compatibility and ease of copying
    const fullText = `Subject: ${draft.subject}\n\n${draft.body}`

    return NextResponse.json({
      email: fullText,
      subject: draft.subject,
      body: draft.body
    })
  } catch (error: any) {
    console.error('Draft-email API error:', error)
    return NextResponse.json({ error: error.message || 'An error occurred while drafting the email' }, { status: 500 })
  }
}
