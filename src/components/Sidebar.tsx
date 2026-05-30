import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faXmark, faRotateLeft, faRotateRight, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import { useStore } from '../store/useStore'
import { fromDisplayUnit, unitSuffix, toDisplayUnit } from '../lib/utils'
import { PieceCard } from './PieceCard'

function HistorySection() {
  const undoStack = useStore((s) => s.undoStack)
  const redoStack = useStore((s) => s.redoStack)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const restoreSnapshot = useStore((s) => s.restoreSnapshot)
  const [open, setOpen] = useState(true)

  const canUndo = undoStack.length > 0
  const canRedo = redoStack.length > 0
  const total = undoStack.length

  function formatTime(ts: number): string {
    const diff = Date.now() - ts
    if (diff < 60_000) return 'just now'
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
    return `${Math.floor(diff / 3_600_000)}h ago`
  }

  return (
    <div className="flex-shrink-0" style={{ borderTop: '1px solid var(--border-subtle)' }}>
      {/* Collapse header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 transition-colors"
        style={{ background: 'transparent' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            History
          </span>
          {total > 0 && (
            <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)', opacity: 0.55 }}>
              {total}
            </span>
          )}
        </div>
        <FontAwesomeIcon
          icon={open ? faChevronDown : faChevronUp}
          style={{ fontSize: 9, color: 'var(--text-muted)', opacity: 0.5 }}
        />
      </button>

      {open && (
        <div className="flex flex-col" style={{ maxHeight: 260, overflowY: 'auto' }}>
          {/* Undo / Redo */}
          <div className="flex gap-1.5 px-3 pb-2">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-xs transition-colors disabled:opacity-30"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
              title="Undo (Ctrl+Z)"
            >
              <FontAwesomeIcon icon={faRotateLeft} /> Undo
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-xs transition-colors disabled:opacity-30"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
              title="Redo (Ctrl+Y)"
            >
              <FontAwesomeIcon icon={faRotateRight} /> Redo
            </button>
          </div>

          {/* Current state indicator */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 mx-3 mb-1 rounded"
            style={{ background: 'var(--history-current)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--accent-blue)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--accent-blue)' }}>Current</span>
            <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>{total} step{total !== 1 ? 's' : ''}</span>
          </div>

          {/* Undo stack — most recent first */}
          <div className="flex flex-col px-3 pb-3 gap-0.5">
            {undoStack.length === 0 && (
              <p className="text-xs text-center py-3" style={{ color: 'var(--text-muted)' }}>No history yet</p>
            )}
            {[...undoStack].reverse().map((snap, i) => {
              const realIdx = undoStack.length - 1 - i
              return (
                <div
                  key={`${snap.timestamp}-${i}`}
                  className="group flex items-center gap-1.5 px-2 py-1 rounded text-[11px]"
                  style={{ background: 'var(--history-undo)', color: 'var(--text-secondary)' }}
                >
                  <FontAwesomeIcon icon={faRotateLeft} style={{ fontSize: 9, color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span className="flex-1 truncate">{snap.label}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 10, flexShrink: 0 }}>{formatTime(snap.timestamp)}</span>
                  <button
                    onClick={() => restoreSnapshot(realIdx, 'undo')}
                    className="opacity-0 group-hover:opacity-100 flex-shrink-0 px-1 py-0.5 rounded text-[10px] transition-opacity"
                    style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.3)' }}
                    title="Restore to this state"
                  >
                    Restore
                  </button>
                </div>
              )
            })}

            {redoStack.length > 0 && (
              <>
                <div className="text-[10px] uppercase tracking-widest px-1 pt-1.5 pb-0.5" style={{ color: 'var(--text-muted)', opacity: 0.45 }}>
                  Redo available
                </div>
                {[...redoStack].reverse().map((snap, i) => {
                  const realIdx = redoStack.length - 1 - i
                  return (
                    <div
                      key={`redo-${snap.timestamp}-${i}`}
                      className="group flex items-center gap-1.5 px-2 py-1 rounded text-[11px] opacity-40 hover:opacity-60"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <FontAwesomeIcon icon={faRotateRight} style={{ fontSize: 9, flexShrink: 0 }} />
                      <span className="flex-1 truncate">{snap.label}</span>
                      <button
                        onClick={() => restoreSnapshot(realIdx, 'redo')}
                        className="opacity-0 group-hover:opacity-100 flex-shrink-0 px-1 py-0.5 rounded text-[10px] transition-opacity"
                        style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.3)' }}
                      >
                        Restore
                      </button>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  const pieces = useStore((s) => s.pieces)
  const selectedId = useStore((s) => s.selectedId)
  const unit = useStore((s) => s.unit)
  const addPiece = useStore((s) => s.addPiece)

  const [adding, setAdding] = useState(false)
  const [addW, setAddW] = useState('')
  const [addH, setAddH] = useState('')

  const suf = unitSuffix(unit)
  const exW = unit === 'cm' ? '60' : unit === 'ft' ? '2' : '24'
  const exH = unit === 'cm' ? '90' : unit === 'ft' ? '3' : '36'

  function handleAdd() {
    const wDisplay = parseFloat(addW)
    const hDisplay = parseFloat(addH)
    if (wDisplay > 0 && hDisplay > 0) {
      addPiece(fromDisplayUnit(wDisplay, unit), fromDisplayUnit(hDisplay, unit))
      setAddW('')
      setAddH('')
      setAdding(false)
    }
  }

  const totalArea = pieces.reduce((s, p) => s + toDisplayUnit(p.w * p.h, unit), 0)

  return (
    <aside
      className="flex-shrink-0 flex flex-col"
      style={{
        width: 264,
        background: 'var(--bg-panel)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Items
          </div>
          {pieces.length > 0 && (
            <div className="text-sm mt-0.5 tabular-nums" style={{ color: 'var(--text-muted)', opacity: 0.65 }}>
              {pieces.length} item{pieces.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        <button
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: adding ? 'var(--accent-blue)' : 'rgba(59,130,246,0.15)',
            border: `1px solid ${adding ? 'var(--accent-blue)' : 'rgba(59,130,246,0.3)'}`,
            color: adding ? 'white' : 'var(--accent-blue)',
          }}
        >
          {adding
            ? <><FontAwesomeIcon icon={faXmark} /> Cancel</>
            : <><FontAwesomeIcon icon={faPlus} /> Add</>
          }
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div
          className="flex flex-col gap-3 px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-input)' }}
        >
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            New item size ({suf})
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Width</label>
              <input
                type="number"
                placeholder={exW}
                value={addW}
                min={1}
                max={unit === 'cm' ? 300 : unit === 'ft' ? 10 : 120}
                autoFocus
                onChange={(e) => setAddW(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd()
                  if (e.key === 'Escape') setAdding(false)
                }}
                className="w-full px-2.5 py-2 rounded text-sm tabular-nums"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-normal)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 18, flexShrink: 0 }}>×</span>
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Height</label>
              <input
                type="number"
                placeholder={exH}
                value={addH}
                min={1}
                max={unit === 'cm' ? 300 : unit === 'ft' ? 10 : 120}
                onChange={(e) => setAddH(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd()
                  if (e.key === 'Escape') setAdding(false)
                }}
                className="w-full px-2.5 py-2 rounded text-sm tabular-nums"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-normal)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>
          </div>
          <button
            onClick={handleAdd}
            className="w-full py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: 'var(--accent-blue)', color: 'white' }}
          >
            Add Item
          </button>
        </div>
      )}

      {/* Piece list */}
      <div className="flex-1 overflow-y-auto py-2 px-2 flex flex-col gap-0.5">
        {pieces.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
            <span className="text-3xl" style={{ opacity: 0.1 }}>🖼</span>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Load <strong style={{ color: 'var(--text-secondary)' }}>Demo</strong> or click{' '}
              <strong style={{ color: 'var(--accent-blue)' }}>+ Add</strong> to get started.
            </p>
          </div>
        ) : (
          <>
            {pieces.map((piece) => (
              <PieceCard key={piece.id} piece={piece} selected={piece.id === selectedId} />
            ))}
            {pieces.length > 1 && (
              <div className="px-2.5 py-2 text-xs" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
                Total area: ~{totalArea.toFixed(0)} {unit === 'in' ? 'sq in' : `sq ${unit}`}
              </div>
            )}
          </>
        )}
      </div>

      {/* History panel — collapsible at the bottom */}
      <HistorySection />
    </aside>
  )
}
