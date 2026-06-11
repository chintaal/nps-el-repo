'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useMirageStore } from '@/store/mirageStore'

/**
 * The "deception fabric" — a living 3D node field that reacts to real telemetry.
 * Engaged sessions push the field toward red and accelerate its churn; a calm
 * cyan lattice means clean traffic. Purely ambient (pointer-events: none).
 */
function Fabric({ count = 520 }: { count?: number }) {
  const points = useRef<THREE.Points>(null)
  const matRef = useRef<THREE.PointsMaterial>(null)

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 22
      positions[i * 3 + 1] = (Math.random() - 0.5) * 22
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12
      speeds[i] = 0.2 + Math.random() * 0.8
    }
    return { positions, speeds }
  }, [count])

  const calm = useMemo(() => new THREE.Color('#22D3EE'), [])
  const hot = useMemo(() => new THREE.Color('#EF4444'), [])
  const tmp = useMemo(() => new THREE.Color(), [])

  useFrame((state, delta) => {
    if (!points.current) return
    const sessions = useMirageStore.getState().sessions
    let engaged = 0
    let total = 0
    for (const s of Object.values(sessions)) {
      total++
      if (s.state === 'DECEPTION_ENGAGED') engaged++
    }
    const threat = total ? Math.min(engaged / Math.max(total, 1), 1) : 0

    // Rotation churns faster under threat.
    points.current.rotation.y += delta * (0.02 + threat * 0.12)
    points.current.rotation.x += delta * 0.006

    // Gentle vertical drift so the lattice breathes.
    const pos = points.current.geometry.attributes.position as THREE.BufferAttribute
    const arr = pos.array as Float32Array
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += Math.sin(t * 0.3 + i) * 0.0008 * speeds[i]
    }
    pos.needsUpdate = true

    if (matRef.current) {
      tmp.copy(calm).lerp(hot, threat)
      matRef.current.color.copy(tmp)
      matRef.current.opacity = 0.28 + threat * 0.22
      matRef.current.size = 0.05 + threat * 0.03
    }
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        size={0.05}
        color="#22D3EE"
        transparent
        opacity={0.32}
        sizeAttenuation
      />
    </points>
  )
}

export default function ParticleField() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <Canvas camera={{ position: [0, 0, 9], fov: 60 }} gl={{ alpha: true, antialias: false }}>
        <Fabric />
      </Canvas>
    </div>
  )
}
