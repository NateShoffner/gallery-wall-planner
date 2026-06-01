'use client'

import { useRef, useEffect, useState, ReactNode } from 'react'
import { isDesktop } from '@/lib/platform'
import { Store } from '@tauri-apps/plugin-store'

interface ResizablePanelProps {
  children: ReactNode
  side: 'left' | 'right'
  defaultWidth: number
  minWidth: number
  maxWidth: number
  storageKey: string
  className?: string
  style?: React.CSSProperties
}

let tauriStore: Store | null = null

async function getTauriStore(): Promise<Store> {
  if (!tauriStore) {
    tauriStore = await Store.load('settings.json')
  }
  return tauriStore
}

export function ResizablePanel({
  children,
  side,
  defaultWidth,
  minWidth,
  maxWidth,
  storageKey,
  className = '',
  style = {},
}: ResizablePanelProps) {
  const [width, setWidth] = useState(defaultWidth)
  const [isResizing, setIsResizing] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  // Load width from storage on mount
  useEffect(() => {
    const loadWidth = async () => {
      try {
        let stored: string | null | undefined = null
        
        if (isDesktop()) {
          const store = await getTauriStore()
          stored = await store.get<string>(storageKey)
        } else {
          stored = localStorage.getItem(storageKey)
        }
        
        if (stored) {
          const parsed = parseInt(stored, 10)
          if (!isNaN(parsed) && parsed >= minWidth && parsed <= maxWidth) {
            setWidth(parsed)
          }
        }
      } catch (error) {
        console.error('Failed to load panel width:', error)
      }
    }
    
    loadWidth()
  }, [storageKey, minWidth, maxWidth])

  // Save width to storage when it changes
  useEffect(() => {
    const saveWidth = async () => {
      try {
        if (isDesktop()) {
          const store = await getTauriStore()
          await store.set(storageKey, String(width))
          await store.save()
        } else {
          localStorage.setItem(storageKey, String(width))
        }
      } catch (error) {
        console.error('Failed to save panel width:', error)
      }
    }
    
    saveWidth()
  }, [width, storageKey])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    startXRef.current = e.clientX
    startWidthRef.current = width
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const delta = side === 'left' ? e.clientX - startXRef.current : startXRef.current - e.clientX
      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidthRef.current + delta))
      setWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, side, minWidth, maxWidth])

  return (
    <div
      ref={panelRef}
      className={className}
      style={{
        ...style,
        width,
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {children}
      
      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 bottom-0 w-1 cursor-col-resize group"
        style={{
          [side === 'left' ? 'right' : 'left']: 0,
          zIndex: 100,
        }}
      >
        <div
          className="h-full w-full transition-colors"
          style={{
            background: isResizing ? 'var(--accent-blue)' : 'transparent',
          }}
          onMouseEnter={(e) => {
            if (!isResizing) e.currentTarget.style.background = 'rgba(59,130,246,0.3)'
          }}
          onMouseLeave={(e) => {
            if (!isResizing) e.currentTarget.style.background = 'transparent'
          }}
        />
      </div>
    </div>
  )
}
