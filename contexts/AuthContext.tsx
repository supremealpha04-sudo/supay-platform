'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

type Profile = {
  id: string
  username: string
  email: string
  full_name?: string | null
  avatar_url?: string | null
  spy_balance: number
  earned_spy?: number
  deposited_spy?: number
  referral_spy?: number
  staking_rewards_spy?: number
  total_earned_usd?: number
  total_withdrawn_usd?: number
  referral_code: string
  referred_by?: string | null
  referral_count?: number
  referral_earnings?: number
  daily_ad_watch_count?: number
  last_ad_watch_at?: string | null
  daily_bonus_streak?: number
  last_bonus_claimed_at?: string | null
  is_premium: boolean
  premium_until?: string | null
  is_admin: boolean
  is_banned?: boolean
  kyc_status?: string
  created_at: string
  updated_at?: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  signUp: (email: string, password: string, username: string, referralCode?: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<{ mfaRequired: boolean }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  enrollTOTP: () => Promise<{ factorId: string; qrCode: string; secret: string }>
  verifyTOTP: (factorId: string, code: string) => Promise<void>
  checkMFAStatus: () => Promise<{ currentLevel: string; nextLevel: string; needsMFA: boolean }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const supabase = createClient()

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // ===== FETCH PROFILE (robust) =====
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Profile fetch error:', error)
        return null
      }

      if (!data) {
        console.warn('Profile missing, creating one for user:', userId)
        const { data: userData } = await supabase.auth.getUser()
        const email = userData.user?.email || ''
        const username = email.split('@')[0] || `user_${userId.slice(0, 6)}`

        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            username,
            email,
            referral_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
          })
          .select()
          .single()

        if (insertError) {
          console.error('Profile creation error:', insertError)
          return null
        }
        return newProfile as Profile
      }

      return data as Profile
    } catch (err) {
      console.error('Unexpected profile error:', err)
      return null
    }
  }, [])

  // ===== INITIAL SESSION CHECK =====
  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return

        setUser(session?.user ?? null)

        if (session?.user) {
          const p = await fetchProfile(session.user.id)
          if (mounted) setProfile(p)
        }
      } catch (err) {
        console.error('Auth init error:', err)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return
        setUser(session?.user ?? null)

        if (session?.user) {
          const p = await fetchProfile(session.user.id)
          if (mounted) setProfile(p)
        } else {
          setProfile(null)
        }
        setIsLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  // ===== SIGN UP (via API route) =====
  const signUp = useCallback(async (
    email: string,
    password: string,
    username: string,
    referralCode?: string
  ) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username, referralCode }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new Error(data.error || 'Registration failed')
    }

    if (data.needsEmailConfirmation) {
      toast.success('Account created! Check your email to verify.')
    } else {
      toast.success('Account created!')
    }
  }, [])

  // ===== SIGN IN (via API route, returns mfaRequired) =====
  const signIn = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new Error(data.error || 'Login failed')
    }

    // Refresh client-side session so AuthContext picks up the user
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      throw new Error('Login failed — no session returned.')
    }

    const p = await fetchProfile(session.user.id)
    if (p) setProfile(p)
    setUser(session.user)

    // Check whether this user has an MFA factor that hasn't been verified
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    const mfaRequired = aal?.currentLevel === 'aal1' && aal?.nextLevel === 'aal2'

    if (mfaRequired) {
      toast('Enter your 2FA code to continue', { icon: '🔐' })
      return { mfaRequired: true }
    }

    toast.success('Welcome back!')
    return { mfaRequired: false }
  }, [fetchProfile])

  // ===== SIGN OUT =====
  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    router.push('/')
  }, [router])

  // ===== REFRESH PROFILE =====
  const refreshProfile = useCallback(async () => {
    if (user) {
      const p = await fetchProfile(user.id)
      if (p) setProfile(p)
    }
  }, [user, fetchProfile])

  // ===== TOTP ENROLL =====
  const enrollTOTP = useCallback(async () => {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: `GoogleAuth::${Date.now()}`, // unique — duplicates throw mfa_factor_name_conflict
    })

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Enrollment failed — no data returned')

    return {
      factorId: data.id,
      qrCode: data.totp.qr_code, // SVG string, render with <img src={...} />
      secret: data.totp.secret,  // manual-entry fallback
    }
  }, [])

  // ===== TOTP VERIFY =====
  const verifyTOTP = useCallback(async (factorId: string, code: string) => {
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId })
    if (challengeError) throw new Error(challengeError.message)

    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: code.trim(),
    })

    if (error) {
      if ((error as any).code === 'mfa_verification_failed') {
        throw new Error('Incorrect code. Check your device clock and try again.')
      }
      throw new Error(error.message)
    }

    // Session upgraded to aal2 — refresh profile/user
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      setUser(session.user)
      const p = await fetchProfile(session.user.id)
      if (p) setProfile(p)
    }

    toast.success('Two-factor authentication enabled!')
  }, [fetchProfile])

  // ===== MFA STATUS =====
  const checkMFAStatus = useCallback(async () => {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (error) throw new Error(error.message)
    return {
      currentLevel: data?.currentLevel || 'aal1',
      nextLevel: data?.nextLevel || 'aal1',
      needsMFA: data?.currentLevel === 'aal1' && data?.nextLevel === 'aal2',
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
        enrollTOTP,
        verifyTOTP,
        checkMFAStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
