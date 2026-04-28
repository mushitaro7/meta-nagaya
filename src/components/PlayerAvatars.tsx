/**
 * プレイヤーアバターコンポーネント
 * 自分（PlayerAvatar）と他プレイヤー（RemotePlayerAvatar）
 */
import { useRef, forwardRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { RemotePlayer } from '../hooks/useMultiplayer'

/* ===========================
   自分のアバター
   =========================== */

interface PlayerAvatarProps {
  color?: string
}

export const PlayerAvatar = forwardRef<THREE.Group, PlayerAvatarProps>(
  ({ color = '#54A0FF' }, ref) => {
    const bobRef = useRef(0)

    useFrame(({ clock }) => {
      bobRef.current = Math.sin(clock.elapsedTime * 3) * 0.05
    })

    return (
      <group ref={ref}>
        {/* 体 */}
        <mesh position={[0, 1.0, 0]} castShadow>
          <boxGeometry args={[0.55, 0.75, 0.35]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>

        {/* 頭 */}
        <mesh position={[0, 1.65, 0]} castShadow>
          <sphereGeometry args={[0.28, 12, 10]} />
          <meshStandardMaterial color="#F5CBA7" roughness={0.7} />
        </mesh>

        {/* 目（左） */}
        <mesh position={[-0.1, 1.7, 0.26]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshStandardMaterial color="#2C3E50" />
        </mesh>

        {/* 目（右） */}
        <mesh position={[0.1, 1.7, 0.26]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshStandardMaterial color="#2C3E50" />
        </mesh>

        {/* 足（左） */}
        <mesh position={[-0.15, 0.35, 0]} castShadow>
          <boxGeometry args={[0.2, 0.55, 0.28]} />
          <meshStandardMaterial color="#2C3E50" roughness={0.8} />
        </mesh>

        {/* 足（右） */}
        <mesh position={[0.15, 0.35, 0]} castShadow>
          <boxGeometry args={[0.2, 0.55, 0.28]} />
          <meshStandardMaterial color="#2C3E50" roughness={0.8} />
        </mesh>

        {/* 腕（左） */}
        <mesh position={[-0.37, 1.0, 0]} castShadow>
          <boxGeometry args={[0.18, 0.6, 0.2]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>

        {/* 腕（右） */}
        <mesh position={[0.37, 1.0, 0]} castShadow>
          <boxGeometry args={[0.18, 0.6, 0.2]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>

        {/* 笠（和風の帽子） */}
        <mesh position={[0, 1.98, 0]} castShadow>
          <coneGeometry args={[0.45, 0.22, 8]} />
          <meshStandardMaterial color="#C4A46C" roughness={0.9} />
        </mesh>

        {/* 名前の表示領域（シャドウキャスト） */}
        <pointLight position={[0, 2.5, 0]} color={color} intensity={0.5} distance={3} />
      </group>
    )
  }
)

PlayerAvatar.displayName = 'PlayerAvatar'

/* ===========================
   他プレイヤーのアバター（lerp補間でスムーズ移動）
   =========================== */

interface RemotePlayerAvatarProps {
  player: RemotePlayer
}

export function RemotePlayerAvatar({ player }: RemotePlayerAvatarProps) {
  const groupRef = useRef<THREE.Group>(null)
  const targetPos = useRef(new THREE.Vector3(player.position.x, player.position.y, player.position.z))
  const targetRot = useRef(player.rotation)
  const nameTagRef = useRef<THREE.Mesh>(null)

  // サーバーからの新しい位置・回転を目標にセット
  targetPos.current.set(player.position.x, player.position.y, player.position.z)
  targetRot.current = player.rotation

  useFrame(({ camera }) => {
    if (!groupRef.current) return

    // 補間移動（ラグ軽減）
    groupRef.current.position.lerp(targetPos.current, 0.2)
    groupRef.current.rotation.y += (targetRot.current - groupRef.current.rotation.y) * 0.2

    // 名前タグを常にカメラの方向に向ける
    if (nameTagRef.current) {
      nameTagRef.current.lookAt(camera.position)
    }
  })

  return (
    <group ref={groupRef} position={[player.position.x, player.position.y, player.position.z]}>
      {/* 体 */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <boxGeometry args={[0.55, 0.75, 0.35]} />
        <meshStandardMaterial color={player.color} roughness={0.6} />
      </mesh>

      {/* 頭 */}
      <mesh position={[0, 1.65, 0]} castShadow>
        <sphereGeometry args={[0.28, 12, 10]} />
        <meshStandardMaterial color="#F5CBA7" roughness={0.7} />
      </mesh>

      {/* 目（左） */}
      <mesh position={[-0.1, 1.7, 0.26]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#2C3E50" />
      </mesh>

      {/* 目（右） */}
      <mesh position={[0.1, 1.7, 0.26]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#2C3E50" />
      </mesh>

      {/* 足（左） */}
      <mesh position={[-0.15, 0.35, 0]} castShadow>
        <boxGeometry args={[0.2, 0.55, 0.28]} />
        <meshStandardMaterial color="#2C3E50" roughness={0.8} />
      </mesh>

      {/* 足（右） */}
      <mesh position={[0.15, 0.35, 0]} castShadow>
        <boxGeometry args={[0.2, 0.55, 0.28]} />
        <meshStandardMaterial color="#2C3E50" roughness={0.8} />
      </mesh>

      {/* 腕（左） */}
      <mesh position={[-0.37, 1.0, 0]} castShadow>
        <boxGeometry args={[0.18, 0.6, 0.2]} />
        <meshStandardMaterial color={player.color} roughness={0.6} />
      </mesh>

      {/* 腕（右） */}
      <mesh position={[0.37, 1.0, 0]} castShadow>
        <boxGeometry args={[0.18, 0.6, 0.2]} />
        <meshStandardMaterial color={player.color} roughness={0.6} />
      </mesh>

      {/* 笠 */}
      <mesh position={[0, 1.98, 0]} castShadow>
        <coneGeometry args={[0.45, 0.22, 8]} />
        <meshStandardMaterial color="#C4A46C" roughness={0.9} />
      </mesh>

      {/* 名前タグ（平面） */}
      <mesh ref={nameTagRef} position={[0, 2.5, 0]}>
        <planeGeometry args={[1.5, 0.38]} />
        <meshBasicMaterial color="#00000088" transparent opacity={0.7} side={2} />
      </mesh>

      {/* プレイヤーカラーのグロー */}
      <pointLight position={[0, 2.0, 0]} color={player.color} intensity={0.4} distance={4} />
    </group>
  )
}

/* ===========================
   名前表示用 HTML オーバーレイ（Canvas外）
   =========================== */

export type { RemotePlayer }
