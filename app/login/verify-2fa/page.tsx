'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import '../../auth.css'

const supabase = createClient()

export default function Verify2FAPage() {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [factorId, setFactorId] = useState<string | null>(null)
  const { user, verifyTOTP, signOut } = useAuth()
  const router = useRouter()

  // Load the user's enrolled TOTP factor on mount
  useEffect(() => {
    ;(async () => {
      if (!user) {
        router.push('/login')
        return
      }
      const { data } = await supabase.auth.mfa.listFactors()
      const totp = data?.totp?.find((f) => f.status === 'verified')
      if (!totp) {
        toast.error('No 2FA factor found. Redirecting to dashboard.')
        router.push('/dashboard')
        return
      }
      setFactorId(totp.id)
    })()
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!factorId) {
      toast.error('2FA not ready. Please try again.')
      return
    }
    if (code.length !== 6) {
      toast.error('Enter the 6-digit code from your authenticator app')
      return
    }

    setIsLoading(true)
    try {
      await verifyTOTP(factorId, code)
      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="app-icon">🔐</div>
          <h1>Two-Factor Auth</h1>
          <p>Enter the 6-digit code from Google Authenticator</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Verification Code</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="auth-input"
              placeholder="000000"
              autoFocus
              required
            />
          </div>
          <button type="submit" disabled={isLoading || !factorId} className="auth-btn">
            {isLoading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
        <div className="auth-footer">
          <p>
            <button
              onClick={async () => { await signOut() }}
              style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
            >
              Sign out
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
