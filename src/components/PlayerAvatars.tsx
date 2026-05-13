/**
 * プレイヤーアバターコンポーネント（強化版）
 * - 名前タグ（Billboard + Text）
 * - 歩行ボブアニメーション
 * - チャット吹き出し（3D空間内）
 * - lerp補間スムーズ移動
 */
import { useRef, forwardRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import type { RemotePlayer } from '../hooks/useMultiplayer'

/* ===========================
   和風アバター本体（共通パーツ）
   =========================== */
interface AvatarBodyProps {
  color: string
  isWalking?: boolean
  walkPhase?: number
}

function AvatarBody({ color, isWalking = false, walkPhase = 0 }: AvatarBodyProps) {
  // 歩行アニメ
  const leftLegSwing  = isWalking ? Math.sin(walkPhase * 6) * 0.25 : 0
  const rightLegSwing = isWalking ? -Math.sin(walkPhase * 6) * 0.25 : 0
  const leftArmSwing  = isWalking ? -Math.sin(walkPhase * 6) * 0.3 : 0
  const rightArmSwing = isWalking ? Math.sin(walkPhase * 6) * 0.3 : 0
  const bodyBob       = isWalking ? Math.abs(Math.sin(walkPhase * 6)) * 0.04 : 0

  return (
    <group position={[0, bodyBob, 0]}>
      {/* 体（着物風・縦長） */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[0.52, 0.78, 0.34]} />
        <meshStandardMaterial color={color} roughness={0.55} metalness={0.05} />
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

      {/* 口（小さな赤い点） */}
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
      <group position={[-0.36, 1.05, 0]} rotation={[leftArmSwing, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.17, 0.58, 0.2]} />
          <meshStandardMaterial color={color} roughness={0.55} />
        </mesh>
      </group>

      {/* 腕（右） */}
      <group position={[0.36, 1.05, 0]} rotation={[rightArmSwing, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.17, 0.58, 0.2]} />
          <meshStandardMaterial color={color} roughness={0.55} />
        </mesh>
      </group>

      {/* 足（左） */}
      <group position={[-0.14, 0.32, 0]} rotation={[leftLegSwing, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.19, 0.56, 0.26]} />
          <meshStandardMaterial color="#2C3E50" roughness={0.8} />
        </mesh>
      </group>

      {/* 足（右） */}
      <group position={[0.14, 0.32, 0]} rotation={[rightLegSwing, 0, 0]}>
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
    const walkPhaseRef = useRef(0)
    const [phase, setPhase] = useState(0)

    useFrame((_, delta) => {
      if (isWalking) {
        walkPhaseRef.current += delta
        setPhase(walkPhaseRef.current)
      }
    })

    return (
      <group ref={ref}>
        <AvatarBody color={color} isWalking={isWalking} walkPhase={phase} />

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
            font="https://fonts.gstatic.com/s/notosansjp/v53/-F6jfJtkLLgws2zOKAQoJTU88ck.woff2"
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
  const walkPhaseRef = useRef(0)
  const [phase, setPhase] = useState(0)
  const [isMoving, setIsMoving] = useState(false)
  const prevPos = useRef(new THREE.Vector3(player.position.x, player.position.y, player.position.z))

  // チャット吹き出し表示制御
  const [showChat, setShowChat] = useState(false)
  const [chatText, setChatText] = useState('')
  const chatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // lastChatTextが変わったら吹き出しを表示
  useEffect(() => {
    if (!lastChatText) return
    setChatText(lastChatText)
    setShowChat(true)
    if (chatTimerRef.current) clearTimeout(chatTimerRef.current)
    chatTimerRef.current = setTimeout(() => setShowChat(false), 4000)
    return () => { if (chatTimerRef.current) clearTimeout(chatTimerRef.current) }
  }, [lastChatText])

  // サーバーからの位置・回転を目標にセット
  targetPos.current.set(player.position.x, player.position.y, player.position.z)
  targetRot.current = player.rotation

  useFrame((_, delta) => {
    if (!groupRef.current) return

    // lerp補間
    groupRef.current.position.lerp(targetPos.current, 0.18)
    groupRef.current.rotation.y += (targetRot.current - groupRef.current.rotation.y) * 0.18

    // 移動検知（歩行アニメ用）
    const curPos = groupRef.current.position
    const dist = curPos.distanceTo(prevPos.current)
    const moving = dist > 0.005
    setIsMoving(moving)
    prevPos.current.copy(curPos)

    if (moving) {
      walkPhaseRef.current += delta
      setPhase(walkPhaseRef.current)
    }
  })

  return (
    <group
      ref={groupRef}
      position={[player.position.x, player.position.y, player.position.z]}
    >
      <AvatarBody color={player.color} isWalking={isMoving} walkPhase={phase} />

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
          font="https://fonts.gstatic.com/s/notosansjp/v53/-F6jfJtkLLgws2zOKAQoJTU88ck.woff2"
        >
          {player.name}
        </Text>

        {/* チャット吹き出し */}
        {showChat && (
          <>
            {/* 吹き出し背景 */}
            <mesh position={[0, 3.2, 0]}>
              <planeGeometry args={[Math.min(2.2, chatText.length * 0.18 + 0.4), 0.5]} />
              <meshBasicMaterial color="#FFFFFF" transparent opacity={0.92} side={2} depthWrite={false} />
            </mesh>
            {/* 吹き出しテキスト */}
            <Text
              position={[0, 3.2, 0.01]}
              fontSize={0.22}
              color="#1A1A2E"
              maxWidth={2.0}
              anchorX="center"
              anchorY="middle"
              font="https://fonts.gstatic.com/s/notosansjp/v53/-F6jfJtkLLgws2zOKAQoJTU88ck.woff2"
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
