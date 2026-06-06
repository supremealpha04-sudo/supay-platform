// components/referrals/ReferralLink.tsx
'use client'

import { useState } from 'react'
import { Copy, Check, Share2, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface ReferralLinkProps {
  code: string
  link: string
}

export function ReferralLink({ code, link }: ReferralLinkProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success('Referral link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const shareOnWhatsApp = () => {
    window.open(`https://wa.me/?text=Join Supay and earn rewards! Use my referral link: ${link}`, '_blank')
  }

  const shareOnTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=Join Supay and earn rewards! Use my referral link: ${link}`, '_blank')
  }

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
          <Users className="w-5 h-5 text-accent-500" />
        </div>
        <div>
          <h3 className="text-white font-semibold">Your Referral Link</h3>
          <p className="text-xs text-gray-500">Share to earn 10% of their earnings</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <code className="flex-1 p-3 bg-navy-800 rounded-xl text-sm text-accent-500 break-all">
          {link}
        </code>
        <button
          onClick={copyToClipboard}
          className="p-3 glass rounded-xl hover:bg-white/5 transition"
        >
          {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-gray-400" />}
        </button>
      </div>

      <div className="flex gap-3">
        <Button onClick={shareOnWhatsApp} variant="outline" className="flex-1">
          WhatsApp
        </Button>
        <Button onClick={shareOnTwitter} variant="outline" className="flex-1">
          Twitter
        </Button>
      </div>

      <p className="text-xs text-center text-gray-500 mt-4">
        Your code: <span className="text-accent-500 font-mono">{code}</span>
      </p>
    </div>
  )
}
