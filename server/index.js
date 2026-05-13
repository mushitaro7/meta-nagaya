/**
 * メタNAGA屋 マルチプレイヤーサーバー（強化版）
 * Socket.io によるリアルタイム位置同期
 * Railway / Render / Fly.io 対応版
 */
import { createServer } from 'http'
import { Server } from 'socket.io'

const httpServer = createServer((req, res) => {
  // ヘルスチェック用エンドポイント
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      status: 'ok',
      players: players.size,
      uptime: Math.floor(process.uptime()),
      version: '2.0.0',
    }))
    return
  }
  res.writeHead(404)
  res.end()
})

// 許可するオリジン
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://meta-nagaya.vercel.app',
  process.env.VITE_CLIENT_URL,
  process.env.CLIENT_URL,
].filter(Boolean)

console.log('[起動] 許可オリジン:', allowedOrigins)

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // 接続品質設定
  pingTimeout: 20000,
  pingInterval: 15000,
})

// プレイヤー管理
const players = new Map()

// アバター名リスト（和風）
const AVATAR_NAMES = [
  'さくら', 'はな', 'ゆき', 'あおい', 'みおん',
  'けんた', 'りょう', 'たける', 'ひなた', 'そうた',
  'もみこ', 'なでしこ', 'あずさ', 'ちはる', 'いろは',
  'ひびき', 'かえで', 'もみじ', 'すずな', 'きりこ',
]

// アバターカラーリスト（鮮やかな和風カラー）
const AVATAR_COLORS = [
  '#FF6B9D', '#FF9F43', '#54A0FF', '#5F27CD', '#00D2D3',
  '#1DD1A1', '#FF9FF3', '#FECA57', '#48DBFB', '#A29BFE',
  '#FD79A8', '#6C5CE7', '#00CEC9', '#E17055', '#74B9FF',
]

let playerCount = 0

io.on('connection', (socket) => {
  playerCount++
  const nameIdx = (playerCount - 1) % AVATAR_NAMES.length
  const colorIdx = (playerCount - 1) % AVATAR_COLORS.length

  const playerData = {
    id: socket.id,
    name: AVATAR_NAMES[nameIdx],
    color: AVATAR_COLORS[colorIdx],
    position: { x: 0, y: 0, z: 22 },  // 橋の内側からスタート
    rotation: Math.PI,                  // 島の内側を向く
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

  // 位置更新（スロットリングはクライアント側で制御済み）
  socket.on('player:move', (data) => {
    const player = players.get(socket.id)
    if (!player) return

    // 境界チェック（サーバーサイドバリデーション）
    if (data.position && typeof data.position.x === 'number') {
      const dist = Math.sqrt(data.position.x ** 2 + data.position.z ** 2)
      if (dist <= 30) {  // 島の最大半径より少し広め
        player.position = data.position
      }
    }
    player.rotation = typeof data.rotation === 'number' ? data.rotation : player.rotation
    player.area = data.area ?? null

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

    const text = String(data.text ?? '').trim().slice(0, 80)
    if (!text) return

    const msg = {
      id: `${socket.id}-${Date.now()}`,
      playerId: socket.id,
      playerName: player.name,
      playerColor: player.color,
      text,
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

  // ping/pong（接続品質計測）
  socket.on('ping', () => {
    socket.emit('pong')
  })

  // 切断
  socket.on('disconnect', (reason) => {
    const player = players.get(socket.id)
    if (player) {
      console.log(`[切断] ${player.name} (${reason}) | 残り: ${players.size - 1}人`)
    }
    players.delete(socket.id)
    io.emit('player:leave', socket.id)
  })
})

// Railway/Render は PORT 環境変数を自動で渡す
const PORT = process.env.PORT ?? 3001
httpServer.listen(PORT, () => {
  console.log(`\n🏮 メタNAGA屋 マルチプレイヤーサーバー v2.0 起動`)
  console.log(`   ポート: ${PORT}`)
  console.log(`   ヘルスチェック: http://localhost:${PORT}/health`)
  console.log(`   待機中...\n`)
})
