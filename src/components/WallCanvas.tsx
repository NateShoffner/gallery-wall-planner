import { useRef, useEffect, useCallback, useState } from 'react'
import { useStore } from '../store/useStore'
import { CanvasPiece } from './CanvasPiece'
import { Ruler } from './Ruler'
import { SCALE } from '../lib/constants'
import { snapToGrid, snapRotation, checkOob, snapToNearbyValid, checkConflict, applyResize } from '../lib/utils'
import type { Piece, ResizeHandle } from '../types'

const RULER_SIZE = 26  // Updated to match Ruler.tsx
const PAD_SIDE = RULER_SIZE + 8  // Reduced from 12 to 8 for tighter spacing
const PAD_BOTTOM = 56

interface DragState {
  pieceId: string
  startX: number
  startY: number
  offsetX: number
  offsetY: number
  pieceW: number
  pieceH: number
  pieceRot: number
  pieceMargin: number
  currentX: number
  currentY: number
}

interface RotateState {
  pieceId: string
  startRotation: number
  centerScreenX: number
  centerScreenY: number
  startAngle: number
  initialRotation: number
  pieceW: number
  pieceH: number
  pieceX: number
  pieceY: number
  pieceMargin: number
  currentRotation: number
}

interface ResizeState {
  pieceId: string
  handle: ResizeHandle
  startX: number
  startY: number
  startW: number
  startH: number
  rotation: number
  startMouseX: number
  startMouseY: number
  currentX: number
  currentY: number
  currentW: number
  currentH: number
}

function getPieceEl(wallEl: HTMLElement, id: string): HTMLElement | null {
  return wallEl.querySelector<HTMLElement>(`[data-piece-id="${id}"]`)
}

type ZoomMode = 'fit' | number

export function WallCanvas({
  zoomMode,
  setZoomMode,
  showLegend,
  previewMode,
}: {
  zoomMode: ZoomMode
  setZoomMode: (mode: ZoomMode | ((prev: ZoomMode) => ZoomMode)) => void
  showLegend: boolean
  previewMode: boolean
}) {
  const pieces = useStore((s) => s.pieces)
  const selectedId = useStore((s) => s.selectedId)
  const wall = useStore((s) => s.wall)
  const snapEnabled = useStore((s) => s.snapEnabled)
  const showGrid = useStore((s) => s.showGrid)
  const showPieceInfo = useStore((s) => s.showPieceInfo)
  const gridSize = useStore((s) => s.gridSize)
  const allowOverlap = useStore((s) => s.allowOverlap)
  const snapToNearby = useStore((s) => s.snapToNearby)
  const imageCache = useStore((s) => s.imageCache)
  const unit = useStore((s) => s.unit)
  const selectPiece = useStore((s) => s.selectPiece)
  const updatePiece = useStore((s) => s.updatePiece)
  const resizePiece = useStore((s) => s.resizePiece)
  const pushHistory = useStore((s) => s.pushHistory)

  const containerRef = useRef<HTMLDivElement>(null)
  const wallRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const rotateRef = useRef<RotateState | null>(null)
  const resizeRef = useRef<ResizeState | null>(null)

  const piecesRef = useRef<Piece[]>(pieces)
  const interactionRef = useRef({ snapEnabled, gridSize, wall, displayScale: SCALE, allowOverlap })

  useEffect(() => { piecesRef.current = pieces })

  // ── Zoom / display scale ────────────────────────────────────

  const [fitScale, setFitScale] = useState(SCALE)
  const [manualScale, setManualScale] = useState(SCALE)

  const displayScale = zoomMode === 'fit' ? fitScale : manualScale

  // Update manual scale when zoomMode changes to a number
  useEffect(() => {
    if (typeof zoomMode === 'number') {
      setManualScale(zoomMode)
    }
  }, [zoomMode])

  const recomputeScale = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    if (width < 50 || height < 50) return
    const availW = width - PAD_SIDE * 2
    const availH = height - PAD_SIDE - PAD_BOTTOM
    
    // In preview mode with work area, fit to the full image size instead of just the work area
    let targetW = wall.width
    let targetH = wall.height
    const workArea = wall.workArea
    const hasWorkArea = !!workArea && !!imageCache[wall.imageId || '']
    if (previewMode && hasWorkArea) {
      targetW = wall.width / workArea.w
      targetH = wall.height / workArea.h
    }
    
    const newScale = Math.max(4, Math.min(24,
      Math.min(availW / targetW, availH / targetH) * 0.9
    ))
    setFitScale(newScale)
    setZoomMode((z) => {
      // keep manual scale if user has set it; only auto-update fit scale
      return z
    })
  }, [wall.width, wall.height, wall.workArea, previewMode, imageCache, wall.imageId])

  useEffect(() => {
    recomputeScale()
    const ro = new ResizeObserver(recomputeScale)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [recomputeScale])

  useEffect(() => {
    interactionRef.current = { snapEnabled, gridSize, wall, displayScale, allowOverlap }
  })

  // ── Piece drag start ────────────────────────────────────────

  const handlePieceMousedown = useCallback(
    (e: React.MouseEvent, pieceId: string) => {
      e.preventDefault()
      e.stopPropagation()

      const piece = piecesRef.current.find((p) => p.id === pieceId)
      if (!piece) return

      selectPiece(pieceId)
      if (piece.locked) return

      const wallEl = wallRef.current
      if (!wallEl) return
      const rect = wallEl.getBoundingClientRect()
      const ds = interactionRef.current.displayScale

      const mouseX = (e.clientX - rect.left) / ds
      const mouseY = (e.clientY - rect.top) / ds

      dragRef.current = {
        pieceId,
        startX: piece.x,
        startY: piece.y,
        offsetX: mouseX - piece.x,
        offsetY: mouseY - piece.y,
        pieceW: piece.w,
        pieceH: piece.h,
        pieceRot: piece.rotation,
        pieceMargin: piece.margin,
        currentX: piece.x,
        currentY: piece.y,
      }

      document.body.style.cursor = 'grabbing'
      document.body.style.userSelect = 'none'
    },
    [selectPiece],
  )

  // ── Rotation handle start ───────────────────────────────────

  const handleHandleMousedown = useCallback(
    (e: React.MouseEvent, pieceId: string) => {
      e.preventDefault()
      e.stopPropagation()

      const piece = piecesRef.current.find((p) => p.id === pieceId)
      if (!piece || piece.locked) return

      const wallEl = wallRef.current
      if (!wallEl) return
      const rect = wallEl.getBoundingClientRect()
      const ds = interactionRef.current.displayScale

      const centerScreenX = rect.left + (piece.x + piece.w / 2) * ds
      const centerScreenY = rect.top + (piece.y + piece.h / 2) * ds

      const startAngle =
        (Math.atan2(e.clientY - centerScreenY, e.clientX - centerScreenX) * 180) / Math.PI

      rotateRef.current = {
        pieceId,
        startRotation: piece.rotation,
        centerScreenX,
        centerScreenY,
        startAngle,
        initialRotation: piece.rotation,
        pieceW: piece.w,
        pieceH: piece.h,
        pieceX: piece.x,
        pieceY: piece.y,
        pieceMargin: piece.margin,
        currentRotation: piece.rotation,
      }

      document.body.style.cursor = 'crosshair'
      document.body.style.userSelect = 'none'
    },
    [],
  )

  // ── Resize handle start ────────────────────────────────────

  const handleResizeMousedown = useCallback(
    (e: React.MouseEvent, pieceId: string, handle: ResizeHandle) => {
      const piece = piecesRef.current.find((p) => p.id === pieceId)
      if (!piece || piece.locked) return

      const wallEl = wallRef.current
      if (!wallEl) return
      const rect = wallEl.getBoundingClientRect()
      const ds = interactionRef.current.displayScale

      resizeRef.current = {
        pieceId,
        handle,
        startX: piece.x,
        startY: piece.y,
        startW: piece.w,
        startH: piece.h,
        rotation: piece.rotation,
        startMouseX: (e.clientX - rect.left) / ds,
        startMouseY: (e.clientY - rect.top) / ds,
        currentX: piece.x,
        currentY: piece.y,
        currentW: piece.w,
        currentH: piece.h,
      }

      document.body.style.cursor = 'crosshair'
      document.body.style.userSelect = 'none'
    },
    [],
  )

  // ── Global mouse events ─────────────────────────────────────

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      const { snapEnabled, gridSize, wall, displayScale: ds, allowOverlap } = interactionRef.current
      const wallEl = wallRef.current
      if (!wallEl) return

      if (dragRef.current) {
        const drag = dragRef.current
        const rect = wallEl.getBoundingClientRect()

        const newX = snapToGrid((e.clientX - rect.left) / ds - drag.offsetX, gridSize, snapEnabled)
        const newY = snapToGrid((e.clientY - rect.top) / ds - drag.offsetY, gridSize, snapEnabled)

        drag.currentX = newX
        drag.currentY = newY

        const el = getPieceEl(wallEl, drag.pieceId)
        if (el) {
          el.style.left = `${newX * ds}px`
          el.style.top = `${newY * ds}px`

          const oob = checkOob(newX, newY, drag.pieceW, drag.pieceH, drag.pieceRot, wall)
          const conflict = !allowOverlap && checkConflict(
            newX, newY, drag.pieceW, drag.pieceH, drag.pieceRot, drag.pieceMargin,
            piecesRef.current, drag.pieceId,
          )
          el.classList.toggle('oob', oob)
          el.classList.toggle('conflict', conflict && !oob)
        }
      }

      if (rotateRef.current) {
        const rot = rotateRef.current

        const angle =
          (Math.atan2(e.clientY - rot.centerScreenY, e.clientX - rot.centerScreenX) * 180) / Math.PI
        const newRot = snapRotation(rot.initialRotation + (angle - rot.startAngle), snapEnabled)
        rot.currentRotation = newRot

        const el = getPieceEl(wallEl, rot.pieceId)
        if (el) {
          el.style.transform = `rotate(${newRot}deg)`
          const oob = checkOob(rot.pieceX, rot.pieceY, rot.pieceW, rot.pieceH, newRot, wall)
          const conflict = !allowOverlap && checkConflict(
            rot.pieceX, rot.pieceY, rot.pieceW, rot.pieceH, newRot, rot.pieceMargin,
            piecesRef.current, rot.pieceId,
          )
          el.classList.toggle('oob', oob)
          el.classList.toggle('conflict', conflict && !oob)
        }
      }

      if (resizeRef.current) {
        const rs = resizeRef.current
        const rect = wallEl.getBoundingClientRect()
        const ds = interactionRef.current.displayScale

        const mouseX = (e.clientX - rect.left) / ds
        const mouseY = (e.clientY - rect.top) / ds
        const dxWorld = mouseX - rs.startMouseX
        const dyWorld = mouseY - rs.startMouseY

        const R = (rs.rotation * Math.PI) / 180
        const localDx = dxWorld * Math.cos(R) + dyWorld * Math.sin(R)
        const localDy = -dxWorld * Math.sin(R) + dyWorld * Math.cos(R)

        const result = applyResize(
          rs.handle,
          rs.startX, rs.startY, rs.startW, rs.startH,
          rs.rotation,
          localDx, localDy,
        )

        rs.currentX = result.x
        rs.currentY = result.y
        rs.currentW = result.w
        rs.currentH = result.h

        const el = getPieceEl(wallEl, rs.pieceId)
        if (el) {
          el.style.left = `${result.x * ds}px`
          el.style.top = `${result.y * ds}px`
          el.style.width = `${result.w * ds}px`
          el.style.height = `${result.h * ds}px`
          const oob = checkOob(result.x, result.y, result.w, result.h, rs.rotation, wall)
          el.classList.toggle('oob', oob)
        }
      }
    }

    function handleMouseUp() {
      const { displayScale: ds, allowOverlap } = interactionRef.current
      const wallEl = wallRef.current

      if (dragRef.current) {
        const drag = dragRef.current
        const piece = piecesRef.current.find((p) => p.id === drag.pieceId)
        const pieceName = piece?.name || `${piece?.w} × ${piece?.h} ${unit}`
        const isOob = checkOob(drag.currentX, drag.currentY, drag.pieceW, drag.pieceH, drag.pieceRot, wall)
        const hasConflict = !allowOverlap && checkConflict(
          drag.currentX, drag.currentY, drag.pieceW, drag.pieceH, drag.pieceRot, drag.pieceMargin,
          piecesRef.current, drag.pieceId,
        )

        if (hasConflict || isOob) {
          let finalX = drag.startX
          let finalY = drag.startY
          
          // If out of bounds and snapToNearby is enabled, try to snap to a valid location
          if (isOob && snapToNearby && !hasConflict) {
            const snapped = snapToNearbyValid(drag.currentX, drag.currentY, drag.pieceW, drag.pieceH, drag.pieceRot, wall)
            finalX = snapped.x
            finalY = snapped.y
          }
          
          const el = wallEl ? getPieceEl(wallEl, drag.pieceId) : null
          if (el) {
            el.style.left = `${finalX * ds}px`
            el.style.top = `${finalY * ds}px`
            el.classList.remove('conflict', 'oob')
          }
          updatePiece(drag.pieceId, { x: finalX, y: finalY })
          
          // Only push history if position actually changed
          if (finalX !== drag.startX || finalY !== drag.startY) {
            pushHistory(`Move ${pieceName}`)
          }
        } else {
          pushHistory(`Move ${pieceName}`)
          updatePiece(drag.pieceId, { x: drag.currentX, y: drag.currentY })
        }
        dragRef.current = null
      }

      if (rotateRef.current) {
        const rot = rotateRef.current
        const piece = piecesRef.current.find((p) => p.id === rot.pieceId)
        const pieceName = piece?.name || `${piece?.w} × ${piece?.h} ${unit}`
        const isOob = checkOob(rot.pieceX, rot.pieceY, rot.pieceW, rot.pieceH, rot.currentRotation, wall)
        const hasConflict = !allowOverlap && checkConflict(
          rot.pieceX, rot.pieceY, rot.pieceW, rot.pieceH, rot.currentRotation, rot.pieceMargin,
          piecesRef.current, rot.pieceId,
        )

        if (hasConflict || isOob) {
          let finalRot = rot.startRotation
          let finalX = rot.pieceX
          let finalY = rot.pieceY
          
          // If out of bounds and snapToNearby is enabled, try to snap to a valid location with the new rotation
          if (isOob && snapToNearby && !hasConflict) {
            const snapped = snapToNearbyValid(rot.pieceX, rot.pieceY, rot.pieceW, rot.pieceH, rot.currentRotation, wall)
            finalX = snapped.x
            finalY = snapped.y
            finalRot = rot.currentRotation
          }
          
          const el = wallEl ? getPieceEl(wallEl, rot.pieceId) : null
          if (el) {
            el.style.transform = `rotate(${finalRot}deg)`
            if (finalX !== rot.pieceX || finalY !== rot.pieceY) {
              el.style.left = `${finalX * ds}px`
              el.style.top = `${finalY * ds}px`
            }
            el.classList.remove('conflict', 'oob')
          }
          
          if (finalX !== rot.pieceX || finalY !== rot.pieceY) {
            pushHistory(`Rotate ${pieceName}`)
            updatePiece(rot.pieceId, { x: finalX, y: finalY, rotation: finalRot })
          } else if (finalRot !== rot.startRotation) {
            pushHistory(`Rotate ${pieceName}`)
            updatePiece(rot.pieceId, { rotation: finalRot })
          } else {
            updatePiece(rot.pieceId, { rotation: finalRot })
          }
        } else {
          pushHistory(`Rotate ${pieceName}`)
          updatePiece(rot.pieceId, { rotation: rot.currentRotation })
        }
        rotateRef.current = null
      }

      if (resizeRef.current) {
        const rs = resizeRef.current
        const piece = piecesRef.current.find((p) => p.id === rs.pieceId)
        const pieceName = piece?.name || `${piece?.w} × ${piece?.h} ${unit}`
        pushHistory(`Resize ${pieceName}`)
        resizePiece(rs.pieceId, {
          x: rs.currentX,
          y: rs.currentY,
          w: rs.currentW,
          h: rs.currentH,
        })
        resizeRef.current = null
      }

      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [updatePiece, resizePiece, pushHistory])

  // ── Render ──────────────────────────────────────────────────

  const wallW = wall.width * displayScale
  const wallH = wall.height * displayScale
  const wallImageUrl = wall.imageId ? imageCache[wall.imageId] : undefined

  // When a workArea is set, position the full image so that the selected region
  // aligns exactly with the workspace, and the rest of the photo extends beyond.
  const workArea = wall.workArea
  const hasWorkArea = !!wallImageUrl && !!workArea

  // In preview mode with work area, show the full image
  const showFullImage = previewMode && hasWorkArea

  // Calculate canvas dimensions - in preview mode, expand to full image
  const canvasW = showFullImage ? wallW / workArea!.w : wallW
  const canvasH = showFullImage ? wallH / workArea!.h : wallH
  
  // In preview mode, calculate the offset for the container to center pieces on the full image
  const containerOffsetX = showFullImage ? (workArea!.x / workArea!.w) * wallW : 0
  const containerOffsetY = showFullImage ? (workArea!.y / workArea!.h) * wallH : 0

  // Full-image CSS values for background-size / background-position
  const bgSize = hasWorkArea && !showFullImage
    ? `${(wallW / workArea.w)}px ${(wallH / workArea.h)}px`
    : 'cover'
  const bgPos = hasWorkArea && !showFullImage
    ? `${-(workArea.x / workArea.w) * wallW}px ${-(workArea.y / workArea.h) * wallH}px`
    : 'center'

  // Photo that extends OUTSIDE workspace (for workArea context view) - hide in preview mode
  const fullPhotoStyle = hasWorkArea && !previewMode ? {
    position: 'absolute' as const,
    left: PAD_SIDE - (workArea.x / workArea.w) * wallW,
    top: PAD_SIDE - (workArea.y / workArea.h) * wallH,
    width: wallW / workArea.w,
    height: wallH / workArea.h,
    backgroundImage: `url(${wallImageUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    opacity: 0.55,
    pointerEvents: 'none' as const,
    zIndex: 0,
  } : null

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto flex items-center justify-center relative"
      style={{ background: 'var(--bg-canvas)', minHeight: 0 }}
    >
      <div
        className="relative flex-shrink-0"
        style={{
          padding: previewMode 
            ? `${PAD_SIDE}px ${PAD_SIDE}px ${PAD_SIDE}px ${PAD_SIDE}px`
            : `${PAD_SIDE}px ${PAD_SIDE}px ${PAD_BOTTOM}px ${PAD_SIDE}px`,
        }}
      >
        {/* Full photo backdrop (only when workArea is set) */}
        {fullPhotoStyle && <div style={fullPhotoStyle} />}

        {showLegend && !previewMode && (
          <Ruler
            orientation="horizontal"
            totalInches={wall.width}
            scale={displayScale}
            unit={unit}
            style={{ position: 'absolute', top: PAD_SIDE - RULER_SIZE, left: PAD_SIDE, zIndex: 2 }}
          />
        )}

        {showLegend && !previewMode && (
          <Ruler
            orientation="vertical"
            totalInches={wall.height}
            scale={displayScale}
            unit={unit}
            style={{ position: 'absolute', top: PAD_SIDE, left: PAD_SIDE - RULER_SIZE, zIndex: 2 }}
          />
        )}

        <div
          ref={wallRef}
          className="relative select-none"
          style={{
            width: canvasW,
            height: canvasH,
            backgroundColor: hasWorkArea ? 'transparent' : wall.bgColor,
            backgroundImage: wallImageUrl ? `url(${wallImageUrl})` : undefined,
            backgroundSize: showFullImage ? 'cover' : bgSize,
            backgroundPosition: showFullImage ? 'center' : bgPos,
            outline: previewMode ? 'none' : (hasWorkArea ? '2px solid rgba(255,255,255,0.5)' : '1px dashed rgba(255,255,255,0.18)'),
            outlineOffset: previewMode ? '0' : (hasWorkArea ? '2px' : '1px'),
            boxShadow: previewMode ? 'none' : '0 4px 40px rgba(0,0,0,0.5)',
            zIndex: 1,
          }}
          onMouseDown={(e) => {
            if (e.target === wallRef.current) selectPiece(null)
          }}
        >
          {showGrid && !previewMode && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(to right,rgba(0,0,0,0.07) 1px,transparent 1px),
                                  linear-gradient(to bottom,rgba(0,0,0,0.07) 1px,transparent 1px)`,
                backgroundSize: `${gridSize}px ${gridSize}px`,
                zIndex: 0,
              }}
            />
          )}

          {/* Pieces container - offset in preview mode to align with full image */}
          <div
            style={{
              position: showFullImage ? 'absolute' : 'relative',
              left: showFullImage ? containerOffsetX : 0,
              top: showFullImage ? containerOffsetY : 0,
              width: showFullImage ? wallW : '100%',
              height: showFullImage ? wallH : '100%',
            }}
          >
            {pieces.map((piece) => (
              <CanvasPiece
                key={piece.id}
                piece={piece}
                selected={piece.id === selectedId && !previewMode}
                wall={wall}
                imageUrl={piece.imageId ? imageCache[piece.imageId] : undefined}
                scale={displayScale}
                unit={unit}
                showPieceInfo={previewMode ? 'off' : showPieceInfo}
                onPieceMousedown={handlePieceMousedown}
                onHandleMousedown={handleHandleMousedown}
                onResizeMousedown={handleResizeMousedown}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
