/**
 * メタNAGA屋 マルチプレイヤーサーバー
 * Socket.io によるリアルタイム位置同期
 * Railway / Render 対応版
 */
import { createServer } from 'http'
import { Server } from 'socket.io'

const httpServer = createServer()

// 許可するオリジン（環境変数で本番URLを追加できる）
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.VITE_CLIENT_URL,  // Vercelなどの本番URL
].filter(Boolean)

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
})

// プレイヤー管理
const players = new Map()

// アバター名リスト（日本語・和風）
const AVATAR_NAMES = [
  'さくら', 'はな', 'ゆき', 'あおい', 'みおん',
  'けんた', 'りょう', 'たける', 'ひなた', 'そうた',
  'もみこ', 'なでしこ', 'あずさ', 'ちはる', 'いろは',
]

// アバターカラーリスト
const AVATAR_COLORS = [
  '#FF6B9D', '#FF9F43', '#54A0FF', '#5F27CD', '#00D2D3',
  '#1DD1A1', '#C8D6E5', '#FF9FF3', '#FECA57', '#48DBFB',
]

let playerCount = 0

io.on('connection', (socket) => {
  playerCount++
  const nameIdx = playerCount % AVATAR_NAMES.length
  const colorIdx = playerCount % AVATAR_COLORS.length

  const playerData = {
    id: socket.id,
    name: AVATAR_NAMES[nameIdx],
    color: AVATAR_COLORS[colorIdx],
    position: { x: 0, y: 0, z: 26 },  // 橋の入口付近からスタート
    rotation: 0,
    area: null,
    joinedAt: Date.now(),
  }

  players.set(socket.id, playerData)

  console.log(`[接続] ${playerData.name} (${socket.id.slice(0, 6)}) | 合計: ${players.size}人`)

  // 自分の初期データを送信
  socket.emit('init', {
    self: playerData,
    players: Array.from(players.values()).filter(p => p.id !== socket.id),
  })

  // 他の全員に新規参加を通知
  socket.broadcast.emit('player:join', playerData)

  // 位置更新
  socket.on('player:move', (data) => {
    const player = players.get(socket.id)
    if (!player) return

    player.position = data.position
    player.rotation = data.rotation
    player.area = data.area ?? null

    // 他の全員に位置を送信（送信者除く）
    socket.broadcast.emit('player:move', {
      id: socket.id,
      position: player.position,
      rotation: player.rotation,
      area: player.area,
    })
  })

  // チャットメッセージ
  socket.on('chat:message', (data) => {
    const player = players.get(socket.id)
    if (!player) return

    const msg = {
      id: `${socket.id}-${Date.now()}`,
      playerId: socket.id,
      playerName: player.name,
      playerColor: player.color,
      text: String(data.text).slice(0, 80),
      timestamp: Date.now(),
    }

    io.emit('chat:message', msg)
    console.log(`[チャット] ${player.name}: ${msg.text}`)
  })

  // エリア到達通知
  socket.on('player:area', (areaId) => {
    const player = players.get(socket.id)
    if (!player) return
    player.area = areaId
    socket.broadcast.emit('player:area', { id: socket.id, area: areaId })
  })

  // 切断
  socket.on('disconnect', () => {
    const player = players.get(socket.id)
    if (player) {
      console.log(`[切断] ${player.name} | 残り: ${players.size - 1}人`)
    }
    players.delete(socket.id)
    io.emit('player:leave', socket.id)
  })
})

// Railway/Render は PORT 環境変数を自動で渡す
const PORT = process.env.PORT ?? 3001
httpServer.listen(PORT, () => {
  console.log(`\n🏮 メタNAGA屋 マルチプレイヤーサーバー起動`)
  console.log(`   http://localhost:${PORT}`)
  console.log(`   待機中...\n`)
})
