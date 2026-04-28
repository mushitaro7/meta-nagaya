/**
 * プレイヤー移動・制御フック
 * WASD / 矢印キーでアバターを動かす
 * 島の境界（半径24）内に制限
 */
import { useRef, useEffect, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

export interface PlayerState {
  position: THREE.Vector3
  rotation: number  // Y軸回転（ラジアン）
  isMoving: boolean
  speed: number
}

interface UsePlayerMovementOptions {
  enabled: boolean
  onMove?: (pos: { x: number; y: number; z: number }, rotation: number) => void
  followCamera?: boolean
}

const MOVE_SPEED = 0.12
const TURN_SPEED = 0.04
const ISLAND_RADIUS = 23.5  // 島の境界
const CAMERA_OFFSET = new THREE.Vector3(0, 6, 12)

export function usePlayerMovement({ enabled, onMove, followCamera = true }: UsePlayerMovementOptions) {
  const keys = useRef<Set<string>>(new Set())
  const playerRef = useRef<THREE.Group>(null)
  const posRef = useRef(new THREE.Vector3(0, 0, 22))  // スタート位置（橋の近く）
  const rotRef = useRef(Math.PI)  // 最初は島の内側を向く
  const isMovingRef = useRef(false)
  const { camera } = useThree()

  // キーイベント登録
  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (e: KeyboardEvent) => {
      keys.current.add(e.key.toLowerCase())
      // スペースキーのデフォルト（スクロール）を防ぐ
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault()
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase())
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [enabled])

  // モバイル用の移動コントロール（外部から呼ぶ用）
  const setMobileKey = useCallback((key: string, pressed: boolean) => {
    if (pressed) {
      keys.current.add(key.toLowerCase())
    } else {
      keys.current.delete(key.toLowerCase())
    }
  }, [])

  // 毎フレーム更新
  useFrame((_, delta) => {
    if (!enabled || !playerRef.current) return

    const k = keys.current
    const forward = k.has('w') || k.has('arrowup')
    const backward = k.has('s') || k.has('arrowdown')
    const left = k.has('a') || k.has('arrowleft')
    const right = k.has('d') || k.has('arrowright')
    const moving = forward || backward || left || right

    isMovingRef.current = moving

    // 回転
    if (left) rotRef.current += TURN_SPEED
    if (right) rotRef.current -= TURN_SPEED

    // 前後移動（回転方向に基づく）
    if (forward || backward) {
      const dir = forward ? 1 : -1
      const dx = Math.sin(rotRef.current) * MOVE_SPEED * dir * (60 * delta)
      const dz = Math.cos(rotRef.current) * MOVE_SPEED * dir * (60 * delta)

      const newX = posRef.current.x + dx
      const newZ = posRef.current.z + dz

      // 島の境界制限
      const dist = Math.sqrt(newX ** 2 + newZ ** 2)
      if (dist < ISLAND_RADIUS) {
        posRef.current.x = newX
        posRef.current.z = newZ
      }
    }

    // アバターのポジション・回転を更新
    playerRef.current.position.copy(posRef.current)
    playerRef.current.rotation.y = rotRef.current

    // カメラをプレイヤーの後ろに追従
    if (followCamera) {
      const camX = posRef.current.x - Math.sin(rotRef.current) * CAMERA_OFFSET.z
      const camY = posRef.current.y + CAMERA_OFFSET.y
      const camZ = posRef.current.z - Math.cos(rotRef.current) * CAMERA_OFFSET.z

      camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.08)
      const lookTarget = posRef.current.clone().add(new THREE.Vector3(0, 1.5, 0))
      camera.lookAt(lookTarget)
    }

    // 位置変化があればコールバック
    if (moving) {
      onMove?.({ x: posRef.current.x, y: posRef.current.y, z: posRef.current.z }, rotRef.current)
    }
  })

  return { playerRef, posRef, rotRef, isMovingRef, setMobileKey }
}
