/**
 * OwnerRegister.tsx
 * 新規出店申請フォーム（ステップ式）
 * 招待コードあり → 即アクセス可， なし → 運営審査待ち
 */
import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useOwnerAuth } from '../hooks/useOwnerAuth'
import {
  createManagedShop,
  getManagedShopByOwner,
  getSession,
} from '../data/ownerStore'
import { validateInviteCode, consumeInviteCode } from '../data/adminStore'

const AREA_OPTIONS = [
  { id: 'A', label: '一次産業', emoji: '🌾', desc: '農業・水産・畜産など' },
  { id: 'B', label: '二次産業', emoji: '⚙️', desc: '手工芸・加工食品・ものづくり' },
  { id: 'C', label: '三次産業', emoji: '🛒', desc: 'セレクトショップ・配送サービス' },
  { id: 'D', label: 'コミュニティ', emoji: '💬', desc: '体験・ワークショップ・イベント' },
  { id: 'E', label: 'エンタメ', emoji: '☕', desc: 'カフェ・グッズ・デジタル' },
]

const AREA_COLORS: Record<string, string> = {
  A: '#4A9960', B: '#3B7DB5', C: '#C05A2B', D: '#8B5DB5', E: '#B5883B',
}

interface FormData {
  // アカウント
  email: string
  password: string
  passwordConfirm: string
  ownerName: string
  inviteCode: string  // 招待コード（任意）
  // 店舗情報
  shopName: string
  tagline: string
  areaId: string
  ownerBio: string
  ownerAvatar: string
  ownerLocation: string
  snsTwitter: string
  snsInstagram: string
  snsWebsite: string
}

const AVATAR_OPTIONS = ['👨‍🌾', '👩‍🌾', '👨‍🍳', '👩‍🍳', '👨‍🔧', '👩‍🔧', '🧑‍🎨', '👩‍💼', '👨‍💼', '🧑‍🤝‍🧑', '👵', '👴', '🎨', '☕', '🎀']

export default function OwnerRegister() {
  const { isLoggedIn, loading, error, register, clearError } = useOwnerAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [registered, setRegistered] = useState<'invited' | 'pending' | null>(null)

  // URLパラメータから招待コードを自動取得
  const [form, setForm] = useState<FormData>({
    email: '', password: '', passwordConfirm: '', ownerName: '',
    shopName: '', tagline: '', areaId: 'A',
    ownerBio: '', ownerAvatar: '👨‍🌾', ownerLocation: '',
    snsTwitter: '', snsInstagram: '', snsWebsite: '',
    inviteCode: searchParams.get('invite') ?? '',
  })

  if (loading) return <div className="owner-loading">読み込み中...</div>
  if (isLoggedIn) return <Navigate to="/owner/dashboard" replace />

  // 登録完了後の分岐画面
  if (registered === 'pending') {
    return (
      <div className="owner-auth-page">
        <div className="owner-auth-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⏳</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>申請が完了しました</h2>
          <p style={{ color: '#666', lineHeight: 1.7, marginBottom: '1.5rem' }}>
            出店申請を受け付けました。<br />
            <strong>運営チームの審査</strong>が完了し次第、登録メールアドレスにご連絡します。
          </p>
          <div style={{ background: '#f5f5f5', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: '#555' }}>
            📬 登録メール: <strong>{form.email}</strong>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '2rem' }}>
            招待コードがある場合は即日アクセス可能です。<br />
            招待コードは運営から送られます。
          </p>
          <a href="/" className="owner-btn owner-btn--primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
            🌐 メタ長屋に戻る
          </a>
        </div>
      </div>
    )
  }

  const update = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setFormError(null)
    clearError()
  }

  const validateStep1 = () => {
    if (!form.email || !form.password || !form.ownerName) {
      setFormError('すべての必須項目を入力してください')
      return false
    }
    if (form.password.length < 6) {
      setFormError('パスワードは6文字以上で入力してください')
      return false
    }
    if (form.password !== form.passwordConfirm) {
      setFormError('パスワードが一致しません')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!form.shopName || !form.tagline || !form.areaId) {
      setFormError('店舗名・キャッチコピー・エリアを入力してください')
      return false
    }
    return true
  }

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    setStep(s => s + 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!form.ownerBio) {
      setFormError('自己紹介を入力してください')
      return
    }

    // 招待コード検証（入力ありの場合）
    const trimmedCode = form.inviteCode.trim().toUpperCase()
    if (trimmedCode) {
      const codeError = validateInviteCode(trimmedCode, form.email)
      if (codeError) {
        setFormError(codeError)
        return
      }
    }

    setSubmitting(true)
    const ok = await register(form.email, form.password, form.ownerName, trimmedCode || null)
    if (!ok) {
      setSubmitting(false)
      return
    }
    // ショップ作成 - 登録直後にセッションを取得
    await new Promise(r => setTimeout(r, 100))
    const account = getSession()
    if (account) {
      const existingShop = getManagedShopByOwner(account.id)
      if (!existingShop) {
        const selectedArea = AREA_OPTIONS.find(a => a.id === form.areaId)!
        createManagedShop(account.id, {
          areaId: form.areaId,
          areaLabel: selectedArea.label,
          areaEmoji: selectedArea.emoji,
          name: form.shopName,
          tagline: form.tagline,
          areaColor: AREA_COLORS[form.areaId],
          isOpen: true,
          products: [],
          owner: {
            name: form.ownerName,
            avatar: form.ownerAvatar,
            bio: form.ownerBio,
            since: new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' }),
            location: form.ownerLocation || undefined,
            sns: {
              twitter: form.snsTwitter || undefined,
              instagram: form.snsInstagram || undefined,
              website: form.snsWebsite || undefined,
            },
          },
        })
      }
      // 招待コードを使用済みにマーク
      if (trimmedCode) consumeInviteCode(trimmedCode, account.id)
    }
    setSubmitting(false)
    if (trimmedCode) {
      navigate('/owner/dashboard')
    } else {
      setRegistered('pending')
    }
  }

  const displayError = formError || error

  return (
    <div className="owner-auth-page">
      <div className="owner-auth-card owner-auth-card--wide">
        {/* ヘッダー */}
        <div className="owner-auth-header">
          <Link to="/owner" className="owner-auth-logo">
            <span>🏘️</span>
            <span>メタ長屋 出店者ポータル</span>
          </Link>
          <h1 className="owner-auth-title">新規出店申請</h1>

          {/* ステップインジケーター */}
          <div className="owner-steps">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`owner-step ${step === s ? 'owner-step--active' : ''} ${step > s ? 'owner-step--done' : ''}`}
              >
                <div className="owner-step-num">{step > s ? '✓' : s}</div>
                <div className="owner-step-label">
                  {s === 1 ? 'アカウント' : s === 2 ? '店舗情報' : 'プロフィール'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {displayError && (
          <div className="owner-auth-error">⚠️ {displayError}</div>
        )}

        <form onSubmit={step === 3 ? handleSubmit : e => { e.preventDefault(); handleNext() }} className="owner-auth-form">

          {/* ===== STEP 1: アカウント情報 ===== */}
          {step === 1 && (
            <>
              <div className="owner-field">
                <label className="owner-field-label" htmlFor="reg-name">
                  お名前（店主名）<span className="owner-required">*</span>
                </label>
                <input
                  id="reg-name"
                  type="text"
                  className="owner-field-input"
                  value={form.ownerName}
                  onChange={update('ownerName')}
                  placeholder="例：田中 一郎"
                  required
                />
              </div>

              <div className="owner-field">
                <label className="owner-field-label" htmlFor="reg-email">
                  メールアドレス<span className="owner-required">*</span>
                </label>
                <input
                  id="reg-email"
                  type="email"
                  className="owner-field-input"
                  value={form.email}
                  onChange={update('email')}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                />
              </div>

              {/* 招待コード入力欄 */}
              <div className="owner-field">
                <label className="owner-field-label" htmlFor="reg-invite">
                  招待コード
                  {form.inviteCode ? (
                    <span style={{ marginLeft: '0.5rem', color: '#4A9960', fontWeight: 600 }}>✅ 入力済み</span>
                  ) : (
                    <span style={{ marginLeft: '0.5rem', color: '#aaa', fontSize: '0.8em' }}>（なければ審査待ちになります）</span>
                  )}
                </label>
                <input
                  id="reg-invite"
                  type="text"
                  className="owner-field-input"
                  value={form.inviteCode}
                  onChange={e => { setForm(f => ({ ...f, inviteCode: e.target.value })); setFormError(null) }}
                  placeholder="MN-XXXXXXXX"
                  style={{ letterSpacing: '0.1em', fontFamily: 'monospace', fontSize: '1.05em' }}
                />
                {!form.inviteCode && (
                  <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.3rem' }}>
                    招待コードがない場合、申請後に運営チームの審査が必要です。
                  </p>
                )}
              </div>

              <div className="owner-field">
                <label className="owner-field-label" htmlFor="reg-password">
                  パスワード（6文字以上）<span className="owner-required">*</span>
                </label>
                <div className="owner-field-password-wrap">
                  <input
                    id="reg-password"
                    type={showPass ? 'text' : 'password'}
                    className="owner-field-input"
                    value={form.password}
                    onChange={update('password')}
                    placeholder="パスワード"
                    required
                    autoComplete="new-password"
                  />
                  <button type="button" className="owner-field-eye" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="owner-field">
                <label className="owner-field-label" htmlFor="reg-password2">
                  パスワード確認<span className="owner-required">*</span>
                </label>
                <input
                  id="reg-password2"
                  type={showPass ? 'text' : 'password'}
                  className="owner-field-input"
                  value={form.passwordConfirm}
                  onChange={update('passwordConfirm')}
                  placeholder="パスワード（再入力）"
                  required
                  autoComplete="new-password"
                />
              </div>
            </>
          )}

          {/* ===== STEP 2: 店舗情報 ===== */}
          {step === 2 && (
            <>
              <div className="owner-field">
                <label className="owner-field-label" htmlFor="reg-shopname">
                  店舗名<span className="owner-required">*</span>
                </label>
                <input
                  id="reg-shopname"
                  type="text"
                  className="owner-field-input"
                  value={form.shopName}
                  onChange={update('shopName')}
                  placeholder="例：田中農園 直売所"
                  required
                />
              </div>

              <div className="owner-field">
                <label className="owner-field-label" htmlFor="reg-tagline">
                  キャッチコピー<span className="owner-required">*</span>
                </label>
                <input
                  id="reg-tagline"
                  type="text"
                  className="owner-field-input"
                  value={form.tagline}
                  onChange={update('tagline')}
                  placeholder="例：朝採り野菜を産地直送でお届け"
                  maxLength={40}
                  required
                />
              </div>

              <div className="owner-field">
                <label className="owner-field-label">
                  出店エリア<span className="owner-required">*</span>
                </label>
                <div className="owner-area-grid">
                  {AREA_OPTIONS.map(area => (
                    <button
                      key={area.id}
                      type="button"
                      className={`owner-area-card ${form.areaId === area.id ? 'owner-area-card--selected' : ''}`}
                      style={form.areaId === area.id ? { borderColor: AREA_COLORS[area.id], background: `${AREA_COLORS[area.id]}22` } : {}}
                      onClick={() => setForm(f => ({ ...f, areaId: area.id }))}
                    >
                      <span className="owner-area-emoji">{area.emoji}</span>
                      <div className="owner-area-label">{area.label}</div>
                      <div className="owner-area-desc">{area.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ===== STEP 3: プロフィール ===== */}
          {step === 3 && (
            <>
              <div className="owner-field">
                <label className="owner-field-label">
                  アバター絵文字
                </label>
                <div className="owner-avatar-grid">
                  {AVATAR_OPTIONS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      className={`owner-avatar-btn ${form.ownerAvatar === emoji ? 'owner-avatar-btn--selected' : ''}`}
                      onClick={() => setForm(f => ({ ...f, ownerAvatar: emoji }))}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="owner-field">
                <label className="owner-field-label" htmlFor="reg-bio">
                  自己紹介<span className="owner-required">*</span>
                </label>
                <textarea
                  id="reg-bio"
                  className="owner-field-textarea"
                  value={form.ownerBio}
                  onChange={update('ownerBio')}
                  placeholder="あなたの店舗や商品への想いを書いてください"
                  rows={4}
                  maxLength={200}
                  required
                />
                <div className="owner-field-count">{form.ownerBio.length}/200</div>
              </div>

              <div className="owner-field">
                <label className="owner-field-label" htmlFor="reg-location">
                  所在地（任意）
                </label>
                <input
                  id="reg-location"
                  type="text"
                  className="owner-field-input"
                  value={form.ownerLocation}
                  onChange={update('ownerLocation')}
                  placeholder="例：長野県"
                />
              </div>

              <div className="owner-sns-group">
                <div className="owner-sns-title">SNS・ウェブサイト（任意）</div>
                <div className="owner-field owner-field--sns">
                  <span className="owner-sns-prefix">𝕏</span>
                  <input
                    type="text"
                    className="owner-field-input"
                    value={form.snsTwitter}
                    onChange={update('snsTwitter')}
                    placeholder="@your_twitter"
                  />
                </div>
                <div className="owner-field owner-field--sns">
                  <span className="owner-sns-prefix">📷</span>
                  <input
                    type="text"
                    className="owner-field-input"
                    value={form.snsInstagram}
                    onChange={update('snsInstagram')}
                    placeholder="@your_instagram"
                  />
                </div>
                <div className="owner-field owner-field--sns">
                  <span className="owner-sns-prefix">🌐</span>
                  <input
                    type="text"
                    className="owner-field-input"
                    value={form.snsWebsite}
                    onChange={update('snsWebsite')}
                    placeholder="yourwebsite.jp"
                  />
                </div>
              </div>
            </>
          )}

          {/* ボタン */}
          <div className="owner-form-actions">
            {step > 1 && (
              <button
                type="button"
                className="owner-btn owner-btn--ghost"
                onClick={() => setStep(s => s - 1)}
              >
                ← 戻る
              </button>
            )}
            <button
              type="submit"
              className="owner-btn owner-btn--primary owner-btn--flex"
              disabled={submitting}
            >
              {submitting ? '⏳ 登録中...' : step < 3 ? '次へ →' : '✨ 出店申請を完了する'}
            </button>
          </div>
        </form>

        <div className="owner-auth-footer">
          <span>既にアカウントをお持ちですか？</span>
          <Link to="/owner/login" className="owner-auth-link">ログイン →</Link>
        </div>

        <Link to="/" className="owner-portal-back">← メタ長屋に戻る</Link>
      </div>
    </div>
  )
}
