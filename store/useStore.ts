'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import toast from 'react-hot-toast'
import { COLORS, DEFAULT_PIECE_MARGIN, DEFAULT_GAP, DEMO_SPECS, PATTERN_LABELS } from '@/lib/constants'
import {
  getRandomPos, placeWithoutOverlap, swapShuffle,
  compactCluster, crossCluster, diagonalCluster, brickCluster,
  gridCluster, columnCluster, scatteredCluster, circularCluster,
  pyramidCluster, spiralCluster, centeredCluster,
  snapRotation, resolveOverlaps, checkClusterFeasibility, hasOverlaps,
} from '@/lib/utils'
import {
  storeImage, getAllImages, deleteImage, clearAllImages, fileToDataUrl,
} from '@/lib/imageStore'
import type { Piece, Wall, WorkArea, HistorySnapshot, LayoutExport, MeasureUnit, ClusterPattern, ErrorLogEntry, AIProcessingData } from '@/types'

const MAX_HISTORY = 50

const ALL_PATTERNS: ClusterPattern[] = ['shelf', 'cross', 'diagonal', 'brick', 'grid', 'column', 'scattered', 'circular', 'pyramid', 'spiral', 'centered']

// Session-only: track last used pattern so consecutive clicks always vary
let _lastClusterPattern: ClusterPattern | null = null

interface StoreState {
  // ── Persisted layout ─────────────────────────────────────
  wall: Wall
  gap: number
  snapEnabled: boolean
  showGrid: boolean
  showRulers: boolean
  showPieceInfo: 'off' | 'hover' | 'always'
  gridSize: number
  allowOverlap: boolean
  snapToNearby: boolean
  unit: MeasureUnit
  theme: 'dark' | 'light'
  enabledPatterns: ClusterPattern[]
  pieces: Piece[]
  _nextId: number
  _colorIndex: number

  // ── Session-only ─────────────────────────────────────────
  selectedId: string | null
  undoStack: HistorySnapshot[]
  redoStack: HistorySnapshot[]
  imageCache: Record<string, string>
  errorLog: ErrorLogEntry[]
  suppressedErrors: Set<string>

  // ── Layout actions ────────────────────────────────────────
  setWall(w: number, h: number): void
  setBgColor(color: string): void
  setWallWorkArea(area: WorkArea | null): void
  setGap(m: number): void
  setSnap(enabled: boolean): void
  setShowGrid(enabled: boolean): void
  setShowRulers(enabled: boolean): void
  setShowPieceInfo(mode: 'off' | 'hover' | 'always'): void
  setGridSize(size: number): void
  setAllowOverlap(v: boolean): void
  setSnapToNearby(enabled: boolean): void
  setUnit(u: MeasureUnit): void
  setTheme(t: 'dark' | 'light'): void
  setEnabledPatterns(patterns: ClusterPattern[]): void
  selectPiece(id: string | null): void
  addPiece(w: number, h: number): void
  removePiece(id: string): void
  updatePiece(id: string, changes: Partial<Pick<Piece, 'x' | 'y' | 'rotation'>>): void
  resizePiece(id: string, changes: Partial<Pick<Piece, 'x' | 'y' | 'w' | 'h'>>): void
  toggleLock(id: string): void
  rotatePiece(id: string, delta: number): void
  setPieceMargin(id: string, margin: number): void
  setPieceProps(id: string, changes: Partial<Pick<Piece, 'x' | 'y' | 'rotation' | 'margin' | 'name'>>): void

  // ── Bulk ops ──────────────────────────────────────────────
  shuffle(): void
  cluster(): void
  loadDemo(): void
  clearAll(): void
  resetEverything(): Promise<void>

  // ── History ───────────────────────────────────────────────
  pushHistory(label?: string): void
  undo(): void
  redo(): void
  restoreSnapshot(index: number, stack: 'undo' | 'redo'): void

  // ── Images ───────────────────────────────────────────────
  initImages(): Promise<void>
  setPieceImage(pieceId: string, file: File, aiData?: AIProcessingData): Promise<void>
  clearPieceImage(pieceId: string): Promise<void>
  setWallBgImage(file: File): Promise<void>
  setWallBgImageDataUrl(dataUrl: string): Promise<void>
  clearWallBgImage(): Promise<void>
  
  // ── AI Processing ────────────────────────────────────────
  reprocessPieceWithAI(pieceId: string): Promise<File>
  getUnprocessedPieceCount(): number

  // ── Import / Export ───────────────────────────────────────
  exportLayout(): Promise<void>
  exportAsImage(format?: 'png' | 'webp' | 'svg'): Promise<void>
  importLayout(file: File): Promise<void>
  _generateSVG(): Promise<string>

  // ── Error Log ─────────────────────────────────────────────
  addError(type: ErrorLogEntry['type'], message: string, context?: ErrorLogEntry['context']): void
  clearErrors(): void
  dismissError(id: string): void
  suppressErrorPattern(pattern: string): void
  unsuppressErrorPattern(pattern: string): void
  clearSuppressedErrors(): void
}

function pickColor(index: number): string {
  return COLORS[index % COLORS.length]!
}

function snapshot(state: StoreState, label = 'Change'): HistorySnapshot {
  return {
    pieces: state.pieces.map((p) => ({ ...p })),
    wall: { ...state.wall },
    label,
    timestamp: Date.now(),
  }
}

function migratePiece(p: Record<string, unknown>): Piece {
  return {
    id: p.id as string,
    name: (p.name as string) ?? '',
    w: p.w as number,
    h: p.h as number,
    x: p.x as number,
    y: p.y as number,
    rotation: (p.rotation as number) ?? 0,
    locked: (p.locked as boolean) ?? false,
    color: (p.color as string) ?? COLORS[0]!,
    margin: (p.margin as number) ?? DEFAULT_PIECE_MARGIN,
    imageId: (p.imageId as string | null) ?? null,
  }
}

function pickRandomPattern(enabled: ClusterPattern[]): ClusterPattern {
  const pool = enabled.length > 0 ? enabled : ALL_PATTERNS
  // When multiple patterns are available, never pick the same one twice in a row
  const candidates = pool.length > 1 ? pool.filter((p) => p !== _lastClusterPattern) : pool
  const chosen = candidates[Math.floor(Math.random() * candidates.length)]!
  _lastClusterPattern = chosen
  return chosen
}

const CLUSTER_FNS: Record<ClusterPattern, typeof compactCluster> = {
  shelf: compactCluster,
  cross: crossCluster,
  diagonal: diagonalCluster,
  brick: brickCluster,
  grid: gridCluster,
  column: columnCluster,
  scattered: scatteredCluster,
  circular: circularCluster,
  pyramid: pyramidCluster,
  spiral: spiralCluster,
  centered: centeredCluster,
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // ── Initial state ───────────────────────────────────
      wall: { width: 96, height: 60, bgColor: '#F5F0E8', imageId: null, workArea: null },
      gap: DEFAULT_GAP,
      snapEnabled: false,
      showGrid: true,
      showRulers: true,
      showPieceInfo: 'hover',
      gridSize: 24,
      allowOverlap: false,
      snapToNearby: true,
      unit: 'in',
      theme: 'dark',
      enabledPatterns: [...ALL_PATTERNS],
      pieces: [],
      selectedId: null,
      _nextId: 1,
      _colorIndex: 0,
      undoStack: [],
      redoStack: [],
      imageCache: {},
      errorLog: [],
      suppressedErrors: new Set(),

      // ── Layout ──────────────────────────────────────────

      setWall(w, h) {
        get().pushHistory('Resize wall')
        set((s) => ({ wall: { ...s.wall, width: w, height: h } }))
      },
      setBgColor(color) {
        set((s) => ({ wall: { ...s.wall, bgColor: color } }))
      },
      setWallWorkArea(area) {
        set((s) => ({ wall: { ...s.wall, workArea: area } }))
      },
      setGap(m) {
        set({ gap: m })
      },
      setSnap(enabled) {
        set({ snapEnabled: enabled })
      },
      setShowGrid(enabled) {
        set({ showGrid: enabled })
      },
      setShowRulers(enabled) {
        set({ showRulers: enabled })
      },
      setShowPieceInfo(mode) {
        set({ showPieceInfo: mode })
      },
      setGridSize(size) {
        set({ gridSize: size })
      },
      setAllowOverlap(v) {
        set({ allowOverlap: v })
      },
      setSnapToNearby(enabled) {
        set({ snapToNearby: enabled })
      },
      setUnit(u) {
        set({ unit: u })
      },
      setTheme(t) {
        set({ theme: t })
      },
      setEnabledPatterns(patterns) {
        set({ enabledPatterns: patterns.length > 0 ? patterns : [...ALL_PATTERNS] })
      },
      selectPiece(id) {
        set({ selectedId: id })
      },

      addPiece(w, h) {
        const s = get()
        s.pushHistory('Add item')
        const pos = getRandomPos(w, h, s.wall, s.gap)
        const piece: Piece = {
          id: `p${s._nextId}`,
          name: `Item ${s._nextId}`,
          w,
          h,
          x: pos.x,
          y: pos.y,
          rotation: 0,
          locked: false,
          color: pickColor(s._colorIndex),
          margin: DEFAULT_PIECE_MARGIN,
          imageId: null,
        }
        set((s) => ({
          pieces: [...s.pieces, piece],
          _nextId: s._nextId + 1,
          _colorIndex: s._colorIndex + 1,
          selectedId: piece.id,
        }))
      },

      removePiece(id) {
        const piece = get().pieces.find((p) => p.id === id)
        const pieceName = piece?.name || `${piece?.w} × ${piece?.h} in`
        get().pushHistory(`Remove ${pieceName}`)
        if (piece?.imageId) void deleteImage(piece.imageId)
        set((s) => ({
          pieces: s.pieces.filter((p) => p.id !== id),
          selectedId: s.selectedId === id ? null : s.selectedId,
          imageCache: piece?.imageId
            ? Object.fromEntries(Object.entries(s.imageCache).filter(([k]) => k !== piece.imageId))
            : s.imageCache,
        }))
      },

      updatePiece(id, changes) {
        set((s) => ({ pieces: s.pieces.map((p) => (p.id === id ? { ...p, ...changes } : p)) }))
      },

      resizePiece(id, changes) {
        set((s) => ({ pieces: s.pieces.map((p) => (p.id === id ? { ...p, ...changes } : p)) }))
      },

      toggleLock(id) {
        const piece = get().pieces.find((p) => p.id === id)
        const pieceName = piece?.name || `${piece?.w} × ${piece?.h} in`
        get().pushHistory(`${piece?.locked ? 'Unlock' : 'Lock'} ${pieceName}`)
        set((s) => ({
          pieces: s.pieces.map((p) => (p.id === id ? { ...p, locked: !p.locked } : p)),
        }))
      },

      rotatePiece(id, delta) {
        const piece = get().pieces.find((p) => p.id === id)
        const pieceName = piece?.name || `${piece?.w} × ${piece?.h} in`
        get().pushHistory(`Rotate ${pieceName}`)
        const { snapEnabled } = get()
        set((s) => ({
          pieces: s.pieces.map((p) =>
            p.id === id && !p.locked
              ? { ...p, rotation: snapRotation(p.rotation + delta, snapEnabled) }
              : p,
          ),
        }))
      },

      setPieceMargin(id, margin) {
        set((s) => ({ pieces: s.pieces.map((p) => (p.id === id ? { ...p, margin } : p)) }))
      },

      setPieceProps(id, changes) {
        const piece = get().pieces.find((p) => p.id === id)
        const pieceName = piece?.name || `${piece?.w} × ${piece?.h} in`
        get().pushHistory(`Edit ${pieceName}`)
        set((s) => ({ pieces: s.pieces.map((p) => (p.id === id ? { ...p, ...changes } : p)) }))
      },

      // ── Bulk ops ────────────────────────────────────────

      shuffle() {
        get().pushHistory('Shuffle')
        set((s) => ({ pieces: swapShuffle(s.pieces), selectedId: null }))
      },

      cluster() {
        const { pieces, wall, gap, snapEnabled, gridSize, enabledPatterns, allowOverlap, suppressedErrors } = get()
        
        // Helper to check if error is suppressed and conditionally show toast/log
        function logError(type: ErrorLogEntry['type'], msg: string, context?: ErrorLogEntry['context']) {
          const patternKey = `${type}:${msg}`
          if (suppressedErrors.has(patternKey)) {
            return // Suppressed, don't show toast or log
          }
          toast.error(msg)
          get().addError(type, msg, context)
        }
        
        // Check if there are any enabled patterns
        if (enabledPatterns.length === 0) {
          const msg = 'Cannot re-arrange: No patterns are enabled. Please enable at least one pattern in the settings.'
          logError('pattern', msg, {
            pieceCount: pieces.length,
            wallSize: { width: wall.width, height: wall.height },
            gap,
            allowOverlap,
          })
          return
        }
        
        // Check feasibility before clustering
        const feasibilityCheck = checkClusterFeasibility(pieces, wall, gap)
        if (!feasibilityCheck.feasible) {
          const msg = `Cannot re-arrange: ${feasibilityCheck.reason}. Try: reducing gap, enabling overlap, or using a larger wall.`
          logError('feasibility', msg, {
            pieceCount: pieces.length,
            wallSize: { width: wall.width, height: wall.height },
            gap,
            allowOverlap,
          })
          return
        }
        
        const pattern = pickRandomPattern(enabledPatterns)
        const patternName = PATTERN_LABELS[pattern]?.name || pattern
        const fn = CLUSTER_FNS[pattern]
        let clustered = fn(pieces, wall, gap, snapEnabled, gridSize)
        
        if (!allowOverlap) {
          clustered = resolveOverlaps(clustered, wall, gap)
          
          // Check if overlaps still exist after resolution
          if (hasOverlaps(clustered, gap)) {
            const msg = `Cannot re-arrange with ${patternName} pattern: Pieces cannot fit without overlapping. Try: reducing gap, enabling overlap, using a larger wall, or removing some pieces.`
            logError('overlap', msg, {
              patternName,
              pieceCount: pieces.length,
              wallSize: { width: wall.width, height: wall.height },
              gap,
              allowOverlap,
            })
            return
          }
        }
        
        // Only push to history if pieces actually changed
        const hasChanges = pieces.some((piece, i) => {
          const clusteredPiece = clustered[i]
          return clusteredPiece && (
            piece.x !== clusteredPiece.x ||
            piece.y !== clusteredPiece.y ||
            piece.rotation !== clusteredPiece.rotation
          )
        })
        
        if (!hasChanges) {
          return
        }
        
        get().pushHistory('Re-arrange')
        set({ pieces: clustered, selectedId: null })
      },

      loadDemo() {
        get().pushHistory('Load demo')
        const { wall, gap } = get()
        const pieces: Piece[] = []

        for (let i = 0; i < DEMO_SPECS.length; i++) {
          const spec = DEMO_SPECS[i]!
          const pm = DEFAULT_PIECE_MARGIN
          const pos = placeWithoutOverlap({ w: spec.w, h: spec.h, margin: pm }, pieces, wall, gap)
          pieces.push({
            id: `p${i + 1}`,
            name: `Item ${i + 1}`,
            w: spec.w,
            h: spec.h,
            x: pos.x,
            y: pos.y,
            rotation: 0,
            locked: false,
            color: pickColor(i),
            margin: pm,
            imageId: null,
          })
        }

        set({ pieces, selectedId: null, _nextId: DEMO_SPECS.length + 1, _colorIndex: DEMO_SPECS.length })
      },

      clearAll() {
        get().pushHistory('Clear all')
        get().pieces.forEach((p) => { if (p.imageId) void deleteImage(p.imageId) })
        set((s) => ({
          pieces: [],
          selectedId: null,
          imageCache: s.wall.imageId ? { [s.wall.imageId]: s.imageCache[s.wall.imageId]! } : {},
        }))
      },

      async resetEverything() {
        // Clear all images from IndexedDB
        await clearAllImages()
        
        // Reset to initial state
        set({
          wall: { width: 96, height: 60, bgColor: '#F5F0E8', imageId: null, workArea: null },
          gap: DEFAULT_GAP,
          snapEnabled: false,
          gridSize: 24,
          allowOverlap: false,
          unit: 'in',
          theme: 'dark',
          enabledPatterns: [...ALL_PATTERNS],
          pieces: [],
          selectedId: null,
          _nextId: 1,
          _colorIndex: 0,
          undoStack: [],
          redoStack: [],
          imageCache: {},
        })
      },

      // ── History ─────────────────────────────────────────

      pushHistory(label = 'Change') {
        const s = get()
        const snap = snapshot(s, label)
        set((s) => ({
          undoStack: [...s.undoStack, snap].slice(-MAX_HISTORY),
          redoStack: [],
        }))
      },

      undo() {
        const { undoStack, pieces, wall, redoStack } = get()
        if (undoStack.length === 0) return
        const prev = undoStack[undoStack.length - 1]!
        const current: HistorySnapshot = {
          pieces: pieces.map((p) => ({ ...p })),
          wall: { ...wall },
          label: 'Current',
          timestamp: Date.now(),
        }
        set({
          pieces: prev.pieces,
          wall: prev.wall,
          undoStack: undoStack.slice(0, -1),
          redoStack: [...redoStack, current].slice(-MAX_HISTORY),
          selectedId: null,
        })
      },

      redo() {
        const { redoStack, pieces, wall, undoStack } = get()
        if (redoStack.length === 0) return
        const next = redoStack[redoStack.length - 1]!
        const current: HistorySnapshot = {
          pieces: pieces.map((p) => ({ ...p })),
          wall: { ...wall },
          label: 'Current',
          timestamp: Date.now(),
        }
        set({
          pieces: next.pieces,
          wall: next.wall,
          redoStack: redoStack.slice(0, -1),
          undoStack: [...undoStack, current].slice(-MAX_HISTORY),
          selectedId: null,
        })
      },

      restoreSnapshot(index, stack) {
        const { undoStack, redoStack, pieces, wall } = get()
        const sourceStack = stack === 'undo' ? undoStack : redoStack
        const snap = sourceStack[index]
        if (!snap) return
        const current: HistorySnapshot = {
          pieces: pieces.map((p) => ({ ...p })),
          wall: { ...wall },
          label: 'Before restore',
          timestamp: Date.now(),
        }
        // Drop everything after this snapshot in the undo stack, push current to redo
        set({
          pieces: snap.pieces,
          wall: snap.wall,
          undoStack: stack === 'undo' ? undoStack.slice(0, index) : undoStack,
          redoStack: [current, ...(stack === 'redo' ? redoStack.slice(index + 1) : redoStack)].slice(0, MAX_HISTORY),
          selectedId: null,
        })
      },

      // ── Images ──────────────────────────────────────────

      async initImages() {
        const images = await getAllImages()
        set({ imageCache: images })
      },

      async setPieceImage(pieceId, file, aiData) {
        const dataUrl = await fileToDataUrl(file)
        const imageId = `piece-${pieceId}-${Date.now()}`
        const piece = get().pieces.find((p) => p.id === pieceId)
        if (piece?.imageId) await deleteImage(piece.imageId)
        await storeImage(imageId, dataUrl)
        set((s) => ({
          imageCache: { ...s.imageCache, [imageId]: dataUrl },
          pieces: s.pieces.map((p) => 
            p.id === pieceId 
              ? { 
                  ...p, 
                  imageId,
                  aiProcessed: !!aiData,
                  aiProcessingData: aiData ? {
                    ...aiData,
                    processedAt: Date.now(),
                  } : undefined,
                } 
              : p
          ),
        }))
      },

      async clearPieceImage(pieceId) {
        const piece = get().pieces.find((p) => p.id === pieceId)
        if (!piece?.imageId) return
        await deleteImage(piece.imageId)
        const oldId = piece.imageId
        set((s) => ({
          imageCache: Object.fromEntries(Object.entries(s.imageCache).filter(([k]) => k !== oldId)),
          pieces: s.pieces.map((p) => (p.id === pieceId ? { ...p, imageId: null, aiProcessed: false, aiProcessingData: undefined } : p)),
        }))
      },

      async setWallBgImage(file) {
        const dataUrl = await fileToDataUrl(file)
        const imageId = `wall-${Date.now()}`
        const { wall } = get()
        if (wall.imageId) await deleteImage(wall.imageId)
        await storeImage(imageId, dataUrl)
        set((s) => ({
          imageCache: { ...s.imageCache, [imageId]: dataUrl },
          wall: { ...s.wall, imageId, workArea: null },
        }))
      },

      async setWallBgImageDataUrl(dataUrl) {
        const imageId = `wall-${Date.now()}`
        const { wall } = get()
        if (wall.imageId) await deleteImage(wall.imageId)
        await storeImage(imageId, dataUrl)
        set((s) => ({
          imageCache: { ...s.imageCache, [imageId]: dataUrl },
          wall: { ...s.wall, imageId },
        }))
      },

      async clearWallBgImage() {
        const { wall } = get()
        if (!wall.imageId) return
        await deleteImage(wall.imageId)
        const oldId = wall.imageId
        set((s) => ({
          imageCache: Object.fromEntries(Object.entries(s.imageCache).filter(([k]) => k !== oldId)),
          wall: { ...s.wall, imageId: null, workArea: null },
        }))
      },

      // ── Import / Export ──────────────────────────────────

      async exportAsImage(format: 'png' | 'webp' | 'svg' = 'png') {
        const { wall, pieces, imageCache } = get()
        
        if (format === 'svg') {
          // SVG export
          const svg = await get()._generateSVG()
          const blob = new Blob([svg], { type: 'image/svg+xml' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `wall-planner-${new Date().toISOString().slice(0, 10)}.svg`
          a.click()
          URL.revokeObjectURL(url)
          return
        }
        
        // PNG/WebP export
        const PX_PER_IN = 12  // output resolution: 12px per inch → 72dpi for 8ft wall = 1152px wide
        const canvasW = Math.round(wall.width * PX_PER_IN)
        const canvasH = Math.round(wall.height * PX_PER_IN)

        const offscreen = document.createElement('canvas')
        offscreen.width = canvasW
        offscreen.height = canvasH
        const ctx = offscreen.getContext('2d')!

        // Background color
        ctx.fillStyle = wall.bgColor
        ctx.fillRect(0, 0, canvasW, canvasH)

        // Wall background image
        const wallImgUrl = wall.imageId ? imageCache[wall.imageId] : null
        if (wallImgUrl) {
          await new Promise<void>((resolve) => {
            const img = new Image()
            img.onload = () => {
              if (wall.workArea) {
                const fw = canvasW / wall.workArea.w
                const fh = canvasH / wall.workArea.h
                const dx = -(wall.workArea.x / wall.workArea.w) * canvasW
                const dy = -(wall.workArea.y / wall.workArea.h) * canvasH
                ctx.drawImage(img, dx, dy, fw, fh)
              } else {
                ctx.drawImage(img, 0, 0, canvasW, canvasH)
              }
              resolve()
            }
            img.src = wallImgUrl
          })
        }

        // Draw pieces
        for (const piece of pieces) {
          const px = piece.x * PX_PER_IN
          const py = piece.y * PX_PER_IN
          const pw = piece.w * PX_PER_IN
          const ph = piece.h * PX_PER_IN
          const cx = px + pw / 2
          const cy = py + ph / 2

          ctx.save()
          ctx.translate(cx, cy)
          ctx.rotate((piece.rotation * Math.PI) / 180)

          const pieceImgUrl = piece.imageId ? imageCache[piece.imageId] : null
          if (pieceImgUrl) {
            await new Promise<void>((resolve) => {
              const img = new Image()
              img.onload = () => { ctx.drawImage(img, -pw / 2, -ph / 2, pw, ph); resolve() }
              img.src = pieceImgUrl
            })
          } else {
            ctx.fillStyle = piece.color
            ctx.fillRect(-pw / 2, -ph / 2, pw, ph)
          }

          // Label
          const label = piece.name || `${piece.w}"×${piece.h}"`
          const fontSize = Math.max(10, Math.min(20, pw * 0.14))
          ctx.font = `600 ${fontSize}px Inter, sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = 'rgba(255,255,255,0.85)'
          ctx.fillText(label, 0, 0, pw * 0.9)

          ctx.restore()
        }

        const mimeType = format === 'webp' ? 'image/webp' : 'image/png'
        const extension = format === 'webp' ? 'webp' : 'png'
        
        offscreen.toBlob((blob) => {
          if (!blob) return
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `wall-planner-${new Date().toISOString().slice(0, 10)}.${extension}`
          a.click()
          URL.revokeObjectURL(url)
        }, mimeType)
      },

      async _generateSVG(): Promise<string> {
        const { wall, pieces } = get()
        const PX_PER_IN = 12
        const canvasW = wall.width * PX_PER_IN
        const canvasH = wall.height * PX_PER_IN
        
        let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`
        svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasW}" height="${canvasH}" viewBox="0 0 ${canvasW} ${canvasH}">\n`
        
        // Background
        svg += `  <rect width="${canvasW}" height="${canvasH}" fill="${wall.bgColor}"/>\n`
        
        // Pieces
        for (const piece of pieces) {
          const px = piece.x * PX_PER_IN
          const py = piece.y * PX_PER_IN
          const pw = piece.w * PX_PER_IN
          const ph = piece.h * PX_PER_IN
          const cx = px + pw / 2
          const cy = py + ph / 2
          
          const transform = `translate(${cx}, ${cy}) rotate(${piece.rotation})`
          
          svg += `  <g transform="${transform}">\n`
          svg += `    <rect x="${-pw / 2}" y="${-ph / 2}" width="${pw}" height="${ph}" fill="${piece.color}"/>\n`
          
          // Label
          const label = piece.name || `${piece.w}"×${piece.h}"`
          const fontSize = Math.max(10, Math.min(20, pw * 0.14))
          svg += `    <text x="0" y="0" text-anchor="middle" dominant-baseline="middle" font-family="Inter, sans-serif" font-size="${fontSize}" font-weight="600" fill="rgba(255,255,255,0.85)">${label}</text>\n`
          
          svg += `  </g>\n`
        }
        
        svg += `</svg>`
        return svg
      },

      async exportLayout() {
        const { wall, pieces, imageCache } = get()
        const usedIds = new Set<string>()
        if (wall.imageId) usedIds.add(wall.imageId)
        pieces.forEach((p) => { if (p.imageId) usedIds.add(p.imageId) })

        const images: Record<string, string> = {}
        for (const id of usedIds) {
          if (imageCache[id]) images[id] = imageCache[id]!
        }

        const payload: LayoutExport = { version: 3, wall, pieces, images }
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `wall-planner-${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
      },

      async importLayout(file) {
        const text = await file.text()
        const data = JSON.parse(text) as LayoutExport

        if (!data.version || !data.wall || !Array.isArray(data.pieces)) {
          throw new Error('Invalid layout file format')
        }

        const newCache: Record<string, string> = {}
        if (data.images) {
          await clearAllImages()
          for (const [id, dataUrl] of Object.entries(data.images)) {
            await storeImage(id, dataUrl)
            newCache[id] = dataUrl
          }
        }

        const migratedPieces = (data.pieces as unknown as Record<string, unknown>[]).map(migratePiece)
        const wall: Wall = {
          ...data.wall,
          imageId: data.wall.imageId ?? null,
          workArea: (data.wall as Wall).workArea ?? null,
        }

        set({ wall, pieces: migratedPieces, imageCache: newCache, selectedId: null, undoStack: [], redoStack: [] })
      },

      // ── Error Log ───────────────────────────────────────────

      addError(type, message, context) {
        const { suppressedErrors } = get()
        
        // Create a pattern key for suppression
        const patternKey = `${type}:${message}`
        
        // Check if this error pattern is suppressed
        if (suppressedErrors.has(patternKey)) {
          return
        }
        
        const entry: ErrorLogEntry = {
          id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          type,
          message,
          context,
          dismissed: false,
        }
        
        set((s) => ({ errorLog: [...s.errorLog, entry] }))
      },

      clearErrors() {
        set({ errorLog: [] })
      },

      dismissError(id) {
        set((s) => ({
          errorLog: s.errorLog.map((e) => (e.id === id ? { ...e, dismissed: true } : e)),
        }))
      },

      suppressErrorPattern(pattern) {
        set((s) => ({
          suppressedErrors: new Set([...s.suppressedErrors, pattern]),
        }))
      },

      unsuppressErrorPattern(pattern) {
        set((s) => {
          const newSet = new Set(s.suppressedErrors)
          newSet.delete(pattern)
          return { suppressedErrors: newSet }
        })
      },

      clearSuppressedErrors() {
        set({ suppressedErrors: new Set() })
      },
      
      // ── AI Processing ─────────────────────────────────────────
      
      async reprocessPieceWithAI(pieceId) {
        const piece = get().pieces.find((p) => p.id === pieceId)
        
        if (!piece?.imageId) {
          throw new Error('Piece has no image')
        }
        
        // Get image data from cache
        const imageUrl = get().imageCache[piece.imageId]
        if (!imageUrl) {
          throw new Error('Image not found in cache')
        }
        
        // Convert data URL to File object
        const blob = await fetch(imageUrl).then(r => r.blob())
        const file = new File([blob], 'image.jpg', { type: blob.type })
        
        return file
      },
      
      getUnprocessedPieceCount() {
        return get().pieces.filter(p => p.imageId && !p.aiProcessed).length
      },
    }),

    {
      name: 'canvas-mapper-v1',
      version: 3,
      partialize: (s) => ({
        wall: s.wall,
        gap: s.gap,
        snapEnabled: s.snapEnabled,
        gridSize: s.gridSize,
        allowOverlap: s.allowOverlap,
        unit: s.unit,
        theme: s.theme,
        enabledPatterns: s.enabledPatterns,
        pieces: s.pieces,
        _nextId: s._nextId,
        _colorIndex: s._colorIndex,
      }),
      migrate(raw, version) {
        let state = raw as Record<string, unknown>
        if (version < 1) {
          const oldWall = (state.wall ?? {}) as Record<string, unknown>
          state = {
            ...state,
            wall: { ...oldWall, imageId: oldWall.imageId ?? null },
            pieces: ((state.pieces ?? []) as Record<string, unknown>[]).map(migratePiece),
          }
        }
        if (version < 2) {
          const oldMarginPx = typeof state.margin === 'number' ? state.margin : 10
          state = {
            ...state,
            gap: oldMarginPx / 8,
            allowOverlap: false,
            unit: 'in',
            pieces: ((state.pieces ?? []) as Record<string, unknown>[]).map(migratePiece),
          }
          delete state.margin
        }
        if (version < 3) {
          const oldWall = (state.wall ?? {}) as Record<string, unknown>
          const oldPattern = (state.clusterPattern as ClusterPattern | undefined) ?? 'shelf'
          state = {
            ...state,
            wall: { ...oldWall, workArea: null },
            enabledPatterns: [...ALL_PATTERNS],
          }
          // Keep old single pattern selected if it was non-default
          if (oldPattern !== 'shelf') {
            state.enabledPatterns = [oldPattern]
          }
          delete state.clusterPattern
        }
        return state
      },
    },
  ),
)
