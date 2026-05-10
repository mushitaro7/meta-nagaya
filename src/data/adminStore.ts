/**
 * adminStore.ts
 * 運営管理者システム - 招待コード・承認・出店者管理
 *
 * 【セキュリティ注記】
 * 現在は localStorage ベースのデモ実装です。
 * 本番では Supabase/Firebase の Row Level Security + サーバー認証に移行してください。
 */

/* ========================
   型定義
   ======================== */

export interface InviteCode {
  code: string          // 8文字英数字
  email: string | null  // null = 誰でも使用可 / メール指定 = 特定人のみ
  note: string          // 運営メモ（例：「田中さん用」）
  createdAt: string
  expiresAt: string | null  // null = 無期限
  usedAt: string | null
  usedByAccountId: string | null
  isRevoked: boolean
}

export interface AdminSession {
  loggedInAt: string
}

/* ========================
   定数
   ======================== */

// 管理者パスワード（本番環境では環境変数 + サーバー認証へ移行）
// デフォルト: "momeko2024admin" → SHA-256 ハッシュ値（参考用、使用はADMIN_PASSWORD_PLAINで行う）
const ADMIN_PASSWORD_PLAIN = 'momeko2024admin' // ← 初期パスワード（管理パネル内で変更可）

const KEYS = {
  ADMIN_SESSION: 'mn_admin_session',
  INVITE_CODES: 'mn_invite_codes',
  ADMIN_PASSWORD: 'mn_admin_password_hash',  // カスタマイズ後のハッシュ保存用
} as const

/* ========================
   ユーティリティ
   ======================== */

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str + 'mn_admin_salt_v1')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function getJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function setJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

/** ランダム招待コード生成（例: MN-A3F7K2PQ） */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 紛らわしい文字を除外
  let code = 'MN-'
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

/* ========================
   管理者認証
   ======================== */

export function getAdminSession(): AdminSession | null {
  const s = getJson<AdminSession | null>(KEYS.ADMIN_SESSION, null)
  if (!s) return null
  // セッション有効期限: 8時間
  const loginTime = new Date(s.loggedInAt).getTime()
  if (Date.now() - loginTime > 8 * 60 * 60 * 1000) {
    localStorage.removeItem(KEYS.ADMIN_SESSION)
    return null
  }
  return s
}

export function isAdminLoggedIn(): boolean {
  return getAdminSession() !== null
}

export async function adminLogin(
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  // カスタムパスワードが保存されていればそれを使用、なければデフォルト
  const storedHash = localStorage.getItem(KEYS.ADMIN_PASSWORD)
  const hash = await hashString(password)

  let valid = false
  if (storedHash) {
    valid = hash === storedHash
  } else {
    // 初回: プレーンテキストと比較（デモ用）
    valid = password === ADMIN_PASSWORD_PLAIN
  }

  if (!valid) {
    return { ok: false, error: 'パスワードが違います' }
  }
  setJson(KEYS.ADMIN_SESSION, { loggedInAt: new Date().toISOString() })
  return { ok: true }
}

export function adminLogout(): void {
  localStorage.removeItem(KEYS.ADMIN_SESSION)
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const loginResult = await adminLogin(currentPassword)
  if (!loginResult.ok) return { ok: false, error: '現在のパスワードが違います' }
  if (newPassword.length < 8) return { ok: false, error: 'パスワードは8文字以上必要です' }
  const newHash = await hashString(newPassword)
  localStorage.setItem(KEYS.ADMIN_PASSWORD, newHash)
  return { ok: true }
}

/* ========================
   招待コード操作
   ======================== */

export function getAllInviteCodes(): InviteCode[] {
  return getJson<InviteCode[]>(KEYS.INVITE_CODES, [])
}

export function getActiveInviteCodes(): InviteCode[] {
  const now = new Date().toISOString()
  return getAllInviteCodes().filter(c =>
    !c.isRevoked &&
    c.usedAt === null &&
    (c.expiresAt === null || c.expiresAt > now),
  )
}

/**
 * 招待コードを新規発行
 * @param email - 特定のメールアドレスに限定する場合に指定（nullで誰でも使用可）
 * @param note - 運営メモ
 * @param expiresInDays - 有効期限（日数）。nullで無期限
 */
export function issueInviteCode(
  email: string | null,
  note: string,
  expiresInDays: number | null = 30,
): InviteCode {
  const code = generateInviteCode()
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null

  const invite: InviteCode = {
    code,
    email,
    note,
    createdAt: new Date().toISOString(),
    expiresAt,
    usedAt: null,
    usedByAccountId: null,
    isRevoked: false,
  }
  const codes = getAllInviteCodes()
  codes.push(invite)
  setJson(KEYS.INVITE_CODES, codes)
  return invite
}

/** 招待コードを無効化 */
export function revokeInviteCode(code: string): boolean {
  const codes = getAllInviteCodes()
  const idx = codes.findIndex(c => c.code === code)
  if (idx === -1) return false
  codes[idx].isRevoked = true
  setJson(KEYS.INVITE_CODES, codes)
  return true
}

/**
 * 招待コードを検証（出店者登録時に呼ぶ）
 * @returns null = 有効, string = エラーメッセージ
 */
export function validateInviteCode(
  code: string,
  email: string,
): string | null {
  const trimmed = code.trim().toUpperCase()
  const invite = getAllInviteCodes().find(c => c.code === trimmed)

  if (!invite) return '招待コードが見つかりません'
  if (invite.isRevoked) return 'この招待コードは無効化されています'
  if (invite.usedAt !== null) return 'この招待コードは既に使用されています'
  if (invite.expiresAt && invite.expiresAt < new Date().toISOString()) {
    return 'この招待コードの有効期限が切れています'
  }
  if (invite.email && invite.email.toLowerCase() !== email.toLowerCase()) {
    return 'この招待コードは別のメールアドレス宛てです'
  }
  return null // OK
}

/** 招待コードを「使用済み」にマーク（出店者登録完了時に呼ぶ） */
export function consumeInviteCode(code: string, accountId: string): void {
  const codes = getAllInviteCodes()
  const idx = codes.findIndex(c => c.code === code.trim().toUpperCase())
  if (idx !== -1) {
    codes[idx].usedAt = new Date().toISOString()
    codes[idx].usedByAccountId = accountId
    setJson(KEYS.INVITE_CODES, codes)
  }
}
