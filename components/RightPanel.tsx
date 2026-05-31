'use client'

import { useRef, useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faLock, faLockOpen, faTrash, faImage, faRotateLeft, faRotateRight,
  faGear, faBorderAll, faSun, faMoon, faXmark, faCheck,
  faRulerCombined, faEyeSlash, faMicrochip,
} from '@fortawesome/free-solid-svg-icons'
import toast from 'react-hot-toast'
import { useStore } from '@/store/useStore'
import { toDisplayUnit, fromDisplayUnit, unitSuffix, unitStep } from '@/lib/utils'
import { PATTERN_LABELS } from '@/lib/constants'
import type { Piece, MeasureUnit, ClusterPattern, WorkArea, AIProcessingData } from '@/types'
import { WallAreaModal } from '@/components/WallAreaModal'
import { ErrorLogSection } from '@/components/ErrorLogSection'
import { HistorySection } from '@/components/HistorySection'
import { ImageProcessModal } from '@/components/ImageProcessModal'
import { PrivacyModal } from '@/components/PrivacyModal'

// ── SVG Pattern Previews ────────────────────────────────────────

function PatternSvg({ pattern }: { pattern: ClusterPattern }) {
  const fill = 'currentColor'
  const opacity = 0.7

  const svgs: Record<ClusterPattern, React.ReactElement> = {
    shelf: (
      <svg viewBox="0 0 60 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="6" width="18" height="12" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="25" y="8" width="14" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="42" y="6" width="14" height="12" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="8" y="24" width="14" height="14" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="25" y="24" width="16" height="14" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="44" y="26" width="12" height="12" rx="1.5" fill={fill} opacity={opacity} />
      </svg>
    ),
    cross: (
      <svg viewBox="0 0 60 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="24" y="4" width="12" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="24" y="17" width="12" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="24" y="30" width="12" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="4" y="19" width="16" height="8" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="40" y="19" width="16" height="8" rx="1.5" fill={fill} opacity={opacity} />
      </svg>
    ),
    diagonal: (
      <svg viewBox="0 0 60 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="4" width="16" height="12" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="22" y="14" width="16" height="12" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="41" y="24" width="16" height="14" rx="1.5" fill={fill} opacity={opacity} />
      </svg>
    ),
    brick: (
      <svg viewBox="0 0 60 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="5" width="16" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="22" y="5" width="16" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="41" y="5" width="16" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="12" y="19" width="16" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="31" y="19" width="16" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="3" y="33" width="16" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="22" y="33" width="16" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="41" y="33" width="16" height="10" rx="1.5" fill={fill} opacity={opacity} />
      </svg>
    ),
    grid: (
      <svg viewBox="0 0 60 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="4" width="16" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="22" y="4" width="16" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="41" y="4" width="16" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="3" y="17" width="16" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="22" y="17" width="16" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="41" y="17" width="16" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="3" y="30" width="16" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="22" y="30" width="16" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="41" y="30" width="16" height="10" rx="1.5" fill={fill} opacity={opacity} />
      </svg>
    ),
    column: (
      <svg viewBox="0 0 60 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="18" y="3" width="24" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="18" y="16" width="24" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="18" y="29" width="24" height="10" rx="1.5" fill={fill} opacity={opacity} />
      </svg>
    ),
    scattered: (
      <svg viewBox="0 0 60 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="6" width="12" height="10" rx="1.5" fill={fill} opacity={opacity} transform="rotate(-5 9 11)" />
        <rect x="22" y="3" width="18" height="13" rx="1.5" fill={fill} opacity={opacity} transform="rotate(3 31 9)" />
        <rect x="44" y="8" width="13" height="10" rx="1.5" fill={fill} opacity={opacity} transform="rotate(-8 50 13)" />
        <rect x="6" y="26" width="16" height="12" rx="1.5" fill={fill} opacity={opacity} transform="rotate(6 14 32)" />
        <rect x="30" y="24" width="10" height="14" rx="1.5" fill={fill} opacity={opacity} transform="rotate(-4 35 31)" />
        <rect x="44" y="27" width="13" height="11" rx="1.5" fill={fill} opacity={opacity} transform="rotate(7 50 32)" />
      </svg>
    ),
    circular: (
      <svg viewBox="0 0 60 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="22" y="4" width="16" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="42" y="10" width="14" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="44" y="24" width="12" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="24" y="30" width="14" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="4" y="24" width="12" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="4" y="10" width="14" height="10" rx="1.5" fill={fill} opacity={opacity} />
      </svg>
    ),
    pyramid: (
      <svg viewBox="0 0 60 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="22" y="4" width="16" height="8" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="14" y="16" width="14" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="30" y="16" width="14" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="4" y="30" width="18" height="11" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="24" y="30" width="12" height="11" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="38" y="30" width="18" height="11" rx="1.5" fill={fill} opacity={opacity} />
      </svg>
    ),
    spiral: (
      <svg viewBox="0 0 60 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="22" y="17" width="16" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="40" y="17" width="14" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="42" y="30" width="12" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="20" y="32" width="14" height="8" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="4" y="26" width="12" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="6" y="12" width="12" height="10" rx="1.5" fill={fill} opacity={opacity} />
      </svg>
    ),
    centered: (
      <svg viewBox="0 0 60 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="14" width="20" height="12" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="24" y="6" width="12" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="14" y="22" width="14" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="32" y="24" width="16" height="10" rx="1.5" fill={fill} opacity={opacity} />
        <rect x="22" y="30" width="16" height="10" rx="1.5" fill={fill} opacity={opacity} />
      </svg>
    ),
  }

  return svgs[pattern]
}

// ── Primitives ─────────────────────────────────────────────────

function Label({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <span
      className="text-sm font-medium flex-shrink-0"
      style={{ color: 'var(--text-muted)', minWidth: wide ? 72 : 52 }}
    >
      {children}
    </span>
  )
}

function SectionHeader({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="px-4 pt-4 pb-2 section-block">
      <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
        {children}
      </div>
      {sub && (
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
          {sub}
        </div>
      )}
    </div>
  )
}

function FormRow({ label, children, wide }: {
  label: string
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <div className="flex items-center gap-2.5 justify-between">
      <Label wide={wide}>{label}</Label>
      <div className="flex items-center gap-2 justify-end">{children}</div>
    </div>
  )
}

function NumInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  minWidth,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  minWidth?: number
}) {
  const [local, setLocal] = useState(String(value))
  useEffect(() => { setLocal(String(Math.round(value * 100) / 100)) }, [value])

  function commit() {
    const v = parseFloat(local)
    if (!isNaN(v)) onChange(v)
    else setLocal(String(value))
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        value={local}
        min={min}
        max={max}
        step={step}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') setLocal(String(value))
        }}
        className="px-2.5 py-1.5 rounded text-sm tabular-nums text-right"
        style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-primary)',
          outline: 'none',
          minWidth: minWidth ?? 60,
          width: minWidth ?? 60,
        }}
        onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent-blue)' }}
        onBlurCapture={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--border-subtle)' }}
      />
      {unit && (
        <span className="text-xs flex-shrink-0 w-6 text-left" style={{ color: 'var(--text-muted)' }}>
          {unit}
        </span>
      )}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex flex-shrink-0 w-10 h-6 rounded-full transition-colors"
      style={{ background: checked ? 'var(--accent-blue)' : 'var(--bg-input)', border: '1px solid var(--border-normal)' }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
        style={{ transform: checked ? 'translateX(16px)' : 'translateX(0)' }}
      />
    </button>
  )
}

function PanelBtn({
  children,
  onClick,
  title,
  variant = 'default',
  disabled,
  small,
}: {
  children: React.ReactNode
  onClick?: () => void
  title?: string
  variant?: 'default' | 'danger' | 'active' | 'warning'
  disabled?: boolean
  small?: boolean
}) {
  const styles: Record<string, { bg: string; color: string }> = {
    default: { bg: 'var(--bg-elevated)', color: 'var(--text-secondary)' },
    danger:  { bg: 'transparent', color: 'var(--text-muted)' },
    active:  { bg: 'var(--accent-blue)', color: 'white' },
    warning: { bg: 'rgba(251,191,36,0.12)', color: '#fde68a' },
  }
  const s = styles[variant] ?? styles.default
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`flex items-center justify-center gap-1.5 px-3 rounded text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed ${small ? 'py-1' : 'py-2'}`}
      style={{ background: s.bg, color: s.color, border: '1px solid var(--border-subtle)', flex: 1 }}
      onMouseEnter={(e) => {
        if (!disabled) {
          if (variant === 'danger') { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#f87171' }
          else e.currentTarget.style.background = 'var(--bg-hover)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = s.bg
        e.currentTarget.style.color = s.color
      }}
    >
      {children}
    </button>
  )
}

const inputStyle = {
  background: 'var(--bg-input)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-primary)',
  outline: 'none',
}

// ── Wall settings ──────────────────────────────────────────────

function WallSettings({ unit }: { unit: MeasureUnit }) {
  const wall = useStore((s) => s.wall)
  const setWall = useStore((s) => s.setWall)
  const setBgColor = useStore((s) => s.setBgColor)
  const setWallBgImage = useStore((s) => s.setWallBgImage)
  const clearWallBgImage = useStore((s) => s.clearWallBgImage)
  const setWallWorkArea = useStore((s) => s.setWallWorkArea)
  const imageCache = useStore((s) => s.imageCache)
  const imgRef = useRef<HTMLInputElement>(null)

  const [areaModalOpen, setAreaModalOpen] = useState(false)

  const suf = unitSuffix(unit)
  const step = unitStep(unit)

  const [w, setW] = useState(String(toDisplayUnit(wall.width, unit)))
  const [h, setH] = useState(String(toDisplayUnit(wall.height, unit)))

  useEffect(() => { setW(String(toDisplayUnit(wall.width, unit))) }, [wall.width, unit])
  useEffect(() => { setH(String(toDisplayUnit(wall.height, unit))) }, [wall.height, unit])

  function apply() {
    const wv = fromDisplayUnit(parseFloat(w), unit)
    const hv = fromDisplayUnit(parseFloat(h), unit)
    if (wv > 0 && hv > 0) setWall(Math.round(wv), Math.round(hv))
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) {
      void setWallBgImage(f).then(() => {
        setAreaModalOpen(true)
      })
    }
    e.target.value = ''
  }

  function handleAreaConfirm(area: WorkArea, wallW: number, wallH: number) {
    setWallWorkArea(area)
    setWall(wallW, wallH)
    setAreaModalOpen(false)
  }

  const wallImageUrl = wall.imageId ? imageCache[wall.imageId] : undefined

  return (
    <>
      {areaModalOpen && wallImageUrl && (
        <WallAreaModal
          imageUrl={wallImageUrl}
          initialArea={wall.workArea}
          onConfirm={handleAreaConfirm}
          onCancel={() => setAreaModalOpen(false)}
        />
      )}

      <div className="px-4 py-3 flex flex-col gap-3 section-block">
        {/* Size */}
        <FormRow label="Size" wide>
          <input
            type="number"
            value={w}
            min={unit === 'cm' ? 30 : unit === 'ft' ? 1 : 12}
            step={step}
            onChange={(e) => setW(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && apply()}
            onBlur={apply}
            className="w-24 px-2.5 py-1.5 rounded text-sm tabular-nums text-right"
            style={inputStyle}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: 12, flexShrink: 0 }}>×</span>
          <input
            type="number"
            value={h}
            min={unit === 'cm' ? 30 : unit === 'ft' ? 1 : 12}
            step={step}
            onChange={(e) => setH(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && apply()}
            onBlur={apply}
            className="w-24 px-2.5 py-1.5 rounded text-sm tabular-nums text-right"
            style={inputStyle}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: 12, flexShrink: 0 }}>{suf}</span>
        </FormRow>

        {/* Color */}
        <FormRow label="Color" wide>
          <input
            type="color"
            value={wall.bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="w-9 h-7 rounded cursor-pointer flex-shrink-0"
            style={{ padding: '2px', border: '1px solid var(--border-subtle)', background: 'var(--bg-input)' }}
          />
          <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
            {wall.bgColor}
          </span>
        </FormRow>

        {/* Photo */}
        <FormRow label="Photo" wide>
          <button
            onClick={() => imgRef.current?.click()}
            className="flex-1 px-2.5 py-1.5 rounded text-sm transition-colors truncate flex items-center gap-1.5"
            style={{
              background: wall.imageId ? 'rgba(59,130,246,0.15)' : 'var(--bg-input)',
              border: `1px solid ${wall.imageId ? 'rgba(59,130,246,0.4)' : 'var(--border-subtle)'}`,
              color: wall.imageId ? '#93c5fd' : 'var(--text-muted)',
            }}
          >
            <FontAwesomeIcon icon={faImage} className="text-xs flex-shrink-0" />
            {wall.imageId ? 'Attached' : 'Add photo'}
          </button>
          {wall.imageId && (
            <>
              <button
                onClick={() => setAreaModalOpen(true)}
                className="w-8 h-7 rounded flex items-center justify-center text-xs transition-colors flex-shrink-0"
                style={{ color: wall.workArea ? '#93c5fd' : 'var(--text-muted)', border: `1px solid ${wall.workArea ? 'rgba(59,130,246,0.4)' : 'var(--border-subtle)'}`, background: wall.workArea ? 'rgba(59,130,246,0.12)' : 'var(--bg-input)' }}
                title="Set usable wall area"
              >
                <FontAwesomeIcon icon={faRulerCombined} />
              </button>
              <button
                onClick={() => void clearWallBgImage()}
                className="w-8 h-7 rounded flex items-center justify-center text-xs transition-colors flex-shrink-0"
                style={{ color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
                title="Remove photo"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </>
          )}
          <input
            ref={imgRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </FormRow>

        {wall.workArea && (
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <FontAwesomeIcon icon={faRulerCombined} style={{ fontSize: 10, color: '#93c5fd', flexShrink: 0 }} />
            <span className="text-xs" style={{ color: '#93c5fd' }}>
              Usable area: {Math.round(wall.workArea.w * 100)}% × {Math.round(wall.workArea.h * 100)}% of photo
            </span>
            <button
              onClick={() => setWallWorkArea(null)}
              className="ml-auto w-5 h-5 flex items-center justify-center text-xs rounded"
              style={{ color: '#93c5fd', opacity: 0.7 }}
              title="Clear work area (use full image)"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ── Layout settings ────────────────────────────────────────────

function LayoutSettings({ unit }: { unit: MeasureUnit }) {
  const gap = useStore((s) => s.gap)
  const snapEnabled = useStore((s) => s.snapEnabled)
  const showGrid = useStore((s) => s.showGrid)
  const showRulers = useStore((s) => s.showRulers)
  const showPieceInfo = useStore((s) => s.showPieceInfo)
  const showAlignmentGuides = useStore((s) => s.showAlignmentGuides)
  const gridSize = useStore((s) => s.gridSize)
  const allowOverlap = useStore((s) => s.allowOverlap)
  const snapToNearby = useStore((s) => s.snapToNearby)
  const setGap = useStore((s) => s.setGap)
  const setSnap = useStore((s) => s.setSnap)
  const setShowGrid = useStore((s) => s.setShowGrid)
  const setShowRulers = useStore((s) => s.setShowRulers)
  const setShowPieceInfo = useStore((s) => s.setShowPieceInfo)
  const setShowAlignmentGuides = useStore((s) => s.setShowAlignmentGuides)
  const setGridSize = useStore((s) => s.setGridSize)
  const setAllowOverlap = useStore((s) => s.setAllowOverlap)
  const setSnapToNearby = useStore((s) => s.setSnapToNearby)

  const dispGap = toDisplayUnit(gap, unit)
  const suf = unitSuffix(unit)
  const [gapInput, setGapInput] = useState(String(dispGap.toFixed(unit === 'in' ? 2 : 1)))

  useEffect(() => {
    setGapInput(String(dispGap.toFixed(unit === 'in' ? 2 : 1)))
  }, [dispGap, unit])

  function applyGap() {
    const val = parseFloat(gapInput)
    if (!isNaN(val) && val >= 0) {
      setGap(fromDisplayUnit(val, unit))
    }
  }

  return (
    <div className="px-4 py-3 flex flex-col gap-3 section-block">
      <FormRow label="Gap" wide>
        <input
          type="number"
          value={gapInput}
          min={0}
          step={unitStep(unit)}
          onChange={(e) => setGapInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyGap()}
          onBlur={applyGap}
          className="w-20 px-2.5 py-1.5 rounded text-sm tabular-nums text-right"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outline: 'none' }}
        />
        <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
          {suf}
        </span>
      </FormRow>

      <FormRow label="Overlap" wide>
        <Toggle checked={allowOverlap} onChange={setAllowOverlap} />
      </FormRow>

      <FormRow label="Snap to nearest" wide>
        <Toggle checked={snapToNearby} onChange={setSnapToNearby} />
      </FormRow>

      <FormRow label="Snap to grid" wide>
        <Toggle checked={snapEnabled} onChange={setSnap} />
      </FormRow>

      {snapEnabled && (
        <FormRow label="Grid size" wide>
          <input
            type="number"
            value={gridSize}
            min={4}
            max={96}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10)
              if (v >= 4) setGridSize(v)
            }}
            className="w-14 px-2.5 py-1.5 rounded text-sm tabular-nums text-right"
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outline: 'none' }}
          />
          <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>px</span>
        </FormRow>
      )}

      <FormRow label="Grid" wide>
        <Toggle checked={showGrid} onChange={setShowGrid} />
      </FormRow>

      <FormRow label="Rulers" wide>
        <Toggle checked={showRulers} onChange={setShowRulers} />
      </FormRow>

      <FormRow label="Alignment guides" wide>
        <Toggle checked={showAlignmentGuides} onChange={setShowAlignmentGuides} />
      </FormRow>

      <FormRow label="Labels" wide>
        <select
          value={showPieceInfo}
          onChange={(e) => setShowPieceInfo(e.target.value as 'off' | 'hover' | 'always')}
          className="flex-1 px-2.5 py-1.5 rounded text-sm"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outline: 'none' }}
        >
          <option value="off">Hidden</option>
          <option value="hover">On hover</option>
          <option value="always">Always visible</option>
        </select>
      </FormRow>
    </div>
  )
}

// ── Settings tab ───────────────────────────────────────────────

const ALL_PATTERNS: ClusterPattern[] = ['shelf', 'cross', 'diagonal', 'brick', 'grid', 'column', 'scattered', 'circular', 'pyramid', 'spiral', 'centered']

function SettingsTab() {
  const unit = useStore((s) => s.unit)
  const setUnit = useStore((s) => s.setUnit)
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const enabledPatterns = useStore((s) => s.enabledPatterns)
  const setEnabledPatterns = useStore((s) => s.setEnabledPatterns)
  const clearAll = useStore((s) => s.clearAll)
  const resetEverything = useStore((s) => s.resetEverything)
  const suppressedErrors = useStore((s) => s.suppressedErrors)
  const unsuppressErrorPattern = useStore((s) => s.unsuppressErrorPattern)
  const clearSuppressedErrors = useStore((s) => s.clearSuppressedErrors)

  const [pendingAction, setPendingAction] = useState<'clear' | 'reset' | null>(null)

  const units: Array<{ value: MeasureUnit; label: string; short: string }> = [
    { value: 'in', label: 'Inches', short: 'in' },
    { value: 'cm', label: 'Centimeters', short: 'cm' },
    { value: 'ft', label: 'Feet', short: 'ft' },
    { value: 'm', label: 'Meters', short: 'm' },
  ]

  function togglePattern(p: ClusterPattern) {
    if (enabledPatterns.includes(p)) {
      // Don't remove the last one
      if (enabledPatterns.length === 1) return
      setEnabledPatterns(enabledPatterns.filter((x) => x !== p))
    } else {
      setEnabledPatterns([...enabledPatterns, p])
    }
  }

  return (
    <div className="flex flex-col">
      <SectionHeader sub="Display unit for measurements">Units</SectionHeader>
      <div className="px-4 py-3 flex gap-2 section-block">
        {units.map((u) => (
          <button
            key={u.value}
            onClick={() => setUnit(u.value)}
            title={u.label}
            className="flex-1 py-2 rounded text-xs font-semibold transition-all"
            style={{
              background: unit === u.value ? 'var(--accent-blue)' : 'var(--bg-elevated)',
              border: `1px solid ${unit === u.value ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
              color: unit === u.value ? 'white' : 'var(--text-muted)',
            }}
          >
            {u.short}
          </button>
        ))}
      </div>

      <SectionHeader sub="Interface color scheme">Appearance</SectionHeader>
      <div className="px-4 py-3 section-block">
        <div className="flex gap-2">
          {(['dark', 'light'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className="flex-1 py-2 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              style={{
                background: theme === t ? 'var(--accent-blue)' : 'var(--bg-elevated)',
                border: `1px solid ${theme === t ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                color: theme === t ? 'white' : 'var(--text-muted)',
              }}
            >
              <FontAwesomeIcon icon={t === 'dark' ? faMoon : faSun} />
              {t === 'dark' ? 'Dark' : 'Light'}
            </button>
          ))}
        </div>
      </div>

      <SectionHeader sub="Re-arrange picks randomly from enabled patterns">Re-arrange Patterns</SectionHeader>
      <div className="px-4 py-3 flex flex-col gap-2">
        <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>
          Toggle patterns on/off. Re-arrange will pick a random enabled one each time.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {ALL_PATTERNS.map((p) => {
            const active = enabledPatterns.includes(p)
            return (
              <button
                key={p}
                onClick={() => togglePattern(p)}
                className="flex flex-col gap-1.5 p-2.5 rounded-lg transition-all text-left"
                style={{
                  background: active ? 'rgba(59,130,246,0.12)' : 'var(--bg-elevated)',
                  border: `1.5px solid ${active ? 'rgba(59,130,246,0.45)' : 'var(--border-subtle)'}`,
                  color: active ? 'var(--accent-blue)' : 'var(--text-muted)',
                }}
              >
                <div
                  className="w-full rounded overflow-hidden"
                  style={{
                    height: 48,
                    background: active ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.03)',
                  }}
                >
                  <PatternSvg pattern={p} />
                </div>
                <div>
                  <div className="text-xs font-semibold">{PATTERN_LABELS[p].name}</div>
                  <div className="text-[10px] mt-0.5" style={{ opacity: 0.65 }}>{PATTERN_LABELS[p].desc}</div>
                </div>
              </button>
            )
          })}
        </div>
        <div className="flex gap-2 mt-1">
          <button
            onClick={() => setEnabledPatterns([...ALL_PATTERNS])}
            className="flex-1 py-1.5 rounded text-xs transition-colors"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
          >
            Select all
          </button>
          <button
            onClick={() => {
              const rand = ALL_PATTERNS[Math.floor(Math.random() * ALL_PATTERNS.length)]!
              setEnabledPatterns([rand])
            }}
            className="flex-1 py-1.5 rounded text-xs transition-colors"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
          >
            Pick one randomly
          </button>
        </div>
      </div>

      {/* Suppressed Errors Section */}
      {suppressedErrors.size > 0 && (
        <>
          <SectionHeader sub="Manage suppressed error patterns">Suppressed Errors</SectionHeader>
          <div className="px-4 py-3 section-block flex flex-col gap-2">
            <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>
              These error patterns are currently suppressed and won't be logged.
            </p>
            <div className="flex flex-col gap-1.5">
              {Array.from(suppressedErrors).map((pattern) => {
                const [type, ...messageParts] = pattern.split(':')
                const message = messageParts.join(':')
                
                return (
                  <div
                    key={pattern}
                    className="flex items-start gap-2 px-2.5 py-2 rounded text-[11px]"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faEyeSlash}
                      style={{
                        fontSize: 10,
                        color: 'var(--text-muted)',
                        marginTop: 2,
                        flexShrink: 0,
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-medium mb-0.5"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {type}
                      </div>
                      <div
                        className="text-[10px] leading-snug"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {message}
                      </div>
                    </div>
                    <button
                      onClick={() => unsuppressErrorPattern(pattern)}
                      className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded text-[10px] transition-colors"
                      style={{
                        color: 'var(--text-muted)',
                        opacity: 0.6,
                      }}
                      title="Unsuppress"
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
                )
              })}
            </div>
            <button
              onClick={clearSuppressedErrors}
              className="py-1.5 rounded text-xs transition-colors mt-1"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              Clear All Suppressions
            </button>
          </div>
        </>
      )}

      <SectionHeader sub="Remove items or reset everything">Danger Zone</SectionHeader>
      <div className="px-4 py-3 section-block flex flex-col gap-2">
        {pendingAction === 'clear' ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Remove all items from the wall? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  clearAll()
                  setPendingAction(null)
                }}
                className="flex-1 py-2 rounded text-xs font-semibold transition-colors"
                style={{ 
                  background: 'rgba(239,68,68,0.15)', 
                  color: '#ef4444', 
                  border: '1px solid rgba(239,68,68,0.35)' 
                }}
              >
                Confirm Clear
              </button>
              <button
                onClick={() => setPendingAction(null)}
                className="flex-1 py-2 rounded text-xs font-semibold transition-colors"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : pendingAction === 'reset' ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Reset all settings, wall dimensions, and items to defaults? This will clear everything including images. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  void resetEverything()
                  setPendingAction(null)
                }}
                className="flex-1 py-2 rounded text-xs font-semibold transition-colors"
                style={{ 
                  background: 'rgba(239,68,68,0.15)', 
                  color: '#ef4444', 
                  border: '1px solid rgba(239,68,68,0.35)' 
                }}
              >
                Confirm Reset
              </button>
              <button
                onClick={() => setPendingAction(null)}
                className="flex-1 py-2 rounded text-xs font-semibold transition-colors"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              onClick={() => setPendingAction('clear')}
              className="py-2 rounded text-xs font-semibold transition-colors"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
            >
              Clear All Items
            </button>
            <button
              onClick={() => setPendingAction('reset')}
              className="py-2 rounded text-xs font-semibold transition-colors"
              style={{ 
                background: 'rgba(239,68,68,0.08)', 
                color: '#ef4444', 
                border: '1px solid rgba(239,68,68,0.25)' 
              }}
            >
              Reset Everything
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Tab navigation ─────────────────────────────────────────────

type PanelTab = 'properties' | 'settings'

// ── Root export ────────────────────────────────────────────────

export function RightPanel() {
  const unit = useStore((s) => s.unit)
  const [tab, setTab] = useState<PanelTab>('properties')
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)

  return (
    <>
    <aside
      className="flex-shrink-0 flex flex-col h-full"
      style={{
        background: 'var(--bg-panel)',
        borderLeft: '1px solid var(--border-subtle)',
      }}
    >
      {/* Tab bar */}
      <div
        className="flex flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        {(['properties', 'settings'] as PanelTab[]).map((t) => {
          const icons = { properties: faBorderAll, settings: faGear } as const
          const labels = { properties: 'Layout', settings: 'Settings' }
          return (
            <button
              key={t}
              className={`panel-tab${tab === t ? ' active' : ''}`}
              style={{ paddingTop: 12, paddingBottom: 12, fontSize: 12 }}
              onClick={() => setTab(t)}
            >
              <FontAwesomeIcon icon={icons[t]} className="mr-1.5" />
              {labels[t]}
            </button>
          )
        })}
      </div>

      {/* Tab content - flex-1 allows it to grow and push footer down */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {tab === 'properties' && (
          <>
            <SectionHeader sub="Dimensions & background">Wall</SectionHeader>
            <WallSettings unit={unit} />

            <SectionHeader sub="Spacing, snap & behavior">Layout</SectionHeader>
            <LayoutSettings unit={unit} />

            {/* History Section - below layout properties */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '1rem' }}>
              <HistorySection />
            </div>
          </>
        )}

        {tab === 'settings' && <SettingsTab />}
      </div>

      {/* Error Log - flex-shrink-0 keeps it from shrinking */}
      <ErrorLogSection />

      {/* Footer - flex-shrink-0 pins it to bottom */}
      <div
        className="flex-shrink-0 px-4 py-3 text-center text-xs"
        style={{
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-input)',
          color: 'var(--text-muted)',
        }}
      >
        <div className="mb-1">
          © {new Date().getFullYear()}{' '}
          <a
            href="https://nateshoffner.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-blue)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            Nate Shoffner
          </a>
        </div>
        <div>
          <button
            onClick={() => setShowPrivacyModal(true)}
            style={{ 
              color: 'var(--text-secondary)', 
              textDecoration: 'none',
              background: 'none',
              border: 'none',
              padding: 0,
              font: 'inherit',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-blue)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            Privacy
          </button>
          {' • '}
          Build:{' '}
          <a
            href={`https://github.com/NateShoffner/gallery-wall-planner/commit/${process.env.GIT_HASH}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontFamily: 'monospace' }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            title="View commit on GitHub"
          >
            {process.env.GIT_HASH || 'unknown'}
          </a>
        </div>
      </div>
    </aside>

    {showPrivacyModal && <PrivacyModal onClose={() => setShowPrivacyModal(false)} />}
    </>
  )
}

