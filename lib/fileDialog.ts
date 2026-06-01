/**
 * Unified file dialog API
 * Uses native dialogs in desktop, falls back to browser downloads in web
 */

import { isDesktop } from './platform'
import { save, open } from '@tauri-apps/plugin-dialog'
import { writeFile, writeTextFile } from '@tauri-apps/plugin-fs'

/**
 * Save a text file with native dialog (desktop) or browser download (web)
 */
export async function saveTextFile(
  defaultFilename: string,
  content: string,
  filters?: Array<{ name: string; extensions: string[] }>
): Promise<void> {
  if (isDesktop()) {
    // Desktop: Use native save dialog
    const filePath = await save({
      defaultPath: defaultFilename,
      filters: filters || [{ name: 'Text File', extensions: ['txt'] }],
    })

    if (filePath) {
      await writeTextFile(filePath, content)
    }
  } else {
    // Web: Use browser download
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = defaultFilename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

/**
 * Save a binary file with native dialog (desktop) or browser download (web)
 */
export async function saveBinaryFile(
  defaultFilename: string,
  data: Uint8Array | ArrayBuffer,
  mimeType: string,
  filters?: Array<{ name: string; extensions: string[] }>
): Promise<void> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
  
  if (isDesktop()) {
    // Desktop: Use native save dialog
    const filePath = await save({
      defaultPath: defaultFilename,
      filters: filters || [{ name: 'File', extensions: ['bin'] }],
    })

    if (filePath) {
      await writeFile(filePath, bytes)
    }
  } else {
    // Web: Use browser download
    const blob = new Blob([bytes as BlobPart], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = defaultFilename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

/**
 * Open a text file with native dialog (desktop) or file input (web)
 */
export async function openTextFile(
  filters?: Array<{ name: string; extensions: string[] }>
): Promise<string | null> {
  if (isDesktop()) {
    // Desktop: Use native open dialog
    const selected = await open({
      multiple: false,
      filters: filters || [{ name: 'Text File', extensions: ['txt'] }],
    })

    if (selected && typeof selected === 'string') {
      const { readTextFile } = await import('@tauri-apps/plugin-fs')
      return await readTextFile(selected)
    }
    return null
  } else {
    // Web: Use file input
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      if (filters && filters.length > 0) {
        const extensions = filters.flatMap(f => f.extensions.map(e => `.${e}`))
        input.accept = extensions.join(',')
      }
      input.onchange = async () => {
        const file = input.files?.[0]
        if (file) {
          const text = await file.text()
          resolve(text)
        } else {
          resolve(null)
        }
      }
      input.click()
    })
  }
}

/**
 * Open multiple image files with native dialog (desktop) or file input (web)
 */
export async function openImageFiles(): Promise<File[]> {
  if (isDesktop()) {
    // Desktop: Use native open dialog
    const selected = await open({
      multiple: true,
      filters: [
        { 
          name: 'Images', 
          extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'] 
        }
      ],
    })

    if (!selected) return []

    const paths = Array.isArray(selected) ? selected : [selected]
    const { readFile } = await import('@tauri-apps/plugin-fs')
    
    // Convert file paths to File objects
    const files: File[] = []
    for (const path of paths) {
      try {
        const bytes = await readFile(path)
        const filename = path.split(/[/\\]/).pop() || 'image.png'
        const ext = filename.split('.').pop()?.toLowerCase() || 'png'
        
        let mimeType = 'image/png'
        if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg'
        else if (ext === 'webp') mimeType = 'image/webp'
        else if (ext === 'gif') mimeType = 'image/gif'
        else if (ext === 'svg') mimeType = 'image/svg+xml'
        
        const blob = new Blob([bytes], { type: mimeType })
        const file = new File([blob], filename, { type: mimeType })
        files.push(file)
      } catch (err) {
        console.error(`Failed to read file ${path}:`, err)
      }
    }
    
    return files
  } else {
    // Web: Use file input
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.multiple = true
      input.onchange = () => {
        const files = Array.from(input.files || [])
        resolve(files)
      }
      input.click()
    })
  }
}
