/**
 * OwnerLogin.tsx
 * オーナーログインページ
 */
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useOwnerAuth } from '../hooks/useOwnerAuth'

export default function OwnerLogin() {
  const { isLoggedIn, loading, error, login, clearError } = useOwnerAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPass, setShowPass] = useState(false)

  if (loading) return <div className="owner-loading">読み込み中...</div>
  if (isLoggedIn) return <Navigate to="/owner/dashboard" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setSubmitting(true)
    const ok = await login(email, password)
    setSubmitting(false)
    if (ok) navigate('/owner/dashboard')
  }

  return (
    <div className="owner-auth-page">
      <div className="owner-auth-card">
        {/* ヘッダー */}
        <div className="owner-auth-header">
          <Link to="/owner" className="owner-auth-logo">
            <span>🏘️</span>
            <span>メタ長屋 出店者ポータル</span>
          </Link>
          <h1 className="owner-auth-title">ログイン</h1>
        </div>

        {/* エラー */}
        {error && (
          <div className="owner-auth-error">
            ⚠️ {error}
          </div>
        )}

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="owner-auth-form">
          <div className="owner-field">
            <label className="owner-field-label" htmlFor="login-email">
              メールアドレス
            </label>
            <input
              id="login-email"
              type="email"
              className="owner-field-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="owner-field">
            <label className="owner-field-label" htmlFor="login-password">
              パスワード
            </label>
            <div className="owner-field-password-wrap">
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                className="owner-field-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="パスワード"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="owner-field-eye"
                onClick={() => setShowPass(v => !v)}
                tabIndex={-1}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="owner-btn owner-btn--primary owner-btn--full"
            disabled={submitting}
          >
            {submitting ? '⏳ ログイン中...' : '🔑 ログイン'}
          </button>
        </form>

        <div className="owner-auth-footer">
          <span>まだ登録していませんか？</span>
          <Link to="/owner/register" className="owner-auth-link">
            新規出店申請 →
          </Link>
        </div>

        <Link to="/" className="owner-portal-back">
          ← メタ長屋に戻る
        </Link>
      </div>
    </div>
  )
}
