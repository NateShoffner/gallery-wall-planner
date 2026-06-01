'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'
import { useMenuAndShortcuts } from '@/lib/useMenuAndShortcuts'
import { Toolbar } from '@/components/Toolbar'
import { LeftPanel } from '@/components/LeftPanel'
import { WallCanvas } from '@/components/WallCanvas'
import { RightPanel } from '@/components/RightPanel'
import { ResizablePanel } from '@/components/ResizablePanel'

export type ZoomMode = 'fit' | number

export default function HomePage() {
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const selectedId = useStore((s) => s.selectedId)
  const removePiece = useStore((s) => s.removePiece)
  const showRulers = useStore((s) => s.showRulers)
  const resetEverything = useStore((s) => s.resetEverything)
  const exportLayout = useStore((s) => s.exportLayout)
  const exportAsImage = useStore((s) => s.exportAsImage)
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const importLayout = useStore((s) => s.importLayout)

  const [zoomMode, setZoomMode] = useState<ZoomMode>('fit')
  const [previewMode, setPreviewMode] = useState(false)

  // Menu and keyboard shortcuts
  useMenuAndShortcuts({
    onNewLayout: () => void resetEverything(),
    onOpenLayout: () => void importLayout(),
    onSaveLayout: () => void exportLayout(),
    onExportImage: () => void exportAsImage(),
    onDeleteSelected: () => selectedId && removePiece(selectedId),
    onToggleDarkMode: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
  })

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
        {!previewMode && (
          <ResizablePanel
            side="left"
            defaultWidth={320}
            minWidth={240}
            maxWidth={600}
            storageKey="leftPanelWidth"
            className="flex flex-col"
          >
            <LeftPanel />
          </ResizablePanel>
        )}
        <WallCanvas 
          zoomMode={zoomMode} 
          setZoomMode={setZoomMode}
          showLegend={showRulers}
          previewMode={previewMode}
        />
        {!previewMode && (
          <ResizablePanel
            side="right"
            defaultWidth={320}
            minWidth={240}
            maxWidth={600}
            storageKey="rightPanelWidth"
            className="flex flex-col"
          >
            <RightPanel />
          </ResizablePanel>
        )}
      </div>
    </div>
  )
}
