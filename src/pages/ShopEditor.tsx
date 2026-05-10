/**
 * ShopEditor.tsx
 * 店舗情報編集ページ
 */
import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useOwnerAuth } from '../hooks/useOwnerAuth'
import {
  type ManagedShop,
  getManagedShopByOwner,
  updateManagedShop,
} from '../data/ownerStore'

const AREA_OPTIONS = [
  { id: 'A', label: '一次産業', emoji: '🌾', color: '#4A9960' },
  { id: 'B', label: '二次産業', emoji: '⚙️', color: '#3B7DB5' },
  { id: 'C', label: '三次産業', emoji: '🛒', color: '#C05A2B' },
  { id: 'D', label: 'コミュニティ', emoji: '💬', color: '#8B5DB5' },
  { id: 'E', label: 'エンタメ', emoji: '☕', color: '#B5883B' },
]

const AVATAR_OPTIONS = ['👨‍🌾', '👩‍🌾', '👨‍🍳', '👩‍🍳', '👨‍🔧', '👩‍🔧', '🧑‍🎨', '👩‍💼', '👨‍💼', '🧑‍🤝‍🧑', '👵', '👴', '🎨', '☕', '🎀']

export default function ShopEditor() {
  const { account, isLoggedIn, loading } = useOwnerAuth()
  const [shop, setShop] = useState<ManagedShop | null>(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // フォーム状態
  const [shopName, setShopName] = useState('')
  const [tagline, setTagline] = useState('')
  const [areaId, setAreaId] = useState('A')
  const [ownerBio, setOwnerBio] = useState('')
  const [ownerAvatar, setOwnerAvatar] = useState('👨‍🌾')
  const [ownerLocation, setOwnerLocation] = useState('')
  const [snsTwitter, setSnsTwitter] = useState('')
  const [snsInstagram, setSnsInstagram] = useState('')
  const [snsWebsite, setSnsWebsite] = useState('')
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    if (!account) return
    const s = getManagedShopByOwner(account.id)
    if (!s) return
    setShop(s)
    setShopName(s.name)
    setTagline(s.tagline)
    setAreaId(s.areaId)
    setOwnerBio(s.owner.bio)
    setOwnerAvatar(s.owner.avatar)
    setOwnerLocation(s.owner.location ?? '')
    setSnsTwitter(s.owner.sns?.twitter ?? '')
    setSnsInstagram(s.owner.sns?.instagram ?? '')
    setSnsWebsite(s.owner.sns?.website ?? '')
    setIsOpen(s.isOpen)
  }, [account])

  if (loading) return <div className="owner-loading">読み込み中...</div>
  if (!isLoggedIn) return <Navigate to="/owner/login" replace />

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!shop) return
    if (!shopName || !tagline || !ownerBio) {
      setError('必須項目を入力してください')
      return
    }
    const selectedArea = AREA_OPTIONS.find(a => a.id === areaId)!
    const updated = updateManagedShop(shop.id, {
      name: shopName,
      tagline,
      areaId,
      areaLabel: selectedArea.label,
      areaEmoji: selectedArea.emoji,
      areaColor: selectedArea.color,
      isOpen,
      owner: {
        ...shop.owner,
        bio: ownerBio,
        avatar: ownerAvatar,
        location: ownerLocation || undefined,
        sns: {
          twitter: snsTwitter || undefined,
          instagram: snsInstagram || undefined,
          website: snsWebsite || undefined,
        },
      },
    })
    setShop(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setError(null)
  }

  return (
    <div className="owner-dashboard">
      {/* サイドバー */}
      <aside className="owner-sidebar">
        <div className="owner-sidebar-logo">
          <span>🏘️</span>
          <div>
            <div className="owner-sidebar-title">メタ長屋</div>
            <div className="owner-sidebar-sub">出店者ポータル</div>
          </div>
        </div>
        <nav className="owner-nav">
          <Link to="/owner/dashboard" className="owner-nav-item">📊 ダッシュボード</Link>
          <Link to="/owner/shop/edit" className="owner-nav-item owner-nav-item--active">🏪 店舗情報編集</Link>
          <Link to="/owner/products/new" className="owner-nav-item">➕ 商品追加</Link>
          <Link to="/" className="owner-nav-item">🌏 ワールドへ戻る</Link>
        </nav>
        <div className="owner-sidebar-account">
          <div className="owner-sidebar-avatar">{ownerAvatar}</div>
          <div>
            <div className="owner-sidebar-name">{account?.name}</div>
            <div className="owner-sidebar-email">{account?.email}</div>
          </div>
        </div>
      </aside>

      <main className="owner-main">
        <div className="owner-page-header">
          <div>
            <h1 className="owner-page-title">店舗情報編集</h1>
            <p className="owner-page-subtitle">店舗名・プロフィール・SNSを編集できます</p>
          </div>
          {saved && <div className="owner-save-toast">✅ 保存しました！</div>}
        </div>

        {error && <div className="owner-auth-error">⚠️ {error}</div>}

        {!shop ? (
          <div className="owner-empty-state">
            <div className="owner-empty-emoji">🏪</div>
            <div className="owner-empty-title">店舗が見つかりません</div>
            <Link to="/owner/register" className="owner-btn owner-btn--primary">出店申請する</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="owner-editor-form">
            {/* 店舗基本情報 */}
            <div className="owner-editor-section">
              <h2 className="owner-editor-section-title">🏪 店舗基本情報</h2>

              <div className="owner-field-row">
                <div className="owner-field owner-field--flex">
                  <label className="owner-field-label">
                    店舗名<span className="owner-required">*</span>
                  </label>
                  <input
                    type="text"
                    className="owner-field-input"
                    value={shopName}
                    onChange={e => setShopName(e.target.value)}
                    placeholder="例：田中農園 直売所"
                    required
                  />
                </div>

                <div className="owner-field owner-field--flex">
                  <label className="owner-field-label">
                    キャッチコピー<span className="owner-required">*</span>
                  </label>
                  <input
                    type="text"
                    className="owner-field-input"
                    value={tagline}
                    onChange={e => setTagline(e.target.value)}
                    placeholder="例：朝採り野菜を産地直送でお届け"
                    maxLength={40}
                    required
                  />
                </div>
              </div>

              <div className="owner-field">
                <label className="owner-field-label">エリア</label>
                <div className="owner-area-grid owner-area-grid--small">
                  {AREA_OPTIONS.map(area => (
                    <button
                      key={area.id}
                      type="button"
                      className={`owner-area-card ${areaId === area.id ? 'owner-area-card--selected' : ''}`}
                      style={areaId === area.id ? { borderColor: area.color, background: `${area.color}22` } : {}}
                      onClick={() => setAreaId(area.id)}
                    >
                      <span className="owner-area-emoji">{area.emoji}</span>
                      <div className="owner-area-label">{area.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="owner-field">
                <label className="owner-field-label">営業状態</label>
                <div className="owner-toggle-row">
                  <button
                    type="button"
                    className={`owner-toggle-chip ${isOpen ? 'owner-toggle-chip--on' : ''}`}
                    onClick={() => setIsOpen(true)}
                  >
                    🟢 OPEN
                  </button>
                  <button
                    type="button"
                    className={`owner-toggle-chip ${!isOpen ? 'owner-toggle-chip--off' : ''}`}
                    onClick={() => setIsOpen(false)}
                  >
                    🔴 準備中
                  </button>
                </div>
              </div>
            </div>

            {/* プロフィール */}
            <div className="owner-editor-section">
              <h2 className="owner-editor-section-title">👤 店主プロフィール</h2>

              <div className="owner-field">
                <label className="owner-field-label">アバター絵文字</label>
                <div className="owner-avatar-grid">
                  {AVATAR_OPTIONS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      className={`owner-avatar-btn ${ownerAvatar === emoji ? 'owner-avatar-btn--selected' : ''}`}
                      onClick={() => setOwnerAvatar(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="owner-field-row">
                <div className="owner-field owner-field--flex">
                  <label className="owner-field-label">
                    自己紹介<span className="owner-required">*</span>
                  </label>
                  <textarea
                    className="owner-field-textarea"
                    value={ownerBio}
                    onChange={e => setOwnerBio(e.target.value)}
                    rows={4}
                    maxLength={200}
                    required
                  />
                  <div className="owner-field-count">{ownerBio.length}/200</div>
                </div>

                <div className="owner-field owner-field--flex">
                  <label className="owner-field-label">所在地</label>
                  <input
                    type="text"
                    className="owner-field-input"
                    value={ownerLocation}
                    onChange={e => setOwnerLocation(e.target.value)}
                    placeholder="例：長野県"
                  />
                </div>
              </div>
            </div>

            {/* SNS */}
            <div className="owner-editor-section">
              <h2 className="owner-editor-section-title">🔗 SNS・ウェブサイト</h2>
              <div className="owner-sns-group">
                <div className="owner-field owner-field--sns">
                  <span className="owner-sns-prefix">𝕏</span>
                  <input type="text" className="owner-field-input" value={snsTwitter}
                    onChange={e => setSnsTwitter(e.target.value)} placeholder="@your_twitter" />
                </div>
                <div className="owner-field owner-field--sns">
                  <span className="owner-sns-prefix">📷</span>
                  <input type="text" className="owner-field-input" value={snsInstagram}
                    onChange={e => setSnsInstagram(e.target.value)} placeholder="@your_instagram" />
                </div>
                <div className="owner-field owner-field--sns">
                  <span className="owner-sns-prefix">🌐</span>
                  <input type="text" className="owner-field-input" value={snsWebsite}
                    onChange={e => setSnsWebsite(e.target.value)} placeholder="yourwebsite.jp" />
                </div>
              </div>
            </div>

            {/* 保存ボタン */}
            <div className="owner-form-actions">
              <Link to="/owner/dashboard" className="owner-btn owner-btn--ghost">
                ← ダッシュボードへ
              </Link>
              <button type="submit" className="owner-btn owner-btn--primary">
                💾 保存する
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}
