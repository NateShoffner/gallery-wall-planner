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
  onContextMenu?: (e: React.MouseEvent, id: string) => void
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
  onContextMenu,
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
  
  // Calculate margin bounding box dimensions
  const displayMarginW = toDisplayUnit(piece.w + piece.margin * 2, unit)
  const displayMarginH = toDisplayUnit(piece.h + piece.margin * 2, unit)
  
  // Format dimensions: show 0 decimals if it's a whole number, otherwise 1 decimal
  const formatDimension = (value: number) => {
    return value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)
  }

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
      onContextMenu={(e) => {
        e.preventDefault()
        if (onContextMenu) {
          onContextMenu(e, piece.id)
        }
      }}
    >
      {/* Margin indicator */}
      {selected && piece.margin > 0 && (
        <>
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
          {/* Margin size label */}
          {shouldShowInfo && (
            <div
              className="absolute pointer-events-none text-xs font-mono px-2 py-1 rounded shadow-lg"
              style={{
                left: -marginPx,
                bottom: -marginPx - 28,
                transform: `rotate(${-piece.rotation}deg)`,
                transformOrigin: 'top left',
                background: 'rgba(251, 146, 60, 0.9)',
                color: '#fff',
                zIndex: 100,
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                whiteSpace: 'nowrap',
              }}
            >
              {formatDimension(displayMarginW)}{suf} × {formatDimension(displayMarginH)}{suf}
            </div>
          )}
        </>
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
      
      {/* Info tooltip - repositioned with coordinates top-left, dimensions center, rotation top-right */}
      {shouldShowInfo && (
        <>
          {/* Coordinates - top left */}
          <div
            className="absolute pointer-events-none text-xs font-mono px-2 py-1 rounded shadow-lg"
            style={{
              left: 4,
              top: 4,
              transform: `rotate(${-piece.rotation}deg)`,
              transformOrigin: 'top left',
              background: 'rgba(0, 0, 0, 0.85)',
              color: '#fff',
              zIndex: 100,
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              whiteSpace: 'nowrap',
            }}
          >
            {formatDimension(displayX)}{suf} × {formatDimension(displayY)}{suf}
          </div>

          {/* Dimensions - center */}
          <div
            className="absolute pointer-events-none text-xs font-mono px-2 py-1 rounded shadow-lg"
            style={{
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%) rotate(${-piece.rotation}deg)`,
              background: 'rgba(0, 0, 0, 0.85)',
              color: '#fff',
              zIndex: 100,
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              whiteSpace: 'nowrap',
            }}
          >
            {formatDimension(displayW)}{suf} × {formatDimension(displayH)}{suf}
          </div>

          {/* Rotation - top right */}
          <div
            className="absolute pointer-events-none text-xs font-mono px-2 py-1 rounded shadow-lg"
            style={{
              right: 4,
              top: 4,
              transform: `rotate(${-piece.rotation}deg)`,
              transformOrigin: 'top right',
              background: 'rgba(0, 0, 0, 0.85)',
              color: '#fff',
              zIndex: 100,
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {piece.rotation}°
          </div>
        </>
      )}
    </div>
  )
})

