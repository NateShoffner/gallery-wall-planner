import OpenAI from 'openai'

// Singleton client instance
let openaiClient: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }
    
    openaiClient = new OpenAI({ apiKey })
  }
  
  return openaiClient
}

export interface AIAnalysisResult {
  rotation: number  // degrees (-45 to +45)
  bounds: {         // normalized 0-1 coordinates
    x: number
    y: number
    w: number
    h: number
  }
  confidence: number  // 0-1
}

export async function analyzeImageWithGPT4(
  imageDataUrl: string
): Promise<AIAnalysisResult> {
  const openai = getOpenAIClient()
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: imageDataUrl,
              detail: 'high', // or 'low' for faster/cheaper processing
            },
          },
          {
            type: 'text',
            text: `You are analyzing a photo of artwork, a canvas, or a poster that may be tilted or have extra background space.

Your task:
1. Detect the rotation angle needed to straighten the artwork (range: -45° to +45°)
   - Negative values = rotate counter-clockwise
   - Positive values = rotate clockwise
2. Identify the bounding box of the actual artwork/canvas (ignoring background/wall)
   - Provide normalized coordinates (0-1 range)
3. Provide a confidence score for your analysis

Respond ONLY with valid JSON in this exact format:
{
  "rotation": <number between -45 and 45>,
  "bounds": {
    "x": <number 0-1, left edge position>,
    "y": <number 0-1, top edge position>,
    "w": <number 0-1, width>,
    "h": <number 0-1, height>
  },
  "confidence": <number 0-1>
}

If you cannot detect artwork boundaries confidently, set confidence to 0 and bounds to {"x": 0, "y": 0, "w": 1, "h": 1}.`,
          },
        ],
      },
    ],
    max_tokens: 300,
    temperature: 0.1, // Low temperature for consistent output
  })

  const content = response.choices[0].message.content
  if (!content) {
    throw new Error('No response from OpenAI')
  }

  try {
    // Strip markdown code blocks if present (gpt-4o sometimes wraps JSON in ```json)
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const result = JSON.parse(cleanContent) as AIAnalysisResult
    
    // Validate response structure
    if (
      typeof result.rotation !== 'number' ||
      typeof result.confidence !== 'number' ||
      !result.bounds ||
      typeof result.bounds.x !== 'number' ||
      typeof result.bounds.y !== 'number' ||
      typeof result.bounds.w !== 'number' ||
      typeof result.bounds.h !== 'number'
    ) {
      throw new Error('Invalid response structure from OpenAI')
    }
    
    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to parse OpenAI response: ${errorMessage}`)
  }
}
