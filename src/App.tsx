import { useState, useCallback, useRef, useEffect, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import NagayaWorld from './components/NagayaWorld'
import ShopModal from './components/ShopModal'
import CartPanel, { CartFab } from './components/CartPanel'
import { useMultiplayer } from './hooks/useMultiplayer'
import { getShopByBuilding } from './data/shops'
import { getApprovedShopByBuilding, getAssignedBuildingIndexes } from './data/ownerStore'
import type { CartItem } from './components/ShopModal'
import type { Shop } from './data/shops'
import OwnerPortal from './pages/OwnerPortal'
import OwnerLogin from './pages/OwnerLogin'
import OwnerRegister from './pages/OwnerRegister'
import OwnerDashboard from './pages/OwnerDashboard'
import ShopEditor from './pages/ShopEditor'
import ProductEditor from './pages/ProductEditor'
import AdminLogin from './pages/AdminLogin'
import AdminPanel from './pages/AdminPanel'

/* ===========================
   メタNAGA屋 - メインアプリ
   設備強化 & 売買システム対応版
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
  { id: 'area-a', areaId: 'A', label: 'エリアA', name: '一次産業', desc: '農業・漁業・採取など\n生産の場所', emoji: '🌾', color: '#4A9960' },
  { id: 'area-b', areaId: 'B', label: 'エリアB', name: '二次産業', desc: '加工・製造\nブランディングの場所', emoji: '⚙️', color: '#3B7DB5' },
  { id: 'area-c', areaId: 'C', label: 'エリアC', name: '三次産業', desc: '販売・広報\nサービスの場所', emoji: '🛒', color: '#C05A2B' },
  { id: 'area-d', areaId: 'D', label: 'エリアD', name: 'コミュニティ', desc: '交流・学び\n仲間づくりの場所', emoji: '💬', color: '#8B5DB5' },
  { id: 'area-e', areaId: 'E', label: 'エリアE', name: 'エンタメ', desc: 'カフェ・遊び\n楽しみの場所', emoji: '☕', color: '#B5883B' },
]

// モバイル用 ジョイスティック UI
interface JoystickProps { onKey: (key: string, pressed: boolean) => void }
function MobileControls({ onKey }: JoystickProps) {
  return (
    <div id="mobile-controls" className="mobile-controls">
      <div className="joystick-row">
        <button className="jbtn" onPointerDown={() => onKey('w', true)} onPointerUp={() => onKey('w', false)} onPointerLeave={() => onKey('w', false)}>▲</button>
      </div>
      <div className="joystick-row">
        <button className="jbtn" onPointerDown={() => onKey('a', true)} onPointerUp={() => onKey('a', false)} onPointerLeave={() => onKey('a', false)}>◀</button>
        <button className="jbtn" onPointerDown={() => onKey('s', true)} onPointerUp={() => onKey('s', false)} onPointerLeave={() => onKey('s', false)}>▼</button>
        <button className="jbtn" onPointerDown={() => onKey('d', true)} onPointerUp={() => onKey('d', false)} onPointerLeave={() => onKey('d', false)}>▶</button>
      </div>
    </div>
  )
}

/* ===========================
   決済モーダル（Stripe / PayPay 導線）
   =========================== */
interface CheckoutModalProps {
  items: CartItem[]
  total: number
  onClose: () => void
}

function CheckoutModal({ items, total, onClose }: CheckoutModalProps) {
  return (
    <div className="checkout-modal-overlay" onClick={onClose}>
      <div className="checkout-modal" onClick={e => e.stopPropagation()}>
        <div className="checkout-modal-header">
          <span>💳 お支払い方法</span>
          <button className="checkout-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="checkout-modal-total">
          合計金額: <strong>¥{total.toLocaleString()}</strong>
        </div>
        <div className="checkout-modal-items">
          {items.map(item => (
            <div key={item.product.id} className="checkout-item">
              <span>{item.product.imageEmoji}</span>
              <span className="checkout-item-name">{item.product.name} × {item.quantity}</span>
              <span className="checkout-item-price">¥{(item.product.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="checkout-methods">
          <a
            className="checkout-method-btn checkout-method-stripe"
            href="https://stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            id="stripe-checkout-btn"
          >
            <span>💳</span>
            <div>
              <div className="checkout-method-name">クレジットカード決済</div>
              <div className="checkout-method-sub">Stripe（Visa / Master / AMEX）</div>
            </div>
          </a>
          <a
            className="checkout-method-btn checkout-method-paypay"
            href="https://paypay.ne.jp"
            target="_blank"
            rel="noopener noreferrer"
            id="paypay-checkout-btn"
          >
            <span>🟡</span>
            <div>
              <div className="checkout-method-name">PayPay</div>
              <div className="checkout-method-sub">スキャンまたはアプリで支払い</div>
            </div>
          </a>
        </div>
        <div className="checkout-coming-soon">
          ※ 現在テスト中。決済システムは近日稼働予定です。
        </div>
      </div>
    </div>
  )
}

/* ===========================
   メインApp
   =========================== */
function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)
  const [isExploring, setIsExploring] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [showLanding, setShowLanding] = useState(true)
  const [chatInput, setChatInput] = useState('')
  const [showChat, setShowChat] = useState(false)
  const [currentAreaId, setCurrentAreaId] = useState<string | null>(null)

  // 店舗パネル
  const [openShop, setOpenShop] = useState<Shop | null>(null)
  // 移動中の近接店舗カード
  const [proximityShop, setProximityShop] = useState<Shop | null>(null)
  const lastProximityBuilding = useRef<number | null>(null)
  const isMovingRef = useRef(false)

  // カート
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)

  // オーナー棟インデックス（リアルタイム更新）
  const [ownerBuildingIndexes, setOwnerBuildingIndexes] = useState<Set<number>>(() => getAssignedBuildingIndexes())

  const chatEndRef = useRef<HTMLDivElement>(null)

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

  // ownerStore の変更を監視してリアルタイム反映
  useEffect(() => {
    const onStorage = () => setOwnerBuildingIndexes(getAssignedBuildingIndexes())
    window.addEventListener('storage', onStorage)
    // 初回マウント時にも取得
    setOwnerBuildingIndexes(getAssignedBuildingIndexes())
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const handleEnter = useCallback(() => {
    setShowLanding(false)
    setIsExploring(true)
  }, [])

  const handleToggleMove = useCallback(() => {
    setIsMoving(prev => !prev)
    setOpenShop(null)
    setProximityShop(null)
    lastProximityBuilding.current = null
  }, [])

  // isMoving変化でrefを同期
  useEffect(() => {
    isMovingRef.current = isMoving
    if (!isMoving) {
      setProximityShop(null)
      lastProximityBuilding.current = null
    }
  }, [isMoving])

  // 建物クリック（移動中は無効）
  const handleBuildingClick = useCallback((_areaId: string, _label: string, buildingIndex: number) => {
    if (isMovingRef.current) return
    const ownerShop = getApprovedShopByBuilding(buildingIndex)
    if (ownerShop) { setOpenShop(ownerShop); setShowCart(false); return }
    const shop = getShopByBuilding(buildingIndex)
    if (shop) { setOpenShop(shop); setShowCart(false) }
  }, [])

  // ホバー（全体図モード）
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleBuildingHover = useCallback((buildingIndex: number | null) => {
    if (isMovingRef.current) return
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    if (buildingIndex !== null) {
      const shop = getApprovedShopByBuilding(buildingIndex) ?? getShopByBuilding(buildingIndex)
      if (shop) setOpenShop(shop)
    } else {
      // 少し待ってから閉じる（別の棟にカーソルが移る間のちらつき防止）
      hoverTimer.current = setTimeout(() => setOpenShop(null), 400)
    }
  }, [])

  const handleAreaEnter = useCallback((areaId: string | null) => {
    setCurrentAreaId(areaId)
  }, [])

  // 移動中の近接検知：棟10個との距離を毎フレーム計算
  const BUILDING_RADIUS_WORLD = 20   // CircularNagayaのBUILDING_RADIUSと合わせる
  const APPROACH_DIST = 7
  const handleMove = useCallback((pos: { x: number; y: number; z: number }, rotation: number) => {
    sendMove(pos, rotation)
    if (!isMovingRef.current) return
    let nearest: number | null = null
    let minDist = Infinity
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2
      const bx = Math.cos(angle) * BUILDING_RADIUS_WORLD
      const bz = Math.sin(angle) * BUILDING_RADIUS_WORLD
      const dist = Math.sqrt((pos.x - bx) ** 2 + (pos.z - bz) ** 2)
      if (dist < APPROACH_DIST && dist < minDist) {
        nearest = i
        minDist = dist
      }
    }
    if (nearest !== lastProximityBuilding.current) {
      lastProximityBuilding.current = nearest
      if (nearest !== null) {
        const shop = getApprovedShopByBuilding(nearest) ?? getShopByBuilding(nearest)
        setProximityShop(shop ?? null)
      } else {
        setProximityShop(null)
      }
    }
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

  // カート操作
  const handleAddToCart = useCallback((item: CartItem) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.product.id === item.product.id)
      if (existing) {
        return prev.map(i =>
          i.product.id === item.product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, item]
    })
  }, [])

  const handleUpdateQty = useCallback((productId: string, delta: number) => {
    setCartItems(prev =>
      prev
        .map(i => i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i)
        .filter(i => i.quantity > 0)
    )
  }, [])

  const handleRemoveFromCart = useCallback((productId: string) => {
    setCartItems(prev => prev.filter(i => i.product.id !== productId))
  }, [])

  const handleCheckout = useCallback(() => {
    setShowCart(false)
    setShowCheckout(true)
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

  const cartTotal = cartItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)

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
            onBuildingHover={handleBuildingHover}
            onAreaEnter={handleAreaEnter}
            ownerBuildingIndexes={ownerBuildingIndexes}
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
        <div className="area-pills">
          {AREAS.map(a => (
            <div key={a.id} className="area-pill" style={{ borderColor: a.color }}>
              <span>{a.emoji}</span>
              <span>{a.name}</span>
            </div>
          ))}
        </div>
        <div className="enter-button-wrapper">
          <button className="enter-button" id="enter-world-button" onClick={handleEnter}>
            長屋に入る
          </button>
        </div>
      </div>

      {/* 下部ヒント */}
      {showLanding && !isLoading && (
        <div className="bottom-info">
          <span className="scroll-hint">drag to look around — 建物クリックでお店を見る</span>
        </div>
      )}

      {/* HUD */}
      <div className={`hud ${isExploring ? 'visible' : ''}`}>
        <div className="hud-logo">
          <span className="hud-brand">MOMEKO</span>
          <span className="hud-sep"> / </span>
          メタ<span>長屋</span>
        </div>
        {connected && (
          <div className="hud-online">
            <span className="hud-online-dot" />
            {remotePlayers.size + 1}人オンライン
          </div>
        )}
      </div>

      {/* 操作ボタン群 */}
      {isExploring && (
        <div className="action-buttons">
          <button
            id="toggle-move-btn"
            className={`action-btn ${isMoving ? 'active' : ''}`}
            onClick={handleToggleMove}
            title={isMoving ? '移動モード終了' : '移動モード開始'}
          >
            {isMoving ? '🔴 移動中' : '🟢 移動する'}
          </button>
          <button
            id="toggle-chat-btn"
            className={`action-btn ${showChat ? 'active' : ''}`}
            onClick={() => { setShowChat(prev => !prev); setShowCart(false) }}
            title="チャット"
          >
            💬 チャット
          </button>
        </div>
      )}

      {/* 操作説明 */}
      <div className={`controls-info ${isExploring ? 'visible' : ''}`}>
        {isMoving
          ? 'W/A/S/D: 移動／ ESC or 「移動中」: 終了　|　建物に近づくと店舗情報が表示'
          : 'マウスドラッグ: 視点回転　|　建物にホバー: 店舗情報を見る'
        }
      </div>

      {/* 移動中のエリア表示 */}
      {isMoving && currentAreaData && (
        <div className="area-enter-notice" style={{ borderColor: currentAreaData.color }} id="area-enter-notice">
          <span className="area-enter-emoji">{currentAreaData.emoji}</span>
          <div>
            <div className="area-enter-name">{currentAreaData.label}</div>
            <div className="area-enter-subname">{currentAreaData.name}</div>
          </div>
        </div>
      )}

      {/* モバイルコントロール */}
      {isMoving && <MobileControls onKey={handleMobileKey} />}

      {/* チャットパネル */}
      {isExploring && showChat && (
        <div className="chat-panel" id="chat-panel">
          <div className="chat-header">
            <span>💬 みんなのチャット</span>
            {connected
              ? <span className="chat-connected">● 接続中</span>
              : <span className="chat-offline">○ オフライン</span>
            }
          </div>
          <div className="chat-messages" id="chat-messages">
            {chatMessages.length === 0 && (
              <div className="chat-empty">まだメッセージがありません</div>
            )}
            {chatMessages.map(msg => (
              <div key={msg.id} className="chat-msg">
                <span className="chat-msg-name" style={{ color: msg.playerColor }}>{msg.playerName}</span>
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
                e.stopPropagation()
                if (e.key === 'Enter') handleSendChat()
              }}
            />
            <button id="chat-send-btn" className="chat-send-btn" onClick={handleSendChat}>送信</button>
          </div>
        </div>
      )}

      {/* プレイヤー一覧 */}
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

      {/* ===== 売買システム ===== */}

      {/* 店舗パネル（ShopModal） */}
      {openShop && (
        <ShopModal
          shop={openShop}
          onClose={() => setOpenShop(null)}
          onAddToCart={item => {
            handleAddToCart(item)
            setShowCart(true)
          }}
        />
      )}

      {/* カートフローティングボタン（探索中のみ） */}
      {isExploring && !openShop && (
        <CartFab
          count={cartCount}
          onClick={() => { setShowCart(prev => !prev); setOpenShop(null) }}
        />
      )}

      {/* カートパネル */}
      {showCart && !openShop && (
        <CartPanel
          items={cartItems}
          onUpdateQty={handleUpdateQty}
          onRemove={handleRemoveFromCart}
          onCheckout={handleCheckout}
          onClose={() => setShowCart(false)}
        />
      )}

      {/* 決済モーダル */}
      {showCheckout && (
        <CheckoutModal
          items={cartItems}
          total={cartTotal}
          onClose={() => setShowCheckout(false)}
        />
      )}

      {/* 移動中の近接店舗カード（非ブロッキング） */}
      {isMoving && proximityShop && !openShop && (
        <div className="proximity-shop-card" id="proximity-shop-card">
          <button className="proximity-shop-close" onClick={() => setProximityShop(null)}>✕</button>
          <div className="proximity-shop-header">
            <span className="proximity-shop-emoji">{proximityShop.owner?.avatar ?? '🏪'}</span>
            <div>
              <div className="proximity-shop-name">{proximityShop.name}</div>
              <div className="proximity-shop-area" style={{ color: proximityShop.areaColor }}>
                {proximityShop.areaEmoji} {proximityShop.areaLabel}
              </div>
            </div>
          </div>
          <p className="proximity-shop-tagline">{proximityShop.tagline}</p>
          {proximityShop.products.length > 0 && (
            <div className="proximity-shop-products">
              {proximityShop.products.slice(0, 3).map(p => (
                <div key={p.id} className="proximity-product-item">
                  <span className="proximity-product-emoji">{p.imageEmoji}</span>
                  <span className="proximity-product-name">{p.name}</span>
                  <span className="proximity-product-price">¥{p.price.toLocaleString()}</span>
                </div>
              ))}
              {proximityShop.products.length > 3 && (
                <div className="proximity-product-more">他 {proximityShop.products.length - 3} 点</div>
              )}
            </div>
          )}
          <button
            className="proximity-shop-detail-btn"
            onClick={() => { setOpenShop(proximityShop); setProximityShop(null) }}
          >
            詳しく見る →
          </button>
        </div>
      )}
    </>
  )
}

/* ===========================
   ルーター統合ラッパー
   =========================== */
function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 運営管理者パネル */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/panel" element={<AdminPanel />} />
        {/* オーナーポータル系 */}
        <Route path="/owner" element={<OwnerPortal />} />
        <Route path="/owner/login" element={<OwnerLogin />} />
        <Route path="/owner/register" element={<OwnerRegister />} />
        <Route path="/owner/dashboard" element={<OwnerDashboard />} />
        <Route path="/owner/shop/edit" element={<ShopEditor />} />
        <Route path="/owner/products/new" element={<ProductEditor />} />
        <Route path="/owner/products/edit/:id" element={<ProductEditor />} />
        {/* メインワールド */}
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
