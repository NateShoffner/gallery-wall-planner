import { SCALE } from './constants'
import type { Piece, Wall, MeasureUnit, ResizeHandle } from '../types'

// ── Snap ────────────────────────────────────────────────────

export function snapToGrid(val: number, gridSize: number, enabled: boolean): number {
  if (!enabled) return val
  const g = gridSize / SCALE
  return Math.round(val / g) * g
}

export function snapRotation(deg: number, enabled: boolean): number {
  if (!enabled) return deg
  return Math.round(deg / 15) * 15
}

// ── Out-of-bounds ────────────────────────────────────────────

export function checkOob(
  x: number,
  y: number,
  w: number,
  h: number,
  rotation: number,
  wall: Wall,
): boolean {
  const cx = x + w / 2
  const cy = y + h / 2
  const hw = w / 2
  const hh = h / 2
  const rad = (rotation * Math.PI) / 180
  const bw = hw * Math.abs(Math.cos(rad)) + hh * Math.abs(Math.sin(rad))
  const bh = hw * Math.abs(Math.sin(rad)) + hh * Math.abs(Math.cos(rad))
  return cx - bw < 0 || cx + bw > wall.width || cy - bh < 0 || cy + bh > wall.height
}

// ── SAT / OBB collision ──────────────────────────────────────

interface OBB {
  cx: number
  cy: number
  hw: number
  hh: number
  angle: number
}

function obbCorners(o: OBB): Array<[number, number]> {
  const c = Math.cos(o.angle)
  const s = Math.sin(o.angle)
  return [
    [o.cx + c * o.hw - s * o.hh, o.cy + s * o.hw + c * o.hh],
    [o.cx - c * o.hw - s * o.hh, o.cy - s * o.hw + c * o.hh],
    [o.cx + c * o.hw + s * o.hh, o.cy + s * o.hw - c * o.hh],
    [o.cx - c * o.hw + s * o.hh, o.cy - s * o.hw - c * o.hh],
  ]
}

function project(corners: Array<[number, number]>, ax: number, ay: number): [number, number] {
  let min = Infinity
  let max = -Infinity
  for (const [x, y] of corners) {
    const p = x * ax + y * ay
    if (p < min) min = p
    if (p > max) max = p
  }
  return [min, max]
}

function obbsOverlap(a: OBB, b: OBB): boolean {
  const axes: Array<[number, number]> = [
    [Math.cos(a.angle), Math.sin(a.angle)],
    [-Math.sin(a.angle), Math.cos(a.angle)],
    [Math.cos(b.angle), Math.sin(b.angle)],
    [-Math.sin(b.angle), Math.cos(b.angle)],
  ]
  const cornersA = obbCorners(a)
  const cornersB = obbCorners(b)
  for (const [ax, ay] of axes) {
    const [minA, maxA] = project(cornersA, ax, ay)
    const [minB, maxB] = project(cornersB, ax, ay)
    if (maxA <= minB || maxB <= minA) return false
  }
  return true
}

function toOBB(
  x: number,
  y: number,
  w: number,
  h: number,
  rotation: number,
  margin: number,
): OBB {
  return {
    cx: x + w / 2,
    cy: y + h / 2,
    hw: w / 2 + margin,
    hh: h / 2 + margin,
    angle: (rotation * Math.PI) / 180,
  }
}

export function checkConflict(
  x: number,
  y: number,
  w: number,
  h: number,
  rotation: number,
  margin: number,
  pieces: Pick<Piece, 'id' | 'x' | 'y' | 'w' | 'h' | 'rotation' | 'margin'>[],
  excludeId: string,
): boolean {
  const a = toOBB(x, y, w, h, rotation, margin)
  for (const p of pieces) {
    if (p.id === excludeId) continue
    if (obbsOverlap(a, toOBB(p.x, p.y, p.w, p.h, p.rotation, p.margin))) return true
  }
  return false
}

// ── Resize math ──────────────────────────────────────────────

export function applyResize(
  handle: ResizeHandle,
  startX: number,
  startY: number,
  startW: number,
  startH: number,
  rotation: number,
  localDx: number,
  localDy: number,
): { x: number; y: number; w: number; h: number } {
  const R = (rotation * Math.PI) / 180
  const cosR = Math.cos(R)
  const sinR = Math.sin(R)
  const oldCx = startX + startW / 2
  const oldCy = startY + startH / 2

  let dw = 0, dh = 0
  let anchorLx = 0, anchorLy = 0

  if (handle.includes('e')) { dw = localDx; anchorLx = -startW / 2 }
  if (handle.includes('w')) { dw = -localDx; anchorLx = startW / 2 }
  if (handle.includes('s')) { dh = localDy; anchorLy = -startH / 2 }
  if (handle.includes('n')) { dh = -localDy; anchorLy = startH / 2 }

  const newW = Math.max(1, startW + dw)
  const newH = Math.max(1, startH + dh)

  const anchorWx = oldCx + cosR * anchorLx - sinR * anchorLy
  const anchorWy = oldCy + sinR * anchorLx + cosR * anchorLy

  const newAnchorLx =
    handle.includes('w') ? newW / 2 : handle.includes('e') ? -newW / 2 : 0
  const newAnchorLy =
    handle.includes('n') ? newH / 2 : handle.includes('s') ? -newH / 2 : 0

  const newCx = anchorWx - cosR * newAnchorLx + sinR * newAnchorLy
  const newCy = anchorWy - sinR * newAnchorLx - cosR * newAnchorLy

  return { x: newCx - newW / 2, y: newCy - newH / 2, w: newW, h: newH }
}

// ── Placement helpers ────────────────────────────────────────

export function randomInRange(min: number, max: number): number {
  return min + Math.random() * Math.max(0, max - min)
}

export function getRandomPos(
  pieceW: number,
  pieceH: number,
  wall: Wall,
  margin: number,
): { x: number; y: number } {
  return {
    x: randomInRange(margin, wall.width - pieceW - margin),
    y: randomInRange(margin, wall.height - pieceH - margin),
  }
}

type PlacedSpec = { x: number; y: number; w: number; h: number; rotation: number; margin: number }

export function placeWithoutOverlap(
  spec: { w: number; h: number; margin: number },
  placed: PlacedSpec[],
  wall: Wall,
  globalMargin: number,
  maxTries = 250,
): { x: number; y: number } {
  for (let i = 0; i < maxTries; i++) {
    const { x, y } = getRandomPos(spec.w, spec.h, wall, globalMargin)
    const a = toOBB(x, y, spec.w, spec.h, 0, spec.margin)
    let ok = true
    for (const p of placed) {
      if (obbsOverlap(a, toOBB(p.x, p.y, p.w, p.h, p.rotation, p.margin))) {
        ok = false
        break
      }
    }
    if (ok) return { x, y }
  }
  return getRandomPos(spec.w, spec.h, wall, globalMargin)
}

// ── Misc ────────────────────────────────────────────────────

export function formatAngle(deg: number): string {
  return `${Math.round(((deg % 360) + 360) % 360)}°`
}

// ── Unit conversion ──────────────────────────────────────────

export function toDisplayUnit(inches: number, unit: MeasureUnit): number {
  if (unit === 'cm') return Math.round(inches * 254) / 100
  if (unit === 'ft') return Math.round(inches / 12 * 100) / 100
  return Math.round(inches * 100) / 100
}

export function fromDisplayUnit(val: number, unit: MeasureUnit): number {
  if (unit === 'cm') return val / 2.54
  if (unit === 'ft') return val * 12
  return val
}

export function unitSuffix(unit: MeasureUnit): string {
  if (unit === 'cm') return 'cm'
  if (unit === 'ft') return 'ft'
  return 'in'
}

export function unitStep(unit: MeasureUnit): number {
  if (unit === 'cm') return 0.5
  if (unit === 'ft') return 0.1
  return 0.25
}

// ── Overlap resolution ───────────────────────────────────────

/**
 * Iterative constraint solver: push overlapping pieces apart until none overlap.
 * Used as a post-pass when allowOverlap is false and cluster has been applied.
 */
export function resolveOverlaps(
  pieces: Piece[],
  wall: Wall,
  gap: number,
  maxPasses = 20,
): Piece[] {
  let result = pieces.map((p) => ({ ...p }))

  for (let pass = 0; pass < maxPasses; pass++) {
    let anyMoved = false

    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i]!
        const b = result[j]!
        if (a.locked && b.locked) continue

        const margin = Math.max(gap * 0.5, 0.25)
        const obbA = toOBB(a.x, a.y, a.w, a.h, 0, a.margin + margin)
        const obbB = toOBB(b.x, b.y, b.w, b.h, 0, b.margin + margin)
        if (!obbsOverlap(obbA, obbB)) continue

        anyMoved = true
        const acx = a.x + a.w / 2, acy = a.y + a.h / 2
        const bcx = b.x + b.w / 2, bcy = b.y + b.h / 2
        let dx = bcx - acx
        let dy = bcy - acy
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        dx /= dist; dy /= dist

        const nudge = Math.max(gap, 0.5)
        const push = nudge * 0.55

        if (!a.locked) {
          result[i] = {
            ...a,
            x: Math.max(0, Math.min(a.x - dx * push, wall.width - a.w)),
            y: Math.max(0, Math.min(a.y - dy * push, wall.height - a.h)),
          }
        }
        if (!b.locked) {
          result[j] = {
            ...b,
            x: Math.max(0, Math.min(b.x + dx * push, wall.width - b.w)),
            y: Math.max(0, Math.min(b.y + dy * push, wall.height - b.h)),
          }
        }
      }
    }

    if (!anyMoved) break
  }

  return result
}

// ── Swap-shuffle ─────────────────────────────────────────────

export function swapShuffle(pieces: Piece[]): Piece[] {
  const unlocked = pieces.filter((p) => !p.locked)
  const locked = pieces.filter((p) => p.locked)
  if (unlocked.length < 2) return pieces

  const sorted = [...unlocked].sort((a, b) => a.w * a.h - b.w * b.h)
  const groups: Piece[][] = []
  let group: Piece[] = [sorted[0]!]

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!
    const curr = sorted[i]!
    const diff = Math.abs(curr.w * curr.h - prev.w * prev.h) / (prev.w * prev.h)
    if (diff <= 0.3) {
      group.push(curr)
    } else {
      groups.push(group)
      group = [curr]
    }
  }
  groups.push(group)

  const posMap = new Map<string, { x: number; y: number; rotation: number }>()
  for (const g of groups) {
    if (g.length < 2) continue
    const positions = g.map((p) => ({ x: p.x, y: p.y, rotation: p.rotation }))
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[positions[i], positions[j]] = [positions[j]!, positions[i]!]
    }
    g.forEach((p, i) => posMap.set(p.id, positions[i]!))
  }

  return [
    ...locked,
    ...unlocked.map((p) => {
      const pos = posMap.get(p.id)
      return pos ? { ...p, ...pos } : p
    }),
  ]
}

// ── Cluster helpers ──────────────────────────────────────────

function clampPos(x: number, y: number, w: number, h: number, wall: Wall, gap: number) {
  return {
    x: Math.max(gap, Math.min(x, wall.width - w - gap)),
    y: Math.max(gap, Math.min(y, wall.height - h - gap)),
  }
}

function applyClusterMap(
  unlocked: Piece[],
  locked: Piece[],
  posMap: Map<string, { x: number; y: number; rotation?: number }>,
  wall: Wall,
  _gap: number,
  snapEnabled: boolean,
  gridSize: number,
): Piece[] {
  return [
    ...locked,
    ...unlocked.map((p) => {
      const pos = posMap.get(p.id)
      if (!pos) return p
      const clamped = clampPos(pos.x, pos.y, p.w, p.h, wall, 0)
      return {
        ...p,
        x: snapToGrid(clamped.x, gridSize, snapEnabled),
        y: snapToGrid(clamped.y, gridSize, snapEnabled),
        rotation: pos.rotation ?? 0,
      }
    }),
  ]
}

// ── Shelf cluster ────────────────────────────────────────────

interface ShelfRow {
  pieces: Piece[]
  totalWidth: number
  rowHeight: number
}

export function compactCluster(
  pieces: Piece[],
  wall: Wall,
  gap: number,
  snapEnabled: boolean,
  gridSize: number,
): Piece[] {
  const unlocked = pieces.filter((p) => !p.locked)
  const locked = pieces.filter((p) => p.locked)
  if (unlocked.length === 0) return pieces

  const shuffled = [...unlocked].sort(() => Math.random() - 0.5)
  const targetRowWidth = wall.width * (0.6 + Math.random() * 0.28)

  const rows: ShelfRow[] = []
  let current: ShelfRow = { pieces: [], totalWidth: 0, rowHeight: 0 }

  for (const p of shuffled) {
    const pm = p.margin
    const pW = p.w + 2 * pm
    const pH = p.h + 2 * pm
    const spacer = current.pieces.length > 0 ? gap : 0

    if (current.pieces.length > 0 && current.totalWidth + spacer + pW > targetRowWidth) {
      rows.push(current)
      current = { pieces: [p], totalWidth: pW, rowHeight: pH }
    } else {
      current.pieces.push(p)
      current.totalWidth += spacer + pW
      current.rowHeight = Math.max(current.rowHeight, pH)
    }
  }
  if (current.pieces.length > 0) rows.push(current)

  const clusterW = Math.max(...rows.map((r) => r.totalWidth))
  const clusterH = rows.reduce((sum, r, i) => sum + r.rowHeight + (i > 0 ? gap : 0), 0)
  const startX = Math.max(gap, (wall.width - clusterW) / 2)
  const startY = Math.max(gap, (wall.height - clusterH) / 2)

  const posMap = new Map<string, { x: number; y: number }>()
  let y = startY

  for (const row of rows) {
    const rowIndent = (clusterW - row.totalWidth) / 2
    let x = startX + rowIndent

    for (const p of row.pieces) {
      const pm = p.margin
      posMap.set(p.id, { x: x + pm, y: y + pm + (row.rowHeight - p.h - 2 * pm) / 2 })
      x += p.w + 2 * pm + gap
    }
    y += row.rowHeight + gap
  }

  return applyClusterMap(unlocked, locked, posMap, wall, gap, snapEnabled, gridSize)
}

// ── Cross / plus cluster ─────────────────────────────────────

export function crossCluster(
  pieces: Piece[],
  wall: Wall,
  gap: number,
  snapEnabled: boolean,
  gridSize: number,
): Piece[] {
  const unlocked = pieces.filter((p) => !p.locked)
  const locked = pieces.filter((p) => p.locked)
  if (unlocked.length === 0) return pieces

  const sorted = [...unlocked].sort((a, b) => b.h / b.w - a.h / a.w)
  const nVert = Math.ceil(sorted.length / 2)
  const spinePieces = sorted.slice(0, nVert)
  const armPieces = sorted.slice(nVert)

  const posMap = new Map<string, { x: number; y: number }>()

  const spineMaxW = spinePieces.reduce((m, p) => Math.max(m, p.w + 2 * p.margin), 0)
  const spineTotalH = spinePieces.reduce(
    (s, p, i) => s + p.h + 2 * p.margin + (i > 0 ? gap : 0), 0)

  const armMaxH = armPieces.length > 0
    ? armPieces.reduce((m, p) => Math.max(m, p.h + 2 * p.margin), 0) : 0

  const cx = wall.width / 2
  const cy = wall.height / 2

  let y = cy - spineTotalH / 2
  for (const p of spinePieces) {
    const pm = p.margin
    const xOff = (spineMaxW - p.w - 2 * pm) / 2
    posMap.set(p.id, { x: cx - spineMaxW / 2 + pm + xOff, y: y + pm })
    y += p.h + 2 * pm + gap
  }

  const leftCount = Math.floor(armPieces.length / 2)
  const leftArm = armPieces.slice(0, leftCount)
  const rightArm = armPieces.slice(leftCount)
  const armY = cy - armMaxH / 2

  let x = cx + spineMaxW / 2 + gap
  for (const p of rightArm) {
    const pm = p.margin
    const yOff = (armMaxH - p.h - 2 * pm) / 2
    posMap.set(p.id, { x: x + pm, y: armY + pm + yOff })
    x += p.w + 2 * pm + gap
  }

  x = cx - spineMaxW / 2 - gap
  for (const p of [...leftArm].reverse()) {
    const pm = p.margin
    const yOff = (armMaxH - p.h - 2 * pm) / 2
    x -= p.w + 2 * pm
    posMap.set(p.id, { x: x + pm, y: armY + pm + yOff })
    x -= gap
  }

  return applyClusterMap(unlocked, locked, posMap, wall, gap, snapEnabled, gridSize)
}

// ── Diagonal cascade cluster ─────────────────────────────────

export function diagonalCluster(
  pieces: Piece[],
  wall: Wall,
  gap: number,
  snapEnabled: boolean,
  gridSize: number,
): Piece[] {
  const unlocked = pieces.filter((p) => !p.locked)
  const locked = pieces.filter((p) => p.locked)
  if (unlocked.length === 0) return pieces

  const sorted = [...unlocked].sort((a, b) => b.w * b.h - a.w * a.h)
  const posMap = new Map<string, { x: number; y: number }>()

  const stepX = gap * 3
  const stepY = gap * 2.5
  let x = gap * 2
  let y = gap * 2
  let chainOffset = 0

  for (const p of sorted) {
    const pm = p.margin
    const pos = clampPos(x + pm, y + pm, p.w, p.h, wall, gap)
    posMap.set(p.id, pos)
    x += p.w + 2 * pm + stepX
    y += p.h * 0.4 + stepY

    if (x + p.w > wall.width - gap) {
      chainOffset += gap * 5
      x = gap * 2 + chainOffset
      y = gap * 2
    }
  }

  return applyClusterMap(unlocked, locked, posMap, wall, gap, snapEnabled, gridSize)
}

// ── Brick cluster ────────────────────────────────────────────

export function brickCluster(
  pieces: Piece[],
  wall: Wall,
  gap: number,
  snapEnabled: boolean,
  gridSize: number,
): Piece[] {
  const unlocked = pieces.filter((p) => !p.locked)
  const locked = pieces.filter((p) => p.locked)
  if (unlocked.length === 0) return pieces

  const shuffled = [...unlocked].sort(() => Math.random() - 0.5)
  const targetRowWidth = wall.width * (0.55 + Math.random() * 0.25)

  const rows: ShelfRow[] = []
  let current: ShelfRow = { pieces: [], totalWidth: 0, rowHeight: 0 }
  for (const p of shuffled) {
    const pm = p.margin
    const pW = p.w + 2 * pm
    const pH = p.h + 2 * pm
    const spacer = current.pieces.length > 0 ? gap : 0
    if (current.pieces.length > 0 && current.totalWidth + spacer + pW > targetRowWidth) {
      rows.push(current)
      current = { pieces: [p], totalWidth: pW, rowHeight: pH }
    } else {
      current.pieces.push(p)
      current.totalWidth += spacer + pW
      current.rowHeight = Math.max(current.rowHeight, pH)
    }
  }
  if (current.pieces.length > 0) rows.push(current)

  const avgHalfW = unlocked.reduce((s, p) => s + p.w / 2 + p.margin, 0) / unlocked.length
  const clusterW = Math.max(...rows.map((r) => r.totalWidth)) + avgHalfW
  const clusterH = rows.reduce((sum, r, i) => sum + r.rowHeight + (i > 0 ? gap : 0), 0)
  const startX = Math.max(gap, (wall.width - clusterW) / 2)
  const startY = Math.max(gap, (wall.height - clusterH) / 2)

  const posMap = new Map<string, { x: number; y: number }>()
  let y = startY

  for (let ri = 0; ri < rows.length; ri++) {
    const row = rows[ri]!
    const brickOffset = ri % 2 === 1 ? avgHalfW + gap / 2 : 0
    const rowIndent = (clusterW - row.totalWidth) / 2
    let x = startX + rowIndent + brickOffset

    for (const p of row.pieces) {
      const pm = p.margin
      posMap.set(p.id, { x: x + pm, y: y + pm + (row.rowHeight - p.h - 2 * pm) / 2 })
      x += p.w + 2 * pm + gap
    }
    y += row.rowHeight + gap
  }

  return applyClusterMap(unlocked, locked, posMap, wall, gap, snapEnabled, gridSize)
}

// ── Grid cluster ─────────────────────────────────────────────

export function gridCluster(
  pieces: Piece[],
  wall: Wall,
  gap: number,
  snapEnabled: boolean,
  gridSize: number,
): Piece[] {
  const unlocked = pieces.filter((p) => !p.locked)
  const locked = pieces.filter((p) => p.locked)
  if (unlocked.length === 0) return pieces

  const sorted = [...unlocked].sort((a, b) => b.w * b.h - a.w * a.h)
  const n = sorted.length
  const cols = Math.max(1, Math.ceil(Math.sqrt(n * (wall.width / wall.height))))
  const rows = Math.ceil(n / cols)

  const cellW = (wall.width - gap * (cols + 1)) / cols
  const cellH = (wall.height - gap * (rows + 1)) / rows

  const posMap = new Map<string, { x: number; y: number }>()
  sorted.forEach((p, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    posMap.set(p.id, {
      x: gap + col * (cellW + gap) + Math.max(0, (cellW - p.w) / 2),
      y: gap + row * (cellH + gap) + Math.max(0, (cellH - p.h) / 2),
    })
  })

  return applyClusterMap(unlocked, locked, posMap, wall, gap, snapEnabled, gridSize)
}

// ── Column cluster ────────────────────────────────────────────

export function columnCluster(
  pieces: Piece[],
  wall: Wall,
  gap: number,
  snapEnabled: boolean,
  gridSize: number,
): Piece[] {
  const unlocked = pieces.filter((p) => !p.locked)
  const locked = pieces.filter((p) => p.locked)
  if (unlocked.length === 0) return pieces

  const sorted = [...unlocked].sort((a, b) => b.w * b.h - a.w * a.h)
  const totalH = sorted.reduce((s, p, i) => s + p.h + 2 * p.margin + (i > 0 ? gap : 0), 0)
  const maxW = sorted.reduce((m, p) => Math.max(m, p.w + 2 * p.margin), 0)
  const startY = Math.max(gap, (wall.height - totalH) / 2)
  const colX = Math.max(gap, (wall.width - maxW) / 2)

  const posMap = new Map<string, { x: number; y: number }>()
  let y = startY
  for (const p of sorted) {
    const pm = p.margin
    const xOff = (maxW - p.w - 2 * pm) / 2
    posMap.set(p.id, { x: colX + pm + xOff, y: y + pm })
    y += p.h + 2 * pm + gap
  }

  return applyClusterMap(unlocked, locked, posMap, wall, gap, snapEnabled, gridSize)
}

// ── Scattered cluster ─────────────────────────────────────────

export function scatteredCluster(
  pieces: Piece[],
  wall: Wall,
  gap: number,
  snapEnabled: boolean,
  gridSize: number,
): Piece[] {
  const unlocked = pieces.filter((p) => !p.locked)
  const locked = pieces.filter((p) => p.locked)
  if (unlocked.length === 0) return pieces

  const shuffled = [...unlocked].sort(() => Math.random() - 0.5)
  const posMap = new Map<string, { x: number; y: number; rotation: number }>()
  const placed: PlacedSpec[] = []

  for (const p of shuffled) {
    const wobble = snapEnabled ? 0 : (Math.random() - 0.5) * 8
    let bestX = randomInRange(gap, Math.max(gap, wall.width - p.w - gap))
    let bestY = randomInRange(gap, Math.max(gap, wall.height - p.h - gap))
    let bestScore = -Infinity

    for (let i = 0; i < 80; i++) {
      const tx = randomInRange(gap, Math.max(gap, wall.width - p.w - gap))
      const ty = randomInRange(gap, Math.max(gap, wall.height - p.h - gap))
      const candidate = toOBB(tx, ty, p.w, p.h, 0, p.margin)

      let minDist = Infinity
      let overlaps = false
      for (const q of placed) {
        if (obbsOverlap(candidate, toOBB(q.x, q.y, q.w, q.h, q.rotation, q.margin))) {
          overlaps = true
          break
        }
        const dx = (tx + p.w / 2) - (q.x + q.w / 2)
        const dy = (ty + p.h / 2) - (q.y + q.h / 2)
        minDist = Math.min(minDist, Math.sqrt(dx * dx + dy * dy))
      }

      if (!overlaps) {
        const score = placed.length === 0 ? 0 : minDist
        if (score > bestScore) { bestScore = score; bestX = tx; bestY = ty }
      }
    }

    const x = Math.max(gap, Math.min(bestX, wall.width - p.w - gap))
    const y = Math.max(gap, Math.min(bestY, wall.height - p.h - gap))
    posMap.set(p.id, { x, y, rotation: wobble })
    placed.push({ x, y, w: p.w, h: p.h, rotation: 0, margin: p.margin })
  }

  return applyClusterMap(unlocked, locked, posMap, wall, gap, snapEnabled, gridSize)
}
