'use client'

import { memo, useState } from 'react'
import { checkOob } from '@/lib/utils'
import { toDisplayUnit, unitSuffix } from '@/lib/utils'
import type { Piece, Wall, ResizeHandle, MeasureUnit } from '@/types'

const RESIZE_HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

interface CanvasPieceProps {
  piece: Piece
  selected: boolean
  wall: Wall
  imageUrl: string | undefined
  scale: number
  unit: MeasureUnit
  showPieceInfo: 'off' | 'hover' | 'always'
  onPieceMousedown: (e: React.MouseEvent, id: string) => void
  onHandleMousedown: (e: React.MouseEvent, id: string) => void
  onResizeMousedown: (e: React.MouseEvent, id: string, handle: ResizeHandle) => void
}

export const CanvasPiece = memo(function CanvasPiece({
  piece,
  selected,
  wall,
  imageUrl,
  scale,
  unit,
  showPieceInfo,
  onPieceMousedown,
  onHandleMousedown,
  onResizeMousedown,
}: CanvasPieceProps) {
  const [isHovered, setIsHovered] = useState(false)
  const oob = checkOob(piece.x, piece.y, piece.w, piece.h, piece.rotation, wall)

  const classes = [
    'canvas-piece',
    'absolute',
    selected && 'selected',
    oob && 'oob',
    piece.locked && 'locked',
  ]
    .filter(Boolean)
    .join(' ')

  const marginPx = piece.margin * scale
  const label = piece.name || `${piece.w}"×${piece.h}"`
  
  // Calculate info to display
  const shouldShowInfo = showPieceInfo === 'always' || (showPieceInfo === 'hover' && isHovered)
  const suf = unitSuffix(unit)
  const displayW = toDisplayUnit(piece.w, unit)
  const displayH = toDisplayUnit(piece.h, unit)
  const displayX = toDisplayUnit(piece.x, unit)
  const displayY = toDisplayUnit(piece.y, unit)
  const infoText = `${piece.name || 'Untitled'}\n${displayW.toFixed(unit === 'in' ? 1 : 0)}${suf} × ${displayH.toFixed(unit === 'in' ? 1 : 0)}${suf}\n@(${displayX.toFixed(0)}, ${displayY.toFixed(0)})${suf}\n${piece.rotation}°`

  return (
    <div
      data-piece-id={piece.id}
      className={classes}
      style={{
        left: piece.x * scale,
        top: piece.y * scale,
        width: piece.w * scale,
        height: piece.h * scale,
        backgroundColor: piece.color,
        backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transform: `rotate(${piece.rotation}deg)`,
        transformOrigin: 'center center',
        cursor: piece.locked ? 'not-allowed' : 'grab',
        zIndex: selected ? 10 : 1,
      }}
      onMouseDown={(e) => onPieceMousedown(e, piece.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Margin indicator */}
      {selected && piece.margin > 0 && (
        <div
          className="absolute pointer-events-none rounded"
          style={{
            left: -marginPx,
            top: -marginPx,
            width: piece.w * scale + marginPx * 2,
            height: piece.h * scale + marginPx * 2,
            border: '1.5px dashed rgba(251,146,60,0.45)',
          }}
        />
      )}

      {/* Label — counter-rotated so text stays upright */}
      {!imageUrl && (
        <span
          className="pointer-events-none select-none text-center leading-tight font-semibold px-1"
          style={{
            fontSize: Math.max(9, Math.min(14, (piece.w * scale) / 7)),
            color: 'rgba(0,0,0,0.45)',
            maxWidth: '90%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            transform: `rotate(${-piece.rotation}deg)`,
            display: 'block',
          }}
        >
          {label}
        </span>
      )}

      {/* Rotation handle */}
      {selected && !piece.locked && (
        <div className="rotation-handle" onMouseDown={(e) => onHandleMousedown(e, piece.id)} />
      )}

      {/* Resize handles */}
      {selected && !piece.locked && RESIZE_HANDLES.map((h) => (
        <div
          key={h}
          className="resize-handle"
          data-handle={h}
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onResizeMousedown(e, piece.id, h)
          }}
        />
      ))}
      
      {/* Info tooltip */}
      {shouldShowInfo && (
        <div
          className="absolute pointer-events-none text-xs font-mono leading-relaxed whitespace-pre-line px-2 py-1.5 rounded shadow-lg"
          style={{
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) rotate(${-piece.rotation}deg)`,
            background: 'rgba(0, 0, 0, 0.85)',
            color: '#fff',
            zIndex: 100,
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            maxWidth: '200px',
            textAlign: 'center',
          }}
        >
          {infoText}
        </div>
      )}
    </div>
  )
})

