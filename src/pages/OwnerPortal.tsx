/**
 * OwnerPortal.tsx
 * オーナーポータル入口ページ
 */
import { Link, Navigate } from 'react-router-dom'
import { useOwnerAuth } from '../hooks/useOwnerAuth'

export default function OwnerPortal() {
  const { isLoggedIn, loading } = useOwnerAuth()

  if (loading) return <div className="owner-loading">読み込み中...</div>
  if (isLoggedIn) return <Navigate to="/owner/dashboard" replace />

  return (
    <div className="owner-portal">
      {/* 背景装飾 */}
      <div className="owner-portal-bg">
        <div className="owner-portal-lantern">🏮</div>
        <div className="owner-portal-lantern">🏮</div>
      </div>

      <div className="owner-portal-card">
        {/* ロゴ */}
        <div className="owner-portal-logo">
          <span className="owner-portal-logo-emoji">🏘️</span>
          <div>
            <div className="owner-portal-logo-title">メタ長屋</div>
            <div className="owner-portal-logo-sub">出店者ポータル</div>
          </div>
        </div>

        <p className="owner-portal-desc">
          あなたのお店を<strong>メタ長屋</strong>に出店しませんか？<br />
          商品管理・在庫管理・SNS連携まで、かんたんに設定できます。
        </p>

        <div className="owner-portal-features">
          <div className="owner-feature-item">
            <span className="owner-feature-icon">🛒</span>
            <div>
              <div className="owner-feature-title">商品管理</div>
              <div className="owner-feature-desc">商品の追加・編集・在庫管理</div>
            </div>
          </div>
          <div className="owner-feature-item">
            <span className="owner-feature-icon">👤</span>
            <div>
              <div className="owner-feature-title">プロフィール設定</div>
              <div className="owner-feature-desc">店舗情報・SNSリンク編集</div>
            </div>
          </div>
          <div className="owner-feature-item">
            <span className="owner-feature-icon">📊</span>
            <div>
              <div className="owner-feature-title">ダッシュボード</div>
              <div className="owner-feature-desc">売上・在庫・訪問者確認</div>
            </div>
          </div>
        </div>

        <div className="owner-portal-actions">
          <Link to="/owner/login" className="owner-btn owner-btn--primary">
            🔑 ログイン
          </Link>
          <Link to="/owner/register" className="owner-btn owner-btn--outline">
            ✨ 新規出店申請
          </Link>
        </div>

        <Link to="/" className="owner-portal-back">
          ← メタ長屋に戻る
        </Link>
      </div>
    </div>
  )
}
