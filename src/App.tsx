import { useState, useCallback, useRef, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import NagayaWorld from './components/NagayaWorld'
import { useMultiplayer } from './hooks/useMultiplayer'

/* ===========================
   メタNAGA屋 - メインアプリ (仮)
   こども中心の経済コミュニティ空間
   移動・マルチプレイヤー対応版
   =========================== */

// ローディング画面
function LoadingScreen({ progress }: { progress: number }) {
  return (
    <div className="loading-screen" id="loading-screen">
      <div className="loading-logo">
        <span className="loading-logo-main">MOMEKO</span>
        <span className="loading-logo-sub">メタNAGA屋</span>
      </div>
      <div className="loading-bar-container">
        <div className="loading-bar" style={{ width: `${progress}%` }} />
      </div>
      <div className="loading-hint">仮想空間を読み込み中...</div>
    </div>
  )
}

// 3Dシーンのローダー
function SceneLoader({ onLoaded }: { onLoaded: () => void }) {
  return (
    <Suspense fallback={null}>
      <SceneReady onReady={onLoaded} />
    </Suspense>
  )
}

function SceneReady({ onReady }: { onReady: () => void }) {
  useState(() => {
    setTimeout(onReady, 500)
  })
  return null
}

// エリア情報
const AREAS = [
  {
    id: 'area-a',
    areaId: 'A',
    label: 'エリアA',
    name: '一次産業',
    desc: '農業・漁業・採取など\n生産の場所',
    emoji: '🌾',
    color: '#4A9960',
  },
  {
    id: 'area-b',
    areaId: 'B',
    label: 'エリアB',
    name: '二次産業',
    desc: '加工・製造\nブランディングの場所',
    emoji: '⚙️',
    color: '#3B7DB5',
  },
  {
    id: 'area-c',
    areaId: 'C',
    label: 'エリアC',
    name: '三次産業',
    desc: '販売・広報\nサービスの場所',
    emoji: '🛒',
    color: '#C05A2B',
  },
  {
    id: 'area-d',
    areaId: 'D',
    label: 'エリアD',
    name: 'コミュニティ',
    desc: '交流・学び\n仲間づくりの場所',
    emoji: '💬',
    color: '#8B5DB5',
  },
  {
    id: 'area-e',
    areaId: 'E',
    label: 'エリアE',
    name: 'エンタメ',
    desc: 'カフェ・遊び\n楽しみの場所',
    emoji: '☕',
    color: '#B5883B',
  },
]

// モバイル用 ジョイスティック UI
interface JoystickProps {
  onKey: (key: string, pressed: boolean) => void
}
function MobileControls({ onKey }: JoystickProps) {
  return (
    <div id="mobile-controls" className="mobile-controls">
      <div className="joystick-row">
        <button
          className="jbtn"
          onPointerDown={() => onKey('w', true)}
          onPointerUp={() => onKey('w', false)}
          onPointerLeave={() => onKey('w', false)}
        >▲</button>
      </div>
      <div className="joystick-row">
        <button
          className="jbtn"
          onPointerDown={() => onKey('a', true)}
          onPointerUp={() => onKey('a', false)}
          onPointerLeave={() => onKey('a', false)}
        >◀</button>
        <button
          className="jbtn"
          onPointerDown={() => onKey('s', true)}
          onPointerUp={() => onKey('s', false)}
          onPointerLeave={() => onKey('s', false)}
        >▼</button>
        <button
          className="jbtn"
          onPointerDown={() => onKey('d', true)}
          onPointerUp={() => onKey('d', false)}
          onPointerLeave={() => onKey('d', false)}
        >▶</button>
      </div>
    </div>
  )
}

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)
  const [isExploring, setIsExploring] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [showLanding, setShowLanding] = useState(true)
  const [activeArea, setActiveArea] = useState<string | null>(null)
  const [buildingPopup, setBuildingPopup] = useState<{ id: string; label: string } | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [showChat, setShowChat] = useState(false)
  const [currentAreaId, setCurrentAreaId] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const moveCallbackRef = useRef<((pos: { x: number; y: number; z: number }, rotation: number) => void) | null>(null)

  // マルチプレイヤー（探索中のみ有効）
  const { self, remotePlayers, chatMessages, connected, sendMove, sendChat } = useMultiplayer(isExploring)

  const handleLoaded = useCallback(() => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setTimeout(() => setIsLoading(false), 500)
      }
      setLoadProgress(progress)
    }, 100)
  }, [])

  const handleEnter = useCallback(() => {
    setShowLanding(false)
    setIsExploring(true)
  }, [])

  const handleToggleMove = useCallback(() => {
    setIsMoving(prev => !prev)
    setBuildingPopup(null)
  }, [])

  const handleBuildingClick = useCallback((areaId: string, label: string) => {
    if (isMoving) return  // 移動中はスキップ
    setBuildingPopup({ id: areaId, label })
    setTimeout(() => setBuildingPopup(null), 4000)
  }, [isMoving])

  const handleAreaEnter = useCallback((areaId: string | null) => {
    setCurrentAreaId(areaId)
  }, [])

  const handleMove = useCallback((pos: { x: number; y: number; z: number }, rotation: number) => {
    sendMove(pos, rotation)
  }, [sendMove])

  const handleSendChat = useCallback(() => {
    if (!chatInput.trim()) return
    sendChat(chatInput)
    setChatInput('')
  }, [chatInput, sendChat])

  const handleMobileKey = useCallback((key: string, pressed: boolean) => {
    const event = new KeyboardEvent(pressed ? 'keydown' : 'keyup', { key })
    window.dispatchEvent(event)
  }, [])

  // チャット自動スクロール
  const prevMsgCount = useRef(0)
  if (chatMessages.length !== prevMsgCount.current) {
    prevMsgCount.current = chatMessages.length
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  const currentAreaData = currentAreaId
    ? AREAS.find(a => a.areaId === currentAreaId)
    : null

  return (
    <>
      {/* ローディング画面 */}
      {isLoading && <LoadingScreen progress={loadProgress} />}

      {/* 3Dキャンバス */}
      <div id="canvas-container">
        <Canvas
          shadows
          camera={{ position: [15, 8, 20], fov: 55, near: 0.1, far: 200 }}
          gl={{ antialias: true, toneMapping: 3, toneMappingExposure: 0.8 }}
          style={{ background: '#87CEEB' }}
        >
          <NagayaWorld
            isExploring={isExploring}
            isMoving={isMoving}
            selfColor={self?.color ?? '#54A0FF'}
            remotePlayers={remotePlayers}
            onMove={handleMove}
            onBuildingClick={handleBuildingClick}
            onAreaEnter={handleAreaEnter}
          />
          <SceneLoader onLoaded={handleLoaded} />
        </Canvas>
      </div>

      {/* ランディングオーバーレイ */}
      <div className={`landing-overlay ${!showLanding ? 'hidden' : ''}`} id="landing-overlay">
        <div className="landing-badge">2026.4.21 ご説明資料</div>
        <div className="title-section">
          <div className="title-brand">MOMEKO</div>
          <h1 className="title-jp">メタNAGA屋</h1>
          <p className="title-en">(仮) Meta Nagaya — Virtual Community Space</p>
          <p className="subtitle">仮想空間を介した、こども中心の<br />経済コミュニティ空間プロジェクト</p>
        </div>

        {/* 5エリア紹介 */}
        <div className="area-pills">
          {AREAS.map(a => (
            <div key={a.id} className="area-pill" style={{ borderColor: a.color }}>
              <span>{a.emoji}</span>
              <span>{a.name}</span>
            </div>
          ))}
        </div>

        <div className="enter-button-wrapper">
          <button
            className="enter-button"
            id="enter-world-button"
            onClick={handleEnter}
          >
            長屋に入る
          </button>
        </div>
      </div>

      {/* 下部ヒント */}
      {showLanding && !isLoading && (
        <div className="bottom-info">
          <span className="scroll-hint">drag to look around</span>
        </div>
      )}

      {/* HUD */}
      <div className={`hud ${isExploring ? 'visible' : ''}`}>
        <div className="hud-logo">
          <span className="hud-brand">MOMEKO</span>
          <span className="hud-sep"> / </span>
          メタ<span>長屋</span>
        </div>
        {/* オンライン人数 */}
        {connected && (
          <div className="hud-online">
            <span className="hud-online-dot" />
            {remotePlayers.size + 1}人オンライン
          </div>
        )}
      </div>

      {/* 操作ボタン群（探索中） */}
      {isExploring && (
        <div className="action-buttons">
          {/* 移動モード切り替え */}
          <button
            id="toggle-move-btn"
            className={`action-btn ${isMoving ? 'active' : ''}`}
            onClick={handleToggleMove}
            title={isMoving ? '移動モード終了' : '移動モード開始'}
          >
            {isMoving ? '🔴 移動中' : '🟢 移動する'}
          </button>

          {/* チャット */}
          <button
            id="toggle-chat-btn"
            className={`action-btn ${showChat ? 'active' : ''}`}
            onClick={() => setShowChat(prev => !prev)}
            title="チャット"
          >
            💬 チャット
          </button>
        </div>
      )}

      {/* 操作説明 */}
      <div className={`controls-info ${isExploring ? 'visible' : ''}`}>
        {isMoving
          ? 'W/A/S/D or ↑←↓→ : 移動　| ESCまたは「移動中」ボタン: 終了'
          : 'マウスドラッグ: 視点回転 | スクロール: ズーム | 建物クリック: 情報表示'
        }
      </div>

      {/* エリアパネル（探索中・通常モード） */}
      {!isMoving && (
        <div className={`features-overlay ${isExploring ? 'visible' : ''}`}>
          {AREAS.map(a => (
            <div
              key={a.id}
              className={`feature-card ${activeArea === a.id ? 'active' : ''}`}
              id={a.id}
              style={{ '--area-color': a.color } as React.CSSProperties}
              onClick={() => setActiveArea(activeArea === a.id ? null : a.id)}
            >
              <div className="feature-card-icon">{a.emoji}</div>
              <div className="feature-card-label-small">{a.label}</div>
              <div className="feature-card-label">{a.name}</div>
            </div>
          ))}
        </div>
      )}

      {/* エリア詳細パネル */}
      {activeArea && isExploring && !isMoving && (
        <div className="area-detail-panel" id="area-detail-panel">
          {(() => {
            const a = AREAS.find(x => x.id === activeArea)!
            return (
              <>
                <div className="area-detail-header" style={{ borderColor: a.color }}>
                  <span className="area-detail-emoji">{a.emoji}</span>
                  <div>
                    <div className="area-detail-label">{a.label}</div>
                    <div className="area-detail-name">{a.name}</div>
                  </div>
                  <button className="area-detail-close" onClick={() => setActiveArea(null)}>✕</button>
                </div>
                <p className="area-detail-desc">{a.desc.replace('\\n', '\n')}</p>
                <div className="area-detail-tag">こども経済コミュニティ</div>
              </>
            )
          })()}
        </div>
      )}

      {/* 建物クリックポップアップ */}
      {buildingPopup && (
        <div className="building-popup" id="building-popup">
          <div className="building-popup-label">{buildingPopup.label}</div>
          <div className="building-popup-hint">クリックして詳細を見る</div>
        </div>
      )}

      {/* 移動中のエリア表示 */}
      {isMoving && currentAreaData && (
        <div
          className="area-enter-notice"
          style={{ borderColor: currentAreaData.color }}
          id="area-enter-notice"
        >
          <span className="area-enter-emoji">{currentAreaData.emoji}</span>
          <div>
            <div className="area-enter-name">{currentAreaData.label}</div>
            <div className="area-enter-subname">{currentAreaData.name}</div>
          </div>
        </div>
      )}

      {/* モバイルコントロール（移動中のみ） */}
      {isMoving && <MobileControls onKey={handleMobileKey} />}

      {/* チャットパネル */}
      {isExploring && showChat && (
        <div className="chat-panel" id="chat-panel">
          <div className="chat-header">
            <span>💬 みんなのチャット</span>
            {connected ? (
              <span className="chat-connected">● 接続中</span>
            ) : (
              <span className="chat-offline">○ オフライン</span>
            )}
          </div>
          <div className="chat-messages" id="chat-messages">
            {chatMessages.length === 0 && (
              <div className="chat-empty">まだメッセージがありません</div>
            )}
            {chatMessages.map(msg => (
              <div key={msg.id} className="chat-msg">
                <span className="chat-msg-name" style={{ color: msg.playerColor }}>
                  {msg.playerName}
                </span>
                <span className="chat-msg-text">{msg.text}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="chat-input-row">
            <input
              id="chat-input"
              className="chat-input"
              type="text"
              placeholder="メッセージを入力..."
              value={chatInput}
              maxLength={80}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => {
                e.stopPropagation()  // WASDキーを3D側に伝えない
                if (e.key === 'Enter') handleSendChat()
              }}
            />
            <button
              id="chat-send-btn"
              className="chat-send-btn"
              onClick={handleSendChat}
            >送信</button>
          </div>
        </div>
      )}

      {/* プレイヤー一覧（右上） */}
      {isExploring && connected && remotePlayers.size > 0 && (
        <div className="player-list" id="player-list">
          <div className="player-list-title">👥 参加中</div>
          {self && (
            <div className="player-list-item">
              <span className="player-dot" style={{ background: self.color }} />
              <span>{self.name}（あなた）</span>
            </div>
          )}
          {Array.from(remotePlayers.values()).map(p => (
            <div key={p.id} className="player-list-item">
              <span className="player-dot" style={{ background: p.color }} />
              <span>{p.name}</span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default App
