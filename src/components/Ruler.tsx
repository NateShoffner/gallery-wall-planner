import type { CSSProperties } from 'react'
import type { MeasureUnit } from '../types'

interface RulerProps {
  orientation: 'horizontal' | 'vertical'
  totalInches: number
  scale: number   // pixels per inch
  unit: MeasureUnit
  style?: CSSProperties
}

const SIZE = 26  // ruler thickness in px (increased from 22)
const LABEL_COLOR = 'rgba(255,255,255,0.75)'  // Increased for better readability
const TICK_MAJOR = 'rgba(255,255,255,0.5)'    // Increased from 0.35
const TICK_MINOR = 'rgba(255,255,255,0.2)'    // Increased from 0.14
const BG = 'rgba(0,0,0,0.35)'                 // Slightly darker for better contrast

export function Ruler({ orientation, totalInches, scale, unit, style }: RulerProps) {
  const length = totalInches * scale
  const ticks: React.ReactNode[] = []

  // Convert total to display unit
  let total: number
  let majorInterval: number  // Interval for major ticks
  let minorInterval: number  // Interval for minor ticks
  let unitLabel: string

  if (unit === 'cm') {
    total = totalInches * 2.54
    majorInterval = 10  // Major tick every 10cm
    minorInterval = 1   // Minor tick every 1cm
    unitLabel = 'cm'
  } else if (unit === 'ft') {
    total = totalInches / 12
    majorInterval = 1   // Major tick every 1ft
    minorInterval = 0.5 // Minor tick every 0.5ft (6 inches)
    unitLabel = 'ft'
  } else if (unit === 'm') {
    total = totalInches / 39.3701
    majorInterval = 1   // Major tick every 1m
    minorInterval = 0.1 // Minor tick every 0.1m (10cm)
    unitLabel = 'm'
  } else {
    // inches
    total = totalInches
    majorInterval = 12  // Major tick every 12 inches (1 foot)
    minorInterval = 1   // Minor tick every inch
    unitLabel = 'in'
  }

  const numTicks = Math.ceil(total / minorInterval)
  
  for (let i = 0; i <= numTicks; i++) {
    const value = i * minorInterval
    if (value > total) break
    
    // Convert back to inches to get pixel position
    let posInInches: number
    if (unit === 'cm') {
      posInInches = value / 2.54
    } else if (unit === 'ft') {
      posInInches = value * 12
    } else if (unit === 'm') {
      posInInches = value * 39.3701
    } else {
      posInInches = value
    }
    
    const pos = posInInches * scale
    const isMajor = Math.abs((value % majorInterval)) < 0.001
    const isHalf = Math.abs((value % (majorInterval / 2))) < 0.001 && !isMajor
    const tickLen = isMajor ? 14 : isHalf ? 9 : 4
    const color = isMajor || isHalf ? TICK_MAJOR : TICK_MINOR
    // Add space between number and unit for better readability
    const label = isMajor && value > 0 ? `${Math.round(value)} ${unitLabel}` : null

    if (orientation === 'horizontal') {
      ticks.push(
        <g key={i}>
          <line
            x1={pos} x2={pos}
            y1={SIZE - tickLen} y2={SIZE}
            stroke={color}
            strokeWidth={isMajor ? 1 : 0.5}
          />
          {label && (
            <text x={pos + 3} y={SIZE - tickLen - 3} fontSize={10} fill={LABEL_COLOR} fontFamily="system-ui, -apple-system, sans-serif" fontWeight="600">
              {label}
            </text>
          )}
        </g>,
      )
    } else {
      ticks.push(
        <g key={i}>
          <line
            x1={SIZE - tickLen} x2={SIZE}
            y1={pos} y2={pos}
            stroke={color}
            strokeWidth={isMajor ? 1 : 0.5}
          />
          {label && (
            <text x={2} y={pos - 2} fontSize={10} fill={LABEL_COLOR} fontFamily="system-ui, -apple-system, sans-serif" fontWeight="600">
              {label}
            </text>
          )}
        </g>,
      )
    }
  }

  // Add max value label at the end
  const maxLabel = `${Math.round(total)} ${unitLabel}`
  if (orientation === 'horizontal') {
    ticks.push(
      <text 
        key="max" 
        x={length - 3} 
        y={SIZE - 16} 
        fontSize={10} 
        fill={LABEL_COLOR} 
        fontFamily="system-ui, -apple-system, sans-serif" 
        fontWeight="600"
        textAnchor="end"
      >
        {maxLabel}
      </text>
    )
  } else {
    ticks.push(
      <text 
        key="max" 
        x={2} 
        y={length - 3} 
        fontSize={10} 
        fill={LABEL_COLOR} 
        fontFamily="system-ui, -apple-system, sans-serif" 
        fontWeight="600"
      >
        {maxLabel}
      </text>
    )
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
