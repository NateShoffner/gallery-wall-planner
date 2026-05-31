'use client'

import { memo, useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLock, faLockOpen, faTrash, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons'
import { useStore } from '@/store/useStore'
import { formatAngle, toDisplayUnit, unitSuffix } from '@/lib/utils'
import type { Piece } from '@/types'

interface PieceCardProps {
  piece: Piece
  selected: boolean
}

export const PieceCard = memo(function PieceCard({ piece, selected }: PieceCardProps) {
  const imageCache = useStore((s) => s.imageCache)
  const unit = useStore((s) => s.unit)
  const selectPiece = useStore((s) => s.selectPiece)
  const removePiece = useStore((s) => s.removePiece)
  const toggleLock = useStore((s) => s.toggleLock)

  const [confirmDelete, setConfirmDelete] = useState(false)

  const thumbnail = piece.imageId ? imageCache[piece.imageId] : null
  const suf = unitSuffix(unit)
  const dispW = toDisplayUnit(piece.w, unit).toFixed(unit === 'in' ? 0 : 1)
  const dispH = toDisplayUnit(piece.h, unit).toFixed(unit === 'in' ? 0 : 1)

  // Auto-dismiss confirm after 4s
  useEffect(() => {
    if (!confirmDelete) return
    const id = setTimeout(() => setConfirmDelete(false), 4000)
    return () => clearTimeout(id)
  }, [confirmDelete])

  return (
    <div
      className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg cursor-pointer transition-all select-none"
      style={{
        background: selected ? 'var(--bg-selected)' : 'transparent',
        border: `1px solid ${selected ? 'rgba(249,115,22,0.4)' : 'transparent'}`,
      }}
      onClick={() => { if (!confirmDelete) selectPiece(piece.id) }}
      onMouseEnter={(e) => {
        if (!selected) e.currentTarget.style.background = 'var(--bg-elevated)'
      }}
      onMouseLeave={(e) => {
        if (!selected) e.currentTarget.style.background = 'transparent'
      }}
    >
      {/* Swatch or thumbnail */}
      {thumbnail ? (
        <img
          src={thumbnail}
          alt=""
          className="w-8 h-8 rounded object-cover flex-shrink-0"
          style={{ border: '1px solid var(--border-subtle)' }}
        />
      ) : (
        <div
          className="w-8 h-8 rounded flex-shrink-0"
          style={{ background: piece.color, border: '1px solid rgba(0,0,0,0.2)' }}
        />
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div
          className="text-sm font-medium truncate"
          style={{ color: piece.name ? 'var(--text-primary)' : 'var(--text-secondary)' }}
        >
          {piece.name || `${dispW} × ${dispH} ${suf}`}
        </div>
        <div className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
          {piece.name && <span>{dispW} × {dispH} {suf} · </span>}
          {formatAngle(piece.rotation)}
          {piece.locked && (
            <FontAwesomeIcon icon={faLock} className="ml-1.5" style={{ fontSize: 9 }} />
          )}
        </div>
      </div>

      {/* Quick actions */}
      {confirmDelete ? (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            title="Confirm remove"
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); removePiece(piece.id) }}
            className="h-7 px-2 rounded flex items-center gap-1 text-xs font-medium transition-colors"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <FontAwesomeIcon icon={faCheck} style={{ fontSize: 10 }} /> Yes
          </button>
          <button
            title="Cancel"
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(false) }}
            className="w-7 h-7 rounded flex items-center justify-center text-xs transition-colors"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
          >
            <FontAwesomeIcon icon={faXmark} style={{ fontSize: 10 }} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            title={piece.locked ? 'Unlock' : 'Lock'}
            onClick={(e) => { e.stopPropagation(); toggleLock(piece.id) }}
            className="w-7 h-7 rounded flex items-center justify-center text-xs transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <FontAwesomeIcon icon={piece.locked ? faLockOpen : faLock} style={{ fontSize: 11 }} />
          </button>
          <button
            title="Remove"
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
            className="w-7 h-7 rounded flex items-center justify-center text-xs transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#f87171'
              e.currentTarget.style.background = 'rgba(239,68,68,0.12)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <FontAwesomeIcon icon={faTrash} style={{ fontSize: 11 }} />
          </button>
        </div>
      )}
    </div>
  )
})

