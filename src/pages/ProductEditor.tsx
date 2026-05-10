/**
 * ProductEditor.tsx
 * 商品追加・編集ページ
 */
import { useState, useEffect } from 'react'
import { Link, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom'
import { useOwnerAuth } from '../hooks/useOwnerAuth'
import {
  type ManagedShop,
  getManagedShopByOwner,
  addProduct,
  updateProduct,
} from '../data/ownerStore'
import type { Product } from '../data/shops'

const CATEGORIES = ['野菜', '果物', '魚介', '穀物', '肉類', '発酵食品', '加工食品', '漬物',
  '木工', '革細工', '竹工', '陶芸', '手工芸', 'アパレル', 'グッズ',
  '体験', '定期便', 'ギフト', 'ドリンク', 'スイーツ', 'その他']

const EMOJI_OPTIONS = [
  '🍅', '🥬', '🌾', '🐟', '🐠', '🍜', '🥒', '🎁', '🥕', '📦',
  '🌱', '🎍', '🍵', '🔑', '🥢', '👕', '👜', '🗝️', '🎂', '☕',
  '🍎', '🍊', '🍇', '🥩', '🧀', '🍄', '🌽', '🫐', '🎨', '🏺',
  '📿', '🧶', '🪡', '🎯', '🎮', '📚', '🎵', '🌸', '🍡', '🍰',
]

const COLOR_OPTIONS = [
  '#FF6B6B', '#FF9F43', '#FECA57', '#48DBFB', '#1DD1A1',
  '#54A0FF', '#5F27CD', '#C8D6E5', '#FF9FF3', '#00D2D3',
  '#A29BFE', '#FD79A8', '#FDCB6E', '#55EFC4', '#74B9FF',
  '#6C5CE7', '#FAD961', '#F17C67', '#2ECC71', '#E17055',
]

interface FormData {
  name: string
  description: string
  price: string
  category: string
  stock: string
  unit: string
  imageEmoji: string
  imageColor: string
  isAvailable: boolean
  tags: string
}

export default function ProductEditor() {
  const { account, isLoggedIn, loading } = useOwnerAuth()
  const navigate = useNavigate()
  const { id: productId } = useParams<{ id: string }>()
  const location = useLocation()
  const isEdit = Boolean(productId)

  const [shop, setShop] = useState<ManagedShop | null>(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<FormData>({
    name: '', description: '', price: '', category: '野菜',
    stock: '10', unit: '個', imageEmoji: '🍅', imageColor: '#FF6B6B',
    isAvailable: true, tags: '',
  })

  useEffect(() => {
    if (!account) return
    const s = getManagedShopByOwner(account.id)
    setShop(s)

    if (isEdit && s && productId) {
      const product = s.products.find(p => p.id === productId)
      if (product) {
        setForm({
          name: product.name,
          description: product.description,
          price: String(product.price),
          category: product.category,
          stock: String(product.stock),
          unit: product.unit ?? '個',
          imageEmoji: product.imageEmoji,
          imageColor: product.imageColor,
          isAvailable: product.isAvailable,
          tags: product.tags?.join(', ') ?? '',
        })
      }
    }
  }, [account, isEdit, productId, location])

  if (loading) return <div className="owner-loading">読み込み中...</div>
  if (!isLoggedIn) return <Navigate to="/owner/login" replace />

  const update = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!shop) return
    if (!form.name || !form.description || !form.price) {
      setError('商品名・説明・価格は必須です')
      return
    }
    const price = parseInt(form.price, 10)
    if (isNaN(price) || price < 0) {
      setError('価格を正しく入力してください')
      return
    }
    const stock = parseInt(form.stock, 10)
    const tags = form.tags
      ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
      : []

    const productData: Omit<Product, 'id'> = {
      name: form.name,
      description: form.description,
      price,
      category: form.category,
      stock: isNaN(stock) ? 0 : stock,
      unit: form.unit || undefined,
      imageEmoji: form.imageEmoji,
      imageColor: form.imageColor,
      isAvailable: form.isAvailable,
      tags: tags.length > 0 ? tags : undefined,
    }

    let updated: ManagedShop | null = null
    if (isEdit && productId) {
      updated = updateProduct(shop.id, productId, productData)
    } else {
      updated = addProduct(shop.id, productData)
    }

    setShop(updated)
    setSaved(true)
    setTimeout(() => {
      navigate('/owner/dashboard')
    }, 1000)
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
          <Link to="/owner/shop/edit" className="owner-nav-item">🏪 店舗情報編集</Link>
          <Link to="/owner/products/new" className={`owner-nav-item ${!isEdit ? 'owner-nav-item--active' : ''}`}>
            ➕ 商品追加
          </Link>
          <Link to="/" className="owner-nav-item">🌏 ワールドへ戻る</Link>
        </nav>
        <div className="owner-sidebar-account">
          <div className="owner-sidebar-avatar">{shop?.owner.avatar ?? '👤'}</div>
          <div>
            <div className="owner-sidebar-name">{account?.name}</div>
            <div className="owner-sidebar-email">{account?.email}</div>
          </div>
        </div>
      </aside>

      <main className="owner-main">
        <div className="owner-page-header">
          <div>
            <h1 className="owner-page-title">{isEdit ? '商品を編集' : '商品を追加'}</h1>
            <p className="owner-page-subtitle">
              {isEdit ? '商品情報を更新してください' : '新しい商品を登録してください'}
            </p>
          </div>
          {saved && <div className="owner-save-toast">✅ {isEdit ? '更新' : '追加'}しました！</div>}
        </div>

        {error && <div className="owner-auth-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit} className="owner-editor-form">
          {/* プレビュー */}
          <div className="owner-editor-section">
            <h2 className="owner-editor-section-title">👁️ プレビュー</h2>
            <div className="owner-product-preview">
              <div
                className="owner-product-preview-img"
                style={{ background: `linear-gradient(135deg, ${form.imageColor}22, ${form.imageColor}55)` }}
              >
                <span className="owner-product-preview-emoji">{form.imageEmoji}</span>
              </div>
              <div className="owner-product-preview-info">
                <div className="owner-product-preview-cat">{form.category}</div>
                <div className="owner-product-preview-name">{form.name || '商品名'}</div>
                <div className="owner-product-preview-desc">
                  {form.description || '商品の説明'}
                </div>
                <div className="owner-product-preview-price">
                  ¥{form.price ? parseInt(form.price || '0').toLocaleString() : '0'}
                  {form.unit && <span>/{form.unit}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* 絵文字・カラー */}
          <div className="owner-editor-section">
            <h2 className="owner-editor-section-title">🎨 商品イメージ</h2>
            <div className="owner-field">
              <label className="owner-field-label">絵文字アイコン</label>
              <div className="owner-emoji-grid">
                {EMOJI_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    className={`owner-emoji-btn ${form.imageEmoji === emoji ? 'owner-emoji-btn--selected' : ''}`}
                    onClick={() => setForm(f => ({ ...f, imageEmoji: emoji }))}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="owner-field">
              <label className="owner-field-label">背景カラー</label>
              <div className="owner-color-grid">
                {COLOR_OPTIONS.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`owner-color-btn ${form.imageColor === color ? 'owner-color-btn--selected' : ''}`}
                    style={{ background: color }}
                    onClick={() => setForm(f => ({ ...f, imageColor: color }))}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 基本情報 */}
          <div className="owner-editor-section">
            <h2 className="owner-editor-section-title">📦 商品基本情報</h2>

            <div className="owner-field-row">
              <div className="owner-field owner-field--flex">
                <label className="owner-field-label">
                  商品名<span className="owner-required">*</span>
                </label>
                <input
                  type="text"
                  className="owner-field-input"
                  value={form.name}
                  onChange={update('name')}
                  placeholder="例：朝採りトマト詰め合わせ"
                  required
                />
              </div>

              <div className="owner-field owner-field--flex">
                <label className="owner-field-label">カテゴリ</label>
                <select className="owner-field-input" value={form.category} onChange={update('category')}>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="owner-field">
              <label className="owner-field-label">
                商品説明<span className="owner-required">*</span>
              </label>
              <textarea
                className="owner-field-textarea"
                value={form.description}
                onChange={update('description')}
                rows={3}
                placeholder="商品の特徴・こだわりポイントを書いてください"
                maxLength={120}
                required
              />
              <div className="owner-field-count">{form.description.length}/120</div>
            </div>

            <div className="owner-field-row">
              <div className="owner-field owner-field--flex">
                <label className="owner-field-label">
                  価格（円）<span className="owner-required">*</span>
                </label>
                <input
                  type="number"
                  className="owner-field-input"
                  value={form.price}
                  onChange={update('price')}
                  placeholder="980"
                  min="0"
                  required
                />
              </div>

              <div className="owner-field owner-field--flex">
                <label className="owner-field-label">単位</label>
                <input
                  type="text"
                  className="owner-field-input"
                  value={form.unit}
                  onChange={update('unit')}
                  placeholder="例：個、kg、セット、袋"
                />
              </div>

              <div className="owner-field owner-field--flex">
                <label className="owner-field-label">在庫数</label>
                <input
                  type="number"
                  className="owner-field-input"
                  value={form.stock}
                  onChange={update('stock')}
                  placeholder="10"
                  min="0"
                />
              </div>
            </div>

            <div className="owner-field">
              <label className="owner-field-label">タグ（カンマ区切り）</label>
              <input
                type="text"
                className="owner-field-input"
                value={form.tags}
                onChange={update('tags')}
                placeholder="例：無農薬, 朝採り, 長野産"
              />
            </div>

            <div className="owner-field">
              <label className="owner-field-label">公開設定</label>
              <div className="owner-toggle-row">
                <button
                  type="button"
                  className={`owner-toggle-chip ${form.isAvailable ? 'owner-toggle-chip--on' : ''}`}
                  onClick={() => setForm(f => ({ ...f, isAvailable: true }))}
                >
                  🟢 公開
                </button>
                <button
                  type="button"
                  className={`owner-toggle-chip ${!form.isAvailable ? 'owner-toggle-chip--off' : ''}`}
                  onClick={() => setForm(f => ({ ...f, isAvailable: false }))}
                >
                  🔴 非公開
                </button>
              </div>
            </div>
          </div>

          {/* 保存ボタン */}
          <div className="owner-form-actions">
            <Link to="/owner/dashboard" className="owner-btn owner-btn--ghost">
              ← ダッシュボードへ
            </Link>
            <button type="submit" className="owner-btn owner-btn--primary">
              {isEdit ? '💾 更新する' : '➕ 商品を追加する'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
