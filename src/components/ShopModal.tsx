/**
 * 店舗パネル（ShopModal）
 * 長屋クリック時に右からスライドして表示される
 * タブ: 🏪 商品一覧 / 👤 プロフィール
 */
import { useState } from 'react'
import type { Shop, Product } from '../data/shops'

/* ===========================
   カートアイテム型（外部公開）
   =========================== */
export interface CartItem {
  product: Product
  shop: Shop
  quantity: number
}

/* ===========================
   商品カード
   =========================== */
interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
}

function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    if (!product.isAvailable || product.stock === 0) return
    onAddToCart(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className={`product-card ${!product.isAvailable || product.stock === 0 ? 'product-card--sold' : ''}`}>
      {/* 商品イメージ */}
      <div
        className="product-card-img"
        style={{ background: `linear-gradient(135deg, ${product.imageColor}22, ${product.imageColor}55)` }}
      >
        <span className="product-card-emoji">{product.imageEmoji}</span>
        {product.stock > 0 && product.stock <= 5 && (
          <span className="product-card-stock-badge">残{product.stock}{product.unit ?? '個'}</span>
        )}
      </div>

      {/* 商品情報 */}
      <div className="product-card-info">
        <div className="product-card-category">{product.category}</div>
        <div className="product-card-name">{product.name}</div>
        <div className="product-card-desc">{product.description}</div>

        {/* タグ */}
        {product.tags && product.tags.length > 0 && (
          <div className="product-card-tags">
            {product.tags.map(tag => (
              <span key={tag} className="product-tag">#{tag}</span>
            ))}
          </div>
        )}

        {/* 価格 + 購入ボタン */}
        <div className="product-card-footer">
          <div className="product-card-price">
            <span className="product-price-yen">¥</span>
            <span className="product-price-num">{product.price.toLocaleString()}</span>
            {product.unit && <span className="product-price-unit">/{product.unit}</span>}
          </div>

          {product.isAvailable && product.stock > 0 ? (
            <button
              className={`product-add-btn ${added ? 'product-add-btn--added' : ''}`}
              onClick={handleAdd}
            >
              {added ? '✓ 追加済み' : '🛒 カートへ'}
            </button>
          ) : (
            <span className="product-sold-out">売切れ</span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ===========================
   プロフィールタブ
   =========================== */
interface ProfileTabProps {
  shop: Shop
}

function ProfileTab({ shop }: ProfileTabProps) {
  const { owner } = shop
  return (
    <div className="profile-tab">
      {/* オーナーカード */}
      <div className="profile-owner-card">
        <div className="profile-owner-avatar">{owner.avatar}</div>
        <div className="profile-owner-info">
          <div className="profile-owner-name">{owner.name}</div>
          <div className="profile-owner-since">出店: {owner.since}</div>
          {owner.location && <div className="profile-owner-loc">📍 {owner.location}</div>}
        </div>
      </div>

      {/* 自己紹介 */}
      <div className="profile-bio">
        <div className="profile-bio-title">自己紹介</div>
        <p className="profile-bio-text">{owner.bio}</p>
      </div>

      {/* エリア説明 */}
      <div className="profile-area-card" style={{ borderColor: shop.areaColor }}>
        <div className="profile-area-emoji">{shop.areaEmoji}</div>
        <div>
          <div className="profile-area-label">{shop.areaLabel}</div>
          <div className="profile-area-tagline">{shop.tagline}</div>
        </div>
      </div>

      {/* 評価 */}
      {shop.rating && (
        <div className="profile-rating">
          <span className="profile-rating-stars">
            {'★'.repeat(Math.round(shop.rating))}{'☆'.repeat(5 - Math.round(shop.rating))}
          </span>
          <span className="profile-rating-num">{shop.rating.toFixed(1)}</span>
          <span className="profile-rating-count">（{shop.reviewCount}件のレビュー）</span>
        </div>
      )}

      {/* SNS リンク */}
      {owner.sns && (
        <div className="profile-sns">
          <div className="profile-sns-title">SNS・ウェブサイト</div>
          <div className="profile-sns-links">
            {owner.sns.twitter && (
              <a className="profile-sns-btn profile-sns-twitter" href={`https://twitter.com/${owner.sns.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                𝕏 {owner.sns.twitter}
              </a>
            )}
            {owner.sns.instagram && (
              <a className="profile-sns-btn profile-sns-ig" href={`https://instagram.com/${owner.sns.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                📷 {owner.sns.instagram}
              </a>
            )}
            {owner.sns.website && (
              <a className="profile-sns-btn profile-sns-web" href={`https://${owner.sns.website}`} target="_blank" rel="noopener noreferrer">
                🌐 {owner.sns.website}
              </a>
            )}
          </div>
        </div>
      )}

      {/* 出店申請へのリンク */}
      <div className="profile-open-shop">
        <div className="profile-open-shop-text">あなたも長屋に出店しませんか？</div>
        <button className="profile-open-shop-btn">🏪 出店申請する</button>
      </div>
    </div>
  )
}

/* ===========================
   メイン ShopModal
   =========================== */
interface ShopModalProps {
  shop: Shop
  onClose: () => void
  onAddToCart: (item: CartItem) => void
}

export default function ShopModal({ shop, onClose, onAddToCart }: ShopModalProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'profile'>('products')

  const handleAddToCart = (product: Product) => {
    onAddToCart({ product, shop, quantity: 1 })
  }

  return (
    <div className="shop-modal-overlay" id="shop-modal-overlay" onClick={onClose}>
      <div
        className="shop-modal"
        id="shop-modal"
        onClick={e => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="shop-modal-header" style={{ borderBottomColor: shop.areaColor }}>
          <div className="shop-modal-header-left">
            <span className="shop-modal-area-emoji">{shop.areaEmoji}</span>
            <div>
              <div className="shop-modal-name">{shop.name}</div>
              <div className="shop-modal-area">{shop.areaLabel}エリア</div>
            </div>
          </div>
          <div className="shop-modal-header-right">
            {shop.isOpen ? (
              <span className="shop-open-badge">OPEN</span>
            ) : (
              <span className="shop-closed-badge">準備中</span>
            )}
            <button className="shop-modal-close" id="shop-modal-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* タブ切り替え */}
        <div className="shop-modal-tabs">
          <button
            className={`shop-tab-btn ${activeTab === 'products' ? 'shop-tab-btn--active' : ''}`}
            id="tab-products"
            style={activeTab === 'products' ? { borderBottomColor: shop.areaColor, color: shop.areaColor } : {}}
            onClick={() => setActiveTab('products')}
          >
            🏪 商品一覧
          </button>
          <button
            className={`shop-tab-btn ${activeTab === 'profile' ? 'shop-tab-btn--active' : ''}`}
            id="tab-profile"
            style={activeTab === 'profile' ? { borderBottomColor: shop.areaColor, color: shop.areaColor } : {}}
            onClick={() => setActiveTab('profile')}
          >
            👤 プロフィール
          </button>
        </div>

        {/* コンテンツ */}
        <div className="shop-modal-content">
          {activeTab === 'products' ? (
            shop.isOpen && shop.products.length > 0 ? (
              <div className="product-list">
                {shop.products.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            ) : (
              <div className="shop-empty">
                <div className="shop-empty-emoji">🏗️</div>
                <div className="shop-empty-title">
                  {shop.isOpen ? '商品を準備中です' : 'ただいま準備中'}
                </div>
                <div className="shop-empty-text">
                  {shop.isOpen
                    ? 'もうすぐ商品が並びます。お楽しみに！'
                    : 'この長屋はまもなくオープン予定です。'}
                </div>
              </div>
            )
          ) : (
            <ProfileTab shop={shop} />
          )}
        </div>
      </div>
    </div>
  )
}
