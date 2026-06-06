'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setIsLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (!error && data) {
      setProfile(data)
    }
    setIsLoading(false)
  }

  async function refreshProfile() {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  async function signUp(email: string, password: string, username: string, referralCode?: string) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })

    if (authError) throw authError

    if (authData.user) {
      let referredById = null
      if (referralCode) {
        const { data: referrer } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_code', referralCode)
          .single()
        if (referrer) referredById = referrer.id
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username,
          referral_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
          referred_by: referredById,
        })

      if (profileError) throw profileError

      if (referredById) {
        await supabase.rpc('handle_referral_bonus', { 
          referrer_id: referredById, 
          new_user_id: authData.user.id 
        })
      }

      toast.success('Account created! Please check your email to verify.')
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    toast.success('Welcome back!')
    router.push('/dashboard')
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}