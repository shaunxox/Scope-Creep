import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
if (!apiKey) {
  console.warn('Warning: GOOGLE_GENERATIVE_AI_API_KEY is not defined in environment variables.')
}

export const googleProvider = createGoogleGenerativeAI({
  apiKey: apiKey || '',
})

// Priority list of Gemini models to try when calling the API
const GEMINI_MODELS = [
  process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-pro',
]

/**
 * Returns the primary Gemini model instance.
 */
export function getGeminiModel(overrideModel?: string) {
  const modelName = overrideModel || process.env.GEMINI_MODEL || 'gemini-1.5-flash'
  return googleProvider(modelName)
}

/**
 * Resilient object generation with model fallback and graceful fallback data
 * in case of API rate limits or quota errors.
 */
export async function generateObjectWithFallback<T>({
  schema,
  prompt,
  fallbackGenerator,
}: {
  schema: z.ZodType<T>
  prompt: string
  fallbackGenerator: () => T
}): Promise<T> {
  const modelsToTry = Array.from(new Set(GEMINI_MODELS))
  let lastError: any = null

  for (const modelName of modelsToTry) {
    try {
      const model = googleProvider(modelName)
      const { object } = await generateObject({
        model,
        schema,
        prompt,
      })
      return object
    } catch (err: any) {
      console.warn(`Gemini model ${modelName} failed/quota exceeded:`, err?.message || err)
      lastError = err
      // If it's a quota or rate limit issue (429 / Quota exceeded), try next model
      if (
        err?.message?.includes('Quota exceeded') ||
        err?.message?.includes('429') ||
        err?.status === 429
      ) {
        continue
      }
    }
  }

  console.warn('All Gemini models failed or hit quota limits. Using high-quality intelligent fallback extraction.')
  return fallbackGenerator()
}
