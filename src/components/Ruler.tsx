import type { CSSProperties } from 'react'

interface RulerProps {
  orientation: 'horizontal' | 'vertical'
  totalInches: number
  scale: number   // pixels per inch
  style?: CSSProperties
}

const SIZE = 22  // ruler thickness in px
const LABEL_COLOR = 'rgba(255,255,255,0.32)'
const TICK_MAJOR = 'rgba(255,255,255,0.35)'
const TICK_MINOR = 'rgba(255,255,255,0.14)'
const BG = 'rgba(0,0,0,0.22)'

export function Ruler({ orientation, totalInches, scale, style }: RulerProps) {
  const length = totalInches * scale
  const ticks: React.ReactNode[] = []

  for (let inch = 0; inch <= totalInches; inch++) {
    const pos = inch * scale
    const isFoot = inch % 12 === 0
    const isHalf = inch % 6 === 0 && !isFoot
    const tickLen = isFoot ? 14 : isHalf ? 9 : 4
    const color = isFoot || isHalf ? TICK_MAJOR : TICK_MINOR
    const label = isFoot && inch > 0 ? `${inch / 12}'` : null

    if (orientation === 'horizontal') {
      ticks.push(
        <g key={inch}>
          <line
            x1={pos} x2={pos}
            y1={SIZE - tickLen} y2={SIZE}
            stroke={color}
            strokeWidth={isFoot ? 1 : 0.5}
          />
          {label && (
            <text x={pos + 3} y={SIZE - tickLen - 2} fontSize={8} fill={LABEL_COLOR} fontFamily="monospace">
              {label}
            </text>
          )}
        </g>,
      )
    } else {
      ticks.push(
        <g key={inch}>
          <line
            x1={SIZE - tickLen} x2={SIZE}
            y1={pos} y2={pos}
            stroke={color}
            strokeWidth={isFoot ? 1 : 0.5}
          />
          {label && (
            <text x={2} y={pos - 2} fontSize={8} fill={LABEL_COLOR} fontFamily="monospace">
              {label}
            </text>
          )}
        </g>,
      )
    }
  }

  if (orientation === 'horizontal') {
    return (
      <svg
        width={length}
        height={SIZE}
        style={{ display: 'block', pointerEvents: 'none', ...style }}
        shapeRendering="crispEdges"
      >
        <rect width={length} height={SIZE} fill={BG} />
        {ticks}
        <line x1={0} y1={SIZE - 0.5} x2={length} y2={SIZE - 0.5} stroke="rgba(255,255,255,0.08)" />
      </svg>
    )
  }

  return (
    <svg
      width={SIZE}
      height={length}
      style={{ display: 'block', pointerEvents: 'none', ...style }}
      shapeRendering="crispEdges"
    >
      <rect width={SIZE} height={length} fill={BG} />
      {ticks}
      <line x1={SIZE - 0.5} y1={0} x2={SIZE - 0.5} y2={length} stroke="rgba(255,255,255,0.08)" />
    </svg>
  )
}
