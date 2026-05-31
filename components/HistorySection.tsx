'use client'

import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRotateLeft, faRotateRight, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import { useStore } from '@/store/useStore'

export function HistorySection() {
  const undoStack = useStore((s) => s.undoStack)
  const redoStack = useStore((s) => s.redoStack)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const restoreSnapshot = useStore((s) => s.restoreSnapshot)
  const [open, setOpen] = useState(true)
  const [, setTick] = useState(0)

  const canUndo = undoStack.length > 0
  const canRedo = redoStack.length > 0
  const total = undoStack.length

  // Force re-render every 10 seconds to update timestamps
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1)
    }, 10_000)
    return () => clearInterval(interval)
  }, [])

  function formatTime(ts: number): string {
    const diff = Date.now() - ts
    if (diff < 10_000) return 'just now'
    if (diff < 60_000) return `${Math.floor(diff / 1_000)}s ago`
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
    return `${Math.floor(diff / 86_400_000)}d ago`
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
