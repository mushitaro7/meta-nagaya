import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Sky, Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import {
  NagayaBuilding,
  Chouchin,
  SakuraTree,
  IslandGround,
  MeetingHall,
  Ocean,
  OceanWaves,
  Cloud,
  Torii,
} from './NagayaObjects'
import { PlayerAvatar, RemotePlayerAvatar } from './PlayerAvatars'
import { usePlayerMovement } from '../hooks/usePlayerMovement'
import type { RemotePlayer } from '../hooks/useMultiplayer'

/* ===========================
   メタNAGA屋 3Dワールド
   5エリア構成（Canva企画書より）
   A: 一次産業 B: 二次産業 C: 三次産業 D: コミュニティ E: エンタメ
   =========================== */

// エリア定義（5エリア・Canva企画書より）
const AREA_CONFIG = [
  { id: 'A', label: '一次産業', emoji: '🌾', color: '#4A9960', norenColor: '#4A9960' },
  { id: 'B', label: '二次産業', emoji: '⚙️', color: '#3B7DB5', norenColor: '#3B7DB5' },
  { id: 'C', label: '三次産業', emoji: '🛒', color: '#C05A2B', norenColor: '#C05A2B' },
  { id: 'D', label: 'コミュニティ', emoji: '💬', color: '#8B5DB5', norenColor: '#8B5DB5' },
  { id: 'E', label: 'エンタメ', emoji: '☕', color: '#B5883B', norenColor: '#B5883B' },
]

// エリア当たり判定定数
const BUILDING_RADIUS = 20
const AREA_HIT_RADIUS = 5.0

// 蝶のパーティクル
function Butterflies() {
  const pointsRef = useRef<THREE.Points>(null)
  const count = 30

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const spd = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 5 + Math.random() * 18
      pos[i * 3] = Math.cos(angle) * radius
      pos[i * 3 + 1] = 2 + Math.random() * 4
      pos[i * 3 + 2] = Math.sin(angle) * radius
      spd[i * 3] = (Math.random() - 0.5) * 0.02
      spd[i * 3 + 1] = (Math.random() - 0.5) * 0.008
      spd[i * 3 + 2] = (Math.random() - 0.5) * 0.02
    }
    return [pos, spd]
  }, [])

  useFrame(({ clock }) => {
    if (!pointsRef.current) return
    const posArr = pointsRef.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      posArr[i * 3] += speeds[i * 3] + Math.sin(clock.elapsedTime * 1.5 + i * 2) * 0.01
      posArr[i * 3 + 1] += Math.sin(clock.elapsedTime * 2 + i) * 0.015
      posArr[i * 3 + 2] += speeds[i * 3 + 2] + Math.cos(clock.elapsedTime + i * 1.5) * 0.01
      const dist = Math.sqrt(posArr[i * 3] ** 2 + posArr[i * 3 + 2] ** 2)
      if (dist > 25) { speeds[i * 3] *= -1; speeds[i * 3 + 2] *= -1 }
      if (posArr[i * 3 + 1] < 1 || posArr[i * 3 + 1] > 8) speeds[i * 3 + 1] *= -1
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#FFD700" size={0.22} transparent opacity={0.8} sizeAttenuation depthWrite={false} />
    </points>
  )
}

// 遠景霧
function DistanceFog() {
  const { scene } = useThree()
  useMemo(() => {
    scene.fog = new THREE.FogExp2('#A8C8D8', 0.005)
  }, [scene])
  return null
}

// カメラ制御（探索中はOrbitControlsを無効にする）
interface CameraControlsProps { isExploring: boolean; isMoving: boolean }
function CameraControls({ isExploring, isMoving }: CameraControlsProps) {
  if (isMoving) return null  // 移動中はOrbitControlsを無効
  return (
    <OrbitControls
      autoRotate={!isExploring}
      autoRotateSpeed={0.35}
      enableDamping
      dampingFactor={0.05}
      minDistance={10}
      maxDistance={65}
      maxPolarAngle={Math.PI / 2.1}
      minPolarAngle={Math.PI / 9}
      target={[0, 2, 0]}
      enablePan={isExploring}
    />
  )
}

/* ===========================
   オーナー店舗インジケータ（棟上に表示）
   =========================== */
function OwnerShopIndicator({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!meshRef.current) return
    // パルスするグロー
    const s = 1 + Math.sin(clock.elapsedTime * 2.5) * 0.18
    meshRef.current.scale.setScalar(s)
  })
  return (
    <group position={position}>
      {/* 光るリング */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <torusGeometry args={[0.6, 0.08, 8, 24]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFB800"
          emissiveIntensity={1.8}
          transparent
          opacity={0.92}
        />
      </mesh>
      {/* OPEN テキスト */}
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <Text
          position={[0, 1.1, 0]}
          fontSize={0.38}
          color="#FFD700"
          outlineWidth={0.04}
          outlineColor="#7A4A00"
          anchorX="center"
          anchorY="middle"
        >
          🏪 OPEN
        </Text>
      </Billboard>
      {/* 点光 */}
      <pointLight color="#FFD700" intensity={1.2} distance={5} decay={2} />
    </group>
  )
}

/* ===========================
   5エリア × 2棟ずつ円状配置
   10棟合計
   =========================== */
interface CircularNagayaProps {
  onBuildingClick?: (areaId: string, areaLabel: string, buildingIndex: number) => void
  ownerBuildingIndexes?: Set<number>
}

/** 16進色をブレンドするヘルパー */
function blendHex(hex1: string, hex2: string, t: number): string {
  const p = (h: string) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ]
  const [r1, g1, b1] = p(hex1)
  const [r2, g2, b2] = p(hex2)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function CircularNagaya({ onBuildingClick, ownerBuildingIndexes = new Set() }: CircularNagayaProps) {
  const totalBuildings = 10  // 5エリア × 2棟
  const radius = BUILDING_RADIUS

  const buildingConfigs = useMemo(() => {
    const configs = []
    const wallColors = [
      '#D4E8D0', '#C8DEEC', '#EDD8CC', '#DDD0EC', '#EDE0C8',
      '#C8E0CA', '#C2D8E8', '#E8CCBE', '#D8CCEC', '#E8DAC4',
    ]
    const roofColors = [
      '#2A6640', '#1E5A8A', '#8A3A18', '#5A3A8A', '#7A5A1A',
      '#1E5C36', '#164E7A', '#7A3010', '#4E2E7A', '#6A4A12',
    ]

    for (let i = 0; i < totalBuildings; i++) {
      const areaIdx = i % 5  // 0〜4の5エリアを繰り返す
      const area = AREA_CONFIG[areaIdx]
      const angle = (i / totalBuildings) * Math.PI * 2
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      const rotY = -(angle + Math.PI / 2)

      configs.push({
        position: [x, 0, z] as [number, number, number],
        rotation: [0, rotY, 0] as [number, number, number],
        width: 3.5 + (i % 3) * 0.5,
        height: 3 + (i % 2) * 0.8,
        depth: 4 + (i % 2) * 0.5,
        hasShop: true,
        wallColor: wallColors[i],
        roofColor: roofColors[i],
        norenColor: area.norenColor,
        areaLabel: `${area.id}: ${area.label}`,
        areaId: area.id,
        angle,
      })
    }
    return configs
  }, [])

  return (
    <>
      {buildingConfigs.map((config, i) => {
        const area = AREA_CONFIG[i % 5]
        const hasOwnerShop = ownerBuildingIndexes.has(i)
        // オーナー店舗がある棟は壁色を金色にブレンド
        const wallColorFinal = hasOwnerShop
          ? blendHex(config.wallColor, '#FFF5D0', 0.4)
          : config.wallColor
        return (
          <group
            key={`nagaya-group-${i}`}
            onClick={(e) => {
              e.stopPropagation()
              onBuildingClick?.(area.id, `${area.emoji} エリア${area.id}：${area.label}`, i)
            }}
          >
            <NagayaBuilding {...config} wallColor={wallColorFinal} />
            {/* クリック用の当たり判定（透明） */}
            <mesh
              position={config.position}
              visible={false}
            >
              <boxGeometry args={[6, 6, 6]} />
              <meshBasicMaterial transparent opacity={0} />
            </mesh>
            {/* オーナー店舗の光るインジケータ */}
            {hasOwnerShop && (
              <OwnerShopIndicator
                position={[config.position[0], config.height + 2.5, config.position[2]]}
              />
            )}
          </group>
        )
      })}
    </>
  )
}

// 提灯（円状配置）
function CircularChouchin() {
  const count = 10
  const radius = 17.5
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.PI / count
        const areaIdx = i % 5
        const areaColor = AREA_CONFIG[areaIdx].color
        return (
          <Chouchin
            key={`chouchin-${i}`}
            position={[Math.cos(angle) * radius, 4.0, Math.sin(angle) * radius]}
            color={i % 2 === 0 ? areaColor : '#D4A843'}
            scale={0.8}
          />
        )
      })}
    </>
  )
}

/* ===========================
   メインワールド
   =========================== */
interface NagayaWorldProps {
  isExploring: boolean
  isMoving: boolean
  selfColor?: string
  remotePlayers?: Map<string, RemotePlayer>
  onMove?: (pos: { x: number; y: number; z: number }, rotation: number) => void
  onBuildingClick?: (areaId: string, areaLabel: string, buildingIndex: number) => void
  onAreaEnter?: (areaId: string | null) => void
  ownerBuildingIndexes?: Set<number>
}

// エリア検出（プレイヤー位置から最寄りエリアを判定）
function detectArea(x: number, z: number): string | null {
  let closest: string | null = null
  let minDist = Infinity

  for (let i = 0; i < 10; i++) {
    const area = AREA_CONFIG[i % 5]
    const angle = (i / 10) * Math.PI * 2
    const bx = Math.cos(angle) * BUILDING_RADIUS
    const bz = Math.sin(angle) * BUILDING_RADIUS
    const dist = Math.sqrt((x - bx) ** 2 + (z - bz) ** 2)
    if (dist < AREA_HIT_RADIUS && dist < minDist) {
      minDist = dist
      closest = area.id
    }
  }
  return closest
}

export default function NagayaWorld({
  isExploring,
  isMoving,
  selfColor = '#54A0FF',
  remotePlayers = new Map(),
  onMove,
  onBuildingClick,
  onAreaEnter,
  ownerBuildingIndexes = new Set(),
}: NagayaWorldProps) {
  const lastAreaRef = useRef<string | null>(null)

  // プレイヤー移動フック
  const { playerRef } = usePlayerMovement({
    enabled: isMoving,
    onMove: (pos, rotation) => {
      onMove?.(pos, rotation)

      // エリア判定
      const area = detectArea(pos.x, pos.z)
      if (area !== lastAreaRef.current) {
        lastAreaRef.current = area
        onAreaEnter?.(area)
      }
    },
    followCamera: isMoving,
  })

  return (
    <>
      <CameraControls isExploring={isExploring} isMoving={isMoving} />

      {/* === 照明 === */}
      <directionalLight
        position={[30, 40, 20]}
        color="#FFF5E8"
        intensity={2.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
      />
      <hemisphereLight color="#87CEEB" groundColor="#5A8F3C" intensity={0.8} />
      <ambientLight color="#EEF5F8" intensity={0.5} />
      <DistanceFog />

      {/* === 空 === */}
      <Sky
        distance={450000}
        sunPosition={[30, 40, 20]}
        inclination={0.48}
        azimuth={0.25}
        turbidity={3}
        rayleigh={1.2}
        mieCoefficient={0.004}
        mieDirectionalG={0.82}
      />

      {/* === 海 === */}
      <Ocean />
      <OceanWaves />

      {/* === 島 === */}
      <IslandGround />

      {/* === 5エリア長屋（円状配置） === */}
      <CircularNagaya onBuildingClick={onBuildingClick} ownerBuildingIndexes={ownerBuildingIndexes} />

      {/* === 提灯 === */}
      <CircularChouchin />

      {/* === 中央の集会所（MOMEKO本部） === */}
      <MeetingHall />

      {/* === 鳥居（島の入口） === */}
      <Torii position={[0, 0, 28]} rotation={[0, 0, 0]} scale={1.2} />
      <Torii position={[0, 0, 32]} rotation={[0, 0, 0]} scale={1} />

      {/* === 桜の木 === */}
      <SakuraTree position={[0, 0, -12]} scale={1.1} />
      <SakuraTree position={[10, 0, -7]} scale={1.0} />
      <SakuraTree position={[10, 0, 7]} scale={0.9} />
      <SakuraTree position={[-10, 0, -7]} scale={1.2} />
      <SakuraTree position={[-10, 0, 7]} scale={1.0} />
      <SakuraTree position={[0, 0, 11]} scale={0.8} />
      <SakuraTree position={[6, 0, 6]} scale={0.6} />
      <SakuraTree position={[-6, 0, -6]} scale={0.6} />

      {/* === 蝶 === */}
      <Butterflies />

      {/* === 雲 === */}
      <Cloud position={[40, 30, -20]} scale={1.5} />
      <Cloud position={[-50, 35, 30]} scale={2} />
      <Cloud position={[20, 28, 50]} scale={1.2} />
      <Cloud position={[-30, 32, -40]} scale={1.8} />
      <Cloud position={[60, 34, 10]} scale={1.3} />

      {/* === 橋（島への入口） === */}
      <group position={[0, 0, 30]}>
        <mesh position={[0, 0.3, 0]} receiveShadow castShadow>
          <boxGeometry args={[3, 0.2, 8]} />
          <meshStandardMaterial color="#8B6F4E" roughness={0.8} />
        </mesh>
        <mesh position={[-1.6, 1, 0]} castShadow>
          <boxGeometry args={[0.1, 1.4, 8]} />
          <meshStandardMaterial color="#264653" roughness={0.6} />
        </mesh>
        <mesh position={[1.6, 1, 0]} castShadow>
          <boxGeometry args={[0.1, 1.4, 8]} />
          <meshStandardMaterial color="#264653" roughness={0.6} />
        </mesh>
        {[-3, 0, 3].map((z, i) => (
          <group key={`bridge-post-${i}`}>
            <mesh position={[-1.6, 0.5, z]}>
              <boxGeometry args={[0.12, 1, 0.12]} />
              <meshStandardMaterial color="#264653" roughness={0.6} />
            </mesh>
            <mesh position={[1.6, 0.5, z]}>
              <boxGeometry args={[0.12, 1, 0.12]} />
              <meshStandardMaterial color="#264653" roughness={0.6} />
            </mesh>
          </group>
        ))}
      </group>

      {/* === 灯篭 === */}
      {Array.from({ length: 4 }, (_, i) => {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4
        return (
          <group key={`tourou-${i}`} position={[Math.cos(angle) * 12, 0, Math.sin(angle) * 12]}>
            <mesh position={[0, 0.15, 0]}>
              <boxGeometry args={[0.6, 0.3, 0.6]} />
              <meshStandardMaterial color="#888888" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.8, 0]}>
              <cylinderGeometry args={[0.08, 0.1, 1, 6]} />
              <meshStandardMaterial color="#999999" roughness={0.9} />
            </mesh>
            <mesh position={[0, 1.5, 0]}>
              <boxGeometry args={[0.5, 0.6, 0.5]} />
              <meshStandardMaterial color="#FFF5E0" roughness={0.5} transparent opacity={0.8} emissive="#FFD580" emissiveIntensity={0.15} />
            </mesh>
            <mesh position={[0, 1.9, 0]}>
              <coneGeometry args={[0.5, 0.3, 4]} />
              <meshStandardMaterial color="#777777" roughness={0.9} />
            </mesh>
          </group>
        )
      })}

      {/* === 自分のアバター（移動モード時のみ表示） === */}
      {isMoving && (
        <PlayerAvatar ref={playerRef} color={selfColor} />
      )}

      {/* === 他プレイヤーのアバター === */}
      {Array.from(remotePlayers.values()).map(player => (
        <RemotePlayerAvatar key={player.id} player={player} />
      ))}
    </>
  )
}
