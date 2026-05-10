/**
 * OwnerDashboard.tsx
 * オーナーダッシュボード
 */
import { useState, useEffect } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useOwnerAuth } from '../hooks/useOwnerAuth'
import {
  type ManagedShop,
  getManagedShopByOwner,
  updateManagedShop,
  deleteProduct,
} from '../data/ownerStore'

export default function OwnerDashboard() {
  const { account, isLoggedIn, loading, logout } = useOwnerAuth()
  const navigate = useNavigate()
  const [shop, setShop] = useState<ManagedShop | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  useEffect(() => {
    if (account) {
      setShop(getManagedShopByOwner(account.id))
    }
  }, [account])

  if (loading) return <div className="owner-loading">読み込み中...</div>
  if (!isLoggedIn) return <Navigate to="/owner/login" replace />

  const handleLogout = () => {
    logout()
    navigate('/owner')
  }

  const toggleOpen = () => {
    if (!shop) return
    const updated = updateManagedShop(shop.id, { isOpen: !shop.isOpen })
    setShop(updated)
  }

  const handleDeleteProduct = (productId: string) => {
    if (!shop) return
    const updated = deleteProduct(shop.id, productId)
    setShop(updated)
    setDeleteTarget(null)
  }

  const availableCount = shop?.products.filter(p => p.isAvailable && p.stock > 0).length ?? 0
  const soldOutCount = shop?.products.filter(p => !p.isAvailable || p.stock === 0).length ?? 0

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
          <Link to="/owner/dashboard" className="owner-nav-item owner-nav-item--active">
            📊 ダッシュボード
          </Link>
          <Link to="/owner/shop/edit" className="owner-nav-item">
            🏪 店舗情報編集
          </Link>
          <Link to="/owner/products/new" className="owner-nav-item">
            ➕ 商品追加
          </Link>
          <Link to="/" className="owner-nav-item">
            🌏 ワールドへ戻る
          </Link>
        </nav>

        <div className="owner-sidebar-account">
          <div className="owner-sidebar-avatar">
            {shop?.owner.avatar ?? '👤'}
          </div>
          <div>
            <div className="owner-sidebar-name">{account?.name}</div>
            <div className="owner-sidebar-email">{account?.email}</div>
          </div>
          <button className="owner-logout-btn" onClick={handleLogout} title="ログアウト">
            🚪
          </button>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="owner-main">
        {/* ページタイトル */}
        <div className="owner-page-header">
          <div>
            <h1 className="owner-page-title">ダッシュボード</h1>
            <p className="owner-page-subtitle">
              {shop ? `${shop.name} の管理` : '出店設定をしてください'}
            </p>
          </div>
          {shop && (
            <button
              className={`owner-toggle-btn ${shop.isOpen ? 'owner-toggle-btn--open' : 'owner-toggle-btn--closed'}`}
              onClick={toggleOpen}
            >
              {shop.isOpen ? '🟢 OPEN' : '🔴 準備中'}
              <span className="owner-toggle-hint">クリックで切替</span>
            </button>
          )}
        </div>

        {/* ショップ未作成の場合 */}
        {!shop && (
          <div className="owner-empty-state">
            <div className="owner-empty-emoji">🏪</div>
            <div className="owner-empty-title">まだ店舗が作成されていません</div>
            <div className="owner-empty-desc">出店申請から店舗を作成してください</div>
            <Link to="/owner/register" className="owner-btn owner-btn--primary">
              ✨ 出店申請する
            </Link>
          </div>
        )}

        {/* ショップ存在する場合 */}
        {shop && (
          <>
            {/* サマリーカード */}
            <div className="owner-summary-grid">
              <div className="owner-summary-card">
                <div className="owner-summary-icon">📦</div>
                <div className="owner-summary-num">{shop.products.length}</div>
                <div className="owner-summary-label">登録商品数</div>
              </div>
              <div className="owner-summary-card owner-summary-card--green">
                <div className="owner-summary-icon">✅</div>
                <div className="owner-summary-num">{availableCount}</div>
                <div className="owner-summary-label">販売中</div>
              </div>
              <div className="owner-summary-card owner-summary-card--red">
                <div className="owner-summary-icon">❌</div>
                <div className="owner-summary-num">{soldOutCount}</div>
                <div className="owner-summary-label">売切れ・非表示</div>
              </div>
              <div className="owner-summary-card owner-summary-card--purple">
                <div className="owner-summary-icon">{shop.areaEmoji}</div>
                <div className="owner-summary-num">{shop.areaLabel}</div>
                <div className="owner-summary-label">エリア</div>
              </div>
            </div>

            {/* 店舗情報カード */}
            <div className="owner-section">
              <div className="owner-section-header">
                <h2 className="owner-section-title">🏪 店舗情報</h2>
                <Link to="/owner/shop/edit" className="owner-edit-link">編集 →</Link>
              </div>
              <div className="owner-shop-preview">
                <div className="owner-shop-preview-left">
                  <div className="owner-shop-preview-emoji">{shop.areaEmoji}</div>
                  <div>
                    <div className="owner-shop-preview-name">{shop.name}</div>
                    <div className="owner-shop-preview-tagline">{shop.tagline}</div>
                    <div className="owner-shop-preview-area"
                      style={{ color: shop.areaColor }}>
                      {shop.areaLabel}エリア
                    </div>
                  </div>
                </div>
                <div
                  className={`owner-status-badge ${shop.isOpen ? 'owner-status-badge--open' : 'owner-status-badge--closed'}`}
                >
                  {shop.isOpen ? 'OPEN' : '準備中'}
                </div>
              </div>
            </div>

            {/* 商品一覧 */}
            <div className="owner-section">
              <div className="owner-section-header">
                <h2 className="owner-section-title">📦 商品管理</h2>
                <Link to="/owner/products/new" className="owner-btn owner-btn--primary owner-btn--sm">
                  ➕ 商品追加
                </Link>
              </div>

              {shop.products.length === 0 ? (
                <div className="owner-empty-products">
                  <div className="owner-empty-emoji">📭</div>
                  <div className="owner-empty-title">商品がまだありません</div>
                  <Link to="/owner/products/new" className="owner-btn owner-btn--outline">
                    最初の商品を追加する →
                  </Link>
                </div>
              ) : (
                <div className="owner-product-list">
                  {shop.products.map(product => (
                    <div key={product.id} className="owner-product-row">
                      {/* 商品イメージ */}
                      <div
                        className="owner-product-img"
                        style={{ background: `${product.imageColor}33` }}
                      >
                        {product.imageEmoji}
                      </div>

                      {/* 商品情報 */}
                      <div className="owner-product-info">
                        <div className="owner-product-name">{product.name}</div>
                        <div className="owner-product-cat">{product.category}</div>
                        <div className="owner-product-price">¥{product.price.toLocaleString()}</div>
                      </div>

                      {/* 在庫 */}
                      <div className="owner-product-stock">
                        <div
                          className={`owner-stock-badge ${
                            product.stock === 0 || !product.isAvailable
                              ? 'owner-stock-badge--zero'
                              : product.stock <= 5
                              ? 'owner-stock-badge--low'
                              : 'owner-stock-badge--ok'
                          }`}
                        >
                          {!product.isAvailable
                            ? '非公開'
                            : product.stock === 0
                            ? '売切れ'
                            : `在庫 ${product.stock}`}
                        </div>
                      </div>

                      {/* アクション */}
                      <div className="owner-product-actions">
                        <Link
                          to={`/owner/products/edit/${product.id}`}
                          state={{ shopId: shop.id }}
                          className="owner-action-btn"
                        >
                          ✏️
                        </Link>
                        <button
                          className="owner-action-btn owner-action-btn--delete"
                          onClick={() => setDeleteTarget(product.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* 削除確認モーダル */}
      {deleteTarget && (
        <div className="owner-confirm-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="owner-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="owner-confirm-icon">🗑️</div>
            <div className="owner-confirm-title">商品を削除しますか？</div>
            <div className="owner-confirm-desc">この操作は取り消せません</div>
            <div className="owner-confirm-actions">
              <button className="owner-btn owner-btn--ghost" onClick={() => setDeleteTarget(null)}>
                キャンセル
              </button>
              <button
                className="owner-btn owner-btn--danger"
                onClick={() => handleDeleteProduct(deleteTarget)}
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
