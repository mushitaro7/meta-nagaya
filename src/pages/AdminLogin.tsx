/**
 * AdminLogin.tsx
 * 運営管理者ログインページ
 */
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { adminLogin, isAdminLoggedIn } from '../data/adminStore'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAdminLoggedIn()) {
    return <Navigate to="/admin/panel" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await adminLogin(password)
    setLoading(false)
    if (result.ok) {
      navigate('/admin/panel', { replace: true })
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-login-icon">🏯</div>
          <h1 className="admin-login-title">運営管理パネル</h1>
          <p className="admin-login-sub">メタNAGA屋 — Admin</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-form-group">
            <label className="admin-form-label">管理者パスワード</label>
            <input
              id="admin-password-input"
              type="password"
              className="admin-form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="パスワードを入力"
              autoFocus
              required
            />
          </div>

          {error && <div className="admin-error-msg">⚠️ {error}</div>}

          <button
            id="admin-login-btn"
            type="submit"
            className="admin-login-btn"
            disabled={loading}
          >
            {loading ? 'ログイン中...' : '🔐 ログイン'}
          </button>
        </form>

        <div className="admin-login-note">
          <p>初期パスワード: <code>momeko2024admin</code></p>
          <p>※ ログイン後に変更できます</p>
        </div>

        <a href="/" className="admin-back-link">← ワールドに戻る</a>
      </div>
    </div>
  )
}
