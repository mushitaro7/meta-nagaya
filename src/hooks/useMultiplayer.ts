/**
 * マルチプレイヤー Socket.io フック（強化版）
 * - サーバーへの接続・位置送信・他プレイヤー受信
 * - チャットメッセージをプレイヤーに紐付け（吹き出し用）
 * - ping/pong による接続品質監視
 */
import { useRef, useEffect, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

export interface RemotePlayer {
  id: string
  name: string
  color: string
  position: { x: number; y: number; z: number }
  rotation: number
  area: string | null
  lastChat?: string   // 最新チャットテキスト（吹き出し用）
  lastChatAt?: number // タイムスタンプ
}

export interface SelfPlayer {
  id: string
  name: string
  color: string
}

export interface ChatMessage {
  id: string
  playerId: string
  playerName: string
  playerColor: string
  text: string
  timestamp: number
}

// 本番: VITE_SERVER_URL 環境変数を使用。未設定時はローカル
const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001'
const SEND_INTERVAL = 80  // ms (約12fps) - 帯域節約

export function useMultiplayer(enabled: boolean) {
  const socketRef = useRef<Socket | null>(null)
  const [self, setSelf] = useState<SelfPlayer | null>(null)
  const [remotePlayers, setRemotePlayers] = useState<Map<string, RemotePlayer>>(new Map())
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [connected, setConnected] = useState(false)
  const [ping, setPing] = useState<number | null>(null)
  const lastSendTime = useRef(0)
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pingSentAt = useRef<number>(0)

  useEffect(() => {
    if (!enabled) return

    const socket = io(SERVER_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      console.log('[MP] サーバー接続完了:', socket.id)
    })

    socket.on('disconnect', () => {
      setConnected(false)
      setPing(null)
      console.log('[MP] 切断')
    })

    socket.on('connect_error', (err) => {
      console.warn('[MP] 接続エラー:', err.message)
    })

    // 初期化（自分の情報＋既存プレイヤー）
    socket.on('init', ({ self: selfData, players }: { self: SelfPlayer & RemotePlayer; players: RemotePlayer[] }) => {
      setSelf({ id: selfData.id, name: selfData.name, color: selfData.color })
      const map = new Map<string, RemotePlayer>()
      players.forEach(p => map.set(p.id, p))
      setRemotePlayers(map)
    })

    // 新規プレイヤー参加
    socket.on('player:join', (player: RemotePlayer) => {
      setRemotePlayers(prev => {
        const next = new Map(prev)
        next.set(player.id, player)
        return next
      })
    })

    // 他プレイヤーの移動
    socket.on('player:move', (data: { id: string; position: RemotePlayer['position']; rotation: number; area: string | null }) => {
      setRemotePlayers(prev => {
        const player = prev.get(data.id)
        if (!player) return prev
        const next = new Map(prev)
        next.set(data.id, { ...player, position: data.position, rotation: data.rotation, area: data.area })
        return next
      })
    })

    // プレイヤー離脱
    socket.on('player:leave', (id: string) => {
      setRemotePlayers(prev => {
        const next = new Map(prev)
        next.delete(id)
        return next
      })
    })

    // チャット受信（プレイヤーに吹き出し情報も紐付け）
    socket.on('chat:message', (msg: ChatMessage) => {
      setChatMessages(prev => [...prev.slice(-49), msg])  // 最大50件

      // 送信者のアバターに lastChat をセット（吹き出し表示用）
      setRemotePlayers(prev => {
        const player = prev.get(msg.playerId)
        if (!player) return prev
        const next = new Map(prev)
        next.set(msg.playerId, { ...player, lastChat: msg.text, lastChatAt: msg.timestamp })
        return next
      })
    })

    // ping/pong で接続品質計測
    pingTimerRef.current = setInterval(() => {
      pingSentAt.current = Date.now()
      socket.emit('ping')
    }, 3000)

    socket.on('pong', () => {
      setPing(Date.now() - pingSentAt.current)
    })

    return () => {
      socket.disconnect()
      if (pingTimerRef.current) clearInterval(pingTimerRef.current)
    }
  }, [enabled])

  // 位置を送信（スロットリング付き）
  const sendMove = useCallback((position: { x: number; y: number; z: number }, rotation: number) => {
    const now = Date.now()
    if (now - lastSendTime.current < SEND_INTERVAL) return
    lastSendTime.current = now

    socketRef.current?.emit('player:move', { position, rotation })
  }, [])

  // チャット送信
  const sendChat = useCallback((text: string) => {
    if (!text.trim()) return
    socketRef.current?.emit('chat:message', { text })
  }, [])

  return {
    self,
    remotePlayers,
    chatMessages,
    connected,
    ping,
    sendMove,
    sendChat,
  }
}
