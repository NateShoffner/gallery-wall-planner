'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faXmark, faCropSimple } from '@fortawesome/free-solid-svg-icons'

interface CropRect {
  x: number  // 0..1 fraction of image
  y: number
  w: number
  h: number
}

type HandleId = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'move'

interface DragStart {
  mouseX: number
  mouseY: number
  crop: CropRect
}

const HANDLE_CURSORS: Record<HandleId, string> = {
  nw: 'nwse-resize', n: 'ns-resize', ne: 'nesw-resize',
  e: 'ew-resize', se: 'nwse-resize', s: 'ns-resize',
  sw: 'nesw-resize', w: 'ew-resize', move: 'move',
}

const MIN_CROP = 0.05

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

function applyHandleDrag(
  handle: HandleId,
  start: DragStart,
  dx: number,
  dy: number,
): CropRect {
  const { x, y, w, h } = start.crop

  if (handle === 'move') {
    const nx = clamp(x + dx, 0, 1 - w)
    const ny = clamp(y + dy, 0, 1 - h)
    return { x: nx, y: ny, w, h }
  }

  let nx = x, ny = y, nw = w, nh = h

  if (handle.includes('w')) {
    const maxDx = w - MIN_CROP
    const d = clamp(dx, -x, maxDx)
    nx = x + d
    nw = w - d
  }
  if (handle.includes('e')) {
    nw = clamp(w + dx, MIN_CROP, 1 - x)
  }
  if (handle.includes('n')) {
    const maxDy = h - MIN_CROP
    const d = clamp(dy, -y, maxDy)
    ny = y + d
    nh = h - d
  }
  if (handle.includes('s')) {
    nh = clamp(h + dy, MIN_CROP, 1 - y)
  }

  return { x: nx, y: ny, w: nw, h: nh }
}

export function WallCropModal({
  imageUrl,
  onConfirm,
  onCancel,
}: {
  imageUrl: string
  onConfirm: (croppedDataUrl: string) => void
  onCancel: () => void
}) {
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, w: 1, h: 1 })
  const [imgLoaded, setImgLoaded] = useState(false)

  const activeDragRef = useRef<{ handle: HandleId; start: DragStart } | null>(null)
  const cropRef = useRef<CropRect>(crop)
  useEffect(() => { cropRef.current = crop }, [crop])

  function getImageRect(): DOMRect | null {
    return imgRef.current?.getBoundingClientRect() ?? null
  }

  const onMouseMove = useCallback((e: MouseEvent) => {
    const drag = activeDragRef.current
    if (!drag) return
    const rect = getImageRect()
    if (!rect) return
    const dx = (e.clientX - drag.start.mouseX) / rect.width
    const dy = (e.clientY - drag.start.mouseY) / rect.height
    const next = applyHandleDrag(drag.handle, drag.start, dx, dy)
    setCrop(next)
    cropRef.current = next
  }, [])

  const onMouseUp = useCallback(() => {
    activeDragRef.current = null
    document.body.style.cursor = ''
  }, [])

  useEffect(() => {
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [onMouseMove, onMouseUp])

  function startDrag(e: React.MouseEvent, handle: HandleId) {
    e.preventDefault()
    e.stopPropagation()
    activeDragRef.current = {
      handle,
      start: { mouseX: e.clientX, mouseY: e.clientY, crop: { ...cropRef.current } },
    }
    document.body.style.cursor = HANDLE_CURSORS[handle]
  }

  function applyAndConfirm() {
    const img = imgRef.current
    if (!img) return
    const nw = img.naturalWidth
    const nh = img.naturalHeight
    const cw = Math.max(1, Math.round(nw * crop.w))
    const ch = Math.max(1, Math.round(nh * crop.h))
    const canvas = document.createElement('canvas')
    canvas.width = cw
    canvas.height = ch
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, nw * crop.x, nh * crop.y, nw * crop.w, nh * crop.h, 0, 0, cw, ch)
    onConfirm(canvas.toDataURL('image/jpeg', 0.92))
  }

  // Overlay layout: 4 dark rects surround the crop selection
  const pct = (v: number) => `${v * 100}%`

  // Handle positions relative to the crop rect (as % of full image)
  const handles: Array<{ id: HandleId; style: React.CSSProperties }> = [
    { id: 'nw', style: { top: pct(crop.y), left: pct(crop.x) } },
    { id: 'n',  style: { top: pct(crop.y), left: pct(crop.x + crop.w / 2) } },
    { id: 'ne', style: { top: pct(crop.y), left: pct(crop.x + crop.w) } },
    { id: 'e',  style: { top: pct(crop.y + crop.h / 2), left: pct(crop.x + crop.w) } },
    { id: 'se', style: { top: pct(crop.y + crop.h), left: pct(crop.x + crop.w) } },
    { id: 's',  style: { top: pct(crop.y + crop.h), left: pct(crop.x + crop.w / 2) } },
    { id: 'sw', style: { top: pct(crop.y + crop.h), left: pct(crop.x) } },
    { id: 'w',  style: { top: pct(crop.y + crop.h / 2), left: pct(crop.x) } },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.82)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        className="flex flex-col gap-4 rounded-xl overflow-hidden"
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-normal)',
          maxWidth: '90vw',
          maxHeight: '92vh',
          width: 'max-content',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 pt-4 pb-0"
        >
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faCropSimple} style={{ color: 'var(--accent-blue)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Select wall area
            </span>
          </div>
          <button
            onClick={onCancel}
            className="w-7 h-7 rounded flex items-center justify-center text-sm transition-colors"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <p className="text-xs px-5" style={{ color: 'var(--text-muted)', marginTop: -8 }}>
          Drag the handles to select the portion of the image to use as your wall background.
        </p>

        {/* Image + crop overlay */}
        <div ref={containerRef} className="relative px-5" style={{ lineHeight: 0 }}>
          <div className="relative inline-block select-none">
            <img
              ref={imgRef}
              src={imageUrl}
              alt="wall background"
              draggable={false}
              onLoad={() => setImgLoaded(true)}
              style={{
                display: 'block',
                maxWidth: 'min(860px, 80vw)',
                maxHeight: '58vh',
                objectFit: 'contain',
              }}
            />

            {imgLoaded && (
              <>
                {/* Dark overlays around the crop selection */}
                {/* Top */}
                <div className="absolute pointer-events-none" style={{
                  top: 0, left: 0, right: 0,
                  height: pct(crop.y),
                  background: 'rgba(0,0,0,0.55)',
                }} />
                {/* Bottom */}
                <div className="absolute pointer-events-none" style={{
                  top: pct(crop.y + crop.h), left: 0, right: 0, bottom: 0,
                  background: 'rgba(0,0,0,0.55)',
                }} />
                {/* Left */}
                <div className="absolute pointer-events-none" style={{
                  top: pct(crop.y), left: 0,
                  width: pct(crop.x),
                  height: pct(crop.h),
                  background: 'rgba(0,0,0,0.55)',
                }} />
                {/* Right */}
                <div className="absolute pointer-events-none" style={{
                  top: pct(crop.y),
                  left: pct(crop.x + crop.w), right: 0,
                  height: pct(crop.h),
                  background: 'rgba(0,0,0,0.55)',
                }} />

                {/* Crop border */}
                <div
                  className="absolute"
                  style={{
                    top: pct(crop.y),
                    left: pct(crop.x),
                    width: pct(crop.w),
                    height: pct(crop.h),
                    border: '2px solid rgba(255,255,255,0.9)',
                    cursor: 'move',
                    boxSizing: 'border-box',
                  }}
                  onMouseDown={(e) => startDrag(e, 'move')}
                >
                  {/* Rule-of-thirds grid lines inside crop */}
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    {[33.33, 66.66].map((p) => (
                      <div key={`v${p}`} style={{
                        position: 'absolute', top: 0, bottom: 0,
                        left: `${p}%`, width: 1,
                        background: 'rgba(255,255,255,0.2)',
                      }} />
                    ))}
                    {[33.33, 66.66].map((p) => (
                      <div key={`h${p}`} style={{
                        position: 'absolute', left: 0, right: 0,
                        top: `${p}%`, height: 1,
                        background: 'rgba(255,255,255,0.2)',
                      }} />
                    ))}
                  </div>
                </div>

                {/* Resize handles */}
                {handles.map(({ id, style }) => (
                  <div
                    key={id}
                    onMouseDown={(e) => startDrag(e, id)}
                    style={{
                      position: 'absolute',
                      width: 12,
                      height: 12,
                      background: 'white',
                      border: '2px solid var(--accent-blue)',
                      borderRadius: 3,
                      transform: 'translate(-50%, -50%)',
                      cursor: HANDLE_CURSORS[id],
                      zIndex: 10,
                      boxShadow: '0 1px 5px rgba(0,0,0,0.5)',
                      ...style,
                    }}
                  />
                ))}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 pb-4 gap-3">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {Math.round(crop.w * 100)}% × {Math.round(crop.h * 100)}% of image
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCrop({ x: 0, y: 0, w: 1, h: 1 })}
              className="px-3 h-8 rounded text-sm transition-colors"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
            >
              Reset
            </button>
            <button
              onClick={onCancel}
              className="px-3 h-8 rounded text-sm transition-colors"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
            >
              <FontAwesomeIcon icon={faXmark} className="mr-1.5" />Cancel
            </button>
            <button
              onClick={applyAndConfirm}
              className="px-4 h-8 rounded text-sm font-semibold transition-colors"
              style={{ background: 'var(--accent-blue)', color: 'white', border: 'none' }}
            >
              <FontAwesomeIcon icon={faCheck} className="mr-1.5" />Use this area
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

