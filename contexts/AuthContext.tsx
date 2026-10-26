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
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
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
        // Profile missing — create it
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

  // ===== SIGN UP =====
  const signUp = useCallback(async (
    email: string,
    password: string,
    username: string,
    referralCode?: string
  ) => {
    const normalizedEmail = email.trim().toLowerCase()

    // 1. Find referrer BEFORE signup (if referral code provided)
    let referredById: string | null = null
    if (referralCode?.trim()) {
      const { data: referrer } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', referralCode.trim().toUpperCase())
        .maybeSingle()

      if (referrer) referredById = referrer.id
    }

    // 2. Create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          username,
          referred_by: referredById,
        },
      },
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Signup failed — no user returned')

    // 3. The DB trigger (handle_new_user) creates the profile.
    //    DO NOT insert manually — that causes duplicate key errors.
    //    Instead, just update the referred_by if needed.
    if (referredById) {
      // Wait a moment for trigger to finish
      await new Promise(r => setTimeout(r, 500))

      await supabase
        .from('profiles')
        .update({ referred_by: referredById })
        .eq('id', authData.user.id)

      await supabase.rpc('handle_referral_bonus', {
        referrer_id: referredById,
        new_user_id: authData.user.id,
      })
    }

    toast.success('Account created! Please check your email to verify.')
  }, [])

  // ===== SIGN IN =====
  const signIn = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (error) {
      console.error('SignIn error:', error)

      if (error.message.toLowerCase().includes('invalid login')) {
        throw new Error('Wrong email or password. Please check and try again.')
      }
      if (error.message.toLowerCase().includes('email not confirmed')) {
        throw new Error('Please confirm your email before logging in.')
      }
      if (error.message.toLowerCase().includes('too many')) {
        throw new Error('Too many attempts. Please wait a few minutes.')
      }
      throw new Error(error.message)
    }

    if (!data.session || !data.user) {
      throw new Error('Login failed — no session returned.')
    }

    // CRITICAL: load the profile BEFORE returning so /dashboard sees it
    const p = await fetchProfile(data.user.id)
    if (p) setProfile(p)

    setUser(data.user)
    toast.success('Welcome back!')
    router.push('/dashboard')
    router.refresh()
  }, [fetchProfile, router])

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
