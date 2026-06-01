'use client'

import { useEffect } from 'react'
import { isDesktop } from '@/lib/platform'

export function useMenuAndShortcuts(callbacks: {
  onNewLayout?: () => void
  onOpenLayout?: () => void
  onSaveLayout?: () => void
  onExportImage?: () => void
  onDeleteSelected?: () => void
  onToggleDarkMode?: () => void
  onShowAbout?: () => void
  onShowPrivacy?: () => void
}) {
  useEffect(() => {
    if (!isDesktop()) return

    // Import Tauri event listener
    import('@tauri-apps/api/event').then(({ listen }) => {
      const listeners = [
        listen('menu:new_layout', () => callbacks.onNewLayout?.()),
        listen('menu:open_layout', () => callbacks.onOpenLayout?.()),
        listen('menu:save_layout', () => callbacks.onSaveLayout?.()),
        listen('menu:export_image', () => callbacks.onExportImage?.()),
        listen('menu:delete_selected', () => callbacks.onDeleteSelected?.()),
        listen('menu:toggle_dark_mode', () => callbacks.onToggleDarkMode?.()),
        listen('menu:show_about', () => callbacks.onShowAbout?.()),
        listen('menu:show_privacy', () => callbacks.onShowPrivacy?.()),
      ]

      return () => {
        listeners.forEach((listener) => {
          listener.then((unlisten) => unlisten())
        })
      }
    })
  }, [callbacks])

  // Web keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      const isMeta = e.ctrlKey || e.metaKey

      if (isMeta && e.key === 'n') {
        e.preventDefault()
        callbacks.onNewLayout?.()
      } else if (isMeta && e.key === 'o') {
        e.preventDefault()
        callbacks.onOpenLayout?.()
      } else if (isMeta && e.key === 's') {
        e.preventDefault()
        callbacks.onSaveLayout?.()
      } else if (isMeta && e.key === 'e') {
        e.preventDefault()
        callbacks.onExportImage?.()
      } else if (e.key === 'Delete') {
        callbacks.onDeleteSelected?.()
      } else if (isMeta && e.shiftKey && e.key === 'D') {
        e.preventDefault()
        callbacks.onToggleDarkMode?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [callbacks])
}
