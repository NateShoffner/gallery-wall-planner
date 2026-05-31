'use client'

import { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus, faXmark, faSearch, faLock, faLockOpen, faTrash, faImage,
  faRotateLeft, faRotateRight, faCheck, faMicrochip,
} from '@fortawesome/free-solid-svg-icons'
import { useStore } from '@/store/useStore'
import { fromDisplayUnit, unitSuffix, toDisplayUnit, unitStep } from '@/lib/utils'
import { PieceCard } from '@/components/PieceCard'
import { ImageProcessModal } from '@/components/ImageProcessModal'
import type { Piece, MeasureUnit, AIProcessingData } from '@/types'
import toast from 'react-hot-toast'

// ── Piece Properties ───────────────────────────────────────────

function PieceProperties({ piece, unit }: { piece: Piece; unit: MeasureUnit }) {
  const imageCache = useStore((s) => s.imageCache)
  const setPieceProps = useStore((s) => s.setPieceProps)
  const setPieceMargin = useStore((s) => s.setPieceMargin)
  const toggleLock = useStore((s) => s.toggleLock)
  const rotatePiece = useStore((s) => s.rotatePiece)
  const removePiece = useStore((s) => s.removePiece)
  const setPieceImage = useStore((s) => s.setPieceImage)
  const clearPieceImage = useStore((s) => s.clearPieceImage)
  const reprocessPieceWithAI = useStore((s) => s.reprocessPieceWithAI)

  const imgRef = useRef<HTMLInputElement>(null)
  const thumbnail = piece.imageId ? imageCache[piece.imageId] : null
  const suf = unitSuffix(unit)
  const step = unitStep(unit)

  const [nameLocal, setNameLocal] = useState(piece.name)
  const [confirmDelete, setConfirmDelete] = useState(false)
  
  // AI Processing Modal state
  const [imageProcessModalOpen, setImageProcessModalOpen] = useState(false)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [reprocessMode, setReprocessMode] = useState(false)

  useEffect(() => { setNameLocal(piece.name) }, [piece.name])
  useEffect(() => {
    if (!confirmDelete) return
    const id = setTimeout(() => setConfirmDelete(false), 4000)
    return () => clearTimeout(id)
  }, [confirmDelete])

  function commitName() {
    if (nameLocal !== piece.name) setPieceProps(piece.id, { name: nameLocal })
  }
  
  function handlePieceImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) {
      if (f.size > 5 * 1024 * 1024) {
        toast.error('Image must be under 5MB')
        e.target.value = ''
        return
      }
      
      if (!f.type.startsWith('image/')) {
        toast.error('Please select an image file')
        e.target.value = ''
        return
      }
      
      setSelectedImageFile(f)
      setReprocessMode(false)
      setImageProcessModalOpen(true)
    }
    e.target.value = ''
  }
  
  async function handleRetroactiveAIProcessing() {
    try {
      const file = await reprocessPieceWithAI(piece.id)
      setSelectedImageFile(file)
      setReprocessMode(true)
      setImageProcessModalOpen(true)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Failed to load image: ${errorMessage}`)
    }
  }
  
  function handleImageProcessed(processedFile: File, aiData?: AIProcessingData) {
    void setPieceImage(piece.id, processedFile, aiData).then(() => {
      setImageProcessModalOpen(false)
      setSelectedImageFile(null)
      setReprocessMode(false)
      
      if (aiData) {
        toast.success(`Image AI processed! Confidence: ${(aiData.confidence * 100).toFixed(0)}%`)
      } else {
        toast.success('Image uploaded successfully')
      }
    })
  }
  
  function handleImageProcessCancel() {
    setImageProcessModalOpen(false)
    setSelectedImageFile(null)
    setReprocessMode(false)
  }

  const inputStyle = {
    background: 'var(--bg-input)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)',
    outline: 'none' as const,
  }

  return (
    <>
      <div className="overflow-y-auto flex-shrink-0" style={{ maxHeight: '60vh' }}>
      {/* Identity & Actions */}
      <div className="px-4 py-3 flex flex-col gap-2.5">
        <div className="flex items-center gap-3">
            {thumbnail ? (
              <img src={thumbnail} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" style={{ border: '1px solid var(--border-subtle)' }} />
            ) : (
              <div className="w-10 h-10 rounded flex-shrink-0" style={{ background: piece.color, border: '1px solid var(--border-subtle)' }} />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {toDisplayUnit(piece.w, unit).toFixed(unit === 'in' ? 0 : 1)} × {toDisplayUnit(piece.h, unit).toFixed(unit === 'in' ? 0 : 1)} {suf}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {piece.locked ? 'Locked · ' : ''}{Math.round(((piece.rotation % 360) + 360) % 360)}°
              </div>
            </div>
          </div>

          <input
            type="text"
            value={nameLocal}
            placeholder="Canvas name…"
            onChange={(e) => setNameLocal(e.target.value)}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--border-subtle)'; commitName() }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { commitName(); (e.target as HTMLInputElement).blur() }
              if (e.key === 'Escape') { setNameLocal(piece.name); (e.target as HTMLInputElement).blur() }
            }}
            className="w-full px-2.5 py-1.5 rounded text-sm"
            style={inputStyle}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent-blue)' }}
          />
          
          {/* Inline Lock/Remove buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleLock(piece.id)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded text-sm transition-all"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
              title={piece.locked ? 'Unlock' : 'Lock'}
            >
              <FontAwesomeIcon icon={piece.locked ? faLockOpen : faLock} />
              {piece.locked ? 'Unlock' : 'Lock'}
            </button>

            {confirmDelete ? (
              <>
                <button
                  onClick={() => { setConfirmDelete(false); removePiece(piece.id) }}
                  className="px-3 py-2 rounded text-sm transition-colors"
                  style={{ background: 'rgba(251,191,36,0.12)', color: '#fde68a', border: '1px solid var(--border-subtle)' }}
                  title="Confirm removal"
                >
                  <FontAwesomeIcon icon={faCheck} />
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-2 rounded text-sm transition-colors"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
                  title="Cancel"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded text-sm transition-all"
                style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#f87171' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                <FontAwesomeIcon icon={faTrash} /> Remove
              </button>
            )}
          </div>
        </div>

        {/* Position */}
        <div className="px-4 py-3 flex flex-col gap-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>POSITION</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium flex-shrink-0 w-14" style={{ color: 'var(--text-muted)' }}>X</span>
            <input
              type="number"
              value={toDisplayUnit(piece.x, unit).toFixed(unit === 'in' ? 0 : 1)}
              step={step}
              onChange={(e) => setPieceProps(piece.id, { x: fromDisplayUnit(parseFloat(e.target.value), unit) })}
              className="flex-1 px-2.5 py-1.5 rounded text-sm tabular-nums"
              style={inputStyle}
            />
            <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{suf}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium flex-shrink-0 w-14" style={{ color: 'var(--text-muted)' }}>Y</span>
            <input
              type="number"
              value={toDisplayUnit(piece.y, unit).toFixed(unit === 'in' ? 0 : 1)}
              step={step}
              onChange={(e) => setPieceProps(piece.id, { y: fromDisplayUnit(parseFloat(e.target.value), unit) })}
              className="flex-1 px-2.5 py-1.5 rounded text-sm tabular-nums"
              style={inputStyle}
            />
            <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{suf}</span>
          </div>
        </div>

        {/* Rotation */}
        <div className="px-4 py-3 flex flex-col gap-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>ROTATION</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium flex-shrink-0 w-14" style={{ color: 'var(--text-muted)' }}>Rotate</span>
            <input
              type="number"
              value={Math.round(((piece.rotation % 360) + 360) % 360)}
              min={0}
              max={359}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                if (!isNaN(v)) setPieceProps(piece.id, { rotation: v })
              }}
              className="flex-1 px-2.5 py-1.5 rounded text-sm tabular-nums"
              style={inputStyle}
            />
            <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>°</span>
            <button
              onClick={() => rotatePiece(piece.id, -90)}
              disabled={piece.locked}
              className="w-8 h-8 flex items-center justify-center rounded text-sm transition-all disabled:opacity-30"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
              title="Rotate 90° CCW"
            >
              <FontAwesomeIcon icon={faRotateLeft} />
            </button>
            <button
              onClick={() => rotatePiece(piece.id, 90)}
              disabled={piece.locked}
              className="w-8 h-8 flex items-center justify-center rounded text-sm transition-all disabled:opacity-30"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
              title="Rotate 90° CW"
            >
              <FontAwesomeIcon icon={faRotateRight} />
            </button>
          </div>
        </div>

        {/* Margin */}
        <div className="px-4 py-3 flex flex-col gap-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>MARGIN</span>
            <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
              {toDisplayUnit(piece.margin, unit).toFixed(unit === 'in' ? 2 : 1)}{suf}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={unit === 'cm' ? 10.16 : unit === 'ft' ? 0.333 : 4}
            step={step}
            value={toDisplayUnit(piece.margin, unit)}
            onChange={(e) => setPieceMargin(piece.id, fromDisplayUnit(parseFloat(e.target.value), unit))}
            className="w-full"
            style={{ accentColor: 'var(--accent-orange)' }}
          />
        </div>

        {/* Photo */}
        <div className="px-4 py-3 flex flex-col gap-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>IMAGE</span>
          <div className="flex items-center gap-2">
            {thumbnail ? (
              <>
                <button
                  onClick={() => imgRef.current?.click()}
                  className="flex-1 px-2.5 py-1.5 rounded text-sm transition-colors truncate flex items-center gap-1.5"
                  style={{
                    background: 'rgba(59,130,246,0.15)',
                    border: '1px solid rgba(59,130,246,0.4)',
                    color: '#93c5fd',
                  }}
                >
                  <FontAwesomeIcon icon={faImage} className="text-xs" />
                  Attached
                </button>
                
                {piece.aiProcessed ? (
                  <span 
                    className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1 flex-shrink-0"
                    style={{
                      background: 'rgba(59, 130, 246, 0.15)',
                      color: '#93c5fd',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                    }}
                    title={`AI processed on ${new Date(piece.aiProcessingData?.processedAt || 0).toLocaleDateString()}`}
                  >
                    <FontAwesomeIcon icon={faMicrochip} />
                  </span>
                ) : (
                  <span 
                    className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1 flex-shrink-0"
                    style={{
                      background: 'var(--bg-input)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)',
                    }}
                    title="Not AI processed"
                  >
                    <FontAwesomeIcon icon={faMicrochip} style={{ opacity: 0.5 }} />
                  </span>
                )}
                
                <button
                  onClick={() => void clearPieceImage(piece.id)}
                  className="w-8 h-8 rounded flex items-center justify-center text-xs flex-shrink-0"
                  style={{ color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </>
            ) : (
              <button
                onClick={() => imgRef.current?.click()}
                className="flex-1 px-2.5 py-1.5 rounded text-sm transition-colors truncate flex items-center gap-1.5"
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                }}
              >
                <FontAwesomeIcon icon={faImage} className="text-xs" />
                Add photo
              </button>
            )}
            <input
              ref={imgRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePieceImageSelect}
            />
          </div>
          
          {thumbnail && !piece.aiProcessed && (
            <div 
              className="p-3 rounded"
              style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
              }}
            >
              <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                <FontAwesomeIcon icon={faMicrochip} /> This image hasn&apos;t been AI processed
              </p>
              <button
                onClick={handleRetroactiveAIProcessing}
                className="w-full px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                style={{
                  background: 'var(--accent-blue)',
                  color: 'white',
                }}
              >
                <FontAwesomeIcon icon={faMicrochip} /> Process with AI Now
              </button>
            </div>
          )}
        </div>
      </div>
      
      {imageProcessModalOpen && selectedImageFile && (
        <ImageProcessModal
          file={selectedImageFile}
          onCancel={handleImageProcessCancel}
          onConfirm={handleImageProcessed}
          mode={reprocessMode ? 'reprocess' : 'upload'}
          existingAIData={piece.aiProcessingData}
        />
      )}
    </>
  )
}

// ── Main Left Panel ────────────────────────────────────────────

export function LeftPanel() {
  const pieces = useStore((s) => s.pieces)
  const selectedId = useStore((s) => s.selectedId)
  const selectedPiece = useStore((s) => s.pieces.find((p) => p.id === s.selectedId))
  const unit = useStore((s) => s.unit)
  const addPiece = useStore((s) => s.addPiece)

  const [adding, setAdding] = useState(false)
  const [addW, setAddW] = useState('')
  const [addH, setAddH] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const suf = unitSuffix(unit)
  const exW = unit === 'cm' ? '60' : unit === 'ft' ? '2' : '24'
  const exH = unit === 'cm' ? '90' : unit === 'ft' ? '3' : '36'

  const filteredPieces = pieces.filter((piece) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const name = piece.name.toLowerCase()
    const size = `${piece.w}x${piece.h}`
    return name.includes(query) || size.includes(query)
  })

  function handleAdd() {
    const wDisplay = parseFloat(addW)
    const hDisplay = parseFloat(addH)
    if (wDisplay > 0 && hDisplay > 0) {
      addPiece(fromDisplayUnit(wDisplay, unit), fromDisplayUnit(hDisplay, unit))
      setAddW('')
      setAddH('')
      setAdding(false)
    }
  }

  return (
    <aside
      className="flex flex-col h-full"
      style={{
        background: 'var(--bg-panel)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Items
          </div>
          {pieces.length > 0 && (
            <div className="text-sm mt-0.5 tabular-nums" style={{ color: 'var(--text-muted)', opacity: 0.65 }}>
              {pieces.length} item{pieces.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        <button
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: adding ? 'var(--accent-blue)' : 'rgba(59,130,246,0.15)',
            border: `1px solid ${adding ? 'var(--accent-blue)' : 'rgba(59,130,246,0.3)'}`,
            color: adding ? 'white' : 'var(--accent-blue)',
          }}
        >
          {adding
            ? <><FontAwesomeIcon icon={faXmark} /> Cancel</>
            : <><FontAwesomeIcon icon={faPlus} /> Add</>
          }
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div
          className="flex flex-col gap-3 px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-input)' }}
        >
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            New item size ({suf})
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Width</label>
              <input
                type="number"
                placeholder={exW}
                value={addW}
                min={1}
                max={unit === 'cm' ? 300 : unit === 'ft' ? 10 : 120}
                autoFocus
                onChange={(e) => setAddW(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd()
                  if (e.key === 'Escape') setAdding(false)
                }}
                className="w-full px-2.5 py-2 rounded text-sm tabular-nums"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-normal)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 18, flexShrink: 0 }}>×</span>
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Height</label>
              <input
                type="number"
                placeholder={exH}
                value={addH}
                min={1}
                max={unit === 'cm' ? 300 : unit === 'ft' ? 10 : 120}
                onChange={(e) => setAddH(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd()
                  if (e.key === 'Escape') setAdding(false)
                }}
                className="w-full px-2.5 py-2 rounded text-sm tabular-nums"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-normal)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>
          </div>
          <button
            onClick={handleAdd}
            className="w-full py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: 'var(--accent-blue)', color: 'white' }}
          >
            Add Item
          </button>
        </div>
      )}

      {/* Search bar */}
      {pieces.length > 0 && (
        <div
          className="flex-shrink-0 px-2 py-2"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="relative">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-xs"
              style={{ color: 'var(--text-muted)', opacity: 0.5 }}
            />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded text-sm"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
              onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent-blue)' }}
              onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--border-subtle)' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded text-xs"
                style={{ color: 'var(--text-muted)', opacity: 0.6 }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'var(--bg-hover)' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.background = 'transparent' }}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Piece list */}
      <div className="flex-1 overflow-y-auto py-2 px-2 flex flex-col gap-0.5 min-h-0">
        {pieces.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
            <FontAwesomeIcon icon={faPlus} style={{ fontSize: 48, opacity: 0.1, color: 'var(--text-muted)' }} />
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Load <strong style={{ color: 'var(--text-secondary)' }}>Demo</strong> or click{' '}
              <strong style={{ color: 'var(--accent-blue)' }}>+ Add</strong> to get started.
            </p>
          </div>
        ) : filteredPieces.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
            <FontAwesomeIcon icon={faSearch} style={{ fontSize: 48, opacity: 0.1, color: 'var(--text-muted)' }} />
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              No items match &quot;{searchQuery}&quot;
            </p>
          </div>
        ) : (
          <>
            {filteredPieces.map((piece) => (
              <PieceCard key={piece.id} piece={piece} selected={piece.id === selectedId} />
            ))}
          </>
        )}
      </div>

      {/* Selected piece properties - always show */}
      <div className="flex flex-col border-t flex-shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
        {/* Header */}
        <div className="px-4 py-2.5 flex-shrink-0" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Selected Item
          </div>
        </div>

        {selectedPiece ? (
          <PieceProperties piece={selectedPiece} unit={unit} />
        ) : (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Select an item to view properties
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
