/**
 * ownerStore.ts
 * localStorage ベースのオーナー管理データストア
 * 将来 Supabase/Firebase に移行する際はここを差し替えるだけ
 */

import type { Shop, Product } from './shops'
export type { Shop, Product }

/* ========================
   型定義
   ======================== */

/** オーナーアカウントの承認ステータス */
export type OwnerApprovalStatus =
  | 'invited'    // 招待コードで登録済み → 即利用可
  | 'pending'    // 招待なしで申請 → 運営審査待ち
  | 'approved'   // 運営が手動承認
  | 'suspended'  // 利用停止

export interface OwnerAccount {
  id: string
  email: string
  passwordHash: string   // 簡易ハッシュ（本番はサーバー側で処理）
  name: string
  createdAt: string
  shopId: string | null
  approvalStatus: OwnerApprovalStatus
  inviteCode: string | null  // 使用した招待コード
  approvedAt: string | null  // 承認日時
  approvalNote: string | null  // 運営メモ
}

/** ダッシュボードへのアクセス可否 */
export function canAccessDashboard(account: OwnerAccount): boolean {
  return account.approvalStatus === 'invited' || account.approvalStatus === 'approved'
}

export interface ManagedShop extends Omit<Shop, 'id' | 'buildingIndex'> {
  id: string
  buildingIndex: number | null   // 承認後に割り当て
  ownerId: string
  status: 'pending' | 'approved' | 'rejected'
  appliedAt: string
  updatedAt: string
}

/* ========================
   LocalStorage キー
   ======================== */
const KEYS = {
  ACCOUNTS: 'mn_owner_accounts',
  SHOPS: 'mn_managed_shops',
  SESSION: 'mn_owner_session',
} as const

/* ========================
   ユーティリティ
   ======================== */

/** 簡易パスワードハッシュ（本番はbcrypt推奨） */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'meta_nagaya_salt_2024')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
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

/* ========================
   アカウント操作
   ======================== */

export function getAllAccounts(): OwnerAccount[] {
  return getJson<OwnerAccount[]>(KEYS.ACCOUNTS, [])
}

export function getAccountByEmail(email: string): OwnerAccount | null {
  return getAllAccounts().find(a => a.email.toLowerCase() === email.toLowerCase()) ?? null
}

export function getAccountById(id: string): OwnerAccount | null {
  return getAllAccounts().find(a => a.id === id) ?? null
}

export async function registerAccount(
  email: string,
  password: string,
  name: string,
  inviteCode: string | null = null,
): Promise<{ ok: true; account: OwnerAccount } | { ok: false; error: string }> {
  if (getAccountByEmail(email)) {
    return { ok: false, error: 'このメールアドレスは既に登録されています' }
  }
  const passwordHash = await hashPassword(password)
  // 招待コードあり → invited (即利用可), なし → pending (審査待ち)
  const approvalStatus: OwnerApprovalStatus = inviteCode ? 'invited' : 'pending'
  const account: OwnerAccount = {
    id: generateId(),
    email: email.toLowerCase(),
    passwordHash,
    name,
    createdAt: new Date().toISOString(),
    shopId: null,
    approvalStatus,
    inviteCode: inviteCode ?? null,
    approvedAt: inviteCode ? new Date().toISOString() : null,
    approvalNote: null,
  }
  const accounts = getAllAccounts()
  accounts.push(account)
  setJson(KEYS.ACCOUNTS, accounts)
  return { ok: true, account }
}

export async function loginAccount(
  email: string,
  password: string,
): Promise<{ ok: true; account: OwnerAccount } | { ok: false; error: string }> {
  const account = getAccountByEmail(email)
  if (!account) {
    return { ok: false, error: 'メールアドレスまたはパスワードが違います' }
  }
  const hash = await hashPassword(password)
  if (hash !== account.passwordHash) {
    return { ok: false, error: 'メールアドレスまたはパスワードが違います' }
  }
  setJson(KEYS.SESSION, { accountId: account.id, loggedInAt: new Date().toISOString() })
  return { ok: true, account }
}

export function logoutAccount(): void {
  localStorage.removeItem(KEYS.SESSION)
}

export function getSession(): OwnerAccount | null {
  const session = getJson<{ accountId: string } | null>(KEYS.SESSION, null)
  if (!session) return null
  return getAccountById(session.accountId)
}

/* ========================
   ショップ操作
   ======================== */

export function getAllManagedShops(): ManagedShop[] {
  return getJson<ManagedShop[]>(KEYS.SHOPS, [])
}

export function getManagedShopByOwner(ownerId: string): ManagedShop | null {
  return getAllManagedShops().find(s => s.ownerId === ownerId) ?? null
}

export function getManagedShopById(id: string): ManagedShop | null {
  return getAllManagedShops().find(s => s.id === id) ?? null
}

export function createManagedShop(
  ownerId: string,
  data: Omit<ManagedShop, 'id' | 'ownerId' | 'status' | 'appliedAt' | 'updatedAt' | 'buildingIndex'>,
): ManagedShop {
  const now = new Date().toISOString()
  // 招待コード持ちのオーナーは即 approved、そうでなければ pending
  const owner = getAccountById(ownerId)
  const shopStatus = (owner?.approvalStatus === 'invited' || owner?.approvalStatus === 'approved')
    ? 'approved'
    : 'pending'

  const shop: ManagedShop = {
    ...data,
    id: `owner-shop-${generateId()}`,
    ownerId,
    buildingIndex: null,
    status: shopStatus,
    appliedAt: now,
    updatedAt: now,
  }
  const shops = getAllManagedShops()
  shops.push(shop)
  setJson(KEYS.SHOPS, shops)

  // アカウントに shopId を紐付け
  const accounts = getAllAccounts()
  const idx = accounts.findIndex(a => a.id === ownerId)
  if (idx !== -1) {
    accounts[idx].shopId = shop.id
    setJson(KEYS.ACCOUNTS, accounts)
  }

  return shop
}

/* ========================
   運営による出店者管理
   ======================== */

/** 出店者を承認 */
export function approveOwner(accountId: string, note?: string): boolean {
  const accounts = getAllAccounts()
  const idx = accounts.findIndex(a => a.id === accountId)
  if (idx === -1) return false
  accounts[idx].approvalStatus = 'approved'
  accounts[idx].approvedAt = new Date().toISOString()
  if (note) accounts[idx].approvalNote = note
  setJson(KEYS.ACCOUNTS, accounts)

  // 紐付いている店舗も approved に
  const shopId = accounts[idx].shopId
  if (shopId) updateManagedShop(shopId, { status: 'approved' })
  return true
}

/** 出店者を停止 */
export function suspendOwner(accountId: string, note?: string): boolean {
  const accounts = getAllAccounts()
  const idx = accounts.findIndex(a => a.id === accountId)
  if (idx === -1) return false
  accounts[idx].approvalStatus = 'suspended'
  if (note) accounts[idx].approvalNote = note
  setJson(KEYS.ACCOUNTS, accounts)

  // 紐付いている店舗も非表示に
  const shopId = accounts[idx].shopId
  if (shopId) updateManagedShop(shopId, { status: 'rejected' })
  return true
}

/** pending 出店者一覧 */
export function getPendingOwners(): OwnerAccount[] {
  return getAllAccounts().filter(a => a.approvalStatus === 'pending')
}

/** 全出店者（ステータス問わず） */
export function getAllOwners(): OwnerAccount[] {
  return getAllAccounts()
}

export function updateManagedShop(
  id: string,
  updates: Partial<Omit<ManagedShop, 'id' | 'ownerId' | 'appliedAt'>>,
): ManagedShop | null {
  const shops = getAllManagedShops()
  const idx = shops.findIndex(s => s.id === id)
  if (idx === -1) return null
  shops[idx] = { ...shops[idx], ...updates, updatedAt: new Date().toISOString() }
  setJson(KEYS.SHOPS, shops)
  return shops[idx]
}

/* ========================
   商品操作
   ======================== */

export function addProduct(shopId: string, product: Omit<Product, 'id'>): ManagedShop | null {
  const shops = getAllManagedShops()
  const idx = shops.findIndex(s => s.id === shopId)
  if (idx === -1) return null
  const newProduct: Product = {
    ...product,
    id: `p-${generateId()}`,
  }
  shops[idx].products = [...shops[idx].products, newProduct]
  shops[idx].updatedAt = new Date().toISOString()
  setJson(KEYS.SHOPS, shops)
  return shops[idx]
}

export function updateProduct(
  shopId: string,
  productId: string,
  updates: Partial<Product>,
): ManagedShop | null {
  const shops = getAllManagedShops()
  const idx = shops.findIndex(s => s.id === shopId)
  if (idx === -1) return null
  shops[idx].products = shops[idx].products.map(p =>
    p.id === productId ? { ...p, ...updates } : p,
  )
  shops[idx].updatedAt = new Date().toISOString()
  setJson(KEYS.SHOPS, shops)
  return shops[idx]
}

export function deleteProduct(shopId: string, productId: string): ManagedShop | null {
  const shops = getAllManagedShops()
  const idx = shops.findIndex(s => s.id === shopId)
  if (idx === -1) return null
  shops[idx].products = shops[idx].products.filter(p => p.id !== productId)
  shops[idx].updatedAt = new Date().toISOString()
  setJson(KEYS.SHOPS, shops)
  return shops[idx]
}

/**
 * 承認済みショップをワールドに表示するデータへ変換
 * buildingIndex が null のものはワールドに表示しない
 */
export function getApprovedShopsForWorld(): ManagedShop[] {
  return getAllManagedShops().filter(
    s => s.status === 'approved' && s.buildingIndex !== null,
  )
}

/**
 * ManagedShop → Shop 型変換（ShopModal互換）
 * オーナーが登録した店舗をワールドの静的Shop型として扱えるよう変換
 */
export function managedShopToShop(ms: ManagedShop, ownerName: string): Shop {
  return {
    id: ms.id,
    buildingIndex: ms.buildingIndex ?? 0,
    areaId: ms.areaId,
    areaLabel: ms.areaLabel,
    areaEmoji: ms.areaEmoji,
    name: ms.name,
    tagline: ms.tagline,
    areaColor: ms.areaColor,
    isOpen: ms.isOpen ?? true,
    rating: undefined,
    reviewCount: undefined,
    owner: {
      name: ownerName,
      avatar: ms.owner?.avatar ?? '🏪',
      bio: ms.owner?.bio ?? '',
      since: new Date(ms.appliedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' }),
      location: ms.owner?.location,
      sns: ms.owner?.sns,
    },
    products: ms.products,
  }
}

/**
 * 運営が承認済みかつ棟割り当て済みの ManagedShop を Shop[] として返す
 * App.tsx の buildingIndex → shop 検索で使用
 */
export function getApprovedShopsAsShopList(): Shop[] {
  const managedShops = getApprovedShopsForWorld()
  const accounts = getAllAccounts()
  return managedShops.map(ms => {
    const account = accounts.find(a => a.id === ms.ownerId)
    return managedShopToShop(ms, account?.name ?? '出店者')
  })
}

/**
 * buildingIndex から承認済み ManagedShop を Shop 型で返す（静的データより優先）
 */
export function getApprovedShopByBuilding(buildingIndex: number): Shop | undefined {
  const managedShops = getApprovedShopsForWorld()
  const ms = managedShops.find(s => s.buildingIndex === buildingIndex)
  if (!ms) return undefined
  const accounts = getAllAccounts()
  const account = accounts.find(a => a.id === ms.ownerId)
  return managedShopToShop(ms, account?.name ?? '出店者')
}

/**
 * 承認済みショップが割り当てられている buildingIndex の Set を返す
 * NagayaWorld の視覚インジケータ用
 */
export function getAssignedBuildingIndexes(): Set<number> {
  return new Set(
    getApprovedShopsForWorld()
      .map(s => s.buildingIndex)
      .filter((i): i is number => i !== null)
  )
}

/**
 * 棟への割り当て（管理者が操作）
 */
export function assignBuildingIndex(shopId: string, buildingIndex: number | null): boolean {
  const shops = getAllManagedShops()
  // 他の店が同じ棟を使っていたら上書き禁止
  if (buildingIndex !== null) {
    const conflict = shops.find(s => s.buildingIndex === buildingIndex && s.id !== shopId && s.status === 'approved')
    if (conflict) return false
  }
  const idx = shops.findIndex(s => s.id === shopId)
  if (idx === -1) return false
  shops[idx].buildingIndex = buildingIndex
  shops[idx].updatedAt = new Date().toISOString()
  setJson(KEYS.SHOPS, shops)
  return true
}
