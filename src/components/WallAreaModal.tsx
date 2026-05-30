import { useRef, useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faXmark, faRulerCombined } from '@fortawesome/free-solid-svg-icons'
import { fromDisplayUnit, unitSuffix, unitStep } from '../lib/utils'
import { useStore } from '../store/useStore'
import type { WorkArea } from '../types'

type HandleId = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'move'

interface DragStart {
  mouseX: number
  mouseY: number
  crop: WorkArea
}

const HANDLE_CURSORS: Record<HandleId, string> = {
  nw: 'nwse-resize', n: 'ns-resize', ne: 'nesw-resize',
  e: 'ew-resize', se: 'nwse-resize', s: 'ns-resize',
  sw: 'nesw-resize', w: 'ew-resize', move: 'move',
}

const MIN_CROP = 0.05

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

function applyHandleDrag(handle: HandleId, start: DragStart, dx: number, dy: number): WorkArea {
  const { x, y, w, h } = start.crop
  if (handle === 'move') {
    return { x: clamp(x + dx, 0, 1 - w), y: clamp(y + dy, 0, 1 - h), w, h }
  }
  let nx = x, ny = y, nw = w, nh = h
  if (handle.includes('w')) { const d = clamp(dx, -x, w - MIN_CROP); nx = x + d; nw = w - d }
  if (handle.includes('e')) { nw = clamp(w + dx, MIN_CROP, 1 - x) }
  if (handle.includes('n')) { const d = clamp(dy, -y, h - MIN_CROP); ny = y + d; nh = h - d }
  if (handle.includes('s')) { nh = clamp(h + dy, MIN_CROP, 1 - y) }
  return { x: nx, y: ny, w: nw, h: nh }
}

export function WallAreaModal({
  imageUrl,
  initialArea,
  onConfirm,
  onCancel,
}: {
  imageUrl: string
  initialArea: WorkArea | null
  onConfirm: (area: WorkArea, wallW: number, wallH: number) => void
  onCancel: () => void
}) {
  const unit = useStore((s) => s.unit)
  const wall = useStore((s) => s.wall)
  const suf = unitSuffix(unit)
  const step = unitStep(unit)

  const imgRef = useRef<HTMLImageElement>(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [area, setArea] = useState<WorkArea>(initialArea ?? { x: 0.05, y: 0.05, w: 0.9, h: 0.9 })

  // Physical dimensions of the selected area (initialized from current wall size)
  const [dimW, setDimW] = useState(() => {
    if (unit === 'cm') return String(Math.round(wall.width * 2.54))
    if (unit === 'ft') return String(Math.round(wall.width / 12 * 10) / 10)
    return String(wall.width)
  })
  const [dimH, setDimH] = useState(() => {
    if (unit === 'cm') return String(Math.round(wall.height * 2.54))
    if (unit === 'ft') return String(Math.round(wall.height / 12 * 10) / 10)
    return String(wall.height)
  })

  const areaRef = useRef<WorkArea>(area)
  useEffect(() => { areaRef.current = area }, [area])

  const activeDragRef = useRef<{ handle: HandleId; start: DragStart } | null>(null)

  function getImgRect(): DOMRect | null {
    return imgRef.current?.getBoundingClientRect() ?? null
  }

  const onMouseMove = useCallback((e: MouseEvent) => {
    const drag = activeDragRef.current
    if (!drag) return
    const rect = getImgRect()
    if (!rect) return
    const dx = (e.clientX - drag.start.mouseX) / rect.width
    const dy = (e.clientY - drag.start.mouseY) / rect.height
    const next = applyHandleDrag(drag.handle, drag.start, dx, dy)
    setArea(next)
    areaRef.current = next
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
      start: { mouseX: e.clientX, mouseY: e.clientY, crop: { ...areaRef.current } },
    }
    document.body.style.cursor = HANDLE_CURSORS[handle]
  }

  function handleConfirm() {
    const wInches = fromDisplayUnit(parseFloat(dimW) || wall.width, unit)
    const hInches = fromDisplayUnit(parseFloat(dimH) || wall.height, unit)
    onConfirm(areaRef.current, Math.max(6, Math.round(wInches)), Math.max(6, Math.round(hInches)))
  }

  const pct = (v: number) => `${v * 100}%`

  const handles: Array<{ id: HandleId; style: React.CSSProperties }> = [
    { id: 'nw', style: { top: pct(area.y), left: pct(area.x) } },
    { id: 'n',  style: { top: pct(area.y), left: pct(area.x + area.w / 2) } },
    { id: 'ne', style: { top: pct(area.y), left: pct(area.x + area.w) } },
    { id: 'e',  style: { top: pct(area.y + area.h / 2), left: pct(area.x + area.w) } },
    { id: 'se', style: { top: pct(area.y + area.h), left: pct(area.x + area.w) } },
    { id: 's',  style: { top: pct(area.y + area.h), left: pct(area.x + area.w / 2) } },
    { id: 'sw', style: { top: pct(area.y + area.h), left: pct(area.x) } },
    { id: 'w',  style: { top: pct(area.y + area.h / 2), left: pct(area.x) } },
  ]

  const inputStyle = {
    background: 'var(--bg-input)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)',
    outline: 'none',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        className="flex flex-col gap-0 rounded-xl overflow-hidden"
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-normal)',
          maxWidth: '90vw',
          maxHeight: '92vh',
          width: 'max-content',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2.5">
            <FontAwesomeIcon icon={faRulerCombined} style={{ color: 'var(--accent-blue)' }} />
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Define Usable Wall Area
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Select the open wall space where art can hang. The full photo stays visible for context.
              </div>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-7 h-7 rounded flex items-center justify-center text-sm ml-4 flex-shrink-0"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Image + selection overlay */}
        <div className="px-5 pt-4" style={{ lineHeight: 0 }}>
          <div className="relative inline-block select-none">
            <img
              ref={imgRef}
              src={imageUrl}
              alt="wall"
              draggable={false}
              onLoad={() => setImgLoaded(true)}
              style={{
                display: 'block',
                maxWidth: 'min(820px, 78vw)',
                maxHeight: '52vh',
                objectFit: 'contain',
              }}
            />

            {imgLoaded && (
              <>
                {/* Dim overlay outside selection */}
                <div className="absolute pointer-events-none" style={{ top: 0, left: 0, right: 0, height: pct(area.y), background: 'rgba(0,0,0,0.6)' }} />
                <div className="absolute pointer-events-none" style={{ top: pct(area.y + area.h), left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)' }} />
                <div className="absolute pointer-events-none" style={{ top: pct(area.y), left: 0, width: pct(area.x), height: pct(area.h), background: 'rgba(0,0,0,0.6)' }} />
                <div className="absolute pointer-events-none" style={{ top: pct(area.y), left: pct(area.x + area.w), right: 0, height: pct(area.h), background: 'rgba(0,0,0,0.6)' }} />

                {/* Selection border + move handle */}
                <div
                  onMouseDown={(e) => startDrag(e, 'move')}
                  style={{
                    position: 'absolute',
                    top: pct(area.y), left: pct(area.x),
                    width: pct(area.w), height: pct(area.h),
                    border: '2px solid rgba(255,255,255,0.9)',
                    cursor: 'move',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Rule-of-thirds */}
                  {[33.33, 66.66].map((p) => (
                    <div key={`v${p}`} style={{ position: 'absolute', top: 0, bottom: 0, left: `${p}%`, width: 1, background: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }} />
                  ))}
                  {[33.33, 66.66].map((p) => (
                    <div key={`h${p}`} style={{ position: 'absolute', left: 0, right: 0, top: `${p}%`, height: 1, background: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }} />
                  ))}
                </div>

                {/* Resize handles */}
                {handles.map(({ id, style }) => (
                  <div
                    key={id}
                    onMouseDown={(e) => startDrag(e, id)}
                    style={{
                      position: 'absolute',
                      width: 12, height: 12,
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

        {/* Physical dimensions input */}
        <div
          className="mx-5 mt-4 mb-0 p-4 rounded-lg flex flex-col gap-3"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Physical size of selected area ({suf})
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Width</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={dimW}
                  min={1}
                  step={step}
                  onChange={(e) => setDimW(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded text-sm tabular-nums"
                  style={inputStyle}
                />
                <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{suf}</span>
              </div>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 18, flexShrink: 0 }}>×</span>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Height</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={dimH}
                  min={1}
                  step={step}
                  onChange={(e) => setDimH(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded text-sm tabular-nums"
                  style={inputStyle}
                />
                <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{suf}</span>
              </div>
            </div>
          </div>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
            Enter the real-world dimensions of the selected wall space. This sets the workspace scale.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 gap-3">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {Math.round(area.w * 100)}% × {Math.round(area.h * 100)}% of photo
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setArea({ x: 0, y: 0, w: 1, h: 1 })}
              className="px-3 h-8 rounded text-sm transition-colors"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
            >
              Full image
            </button>
            <button
              onClick={onCancel}
              className="px-3 h-8 rounded text-sm transition-colors"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 h-8 rounded text-sm font-semibold transition-colors"
              style={{ background: 'var(--accent-blue)', color: 'white', border: 'none' }}
            >
              <FontAwesomeIcon icon={faCheck} className="mr-1.5" />Set as workspace
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
