import { NextRequest, NextResponse } from 'next/server'
import { analyzeImageWithGPT4 } from '@/lib/openai'
import { compressImageForAI, validateImage } from '@/lib/imageProcessingServer'

export const runtime = 'nodejs' // Use Node.js runtime for Sharp
export const maxDuration = 30   // 30 second timeout

interface ProcessImageRequest {
  imageData: string  // base64 data URL
  maxSize?: number   // optional max dimension for compression
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ProcessImageRequest = await request.json()
    
    if (!body.imageData) {
      return NextResponse.json(
        { success: false, error: 'Missing imageData' },
        { status: 400 }
      )
    }
    
    // Validate image (10MB limit)
    try {
      validateImage(body.imageData, 10 * 1024 * 1024)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid image'
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      )
    }
    
    // Compress image for AI processing
    const maxSize = body.maxSize || 1024
    const compressedImage = await compressImageForAI(body.imageData, maxSize)
    
    // Call GPT-4 Vision API
    const analysis = await analyzeImageWithGPT4(compressedImage)
    
    // Check confidence threshold (30%)
    if (analysis.confidence < 0.3) {
      return NextResponse.json({
        success: true,
        result: {
          ...analysis,
          // Return original bounds if confidence too low
          bounds: { x: 0, y: 0, w: 1, h: 1 },
          rotation: 0,
        },
      })
    }
    
    return NextResponse.json({
      success: true,
      result: analysis,
    })
    
  } catch (error) {
    console.error('AI processing error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
