import sharp from 'sharp'

/**
 * Compress image for AI processing using Sharp
 * Target: ~1024px max dimension, JPEG format
 */
export async function compressImageForAI(
  dataUrl: string,
  maxDimension = 1024
): Promise<string> {
  // Extract base64 data from data URL
  const base64Data = dataUrl.split(',')[1]
  if (!base64Data) {
    throw new Error('Invalid data URL format')
  }
  
  const buffer = Buffer.from(base64Data, 'base64')
  
  // Get image metadata
  const metadata = await sharp(buffer).metadata()
  
  if (!metadata.width || !metadata.height) {
    throw new Error('Invalid image: cannot read dimensions')
  }
  
  // Calculate scale factor
  const scale = Math.min(1, maxDimension / Math.max(metadata.width, metadata.height))
  
  if (scale >= 1) {
    // No compression needed, but convert to JPEG
    const jpeg = await sharp(buffer)
      .jpeg({ quality: 85 })
      .toBuffer()
    
    return `data:image/jpeg;base64,${jpeg.toString('base64')}`
  }
  
  // Resize and compress
  const newWidth = Math.round(metadata.width * scale)
  const newHeight = Math.round(metadata.height * scale)
  
  const compressed = await sharp(buffer)
    .resize(newWidth, newHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85 })
    .toBuffer()
  
  return `data:image/jpeg;base64,${compressed.toString('base64')}`
}

/**
 * Validate uploaded image
 */
export function validateImage(dataUrl: string, maxSizeBytes = 10 * 1024 * 1024) {
  // Check if it's a valid data URL
  if (!dataUrl.startsWith('data:image/')) {
    throw new Error('Invalid image format')
  }
  
  // Extract base64 and check size
  const base64Data = dataUrl.split(',')[1]
  if (!base64Data) {
    throw new Error('Invalid data URL format')
  }
  
  const buffer = Buffer.from(base64Data, 'base64')
  
  if (buffer.length > maxSizeBytes) {
    throw new Error(`Image size exceeds ${maxSizeBytes / 1024 / 1024}MB limit`)
  }
  
  return true
}
