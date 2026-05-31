'use client'

export interface AIProcessingResult {
  rotation: number
  bounds: { x: number; y: number; w: number; h: number }
  confidence: number
}

interface APIResponse {
  success: boolean
  result?: AIProcessingResult
  error?: string
}

/**
 * Call backend API to process image with AI
 */
export async function processImageWithAI(
  imageDataUrl: string,
  maxSize = 1024
): Promise<AIProcessingResult> {
  
  const response = await fetch('/api/process-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageData: imageDataUrl,
      maxSize,
    }),
  })
  
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`API request failed (${response.status}): ${text}`)
  }
  
  const data: APIResponse = await response.json()
  
  if (!data.success || !data.result) {
    throw new Error(data.error || 'AI processing failed')
  }
  
  return data.result
}
