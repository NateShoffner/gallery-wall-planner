export const SCALE = 8 // 1 inch = 8px (logical scale used for coordinate math)
export const DEFAULT_PIECE_MARGIN = 0.5 // inches
export const DEFAULT_GAP = 1.25 // inches gap between pieces in cluster/placement

export const COLORS = [
  '#E8A87C',
  '#85DCB0',
  '#E27D60',
  '#41B3A3',
  '#C38D9E',
  '#F8C840',
  '#9B8FD4',
  '#FF8080',
  '#5DC8C0',
  '#A0D8CF',
  '#F7DC6F',
  '#82C9A8',
  '#F4A0A0',
  '#88BFE8',
  '#C8A8D8',
]

export const DEMO_SPECS: Array<{ w: number; h: number }> = [
  { w: 12, h: 12 },
  { w: 12, h: 12 },
  { w: 12, h: 12 },
  { w: 12, h: 16 },
  { w: 12, h: 16 },
  { w: 9, h: 12 },
]

export const PATTERN_LABELS: Record<string, { name: string; desc: string }> = {
  shelf: { name: 'Shelf', desc: 'Compact rows' },
  cross: { name: 'Cross', desc: 'Plus shape' },
  diagonal: { name: 'Diagonal', desc: 'Staircase' },
  brick: { name: 'Brick', desc: 'Offset rows' },
  grid: { name: 'Grid', desc: 'Even columns' },
  column: { name: 'Column', desc: 'Single stack' },
  scattered: { name: 'Scattered', desc: 'Organic spread' },
  circular: { name: 'Circular', desc: 'Circle pattern' },
  pyramid: { name: 'Pyramid', desc: 'Largest at bottom' },
  spiral: { name: 'Spiral', desc: 'Outward from center' },
  centered: { name: 'Centered', desc: 'Clustered at center' },
}
