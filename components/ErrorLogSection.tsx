'use client'

import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronDown,
  faChevronUp,
  faCircleExclamation,
  faXmark,
  faEyeSlash,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'
import { useStore } from '@/store/useStore'
import type { ErrorLogEntry } from '@/types'

function formatTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  return `${Math.floor(diff / 3_600_000)}h ago`
}

function getErrorIcon(_type: ErrorLogEntry['type']) {
  return faCircleExclamation
}

function getErrorColor(type: ErrorLogEntry['type']) {
  const colors = {
    pattern: '#f59e0b',
    overlap: '#ef4444',
    feasibility: '#f59e0b',
    general: '#6b7280',
  }
  return colors[type]
}

export function ErrorLogSection() {
  const errorLog = useStore((s) => s.errorLog)
  const dismissError = useStore((s) => s.dismissError)
  const clearErrors = useStore((s) => s.clearErrors)
  const suppressErrorPattern = useStore((s) => s.suppressErrorPattern)
  
  const [open, setOpen] = useState(false)
  const [expandedError, setExpandedError] = useState<string | null>(null)

  // Only show non-dismissed errors in the count
  const activeErrors = errorLog.filter((e) => !e.dismissed)
  const errorCount = activeErrors.length

  function handleSuppress(error: ErrorLogEntry) {
    const patternKey = `${error.type}:${error.message}`
    suppressErrorPattern(patternKey)
    dismissError(error.id)
  }

  return (
    <div className="flex-shrink-0" style={{ borderTop: '1px solid var(--border-subtle)' }}>
      {/* Collapse header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 transition-colors"
        style={{ background: 'transparent' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-elevated)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--text-muted)' }}
          >
            Error Log
          </span>
          {errorCount > 0 && (
            <span
              className="flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-bold"
              style={{
                background: 'rgba(239,68,68,0.2)',
                color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.4)',
              }}
            >
              {errorCount}
            </span>
          )}
        </div>
        <FontAwesomeIcon
          icon={open ? faChevronDown : faChevronUp}
          style={{ fontSize: 9, color: 'var(--text-muted)', opacity: 0.5 }}
        />
      </button>

      {open && (
        <div className="flex flex-col" style={{ maxHeight: 320, overflowY: 'auto' }}>
          {/* Clear button */}
          {errorCount > 0 && (
            <div className="flex gap-1.5 px-3 pb-2">
              <button
                onClick={clearErrors}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-xs transition-colors"
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                }}
                title="Clear all errors"
              >
                <FontAwesomeIcon icon={faTrash} /> Clear All
              </button>
            </div>
          )}

          {/* Error list */}
          <div className="flex flex-col px-3 pb-3 gap-1">
            {activeErrors.length === 0 && (
              <p
                className="text-xs text-center py-3"
                style={{ color: 'var(--text-muted)' }}
              >
                No errors
              </p>
            )}
            {activeErrors.map((error) => {
              const isExpanded = expandedError === error.id
              const errorColor = getErrorColor(error.type)
              
              return (
                <div
                  key={error.id}
                  className="flex flex-col gap-1.5 px-2.5 py-2 rounded"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: `1px solid ${errorColor}33`,
                  }}
                >
                  {/* Error header */}
                  <div className="flex items-start gap-2">
                    <FontAwesomeIcon
                      icon={getErrorIcon(error.type)}
                      style={{ fontSize: 11, color: errorColor, marginTop: 2, flexShrink: 0 }}
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-[11px] leading-snug"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {error.message}
                      </div>
                      <div
                        className="text-[10px] mt-0.5"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {formatTime(error.timestamp)}
                        {error.context?.patternName && (
                          <span> • Pattern: {error.context.patternName}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => dismissError(error.id)}
                      className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded text-[10px] transition-colors"
                      style={{
                        color: 'var(--text-muted)',
                        opacity: 0.6,
                      }}
                      title="Dismiss"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '1'
                        e.currentTarget.style.background = 'var(--bg-hover)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '0.6'
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </div>

                  {/* Context details (expandable) */}
                  {error.context && (
                    <>
                      <button
                        onClick={() =>
                          setExpandedError(isExpanded ? null : error.id)
                        }
                        className="text-[10px] text-left px-1 py-0.5 rounded transition-colors"
                        style={{
                          color: errorColor,
                          opacity: 0.8,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '1'
                          e.currentTarget.style.background = `${errorColor}15`
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '0.8'
                          e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        {isExpanded ? 'Hide' : 'Show'} details
                      </button>

                      {isExpanded && (
                        <div
                          className="text-[10px] px-2 py-1.5 rounded"
                          style={{
                            background: `${errorColor}0a`,
                            border: `1px solid ${errorColor}20`,
                            color: 'var(--text-muted)',
                          }}
                        >
                          {error.context.pieceCount !== undefined && (
                            <div>Pieces: {error.context.pieceCount}</div>
                          )}
                          {error.context.wallSize && (
                            <div>
                              Wall: {error.context.wallSize.width}″ ×{' '}
                              {error.context.wallSize.height}″
                            </div>
                          )}
                          {error.context.gap !== undefined && (
                            <div>Gap: {error.context.gap.toFixed(2)}″</div>
                          )}
                          {error.context.allowOverlap !== undefined && (
                            <div>
                              Overlap:{' '}
                              {error.context.allowOverlap ? 'Enabled' : 'Disabled'}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* Actions */}
                  <div className="flex gap-1.5 mt-0.5">
                    <button
                      onClick={() => handleSuppress(error)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-[10px] transition-colors"
                      style={{
                        background: 'var(--bg-input)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border-subtle)',
                      }}
                      title="Suppress this error pattern"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-hover)'
                        e.currentTarget.style.color = 'var(--text-secondary)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--bg-input)'
                        e.currentTarget.style.color = 'var(--text-muted)'
                      }}
                    >
                      <FontAwesomeIcon icon={faEyeSlash} /> Suppress
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

