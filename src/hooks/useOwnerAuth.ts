/**
 * useOwnerAuth.ts
 * オーナー認証状態管理フック
 */
import { useState, useEffect, useCallback } from 'react'
import {
  type OwnerAccount,
  getSession,
  loginAccount,
  registerAccount,
  logoutAccount,
} from '../data/ownerStore'

interface AuthState {
  account: OwnerAccount | null
  loading: boolean
  error: string | null
}

export function useOwnerAuth() {
  const [state, setState] = useState<AuthState>({
    account: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    const account = getSession()
    setState({ account, loading: false, error: null })
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setState(s => ({ ...s, loading: true, error: null }))
    const result = await loginAccount(email, password)
    if (result.ok) {
      setState({ account: result.account, loading: false, error: null })
      return true
    } else {
      setState(s => ({ ...s, loading: false, error: result.error }))
      return false
    }
  }, [])

  const register = useCallback(async (email: string, password: string, name: string, inviteCode: string | null = null) => {
    setState(s => ({ ...s, loading: true, error: null }))
    const result = await registerAccount(email, password, name, inviteCode)
    if (result.ok) {
      // 登録後そのままログイン
      await loginAccount(email, password)
      setState({ account: result.account, loading: false, error: null })
      return true
    } else {
      setState(s => ({ ...s, loading: false, error: result.error }))
      return false
    }
  }, [])

  const logout = useCallback(() => {
    logoutAccount()
    setState({ account: null, loading: false, error: null })
  }, [])

  const clearError = useCallback(() => {
    setState(s => ({ ...s, error: null }))
  }, [])

  return {
    account: state.account,
    loading: state.loading,
    error: state.error,
    isLoggedIn: state.account !== null,
    login,
    register,
    logout,
    clearError,
  }
}
