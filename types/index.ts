export type MeasureUnit = 'in' | 'cm' | 'ft' | 'm'
export type ClusterPattern =
  | 'shelf'
  | 'cross'
  | 'diagonal'
  | 'brick'
  | 'grid'
  | 'column'
  | 'scattered'
  | 'circular'
  | 'pyramid'
  | 'spiral'
  | 'centered'
export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

export interface Piece {
  id: string
  name: string
  w: number           // inches
  h: number           // inches
  x: number           // inches
  y: number           // inches
  rotation: number    // degrees
  locked: boolean
  color: string
  margin: number      // inches
  imageId: string | null
  
  // AI Processing metadata
  aiProcessed?: boolean
  aiProcessingData?: {
    rotation: number             // Applied rotation (degrees)
    bounds: {                    // Applied crop bounds (normalized 0-1)
      x: number
      y: number
      w: number
      h: number
    }
    confidence: number           // AI confidence score (0-1)
    processedAt: number          // Timestamp (Date.now())
  }
}

/** Fraction (0–1) of the image's natural dimensions that the workspace occupies. */
export interface WorkArea {
  x: number
  y: number
  w: number
  h: number
}

export interface Wall {
  width: number    // inches
  height: number   // inches
  bgColor: string
  imageId: string | null
  /** When set, the full image is shown for context but only this region is the workspace. */
  workArea: WorkArea | null
}

export type HistorySnapshot = {
  pieces: Piece[]
  wall: Wall
  label: string
  timestamp: number
}

export type LayoutExport = {
  version: number
  wall: Wall
  pieces: Piece[]
  images: Record<string, string>
}

export type ErrorType = 'pattern' | 'overlap' | 'feasibility' | 'general'

export interface ErrorLogEntry {
  id: string
  timestamp: number
  type: ErrorType
  message: string
  context?: {
    patternName?: string
    pieceCount?: number
    wallSize?: { width: number; height: number }
    gap?: number
    allowOverlap?: boolean
  }
  dismissed?: boolean
}

export interface AIProcessingResult {
  rotation: number
  bounds: {
    x: number
    y: number
    w: number
    h: number
  }
  confidence: number
}

export interface AIProcessingData {
  rotation: number
  bounds: {
    x: number
    y: number
    w: number
    h: number
  }
  confidence: number
  processedAt?: number
}
