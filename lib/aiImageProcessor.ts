import sharp from 'sharp'

export interface ImageProcessingResult {
  base64: string
  width: number
  height: number
  format: 'png' | 'jpeg' | 'webp'
}

export interface AIProcessingData {
  processedImageId?: string
  backgroundRemoved?: boolean
  description?: string
  processedAt?: number
  error?: string
}

/**
 * Process an image for the gallery wall:
 * - Resize if needed
 * - Convert to optimized format
 * - Return as base64
 */
export async function processImageForGallery(
  buffer: Buffer,
  options?: {
    maxWidth?: number
    maxHeight?: number
    format?: 'png' | 'jpeg' | 'webp'
    quality?: number
  },
): Promise<ImageProcessingResult> {
  const {
    maxWidth = 2000,
    maxHeight = 2000,
    format = 'webp',
    quality = 80,
  } = options || {}

  let image = sharp(buffer)

  // Get metadata
  const metadata = await image.metadata()
  let { width = 0, height = 0 } = metadata

  // Resize if needed
  if (width > maxWidth || height > maxHeight) {
    image = image.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })
  }

  // Convert to target format
  let processedBuffer: Buffer
  if (format === 'png') {
    processedBuffer = await image.png({ progressive: true }).toBuffer()
  } else if (format === 'jpeg') {
    processedBuffer = await image
      .jpeg({ quality, progressive: true })
      .toBuffer()
  } else {
    processedBuffer = await image.webp({ quality }).toBuffer()
  }

  const base64 = processedBuffer.toString('base64')

  return {
    base64,
    width,
    height,
    format,
  }
}

/**
 * Optimize image for thumbnails
 */
export async function createThumbnail(
  buffer: Buffer,
  size: number = 200,
): Promise<string> {
  const thumbnail = await sharp(buffer)
    .resize(size, size, {
      fit: 'cover',
      position: 'center',
    })
    .webp({ quality: 70 })
    .toBuffer()

  return `data:image/webp;base64,${thumbnail.toString('base64')}`
}

/**
 * Extract dominant color from image
 */
export async function getDominantColor(buffer: Buffer): Promise<string> {
  // Simple approach: resize to 1px and get the color
  const pixel = await sharp(buffer)
    .resize(1, 1, { fit: 'cover' })
    .raw()
    .toBuffer()

  // Interpret as RGB
  const r = pixel[0]
  const g = pixel[1]
  const b = pixel[2]

  return `rgb(${r},${g},${b})`
}
