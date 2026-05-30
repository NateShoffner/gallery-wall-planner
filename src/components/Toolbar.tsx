import { useRef, useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faRotateLeft, faRotateRight, faWandMagicSparkles, faShuffle,
  faObjectGroup, faTrashCan, faFileImport, faFileExport,
  faCheck, faXmark, faCamera,
} from '@fortawesome/free-solid-svg-icons'
import { useStore } from '../store/useStore'

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
    violet: 'rgba(139,92,246,0.2)',
    danger: 'transparent',
    warning: 'rgba(251,191,36,0.15)',
    amber: 'rgba(245,158,11,0.18)',
    default: 'var(--bg-elevated)',
  }
  const borderMap = {
    violet: 'rgba(139,92,246,0.4)',
    danger: 'transparent',
    warning: 'rgba(251,191,36,0.4)',
    amber: 'rgba(245,158,11,0.45)',
    default: 'var(--border-normal)',
  }
  const colorMap = {
    violet: '#c4b5fd',
    danger: 'var(--text-muted)',
    warning: '#fde68a',
    amber: '#fcd34d',
    default: 'var(--text-secondary)',
  }
  const hoverBgMap = {
    violet: 'var(--bg-hover)',
    danger: undefined,
    warning: 'rgba(251,191,36,0.25)',
    amber: 'rgba(245,158,11,0.28)',
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

type PendingAction = 'clear' | 'demo' | null

const CONFIRM_LABELS: Record<NonNullable<PendingAction>, string> = {
  demo: 'Load demo layout? Current canvases will be replaced.',
  clear: 'Remove all canvases?',
}

export function Toolbar() {
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

  useEffect(() => {
    if (!pending) return
    const id = setTimeout(() => setPending(null), 4000)
    return () => clearTimeout(id)
  }, [pending])

  function confirm() {
    if (!pending) return
    if (pending === 'clear') clearAll()
    else if (pending === 'demo') loadDemo()
    setPending(null)
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
          <Btn onClick={() => shuffle()} title="Swap similar-sized canvases">
            <FontAwesomeIcon icon={faShuffle} /> Shuffle
          </Btn>
          <Btn
            onClick={() => cluster()}
            accent="violet"
            title="Cluster canvases using a random enabled pattern"
          >
            <FontAwesomeIcon icon={faObjectGroup} /> Cluster
          </Btn>
          <Btn onClick={() => setPending('clear')} title="Remove all canvases">
            <FontAwesomeIcon icon={faTrashCan} />
          </Btn>
        </>
      )}

      <div className="flex-1" />

      {/* Import / Export / Save image */}
      <Btn onClick={() => importRef.current?.click()} title="Import layout from JSON">
        <FontAwesomeIcon icon={faFileImport} /> Import
      </Btn>
      <Btn onClick={() => void exportLayout()} title="Export layout as JSON">
        <FontAwesomeIcon icon={faFileExport} /> Export
      </Btn>
      <Btn onClick={() => void exportAsImage()} title="Save layout as PNG image">
        <FontAwesomeIcon icon={faCamera} /> Save Image
      </Btn>

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
