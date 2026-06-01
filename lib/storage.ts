/**
 * Unified image storage API
 * Automatically uses the correct storage backend based on platform
 */

import { isDesktop } from './platform'

// Import both implementations
import * as webStorage from './imageStore'
import * as desktopStorage from './desktopImageStore'

/**
 * Get the appropriate storage implementation for the current platform
 */
function getStorage() {
  return isDesktop() ? desktopStorage : webStorage
}

/**
 * Store an image
 */
export async function storeImage(id: string, dataUrl: string): Promise<void> {
  return getStorage().storeImage(id, dataUrl)
}

/**
 * Get all images
 */
export async function getAllImages(): Promise<Record<string, string>> {
  return getStorage().getAllImages()
}

/**
 * Delete a specific image
 */
export async function deleteImage(id: string): Promise<void> {
  return getStorage().deleteImage(id)
}

/**
 * Clear all images
 */
export async function clearAllImages(): Promise<void> {
  return getStorage().clearAllImages()
}

/**
 * Convert File to data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
  return getStorage().fileToDataUrl(file)
}
