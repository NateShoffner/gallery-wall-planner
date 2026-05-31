'use client'

/**
 * Compress image for API transmission (client-side)
 */
export async function compressImageForAI(
  file: File,
  maxDimension = 1024
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
        
        const canvas = document.createElement('canvas')
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        // Convert to JPEG for better compression
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target!.result as string
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Apply AI-detected transformations to original image
 */
export async function transformImage(
  file: File,
  rotation: number,
  bounds: { x: number; y: number; w: number; h: number }
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        try {
          // Step 1: Rotate image
          const rotatedCanvas = rotateCanvas(img, rotation)
          
          // Step 2: Crop to detected bounds
          const finalCanvas = document.createElement('canvas')
          
          const bx = bounds.x * rotatedCanvas.width
          const by = bounds.y * rotatedCanvas.height
          const bw = bounds.w * rotatedCanvas.width
          const bh = bounds.h * rotatedCanvas.height
          
          finalCanvas.width = bw
          finalCanvas.height = bh
          
          const ctx = finalCanvas.getContext('2d')!
          ctx.drawImage(
            rotatedCanvas,
            bx, by, bw, bh,  // source rect
            0, 0, bw, bh     // dest rect
          )
          
          // Convert back to File
          finalCanvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob'))
                return
              }
              
              const newFile = new File([blob], file.name, { type: file.type })
              resolve(newFile)
            },
            file.type,
            0.95
          )
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target!.result as string
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Rotate canvas by specified degrees
 */
function rotateCanvas(img: HTMLImageElement, degrees: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  const rad = (degrees * Math.PI) / 180
  
  // Calculate new canvas size after rotation
  const cos = Math.abs(Math.cos(rad))
  const sin = Math.abs(Math.sin(rad))
  const newWidth = img.width * cos + img.height * sin
  const newHeight = img.width * sin + img.height * cos
  
  canvas.width = newWidth
  canvas.height = newHeight
  
  const ctx = canvas.getContext('2d')!
  
  // Rotate around center
  ctx.translate(newWidth / 2, newHeight / 2)
  ctx.rotate(rad)
  ctx.drawImage(img, -img.width / 2, -img.height / 2)
  
  return canvas
}

/**
 * Create preview data URL from File
 */
export async function createPreviewUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target!.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}
