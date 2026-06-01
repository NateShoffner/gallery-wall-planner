/**
 * Platform detection utilities
 * Detects whether the app is running in a Tauri desktop environment or web browser
 */

/**
 * Check if the app is running in Tauri desktop mode
 */
export const isDesktop = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI__' in window
}

/**
 * Check if the app is running in web browser mode
 */
export const isWeb = (): boolean => {
  return !isDesktop()
}

/**
 * Get the current platform type
 */
export type Platform = 'desktop' | 'web'

export const getPlatform = (): Platform => {
  return isDesktop() ? 'desktop' : 'web'
}
