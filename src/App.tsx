import { useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { useStore } from './store/useStore'
import { Toolbar } from './components/Toolbar'
import { Sidebar } from './components/Sidebar'
import { WallCanvas } from './components/WallCanvas'
import { RightPanel } from './components/RightPanel'

export type ZoomMode = 'fit' | number

export default function App() {
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const initImages = useStore((s) => s.initImages)
  const theme = useStore((s) => s.theme)
  const showRulers = useStore((s) => s.showRulers)

  const [zoomMode, setZoomMode] = useState<ZoomMode>('fit')
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => { void initImages() }, [initImages])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const ctrl = e.ctrlKey || e.metaKey
      if (!ctrl) return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); redo() }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [undo, redo])

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-normal)',
            borderRadius: '6px',
            padding: '12px 16px',
            fontSize: '14px',
          },
          success: {
            style: {
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--accent-blue)',
            },
          },
          error: {
            style: {
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--accent-orange)',
            },
            iconTheme: {
              primary: 'var(--accent-orange)',
              secondary: 'var(--bg-elevated)',
            },
          },
        }}
      />
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
