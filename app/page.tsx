'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'
import { Toolbar } from '@/components/Toolbar'
import { Sidebar } from '@/components/Sidebar'
import { WallCanvas } from '@/components/WallCanvas'
import { RightPanel } from '@/components/RightPanel'

export type ZoomMode = 'fit' | number

export default function HomePage() {
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const selectedId = useStore((s) => s.selectedId)
  const removePiece = useStore((s) => s.removePiece)
  const showRulers = useStore((s) => s.showRulers)

  const [zoomMode, setZoomMode] = useState<ZoomMode>('fit')
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Skip if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      const ctrl = e.ctrlKey || e.metaKey
      
      // Undo/Redo
      if (ctrl) {
        if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
        else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); redo() }
      }
      
      // Delete key - remove selected piece
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && !ctrl) {
        e.preventDefault()
        removePiece(selectedId)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [undo, redo, selectedId, removePiece])

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <Toolbar 
        zoomMode={zoomMode} 
        setZoomMode={setZoomMode}
        previewMode={previewMode}
        setPreviewMode={setPreviewMode}
      />
      <div className="flex flex-1 min-h-0">
        {!previewMode && <Sidebar />}
        <WallCanvas 
          zoomMode={zoomMode} 
          setZoomMode={setZoomMode}
          showLegend={showRulers}
          previewMode={previewMode}
        />
        {!previewMode && <RightPanel />}
      </div>
    </div>
  )
}
