import { memo } from 'react'
import { checkOob } from '../lib/utils'
import type { Piece, Wall, ResizeHandle } from '../types'

const RESIZE_HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

interface CanvasPieceProps {
  piece: Piece
  selected: boolean
  wall: Wall
  imageUrl: string | undefined
  scale: number
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
  onPieceMousedown,
  onHandleMousedown,
  onResizeMousedown,
}: CanvasPieceProps) {
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
    </div>
  )
})
