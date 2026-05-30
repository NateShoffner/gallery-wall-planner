import { useRef, useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faRotateLeft, faRotateRight, faWandMagicSparkles, faShuffle,
  faObjectGroup, faTrashCan, faFileImport, faFileExport,
  faCheck, faXmark, faCamera, faChevronDown,
} from '@fortawesome/free-solid-svg-icons'
import { useStore } from '../store/useStore'
import type { ZoomMode } from '../App'

function Btn({
  children,
  onClick,
  title,
  disabled,
  accent,
}: {
  children: React.ReactNode
  onClick?: () => void
  title?: string
  disabled?: boolean
  accent?: 'violet' | 'danger' | 'warning' | 'amber'
}) {
  const bgMap = {
    violet: 'var(--accent-violet-bg)',
    danger: 'transparent',
    warning: 'rgba(251,191,36,0.15)',
    amber: 'var(--accent-amber-bg)',
    default: 'var(--bg-elevated)',
  }
  const borderMap = {
    violet: 'var(--accent-violet-border)',
    danger: 'transparent',
    warning: 'rgba(251,191,36,0.4)',
    amber: 'var(--accent-amber-border)',
    default: 'var(--border-normal)',
  }
  const colorMap = {
    violet: 'var(--accent-violet-text)',
    danger: 'var(--text-muted)',
    warning: '#fde68a',
    amber: 'var(--accent-amber)',
    default: 'var(--text-secondary)',
  }
  const hoverBgMap = {
    violet: 'var(--bg-hover)',
    danger: undefined,
    warning: 'rgba(251,191,36,0.25)',
    amber: 'var(--accent-amber-hover)',
    default: 'var(--bg-hover)',
  }
  const key = accent ?? 'default'

  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="px-3 h-8 rounded text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
      style={{ background: bgMap[key], border: `1px solid ${borderMap[key]}`, color: colorMap[key] }}
      onMouseEnter={(e) => {
        if (disabled) return
        if (accent === 'danger') e.currentTarget.style.color = '#f87171'
        else if (hoverBgMap[key]) e.currentTarget.style.background = hoverBgMap[key]!
      }}
      onMouseLeave={(e) => {
        if (accent === 'danger') e.currentTarget.style.color = colorMap[key]
        else e.currentTarget.style.background = bgMap[key]
      }}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-5 flex-shrink-0" style={{ background: 'var(--border-subtle)' }} />
}

function Toggle({
  checked,
  onChange,
  label,
  title,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  title?: string
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5 h-8 text-xs font-medium transition-all"
      style={{
        background: 'transparent',
        border: 'none',
        color: 'var(--text-secondary)',
        padding: 0,
      }}
      title={title}
    >
      <span>{label}</span>
      <div
        className="relative rounded-full transition-all flex items-center"
        style={{
          width: 36,
          height: 20,
          background: checked ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.1)',
          border: `1.5px solid ${checked ? 'rgba(59,130,246,0.5)' : 'var(--border-subtle)'}`,
          padding: '2px',
        }}
      >
        <div
          className="rounded-full transition-all"
          style={{
            width: 14,
            height: 14,
            background: checked ? '#3b82f6' : 'var(--text-muted)',
            transform: checked ? 'translateX(16px)' : 'translateX(0)',
          }}
        />
      </div>
    </button>
  )
}

type PendingAction = 'clear' | 'demo' | null

const CONFIRM_LABELS: Record<NonNullable<PendingAction>, string> = {
  demo: 'Load demo layout? Current items will be replaced.',
  clear: 'Remove all items?',
}

export function Toolbar({
  zoomMode,
  setZoomMode,
  showLegend,
  setShowLegend,
}: {
  zoomMode: ZoomMode
  setZoomMode: (mode: ZoomMode | ((prev: ZoomMode) => ZoomMode)) => void
  showLegend: boolean
  setShowLegend: (show: boolean | ((prev: boolean) => boolean)) => void
}) {
  const undoStack = useStore((s) => s.undoStack)
  const redoStack = useStore((s) => s.redoStack)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const shuffle = useStore((s) => s.shuffle)
  const cluster = useStore((s) => s.cluster)
  const loadDemo = useStore((s) => s.loadDemo)
  const clearAll = useStore((s) => s.clearAll)
  const exportLayout = useStore((s) => s.exportLayout)
  const exportAsImage = useStore((s) => s.exportAsImage)
  const importLayout = useStore((s) => s.importLayout)

  const importRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<PendingAction>(null)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  const isFit = zoomMode === 'fit'
  const displayScale = typeof zoomMode === 'number' ? zoomMode : 1

  const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4]

  function handleZoomIn() {
    if (isFit) return
    const curr = ZOOM_LEVELS.findIndex((z) => z >= displayScale)
    const next = ZOOM_LEVELS[Math.min(curr + 1, ZOOM_LEVELS.length - 1)]!
    setZoomMode(next)
  }

  function handleZoomOut() {
    if (isFit) return
    const curr = ZOOM_LEVELS.findIndex((z) => z >= displayScale)
    const next = ZOOM_LEVELS[Math.max(curr - 1, 0)]!
    setZoomMode(next)
  }

  function handleFit() {
    setZoomMode((z) => {
      if (z === 'fit') return displayScale || 1
      return 'fit'
    })
  }

  useEffect(() => {
    if (!pending) return
    const id = setTimeout(() => setPending(null), 4000)
    return () => clearTimeout(id)
  }, [pending])

  // Close export menu when clicking outside
  useEffect(() => {
    if (!showExportMenu) return
    const handleClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showExportMenu])

  function confirm() {
    if (!pending) return
    if (pending === 'clear') clearAll()
    else if (pending === 'demo') loadDemo()
    setPending(null)
  }

  async function handleExport(format: 'png' | 'webp' | 'svg') {
    setShowExportMenu(false)
    await exportAsImage(format)
  }

  return (
    <header
      className="flex items-center gap-2 px-4 flex-shrink-0"
      style={{
        height: 56,
        background: 'var(--bg-toolbar)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Brand */}
      <span
        className="text-sm font-semibold mr-2 flex-shrink-0"
        style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
      >
        Gallery Wall Planner
      </span>

      <Divider />

      {/* Undo / Redo */}
      <Btn onClick={undo} disabled={undoStack.length === 0} title={`Undo (Ctrl+Z)${undoStack.length > 0 ? ` — ${undoStack[undoStack.length - 1]!.label}` : ''}`}>
        <FontAwesomeIcon icon={faRotateLeft} /> Undo
      </Btn>
      <Btn onClick={redo} disabled={redoStack.length === 0} title={`Redo (Ctrl+Y)${redoStack.length > 0 ? ` — ${redoStack[redoStack.length - 1]!.label}` : ''}`}>
        <FontAwesomeIcon icon={faRotateRight} /> Redo
      </Btn>

      <Divider />

      {/* Actions */}
      {pending ? (
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {CONFIRM_LABELS[pending]}
          </span>
          <Btn accent="warning" onClick={confirm}>
            <FontAwesomeIcon icon={faCheck} /> Confirm
          </Btn>
          <Btn onClick={() => setPending(null)}>
            <FontAwesomeIcon icon={faXmark} /> Cancel
          </Btn>
        </div>
      ) : (
        <>
          <Btn onClick={() => shuffle()} title="Swap similar-sized items">
            <FontAwesomeIcon icon={faShuffle} /> Shuffle
          </Btn>
          <Btn
            onClick={() => cluster()}
            accent="violet"
            title="Cluster items using a random enabled pattern"
          >
            <FontAwesomeIcon icon={faObjectGroup} /> Cluster
          </Btn>

          <Divider />

          {/* Zoom controls */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleZoomOut}
              disabled={isFit}
              className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold transition-colors"
              style={{ 
                background: 'var(--bg-elevated)', 
                color: isFit ? 'var(--text-disabled)' : 'var(--text-muted)', 
                border: '1px solid var(--border-subtle)',
                cursor: isFit ? 'not-allowed' : 'pointer',
                opacity: isFit ? 0.5 : 1,
              }}
              title="Zoom out"
            >
              −
            </button>
            <button
              onClick={handleFit}
              className="px-3 h-8 rounded text-xs font-semibold transition-colors flex-shrink-0"
              style={{
                background: isFit ? 'rgba(59,130,246,0.15)' : 'var(--bg-elevated)',
                color: isFit ? '#93c5fd' : 'var(--text-muted)',
                border: `1px solid ${isFit ? 'rgba(59,130,246,0.35)' : 'var(--border-subtle)'}`,
                minWidth: 50,
                textAlign: 'center',
              }}
              title={isFit ? 'Auto-fit active — click to fix scale' : 'Click to fit wall to screen'}
            >
              {isFit ? 'Fit' : `${Math.round(displayScale * 10) / 10}px`}
            </button>
            <button
              onClick={handleZoomIn}
              disabled={isFit}
              className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold transition-colors"
              style={{ 
                background: 'var(--bg-elevated)', 
                color: isFit ? 'var(--text-disabled)' : 'var(--text-muted)', 
                border: '1px solid var(--border-subtle)',
                cursor: isFit ? 'not-allowed' : 'pointer',
                opacity: isFit ? 0.5 : 1,
              }}
              title="Zoom in"
            >
              +
            </button>
          </div>

          {/* Ruler toggle */}
          <Toggle
            checked={showLegend}
            onChange={setShowLegend}
            label="Rulers"
            title={showLegend ? 'Hide rulers' : 'Show rulers'}
          />
        </>
      )}

      <div className="flex-1" />

      {/* Import / Export */}
      <Btn onClick={() => importRef.current?.click()} title="Import plan from JSON">
        <FontAwesomeIcon icon={faFileImport} /> Import Plan
      </Btn>
      <Btn onClick={() => void exportLayout()} title="Export plan as JSON">
        <FontAwesomeIcon icon={faFileExport} /> Export Plan
      </Btn>
      
      {/* Export As... dropdown */}
      <div className="relative" ref={exportMenuRef}>
        <Btn onClick={() => setShowExportMenu(!showExportMenu)} title="Export layout as image">
          <FontAwesomeIcon icon={faCamera} /> Export As... <FontAwesomeIcon icon={faChevronDown} className="ml-1" style={{ fontSize: '0.7em' }} />
        </Btn>
        {showExportMenu && (
          <div
            className="absolute top-full mt-1 right-0 rounded shadow-lg overflow-hidden z-50"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              minWidth: '160px',
            }}
          >
            <button
              onClick={() => void handleExport('png')}
              className="w-full px-4 py-2 text-left text-sm transition-colors"
              style={{
                color: 'var(--text-primary)',
                background: 'transparent',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              PNG Image
            </button>
            <button
              onClick={() => void handleExport('webp')}
              className="w-full px-4 py-2 text-left text-sm transition-colors"
              style={{
                color: 'var(--text-primary)',
                background: 'transparent',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              WebP Image
            </button>
            <button
              onClick={() => void handleExport('svg')}
              className="w-full px-4 py-2 text-left text-sm transition-colors"
              style={{
                color: 'var(--text-primary)',
                background: 'transparent',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              SVG Vector
            </button>
          </div>
        )}
      </div>

      <Divider />

      {/* Demo — highlighted, far right, requires confirm */}
      <Btn
        onClick={() => setPending('demo')}
        accent="amber"
        title="Load a demo gallery layout"
      >
        <FontAwesomeIcon icon={faWandMagicSparkles} /> Demo
      </Btn>

      <input
        ref={importRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void importLayout(f)
          e.target.value = ''
        }}
      />
    </header>
  )
}
