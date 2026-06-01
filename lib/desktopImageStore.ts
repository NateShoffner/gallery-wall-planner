/**
 * Desktop image storage using Tauri filesystem APIs
 * Provides the same interface as the web IndexedDB implementation
 */

import { appDataDir, join } from '@tauri-apps/api/path'
import { 
  readDir, 
  readFile, 
  writeFile, 
  remove,
  mkdir,
  exists
} from '@tauri-apps/plugin-fs'

const IMAGES_DIR = 'images'

/**
 * Ensure the images directory exists
 */
async function ensureImagesDir(): Promise<string> {
  const appDir = await appDataDir()
  const imagesPath = await join(appDir, IMAGES_DIR)
  
  if (!await exists(imagesPath)) {
    await mkdir(imagesPath, { recursive: true })
  }
  
  return imagesPath
}

/**
 * Convert data URL to binary data
 */
function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1]
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * Convert binary data to data URL
 */
function uint8ArrayToDataUrl(bytes: Uint8Array, mimeType: string = 'image/png'): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  const base64 = btoa(binary)
  return `data:${mimeType};base64,${base64}`
}

/**
 * Get MIME type from data URL
 */
function getMimeType(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+);/)
  return match ? match[1] : 'image/png'
}

/**
 * Get file extension from MIME type
 */
function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
  }
  return map[mimeType] || 'png'
}

/**
 * Store an image on the filesystem
 */
export async function storeImage(id: string, dataUrl: string): Promise<void> {
  const imagesDir = await ensureImagesDir()
  const mimeType = getMimeType(dataUrl)
  const ext = getExtension(mimeType)
  const fileName = `${id}.${ext}`
  const filePath = await join(imagesDir, fileName)
  
  const bytes = dataUrlToUint8Array(dataUrl)
  await writeFile(filePath, bytes)
}

/**
 * Get all images from the filesystem
 */
export async function getAllImages(): Promise<Record<string, string>> {
  const imagesDir = await ensureImagesDir()
  const result: Record<string, string> = {}
  
  try {
    const entries = await readDir(imagesDir)
    
    for (const entry of entries) {
      if (entry.isFile && entry.name) {
        // Extract ID from filename (remove extension)
        const id = entry.name.replace(/\.[^.]+$/, '')
        const filePath = await join(imagesDir, entry.name)
        
        try {
          const bytes = await readFile(filePath)
          
          // Determine MIME type from extension
          const ext = entry.name.split('.').pop()?.toLowerCase()
          let mimeType = 'image/png'
          if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg'
          else if (ext === 'webp') mimeType = 'image/webp'
          else if (ext === 'gif') mimeType = 'image/gif'
          else if (ext === 'svg') mimeType = 'image/svg+xml'
          
          result[id] = uint8ArrayToDataUrl(bytes, mimeType)
        } catch (err) {
          console.error(`Failed to read image ${entry.name}:`, err)
        }
      }
    }
  } catch (err) {
    console.error('Failed to read images directory:', err)
  }
  
  return result
}

/**
 * Delete a specific image
 */
export async function deleteImage(id: string): Promise<void> {
  const imagesDir = await ensureImagesDir()
  
  // Try all possible extensions
  const extensions = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg']
  
  for (const ext of extensions) {
    const fileName = `${id}.${ext}`
    const filePath = await join(imagesDir, fileName)
    
    try {
      if (await exists(filePath)) {
        await remove(filePath)
        return
      }
    } catch (err) {
      // Ignore errors, file might not exist
    }
  }
}

/**
 * Clear all images
 */
export async function clearAllImages(): Promise<void> {
  const imagesDir = await ensureImagesDir()
  
  try {
    const entries = await readDir(imagesDir)
    
    for (const entry of entries) {
      if (entry.isFile && entry.name) {
        const filePath = await join(imagesDir, entry.name)
        try {
          await remove(filePath)
        } catch (err) {
          console.error(`Failed to delete ${entry.name}:`, err)
        }
      }
    }
  } catch (err) {
    console.error('Failed to clear images:', err)
  }
}

/**
 * Convert File to data URL (works the same in desktop)
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
