import { useEffect, useState } from 'react'
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

  const [zoomMode, setZoomMode] = useState<ZoomMode>('fit')
  const [showLegend, setShowLegend] = useState(true)

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
      <Toolbar 
        zoomMode={zoomMode} 
        setZoomMode={setZoomMode}
        showLegend={showLegend}
        setShowLegend={setShowLegend}
      />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <WallCanvas 
          zoomMode={zoomMode} 
          setZoomMode={setZoomMode}
          showLegend={showLegend}
        />
        <RightPanel />
      </div>
    </div>
  )
}
