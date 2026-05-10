/**
 * AdminPanel.tsx
 * 運営管理パネル — 出店者管理・招待コード発行
 */
import { useState, useEffect, useCallback } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  isAdminLoggedIn,
  adminLogout,
  getAllInviteCodes,
  issueInviteCode,
  revokeInviteCode,
  changeAdminPassword,
  type InviteCode,
} from '../data/adminStore'
import {
  getAllOwners,
  getManagedShopByOwner,
  getAllManagedShops,
  approveOwner,
  suspendOwner,
  assignBuildingIndex,
  type OwnerAccount,
  type ManagedShop,
} from '../data/ownerStore'

/* ========================
   ステータスバッジ
   ======================== */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    invited:   { label: '✅ 招待済み',   cls: 'badge-invited' },
    pending:   { label: '⏳ 審査待ち',   cls: 'badge-pending' },
    approved:  { label: '✅ 承認済み',   cls: 'badge-approved' },
    suspended: { label: '🚫 停止中',     cls: 'badge-suspended' },
  }
  const b = map[status] ?? { label: status, cls: '' }
  return <span className={`admin-badge ${b.cls}`}>{b.label}</span>
}

/* ========================
   招待コードカード
   ======================== */
function InviteCodeCard({ invite, onRevoke }: { invite: InviteCode; onRevoke: () => void }) {
  const [copied, setCopied] = useState(false)

  const isExpired = invite.expiresAt ? invite.expiresAt < new Date().toISOString() : false
  const isUsed = invite.usedAt !== null
  const isRevoked = invite.isRevoked
  const isActive = !isExpired && !isUsed && !isRevoked

  const handleCopy = () => {
    const url = `${window.location.origin}/owner/register?invite=${invite.code}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className={`invite-card ${!isActive ? 'invite-card-inactive' : ''}`}>
      <div className="invite-card-top">
        <div className="invite-code-text">{invite.code}</div>
        <div className="invite-card-badges">
          {isRevoked && <span className="admin-badge badge-suspended">無効化</span>}
          {isUsed && <span className="admin-badge badge-approved">使用済み</span>}
          {isExpired && !isUsed && !isRevoked && <span className="admin-badge badge-pending">期限切れ</span>}
          {isActive && <span className="admin-badge badge-invited">有効</span>}
        </div>
      </div>
      <div className="invite-card-meta">
        <span>📝 {invite.note || '（メモなし）'}</span>
        {invite.email && <span>📧 {invite.email}</span>}
        {invite.expiresAt && (
          <span>⏰ {new Date(invite.expiresAt).toLocaleDateString('ja-JP')}まで</span>
        )}
        <span>🗓 {new Date(invite.createdAt).toLocaleDateString('ja-JP')}発行</span>
      </div>
      {isActive && (
        <div className="invite-card-actions">
          <button
            id={`copy-invite-${invite.code}`}
            className="invite-action-btn invite-btn-copy"
            onClick={handleCopy}
          >
            {copied ? '✅ コピー済み' : '🔗 招待リンクをコピー'}
          </button>
          <button
            id={`revoke-invite-${invite.code}`}
            className="invite-action-btn invite-btn-revoke"
            onClick={onRevoke}
          >
            無効化
          </button>
        </div>
      )}
    </div>
  )
}

/* ========================
   メインパネル
   ======================== */
export default function AdminPanel() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'owners' | 'invites' | 'worlds' | 'settings'>('owners')
  const [owners, setOwners] = useState<OwnerAccount[]>([])
  const [invites, setInvites] = useState<InviteCode[]>([])
  const [managedShops, setManagedShops] = useState<ManagedShop[]>([])

  // 招待コード発行フォーム
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteNote, setInviteNote] = useState('')
  const [inviteExpireDays, setInviteExpireDays] = useState<number | null>(30)
  const [issueMsg, setIssueMsg] = useState('')
  const [newlyIssued, setNewlyIssued] = useState<InviteCode | null>(null)
  const [issuedCopied, setIssuedCopied] = useState(false)

  // パスワード変更フォーム
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwNew2, setPwNew2] = useState('')
  const [pwMsg, setPwMsg] = useState('')

  // 承認モーダル
  const [actionTarget, setActionTarget] = useState<{ id: string; name: string; action: 'approve' | 'suspend' } | null>(null)
  const [actionNote, setActionNote] = useState('')

  if (!isAdminLoggedIn()) {
    return <Navigate to="/admin" replace />
  }

  const reload = useCallback(() => {
    setOwners(getAllOwners())
    setInvites(getAllInviteCodes().reverse()) // 新しい順
    setManagedShops(getAllManagedShops())
  }, [])

  useEffect(() => { reload() }, [reload])

  const handleIssue = (e: React.FormEvent) => {
    e.preventDefault()
    const invite = issueInviteCode(
      inviteEmail.trim() || null,
      inviteNote.trim() || '（メモなし）',
      inviteExpireDays,
    )
    setNewlyIssued(invite)
    setIssueMsg('')
    setInviteEmail('')
    setInviteNote('')
    reload()
  }

  const handleCopyNewInvite = () => {
    if (!newlyIssued) return
    const url = `${window.location.origin}/owner/register?invite=${newlyIssued.code}`
    navigator.clipboard.writeText(url).then(() => {
      setIssuedCopied(true)
      setTimeout(() => setIssuedCopied(false), 2500)
    })
  }

  const handleRevoke = (code: string) => {
    if (confirm(`招待コード「${code}」を無効化しますか？`)) {
      revokeInviteCode(code)
      reload()
    }
  }

  const handleOwnerAction = (id: string, name: string, action: 'approve' | 'suspend') => {
    setActionTarget({ id, name, action })
    setActionNote('')
  }

  const confirmOwnerAction = () => {
    if (!actionTarget) return
    if (actionTarget.action === 'approve') {
      approveOwner(actionTarget.id, actionNote || undefined)
    } else {
      suspendOwner(actionTarget.id, actionNote || undefined)
    }
    setActionTarget(null)
    reload()
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwNew !== pwNew2) {
      setPwMsg('❌ 新しいパスワードが一致しません')
      return
    }
    const result = await changeAdminPassword(pwCurrent, pwNew)
    if (result.ok) {
      setPwMsg('✅ パスワードを変更しました')
      setPwCurrent(''); setPwNew(''); setPwNew2('')
    } else {
      setPwMsg(`❌ ${result.error}`)
    }
  }

  const pendingCount = owners.filter(o => o.approvalStatus === 'pending').length
  const activeInviteCount = invites.filter(i =>
    !i.isRevoked && !i.usedAt && (!i.expiresAt || i.expiresAt > new Date().toISOString())
  ).length
  // 承認済みで棟未割り当ての店舗数
  const unassignedCount = managedShops.filter(s => s.status === 'approved' && s.buildingIndex === null).length

  return (
    <div className="admin-panel-page">
      {/* サイドバー */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo">🏯</div>
          <div>
            <div className="admin-sidebar-title">運営管理</div>
            <div className="admin-sidebar-sub">メタNAGA屋</div>
          </div>
        </div>

        <nav className="admin-nav">
          <button
            id="admin-tab-owners"
            className={`admin-nav-item ${tab === 'owners' ? 'active' : ''}`}
            onClick={() => setTab('owners')}
          >
            <span className="admin-nav-icon">👥</span>
            <span>出店者管理</span>
            {pendingCount > 0 && <span className="admin-nav-badge">{pendingCount}</span>}
          </button>
          <button
            id="admin-tab-invites"
            className={`admin-nav-item ${tab === 'invites' ? 'active' : ''}`}
            onClick={() => setTab('invites')}
          >
            <span className="admin-nav-icon">🎟</span>
            <span>招待コード</span>
            {activeInviteCount > 0 && <span className="admin-nav-badge admin-nav-badge-green">{activeInviteCount}</span>}
          </button>
          <button
            id="admin-tab-worlds"
            className={`admin-nav-item ${tab === 'worlds' ? 'active' : ''}`}
            onClick={() => setTab('worlds')}
          >
            <span className="admin-nav-icon">🗺</span>
            <span>棟配置</span>
            {unassignedCount > 0 && <span className="admin-nav-badge">{unassignedCount}</span>}
          </button>
          <button
            id="admin-tab-settings"
            className={`admin-nav-item ${tab === 'settings' ? 'active' : ''}`}
            onClick={() => setTab('settings')}
          >
            <span className="admin-nav-icon">⚙️</span>
            <span>設定</span>
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <a href="/" className="admin-nav-item">
            <span className="admin-nav-icon">🌐</span>
            <span>ワールドへ</span>
          </a>
          <button
            id="admin-logout-btn"
            className="admin-nav-item admin-logout"
            onClick={() => { adminLogout(); navigate('/admin') }}
          >
            <span className="admin-nav-icon">🚪</span>
            <span>ログアウト</span>
          </button>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="admin-main">

        {/* ===== 出店者管理タブ ===== */}
        {tab === 'owners' && (
          <div className="admin-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">👥 出店者管理</h2>
              <p className="admin-section-sub">全出店者 {owners.length}名</p>
            </div>

            {/* 審査待ちアラート */}
            {pendingCount > 0 && (
              <div className="admin-alert admin-alert-warning">
                ⚠️ <strong>{pendingCount}名</strong>の出店者が審査待ちです。
              </div>
            )}

            {owners.length === 0 ? (
              <div className="admin-empty">
                <p>まだ登録された出店者がいません</p>
                <p className="admin-empty-sub">招待コードを発行して出店者を招待しましょう</p>
                <button
                  className="admin-btn admin-btn-primary"
                  onClick={() => setTab('invites')}
                >
                  🎟 招待コードを発行する
                </button>
              </div>
            ) : (
              <div className="admin-owner-list">
                {owners.map(owner => {
                  const shop = getManagedShopByOwner(owner.id)
                  return (
                    <div key={owner.id} className="admin-owner-card">
                      <div className="admin-owner-card-header">
                        <div className="admin-owner-avatar">
                          {owner.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="admin-owner-info">
                          <div className="admin-owner-name">{owner.name}</div>
                          <div className="admin-owner-email">{owner.email}</div>
                          <div className="admin-owner-date">
                            登録: {new Date(owner.createdAt).toLocaleDateString('ja-JP')}
                            {owner.inviteCode && ` • 招待コード: ${owner.inviteCode}`}
                          </div>
                        </div>
                        <StatusBadge status={owner.approvalStatus} />
                      </div>

                      {shop && (
                        <div className="admin-owner-shop">
                          <span className="admin-owner-shop-icon">{shop.areaEmoji || '🏪'}</span>
                          <div>
                            <div className="admin-owner-shop-name">{shop.name}</div>
                            <div className="admin-owner-shop-meta">
                              {shop.areaLabel} • 商品{shop.products.length}点
                            </div>
                          </div>
                        </div>
                      )}

                      {owner.approvalNote && (
                        <div className="admin-owner-note">💬 {owner.approvalNote}</div>
                      )}

                      <div className="admin-owner-actions">
                        {(owner.approvalStatus === 'pending') && (
                          <button
                            id={`approve-btn-${owner.id}`}
                            className="admin-btn admin-btn-approve"
                            onClick={() => handleOwnerAction(owner.id, owner.name, 'approve')}
                          >
                            ✅ 承認する
                          </button>
                        )}
                        {(owner.approvalStatus === 'approved' || owner.approvalStatus === 'invited') && (
                          <button
                            id={`suspend-btn-${owner.id}`}
                            className="admin-btn admin-btn-suspend"
                            onClick={() => handleOwnerAction(owner.id, owner.name, 'suspend')}
                          >
                            🚫 利用停止
                          </button>
                        )}
                        {owner.approvalStatus === 'suspended' && (
                          <button
                            id={`reapprove-btn-${owner.id}`}
                            className="admin-btn admin-btn-approve"
                            onClick={() => handleOwnerAction(owner.id, owner.name, 'approve')}
                          >
                            ✅ 再承認
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ===== 棟配置タブ ===== */}
        {tab === 'worlds' && (
          <div className="admin-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">🗺 棟配置管理</h2>
              <p className="admin-section-sub">承認済みオーナーの店舗を3Dワールドの棟に割り当てます</p>
            </div>

            {unassignedCount > 0 && (
              <div className="admin-alert admin-alert-warning">
                ⚠️ <strong>{unassignedCount}店舗</strong>が棟未割り当てです。下記で棟を設定してください。
              </div>
            )}

            {/* 棟マップの凡例 */}
            <div className="building-map">
              <div className="building-map-title">🏯 10棟マップ（クリックで割り当て）</div>
              <div className="building-map-grid">
                {Array.from({ length: 10 }, (_, i) => {
                  const assignedShop = managedShops.find(s => s.buildingIndex === i && s.status === 'approved')
                  const areaIdx = i % 5
                  const areaColors = ['#4A9960', '#3B7DB5', '#C05A2B', '#8B5DB5', '#B5883B']
                  const areaNames = ['一次産業', '二次産業', '三次産業', 'コミュニティ', 'エンタメ']
                  return (
                    <div
                      key={i}
                      className={`building-map-cell ${assignedShop ? 'assigned' : 'empty'}`}
                      style={{ borderColor: areaColors[areaIdx] }}
                    >
                      <div className="building-map-index">棟{i}</div>
                      <div className="building-map-area" style={{ color: areaColors[areaIdx] }}>{areaNames[areaIdx]}</div>
                      {assignedShop ? (
                        <div className="building-map-shop">
                          <span>{assignedShop.areaEmoji}</span>
                          <span className="building-map-shopname">{assignedShop.name}</span>
                        </div>
                      ) : (
                        <div className="building-map-empty">空き</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 店舗別割り当て */}
            <h3 className="admin-section-title" style={{ fontSize: '1rem', marginTop: '2rem' }}>📋 店舗一覧と棟割り当て</h3>
            {managedShops.filter(s => s.status === 'approved').length === 0 ? (
              <div className="admin-empty">
                <p>承認済みの店舗がありません</p>
                <p className="admin-empty-sub">出店者を承認してから棟を割り当てましょう</p>
              </div>
            ) : (
              <div className="admin-owner-list">
                {managedShops.filter(s => s.status === 'approved').map(shop => {
                  const owner = owners.find(o => o.id === shop.ownerId)
                  // 現在使用中の棟インデックス（自店舗以外）
                  const usedIndexes = new Set(
                    managedShops
                      .filter(s => s.status === 'approved' && s.id !== shop.id && s.buildingIndex !== null)
                      .map(s => s.buildingIndex as number)
                  )
                  return (
                    <div key={shop.id} className="admin-owner-card">
                      <div className="admin-owner-card-header">
                        <div className="admin-owner-avatar" style={{ background: '#B5883B' }}>
                          {shop.areaEmoji || '🏪'}
                        </div>
                        <div className="admin-owner-info">
                          <div className="admin-owner-name">{shop.name}</div>
                          <div className="admin-owner-email">{owner?.name ?? '不明'} • {shop.areaLabel}</div>
                          <div className="admin-owner-date">商品 {shop.products.length}点</div>
                        </div>
                        <span className={`admin-badge ${shop.buildingIndex !== null ? 'badge-approved' : 'badge-pending'}`}>
                          {shop.buildingIndex !== null ? `棟${shop.buildingIndex}` : '未割り当て'}
                        </span>
                      </div>
                      <div className="admin-building-assign">
                        <label className="admin-form-label">割り当て棟:</label>
                        <select
                          id={`building-select-${shop.id}`}
                          className="admin-form-input"
                          value={shop.buildingIndex ?? ''}
                          onChange={e => {
                            const val = e.target.value === '' ? null : Number(e.target.value)
                            const ok = assignBuildingIndex(shop.id, val)
                            if (!ok) {
                              alert('その棟は既に別の店舗が使用中です。別の棟を選んでください。')
                            } else {
                              reload()
                            }
                          }}
                        >
                          <option value="">未割り当て（ワールド非表示）</option>
                          {Array.from({ length: 10 }, (_, i) => {
                            const taken = usedIndexes.has(i)
                            const areaNames = ['一次産業', '二次産業', '三次産業', 'コミュニティ', 'エンタメ']
                            return (
                              <option key={i} value={i} disabled={taken}>
                                棟{i}（{areaNames[i % 5]}エリア）{taken ? ' — 使用中' : ''}
                              </option>
                            )
                          })}
                        </select>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ===== 招待コードタブ ===== */}
        {tab === 'invites' && (
          <div className="admin-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">🎟 招待コード管理</h2>
              <p className="admin-section-sub">招待コードで出店者にアクセスを許可します</p>
            </div>

            {/* 発行フォーム */}
            <div className="invite-issue-form">
              <h3 className="invite-issue-title">新規招待コードを発行</h3>
              <form onSubmit={handleIssue}>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">運営メモ <span className="required">必須</span></label>
                    <input
                      id="invite-note-input"
                      type="text"
                      className="admin-form-input"
                      value={inviteNote}
                      onChange={e => setInviteNote(e.target.value)}
                      placeholder="例: 田中さん用 / 一次産業エリア担当"
                      required
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">メールアドレス指定 <span className="optional">任意</span></label>
                    <input
                      id="invite-email-input"
                      type="email"
                      className="admin-form-input"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="指定しなければ誰でも使用可"
                    />
                  </div>
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">有効期限</label>
                    <select
                      id="invite-expire-select"
                      className="admin-form-input"
                      value={inviteExpireDays ?? 'none'}
                      onChange={e => setInviteExpireDays(e.target.value === 'none' ? null : Number(e.target.value))}
                    >
                      <option value={7}>7日間</option>
                      <option value={30}>30日間（推奨）</option>
                      <option value={90}>90日間</option>
                      <option value="none">無期限</option>
                    </select>
                  </div>
                </div>
                {issueMsg && <div className="admin-error-msg">{issueMsg}</div>}
                <button
                  id="issue-invite-btn"
                  type="submit"
                  className="admin-btn admin-btn-primary"
                >
                  🎟 招待コードを発行する
                </button>
              </form>
            </div>

            {/* 発行成功バナー */}
            {newlyIssued && (
              <div className="invite-success-banner">
                <div className="invite-success-title">✅ 発行完了！</div>
                <div className="invite-success-code">{newlyIssued.code}</div>
                <p className="invite-success-note">
                  以下のリンクを出店者に送ってください：
                </p>
                <div className="invite-success-url">
                  {`${window.location.origin}/owner/register?invite=${newlyIssued.code}`}
                </div>
                <button
                  id="copy-new-invite-btn"
                  className="admin-btn admin-btn-primary"
                  onClick={handleCopyNewInvite}
                >
                  {issuedCopied ? '✅ コピーしました！' : '🔗 招待リンクをコピー'}
                </button>
                <button
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setNewlyIssued(null)}
                >
                  閉じる
                </button>
              </div>
            )}

            {/* 招待コード一覧 */}
            <h3 className="invite-list-title">発行済みコード一覧 ({invites.length}件)</h3>
            {invites.length === 0 ? (
              <div className="admin-empty">
                <p>まだ招待コードが発行されていません</p>
              </div>
            ) : (
              <div className="invite-list">
                {invites.map(invite => (
                  <InviteCodeCard
                    key={invite.code}
                    invite={invite}
                    onRevoke={() => handleRevoke(invite.code)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== 設定タブ ===== */}
        {tab === 'settings' && (
          <div className="admin-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">⚙️ 設定</h2>
            </div>

            <div className="admin-settings-card">
              <h3 className="admin-settings-subtitle">🔐 管理者パスワード変更</h3>
              <form onSubmit={handleChangePassword}>
                <div className="admin-form-group">
                  <label className="admin-form-label">現在のパスワード</label>
                  <input
                    id="pw-current-input"
                    type="password"
                    className="admin-form-input"
                    value={pwCurrent}
                    onChange={e => setPwCurrent(e.target.value)}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">新しいパスワード（8文字以上）</label>
                  <input
                    id="pw-new-input"
                    type="password"
                    className="admin-form-input"
                    value={pwNew}
                    onChange={e => setPwNew(e.target.value)}
                    minLength={8}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">新しいパスワード（確認）</label>
                  <input
                    id="pw-new2-input"
                    type="password"
                    className="admin-form-input"
                    value={pwNew2}
                    onChange={e => setPwNew2(e.target.value)}
                    minLength={8}
                    required
                  />
                </div>
                {pwMsg && (
                  <div className={pwMsg.startsWith('✅') ? 'admin-success-msg' : 'admin-error-msg'}>
                    {pwMsg}
                  </div>
                )}
                <button
                  id="change-pw-btn"
                  type="submit"
                  className="admin-btn admin-btn-primary"
                >
                  パスワードを変更
                </button>
              </form>
            </div>

            <div className="admin-settings-card">
              <h3 className="admin-settings-subtitle">ℹ️ システム情報</h3>
              <div className="admin-info-table">
                <div className="admin-info-row">
                  <span>データ保存場所</span>
                  <span>ブラウザ localStorage</span>
                </div>
                <div className="admin-info-row">
                  <span>登録出店者数</span>
                  <span>{owners.length}名</span>
                </div>
                <div className="admin-info-row">
                  <span>発行済み招待コード</span>
                  <span>{invites.length}件</span>
                </div>
                <div className="admin-info-row">
                  <span>有効な招待コード</span>
                  <span>{activeInviteCount}件</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ===== 承認/停止確認モーダル ===== */}
      {actionTarget && (
        <div className="admin-modal-overlay" onClick={() => setActionTarget(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>
                {actionTarget.action === 'approve' ? '✅ 承認確認' : '🚫 利用停止確認'}
              </h3>
            </div>
            <div className="admin-modal-body">
              <p>
                <strong>{actionTarget.name}</strong> を
                {actionTarget.action === 'approve' ? '承認' : '利用停止に'}しますか？
              </p>
              <div className="admin-form-group" style={{ marginTop: '1rem' }}>
                <label className="admin-form-label">運営メモ（任意）</label>
                <input
                  id="action-note-input"
                  type="text"
                  className="admin-form-input"
                  value={actionNote}
                  onChange={e => setActionNote(e.target.value)}
                  placeholder="例: 審査通過 / ルール違反のため"
                  autoFocus
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button
                id="confirm-action-btn"
                className={`admin-btn ${actionTarget.action === 'approve' ? 'admin-btn-approve' : 'admin-btn-suspend'}`}
                onClick={confirmOwnerAction}
              >
                {actionTarget.action === 'approve' ? '✅ 承認する' : '🚫 停止する'}
              </button>
              <button
                id="cancel-action-btn"
                className="admin-btn admin-btn-secondary"
                onClick={() => setActionTarget(null)}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
