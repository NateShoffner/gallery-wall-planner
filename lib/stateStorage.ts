/**
 * Unified state persistence for Zustand
 * Uses localStorage in web, Tauri Store in desktop
 */

import { StateStorage } from 'zustand/middleware'
import { isDesktop } from './platform'
import { Store } from '@tauri-apps/plugin-store'

let tauriStore: Store | null = null

/**
 * Get or initialize the Tauri store
 */
async function getTauriStore(): Promise<Store> {
  if (!tauriStore) {
    tauriStore = await Store.load('settings.json')
  }
  return tauriStore
}

/**
 * Desktop storage implementation using Tauri Store
 */
const desktopStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const store = await getTauriStore()
      const value = await store.get<string>(name)
      return value ?? null
    } catch (error) {
      console.error('Failed to get item from Tauri store:', error)
      return null
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      const store = await getTauriStore()
      await store.set(name, value)
      await store.save()
    } catch (error) {
      console.error('Failed to set item in Tauri store:', error)
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      const store = await getTauriStore()
      await store.delete(name)
      await store.save()
    } catch (error) {
      console.error('Failed to remove item from Tauri store:', error)
    }
  },
}

/**
 * Web storage implementation using localStorage (async-compatible)
 */
const webStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return localStorage.getItem(name)
  },
  setItem: async (name: string, value: string): Promise<void> => {
    localStorage.setItem(name, value)
  },
  removeItem: async (name: string): Promise<void> => {
    localStorage.removeItem(name)
  },
}

/**
 * Get the appropriate storage implementation for the current platform
 */
export function getStateStorage(): StateStorage {
  return isDesktop() ? desktopStorage : webStorage
}
