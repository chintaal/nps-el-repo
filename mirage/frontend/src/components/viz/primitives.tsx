'use client'

import { useEffect, useRef, useState } from 'react'
import { animate } from 'framer-motion'

/** Count-up number that animates whenever the target changes. */
export function AnimatedNumber({
  value,
  decimals = 0,
  className,
  suffix = '',
}: {
  value: number
  decimals?: number
  className?: string
  suffix?: string
}) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)
  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    })
    prev.current = value
    return () => controls.stop()
  }, [value])
  return (
    <span className={className}>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  )
}

/** Radial HUD gauge. value in [0,1]. */
export function RadialGauge({
  value,
  label,
  display,
  color = '#22D3EE',
  size = 120,
}: {
  value: number
  label: string
  display: string
  color?: string
  size?: number
}) {
  const r = size / 2 - 10
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value))
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1f2937" strokeWidth={6} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - v)}
            style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)', filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display font-bold text-lg" style={{ color }}>
            {display}
          </span>
        </div>
      </div>
      <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mt-1">{label}</div>
    </div>
  )
}

/** Lightweight SVG line path from [x,y] points within a unit box. */
export function polyline(points: [number, number][], w: number, h: number, pad = 4): string {
  if (!points.length) return ''
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const sx = (x: number) => pad + ((x - minX) / (maxX - minX || 1)) * (w - 2 * pad)
  const sy = (y: number) => h - pad - ((y - minY) / (maxY - minY || 1)) * (h - 2 * pad)
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p[0]).toFixed(1)} ${sy(p[1]).toFixed(1)}`).join(' ')
}
