'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const supabase = createClient()

export default function SecurityPage() {
  const { enrollTOTP, verifyTOTP } = useAuth()
  const [enrollment, setEnrollment] = useState<{ factorId: string; qrCode: string; secret: string } | null>(null)
  const [code, setCode] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await supabase.auth.mfa.listFactors()
        const totp = data?.totp?.find((f) => f.status === 'verified')
        setEnabled(!!totp)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const startEnroll = async () => {
    try {
      const data = await enrollTOTP()
      setEnrollment(data)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const finishEnroll = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!enrollment) return
    if (code.length !== 6) {
      toast.error('Enter the 6-digit code')
      return
    }
    try {
      await verifyTOTP(enrollment.factorId, code)
      setEnrollment(null)
      setCode('')
      setEnabled(true)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  if (loading) return <div className="p-4">Loading…</div>

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-white mb-4">Security</h1>

      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <h2 className="text-white font-semibold mb-1">Google Authenticator</h2>
        <p className="text-gray-400 text-sm mb-3">
          {enabled
            ? 'TOTP 2FA is enabled on your account.'
            : 'Add a second layer of security using an authenticator app.'}
        </p>

        {!enabled && !enrollment && (
          <button onClick={startEnroll} className="px-4 py-2 bg-accent-500 rounded-lg text-white font-bold">
            Enable 2FA
          </button>
        )}

        {enrollment && (
          <form onSubmit={finishEnroll} className="space-y-3 mt-3">
            <div className="bg-white p-3 rounded-lg inline-block">
              <img src={enrollment.qrCode} alt="Scan with Google Authenticator" width={180} height={180} />
            </div>
            <p className="text-gray-400 text-xs">
              Manual entry key: <code className="text-white">{enrollment.secret}</code>
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="auth-input w-full"
              placeholder="Enter 6-digit code"
              required
            />
            <button type="submit" className="px-4 py-2 bg-accent-500 rounded-lg text-white font-bold">
              Verify & Enable
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
