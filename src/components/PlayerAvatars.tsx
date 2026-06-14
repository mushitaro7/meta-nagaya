/**
 * プレイヤーアバターコンポーネント（修正版）
 * - 名前タグ（Billboard + Text）
 * - 歩行ボブアニメーション（useFrame直接制御 / state更新なし）
 * - チャット吹き出し（3D空間内）
 * - lerp補間スムーズ移動
 */
import { useRef, forwardRef, useState, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import type { RemotePlayer } from '../hooks/useMultiplayer'

/* ===========================
   和風アバター本体（useFrame直接制御版）
   Reactのstate更新を一切使わない → 親の再レンダーを起こさない
   =========================== */
interface AvatarBodyRefProps {
  color: string
  walkingRef: React.MutableRefObject<boolean>
  walkPhaseRef: React.MutableRefObject<number>
}

function AvatarBodyAnimated({ color, walkingRef, walkPhaseRef }: AvatarBodyRefProps) {
  // 各パーツのrefを持つ
  const bodyRef = useRef<THREE.Group>(null)
  const leftLegRef = useRef<THREE.Group>(null)
  const rightLegRef = useRef<THREE.Group>(null)
  const leftArmRef = useRef<THREE.Group>(null)
  const rightArmRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    const isWalking = walkingRef.current
    if (isWalking) {
      walkPhaseRef.current += delta
    }
    const phase = walkPhaseRef.current
    const swing = isWalking ? Math.sin(phase * 6) : 0
    const bob = isWalking ? Math.abs(Math.sin(phase * 6)) * 0.04 : 0

    if (bodyRef.current) bodyRef.current.position.y = bob
    if (leftLegRef.current) leftLegRef.current.rotation.x = swing * 0.25
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing * 0.25
    if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.3
    if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.3
  })

  const bodyColor = useMemo(() => color, [color])

  return (
    <group ref={bodyRef}>
      {/* 体（着物風・縦長） */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[0.52, 0.78, 0.34]} />
        <meshStandardMaterial color={bodyColor} roughness={0.55} metalness={0.05} />
      </mesh>

      {/* 帯 */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <boxGeometry args={[0.54, 0.12, 0.36]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>

      {/* 頭 */}
      <mesh position={[0, 1.68, 0]} castShadow>
        <sphereGeometry args={[0.27, 14, 12]} />
        <meshStandardMaterial color="#F5CBA7" roughness={0.65} />
      </mesh>

      {/* 目（左） */}
      <mesh position={[-0.095, 1.72, 0.25]}>
        <sphereGeometry args={[0.038, 6, 6]} />
        <meshStandardMaterial color="#1A252F" />
      </mesh>

      {/* 目（右） */}
      <mesh position={[0.095, 1.72, 0.25]}>
        <sphereGeometry args={[0.038, 6, 6]} />
        <meshStandardMaterial color="#1A252F" />
      </mesh>

      {/* 口 */}
      <mesh position={[0, 1.64, 0.26]}>
        <sphereGeometry args={[0.022, 4, 4]} />
        <meshStandardMaterial color="#C0392B" />
      </mesh>

      {/* 笠（和風の帽子） */}
      <mesh position={[0, 2.02, 0]} castShadow>
        <coneGeometry args={[0.42, 0.21, 10]} />
        <meshStandardMaterial color="#C4A46C" roughness={0.88} />
      </mesh>

      {/* 笠のつば */}
      <mesh position={[0, 1.93, 0]} castShadow>
        <cylinderGeometry args={[0.44, 0.44, 0.04, 10]} />
        <meshStandardMaterial color="#B8935A" roughness={0.9} />
      </mesh>

      {/* 腕（左） */}
      <group ref={leftArmRef} position={[-0.36, 1.05, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.17, 0.58, 0.2]} />
          <meshStandardMaterial color={bodyColor} roughness={0.55} />
        </mesh>
      </group>

      {/* 腕（右） */}
      <group ref={rightArmRef} position={[0.36, 1.05, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.17, 0.58, 0.2]} />
          <meshStandardMaterial color={bodyColor} roughness={0.55} />
        </mesh>
      </group>

      {/* 足（左） */}
      <group ref={leftLegRef} position={[-0.14, 0.32, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.19, 0.56, 0.26]} />
          <meshStandardMaterial color="#2C3E50" roughness={0.8} />
        </mesh>
      </group>

      {/* 足（右） */}
      <group ref={rightLegRef} position={[0.14, 0.32, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.19, 0.56, 0.26]} />
          <meshStandardMaterial color="#2C3E50" roughness={0.8} />
        </mesh>
      </group>
    </group>
  )
}

/* ===========================
   自分のアバター
   =========================== */

interface PlayerAvatarProps {
  color?: string
  isWalking?: boolean
  name?: string
}

export const PlayerAvatar = forwardRef<THREE.Group, PlayerAvatarProps>(
  ({ color = '#54A0FF', isWalking = false, name = 'あなた' }, ref) => {
    // isWalkingをrefで保持（state更新を避ける）
    const walkingRef = useRef(isWalking)
    const walkPhaseRef = useRef(0)

    // isWalkingプロップが変化したらrefだけ更新（再レンダーなし）
    walkingRef.current = isWalking

    return (
      <group ref={ref}>
        <AvatarBodyAnimated color={color} walkingRef={walkingRef} walkPhaseRef={walkPhaseRef} />

        {/* 名前タグ（自分） */}
        <Billboard follow lockX={false} lockY={false} lockZ={false}>
          <Text
            position={[0, 2.6, 0]}
            fontSize={0.28}
            color="#FFFFFF"
            outlineWidth={0.06}
            outlineColor="#1A1A2E"
            anchorX="center"
            anchorY="middle"
          >
            {name}（あなた）
          </Text>
        </Billboard>

        {/* プレイヤーグロー */}
        <pointLight position={[0, 2.2, 0]} color={color} intensity={0.6} distance={4} decay={2} />
      </group>
    )
  }
)

PlayerAvatar.displayName = 'PlayerAvatar'

/* ===========================
   他プレイヤーのアバター（lerp補間）
   =========================== */

interface RemotePlayerAvatarProps {
  player: RemotePlayer
  lastChatText?: string
}

export function RemotePlayerAvatar({ player, lastChatText }: RemotePlayerAvatarProps) {
  const groupRef = useRef<THREE.Group>(null)
  const targetPos = useRef(new THREE.Vector3(player.position.x, player.position.y, player.position.z))
  const targetRot = useRef(player.rotation)
  const walkingRef = useRef(false)
  const walkPhaseRef = useRef(0)
  const prevPos = useRef(new THREE.Vector3(player.position.x, player.position.y, player.position.z))

  // チャット吹き出し（これだけstateでOK：アバターのrefに影響しない）
  const [showChat, setShowChat] = useState(false)
  const [chatText, setChatText] = useState('')
  const chatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!lastChatText) return
    setChatText(lastChatText)
    setShowChat(true)
    if (chatTimerRef.current) clearTimeout(chatTimerRef.current)
    chatTimerRef.current = setTimeout(() => setShowChat(false), 4000)
    return () => { if (chatTimerRef.current) clearTimeout(chatTimerRef.current) }
  }, [lastChatText])

  // サーバーからの位置・回転を目標にセット（レンダー外）
  targetPos.current.set(player.position.x, player.position.y, player.position.z)
  targetRot.current = player.rotation

  useFrame(() => {
    if (!groupRef.current) return

    // lerp補間
    groupRef.current.position.lerp(targetPos.current, 0.18)
    groupRef.current.rotation.y += (targetRot.current - groupRef.current.rotation.y) * 0.18

    // 移動検知（歩行アニメ用）
    const curPos = groupRef.current.position
    const dist = curPos.distanceTo(prevPos.current)
    walkingRef.current = dist > 0.004
    prevPos.current.copy(curPos)
  })

  return (
    <group
      ref={groupRef}
      position={[player.position.x, player.position.y, player.position.z]}
    >
      <AvatarBodyAnimated color={player.color} walkingRef={walkingRef} walkPhaseRef={walkPhaseRef} />

      {/* 名前タグ */}
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        {/* 名前背景板 */}
        <mesh position={[0, 2.6, 0]}>
          <planeGeometry args={[1.4, 0.36]} />
          <meshBasicMaterial color="#1A1A2E" transparent opacity={0.75} side={2} depthWrite={false} />
        </mesh>

        {/* 名前テキスト */}
        <Text
          position={[0, 2.6, 0.01]}
          fontSize={0.26}
          color={player.color}
          outlineWidth={0.04}
          outlineColor="#000000"
          anchorX="center"
          anchorY="middle"
        >
          {player.name}
        </Text>

        {/* チャット吹き出し */}
        {showChat && (
          <>
            <mesh position={[0, 3.2, 0]}>
              <planeGeometry args={[Math.min(2.2, chatText.length * 0.18 + 0.4), 0.5]} />
              <meshBasicMaterial color="#FFFFFF" transparent opacity={0.92} side={2} depthWrite={false} />
            </mesh>
            <Text
              position={[0, 3.2, 0.01]}
              fontSize={0.22}
              color="#1A1A2E"
              maxWidth={2.0}
              anchorX="center"
              anchorY="middle"
            >
              {chatText}
            </Text>
          </>
        )}
      </Billboard>

      {/* グロー */}
      <pointLight
        position={[0, 2.0, 0]}
        color={player.color}
        intensity={0.45}
        distance={4}
        decay={2}
      />
    </group>
  )
}

export type { RemotePlayer }
