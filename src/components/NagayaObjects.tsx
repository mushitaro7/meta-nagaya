import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* ===========================
   長屋の建物コンポーネント
   =========================== */

interface NagayaBuildingProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  width?: number
  depth?: number
  height?: number
  roofColor?: string
  wallColor?: string
  hasShop?: boolean
  norenColor?: string
  areaLabel?: string
  areaId?: string
}

export function NagayaBuilding({
  position,
  rotation = [0, 0, 0],
  width = 4,
  depth = 5,
  height = 3.5,
  roofColor = '#6B4226',
  wallColor = '#E8D5B7',
  hasShop = false,
  norenColor = '#264653',
  areaId = '',
}: NagayaBuildingProps) {
  const groupRef = useRef<THREE.Group>(null)

  // 屋根：extrudeの三角端面が見えるためBoxベースに変更
  // 切妻屋根を2枚の傾いた板で表現（端面なし）
  const roofHalfW = width / 2 + 0.6 + 0.8
  const roofDepth = depth + 1.0
  const roofH = 1.8

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* 壁面 */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} />
      </mesh>

      {/* 木の柱 - 左 */}
      <mesh position={[-width / 2, height / 2, depth / 2 + 0.08]} castShadow>
        <boxGeometry args={[0.15, height, 0.15]} />
        <meshStandardMaterial color="#5C3A1E" roughness={0.8} />
      </mesh>

      {/* 木の柱 - 右 */}
      <mesh position={[width / 2, height / 2, depth / 2 + 0.08]} castShadow>
        <boxGeometry args={[0.15, height, 0.15]} />
        <meshStandardMaterial color="#5C3A1E" roughness={0.8} />
      </mesh>

      {/* 木の柱 - 中央 */}
      <mesh position={[0, height / 2, depth / 2 + 0.08]} castShadow>
        <boxGeometry args={[0.12, height, 0.12]} />
        <meshStandardMaterial color="#5C3A1E" roughness={0.8} />
      </mesh>

      {/* 梁 - 上部 */}
      <mesh position={[0, height * 0.85, depth / 2 + 0.1]} castShadow>
        <boxGeometry args={[width + 0.3, 0.12, 0.12]} />
        <meshStandardMaterial color="#4A2E14" roughness={0.8} />
      </mesh>

      {/* 障子風パネル - 左 */}
      <mesh position={[-width / 4 - 0.1, height * 0.4, depth / 2 + 0.1]}>
        <boxGeometry args={[width / 2 - 0.3, height * 0.65, 0.06]} />
        <meshStandardMaterial 
          color="#FFF8F0" 
          roughness={0.4} 
        />
      </mesh>

      {/* 障子風パネル - 右 */}
      <mesh position={[width / 4 + 0.1, height * 0.4, depth / 2 + 0.1]}>
        <boxGeometry args={[width / 2 - 0.3, height * 0.65, 0.06]} />
        <meshStandardMaterial 
          color="#FFF8F0" 
          roughness={0.4} 
        />
      </mesh>

      {/* 屋根（端面なし・2枚の傾斜板で切妻を表現） */}
      <group position={[0, height, 0]}>
        {/* 左の屋根面：Z軸回転で傾ける。幅=斜辺長, 厚み=0.2, 奥行き=roofDepth */}
        <mesh
          castShadow
          position={[-roofHalfW / 2, roofH / 2, 0]}
          rotation={[0, 0, Math.atan2(roofH, roofHalfW)]}
        >
          <boxGeometry args={[Math.hypot(roofHalfW, roofH), 0.2, roofDepth]} />
          <meshStandardMaterial color={roofColor} roughness={0.7} />
        </mesh>
        {/* 右の屋根面 */}
        <mesh
          castShadow
          position={[roofHalfW / 2, roofH / 2, 0]}
          rotation={[0, 0, -Math.atan2(roofH, roofHalfW)]}
        >
          <boxGeometry args={[Math.hypot(roofHalfW, roofH), 0.2, roofDepth]} />
          <meshStandardMaterial color={roofColor} roughness={0.7} />
        </mesh>
        {/* 棟（頂上） */}
        <mesh castShadow position={[0, roofH, 0]}>
          <boxGeometry args={[0.25, 0.18, roofDepth + 0.1]} />
          <meshStandardMaterial color={roofColor} roughness={0.6} />
        </mesh>
      </group>

      {/* 軒下 */}
      <mesh position={[0, height - 0.05, depth / 2 + 0.5]} castShadow>
        <boxGeometry args={[width + 1.2, 0.08, 1.2]} />
        <meshStandardMaterial color="#5C3A1E" roughness={0.8} />
      </mesh>

      {/* 暖簾（のれん）- ショップの場合 */}
      {hasShop && (
        <group position={[0, height * 0.75, depth / 2 + 0.1]}>
          <mesh position={[-width / 4, 0, 0]}>
            <planeGeometry args={[width / 2 - 0.2, height * 0.35]} />
            <meshStandardMaterial 
              color={norenColor}
              roughness={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[width / 4, 0, 0]}>
            <planeGeometry args={[width / 2 - 0.2, height * 0.35]} />
            <meshStandardMaterial 
              color={norenColor}
              roughness={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* 暖簾の竿 */}
          <mesh position={[0, height * 0.18, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.04, 0.04, width + 0.2, 8]} />
            <meshStandardMaterial color="#4A2E14" roughness={0.7} />
          </mesh>
        </group>
      )}

      {/* エリアID看板（削除済み） */}

      {/* 基礎石 - 芝生(Y=0)と重ならないよう底面をY=0.02以上に */}
      <mesh position={[0, 0.13, 0]} receiveShadow>
        <boxGeometry args={[width + 0.3, 0.26, depth + 0.3]} />
        <meshStandardMaterial color="#888888" roughness={1} />
      </mesh>

      {/* 縁側（えんがわ） */}
      <mesh position={[0, 0.28, depth / 2 + 0.6]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.4, 0.08, 0.8]} />
        <meshStandardMaterial color="#C4A46C" roughness={0.7} />
      </mesh>

    </group>
  )
}

/* ===========================
   提灯コンポーネント
   =========================== */

interface ChouchinProps {
  position: [number, number, number]
  color?: string
  scale?: number
}

export function Chouchin({ 
  position, 
  color = '#C03A2B', 
  scale = 1 
}: ChouchinProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.8 + position[0] * 2) * 0.05
    }
  })

  return (
    <group position={position} scale={scale}>
      {/* 吊り紐 */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.5, 4]} />
        <meshStandardMaterial color="#1C1C1C" />
      </mesh>

      {/* 提灯本体 */}
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[0.3, 16, 12]} />
        <meshStandardMaterial
          color={color}
          roughness={0.6}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* 提灯の上部金具 */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.1, 8]} />
        <meshStandardMaterial color="#1C1C1C" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* 提灯の下部 */}
      <mesh position={[0, -0.28, 0]}>
        <cylinderGeometry args={[0.1, 0.05, 0.08, 8]} />
        <meshStandardMaterial color="#1C1C1C" roughness={0.5} metalness={0.3} />
      </mesh>
    </group>
  )
}

/* ===========================
   桜の木コンポーネント
   =========================== */

interface SakuraTreeProps {
  position: [number, number, number]
  scale?: number
}

export function SakuraTree({ position, scale = 1 }: SakuraTreeProps) {
  const petalsRef = useRef<THREE.Points>(null)

  const petalsGeometry = useMemo(() => {
    const count = 120
    const positions = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 1 + Math.random() * 2.8
      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = 3 + Math.random() * 4
      positions[i * 3 + 2] = Math.sin(angle) * radius
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [])

  useFrame(({ clock }) => {
    if (petalsRef.current) {
      const positions = petalsRef.current.geometry.attributes.position
      const arr = positions.array as Float32Array
      for (let i = 0; i < arr.length / 3; i++) {
        arr[i * 3] += Math.sin(clock.elapsedTime * 0.5 + i) * 0.004
        arr[i * 3 + 1] -= 0.006 + Math.random() * 0.003
        arr[i * 3 + 2] += Math.cos(clock.elapsedTime * 0.3 + i * 0.5) * 0.003

        if (arr[i * 3 + 1] < 0) {
          arr[i * 3 + 1] = 4 + Math.random() * 4
          const angle = Math.random() * Math.PI * 2
          const radius = 1 + Math.random() * 2.8
          arr[i * 3] = Math.cos(angle) * radius
          arr[i * 3 + 2] = Math.sin(angle) * radius
        }
      }
      positions.needsUpdate = true
    }
  })

  return (
    <group position={position} scale={scale}>
      {/* 幹 */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.3, 3, 8]} />
        <meshStandardMaterial color="#5C3A1E" roughness={0.9} />
      </mesh>

      {/* 枝 */}
      <mesh position={[0.6, 2.8, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <cylinderGeometry args={[0.05, 0.1, 2, 6]} />
        <meshStandardMaterial color="#4A2E14" roughness={0.9} />
      </mesh>
      <mesh position={[-0.7, 2.5, 0.3]} rotation={[0.2, 0, -Math.PI / 3.5]} castShadow>
        <cylinderGeometry args={[0.04, 0.08, 1.8, 6]} />
        <meshStandardMaterial color="#4A2E14" roughness={0.9} />
      </mesh>

      {/* 桜の花冠 */}
      <mesh position={[0, 4.2, 0]}>
        <sphereGeometry args={[2.5, 12, 10]} />
        <meshStandardMaterial 
          color="#FFB7C5" 
          roughness={0.7} 
          transparent 
          opacity={0.75}
        />
      </mesh>
      <mesh position={[0.8, 3.5, 0.5]}>
        <sphereGeometry args={[1.8, 10, 8]} />
        <meshStandardMaterial 
          color="#FFDAE0" 
          roughness={0.7} 
          transparent 
          opacity={0.65}
        />
      </mesh>

      {/* 花びらパーティクル */}
      <points ref={petalsRef} geometry={petalsGeometry}>
        <pointsMaterial
          color="#FFB7C5"
          size={0.1}
          transparent
          opacity={0.85}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  )
}

/* ===========================
   集会所（中央の建物）
   =========================== */

export function MeetingHall() {
  return (
    <group position={[0, 0, 0]}>
      {/* 基壇（きだん）- 高い石の台座 */}
      <mesh position={[0, 0.4, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[6, 6.5, 0.8, 8]} />
        <meshStandardMaterial color="#999999" roughness={0.9} />
      </mesh>

      {/* メインの建物 */}
      <mesh position={[0, 2.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[8, 4, 8]} />
        <meshStandardMaterial color="#E8D5B7" roughness={0.8} />
      </mesh>

      {/* 柱 - 四隅 + 中間 */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2
        const x = Math.cos(angle) * 4.2
        const z = Math.sin(angle) * 4.2
        return (
          <mesh key={`pillar-${i}`} position={[x, 2.5, z]} castShadow>
            <cylinderGeometry args={[0.15, 0.18, 4.2, 8]} />
            <meshStandardMaterial color="#8B4513" roughness={0.7} />
          </mesh>
        )
      })}

      {/* 大屋根 */}
      <mesh position={[0, 5.5, 0]} castShadow>
        <coneGeometry args={[7.5, 3, 4]} />
        <meshStandardMaterial color="#4A3520" roughness={0.7} />
      </mesh>

      {/* 屋根飾り（しび） */}
      <mesh position={[0, 7.2, 0]}>
        <coneGeometry args={[0.2, 0.8, 4]} />
        <meshStandardMaterial color="#D4A843" roughness={0.3} metalness={0.6} />
      </mesh>

      {/* 梁（はり）の装飾 */}
      <mesh position={[0, 4.9, 0]} castShadow>
        <boxGeometry args={[9, 0.15, 9]} />
        <meshStandardMaterial color="#5C3A1E" roughness={0.8} />
      </mesh>

      {/* 縁側 */}
      <mesh position={[0, 0.85, 0]} receiveShadow>
        <boxGeometry args={[9.5, 0.1, 9.5]} />
        <meshStandardMaterial color="#C4A46C" roughness={0.7} />
      </mesh>

      {/* 入口の暖簾（四方向） */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
        <group key={`noren-${i}`} rotation={[0, angle, 0]}>
          <mesh position={[0, 3.2, 4.05]}>
            <planeGeometry args={[2.5, 2]} />
            <meshStandardMaterial 
              color="#C03A2B" 
              roughness={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}

      {/* 看板 */}
      <mesh position={[0, 4.6, 4.3]} castShadow>
        <boxGeometry args={[2.5, 0.6, 0.1]} />
        <meshStandardMaterial color="#3E2A16" roughness={0.8} />
      </mesh>
    </group>
  )
}

/* ===========================
   海コンポーネント
   =========================== */

export function Ocean() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.05 + Math.sin(clock.elapsedTime * 0.5) * 0.02
    }
  })

  return (
    <mesh 
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -0.3, 0]} 
      receiveShadow
    >
      <circleGeometry args={[200, 64]} />
      <meshStandardMaterial 
        color="#1E90AA"
        roughness={0.3}
        metalness={0.1}
        emissive="#0077AA"
        emissiveIntensity={0.05}
        transparent
        opacity={0.92}
      />
    </mesh>
  )
}

/* ===========================
   海の波エフェクト
   =========================== */

export function OceanWaves() {
  const wavesRef = useRef<THREE.Points>(null)
  const count = 3000

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 30 + Math.random() * 170
      pos[i * 3] = Math.cos(angle) * radius
      pos[i * 3 + 1] = -0.2 + Math.random() * 0.1
      pos[i * 3 + 2] = Math.sin(angle) * radius
    }
    return pos
  }, [])

  useFrame(({ clock }) => {
    if (!wavesRef.current) return
    const posArr = wavesRef.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      const x = posArr[i * 3]
      const z = posArr[i * 3 + 2]
      posArr[i * 3 + 1] = -0.2 + Math.sin(clock.elapsedTime * 0.8 + x * 0.05 + z * 0.03) * 0.3
    }
    wavesRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={wavesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#FFFFFF"
        size={0.4}
        transparent
        opacity={0.15}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

/* ===========================
   島の地面
   =========================== */

export function IslandGround() {
  return (
    <group>
      {/* 島本体 - 芝生（半径25.5 → 砂浜と重ならない） */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[25.5, 64]} />
        <meshStandardMaterial color="#5A8F3C" roughness={0.95} />
      </mesh>

      {/* 島の縁 - 砂浜（Y=0.01 → 斜面上面Y=-0.3より確実に上） */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <ringGeometry args={[25.5, 32, 64]} />
        <meshStandardMaterial color="#E8D5A8" roughness={1} />
      </mesh>

      {/* 中央の広場（石畳）Y=0.08 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]} receiveShadow>
        <circleGeometry args={[10, 32]} />
        <meshStandardMaterial color="#C4B396" roughness={0.9} />
      </mesh>

      {/* 石畳の円模様 - Y=0.12以上で石畳より確実に上 */}
      {[3, 5, 7, 9].map((r, i) => (
        <mesh key={`ring-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12 + i * 0.01, 0]}>
          <ringGeometry args={[r - 0.05, r + 0.05, 64]} />
          <meshStandardMaterial
            color="#A89880"
            roughness={0.9}
            polygonOffset
            polygonOffsetFactor={-4}
            polygonOffsetUnits={-4}
          />
        </mesh>
      ))}

      {/* 放射状の石畳パス - Y=0.10 */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2
        const cx = Math.cos(angle) * 14
        const cz = Math.sin(angle) * 14
        return (
          <mesh
            key={`path-${i}`}
            position={[cx, 0.10, cz]}
            rotation={[-Math.PI / 2, 0, angle + Math.PI / 2]}
            receiveShadow
          >
            <planeGeometry args={[1.5, 20]} />
            <meshStandardMaterial
              color="#C4B396"
              roughness={0.9}
              polygonOffset
              polygonOffsetFactor={-3}
              polygonOffsetUnits={-3}
            />
          </mesh>
        )
      })}

      {/* 島の斜面 - Y=-0.8にして上面をY=-0.3に（砂浜Y=0.01より下） */}
      <mesh position={[0, -0.8, 0]}>
        <cylinderGeometry args={[28, 32, 1.0, 64]} />
        <meshStandardMaterial color="#A08060" roughness={1} />
      </mesh>
    </group>
  )
}

/* ===========================
   雲コンポーネント
   =========================== */

interface CloudProps {
  position: [number, number, number]
  scale?: number
}

export function Cloud({ position, scale = 1 }: CloudProps) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.x = position[0] + Math.sin(clock.elapsedTime * 0.05 + position[2]) * 2
    }
  })

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <mesh>
        <sphereGeometry args={[3, 8, 6]} />
        <meshStandardMaterial color="#FFFFFF" roughness={1} transparent opacity={0.85} />
      </mesh>
      <mesh position={[2.5, -0.3, 0]}>
        <sphereGeometry args={[2.5, 8, 6]} />
        <meshStandardMaterial color="#FFFFFF" roughness={1} transparent opacity={0.8} />
      </mesh>
      <mesh position={[-2, -0.2, 0.5]}>
        <sphereGeometry args={[2.2, 8, 6]} />
        <meshStandardMaterial color="#FFFFFF" roughness={1} transparent opacity={0.8} />
      </mesh>
      <mesh position={[1, 0.8, -0.5]}>
        <sphereGeometry args={[2, 8, 6]} />
        <meshStandardMaterial color="#FEFEFE" roughness={1} transparent opacity={0.75} />
      </mesh>
    </group>
  )
}

/* ===========================
   鳥居コンポーネント
   =========================== */

interface ToriiProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
}

export function Torii({ position, rotation = [0, 0, 0], scale = 1 }: ToriiProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* 左柱 */}
      <mesh position={[-1.5, 2, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.18, 4, 8]} />
        <meshStandardMaterial color="#C03A2B" roughness={0.6} />
      </mesh>
      {/* 右柱 */}
      <mesh position={[1.5, 2, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.18, 4, 8]} />
        <meshStandardMaterial color="#C03A2B" roughness={0.6} />
      </mesh>
      {/* 笠木（かさぎ）- 上の横木 */}
      <mesh position={[0, 4.1, 0]} castShadow>
        <boxGeometry args={[4.2, 0.2, 0.3]} />
        <meshStandardMaterial color="#C03A2B" roughness={0.6} />
      </mesh>
      {/* 島木（しまぎ）- 下の横木 */}
      <mesh position={[0, 3.5, 0]} castShadow>
        <boxGeometry args={[3.5, 0.15, 0.2]} />
        <meshStandardMaterial color="#C03A2B" roughness={0.6} />
      </mesh>
      {/* 額束（がくづか） */}
      <mesh position={[0, 3.8, 0]}>
        <boxGeometry args={[0.8, 0.5, 0.15]} />
        <meshStandardMaterial color="#3E2A16" roughness={0.8} />
      </mesh>
    </group>
  )
}

/* ===========================
   エリア看板コンポーネント（Canva 5エリア対応）
   =========================== */

interface AreaSignProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  label: string
  subLabel: string
  color: string
}

export function AreaSign({ position, rotation = [0, 0, 0], label, subLabel, color }: AreaSignProps) {
  return (
    <group position={position} rotation={rotation}>
      {/* 柱 */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 3, 6]} />
        <meshStandardMaterial color="#5C3A1E" roughness={0.8} />
      </mesh>

      {/* 看板枠 */}
      <mesh position={[0, 3.2, 0]} castShadow>
        <boxGeometry args={[2.3, 0.9, 0.1]} />
        <meshStandardMaterial color="#3E2A16" roughness={0.8} />
      </mesh>

      {/* 看板本体（エリアカラー） */}
      <mesh position={[0, 3.2, 0.06]} castShadow>
        <boxGeometry args={[2.2, 0.78, 0.06]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>

      {/* 看板白テキスト部分 */}
      <mesh position={[0, 3.2, 0.1]}>
        <boxGeometry args={[1.8, 0.52, 0.02]} />
        <meshStandardMaterial color="#FDFAF5" roughness={0.5} />
      </mesh>

      {/* ポイントライト（発光） */}
      <pointLight position={[0, 3.2, 0.6]} color={color} intensity={0.6} distance={5} />
    </group>
  )
}
