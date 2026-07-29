import { createGoogleGenerativeAI } from '@ai-sdk/google'

// Verify API key is present
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
if (!apiKey) {
  console.warn('Warning: GOOGLE_GENERATIVE_AI_API_KEY is not defined in environment variables.')
}

export const googleProvider = createGoogleGenerativeAI({
  apiKey,
})

/**
 * Returns the Gemini model instance.
 * Defaults to the user-requested 'gemini-3.5-flash'.
 */
export function getGeminiModel() {
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash'
  return googleProvider(modelName)
}
