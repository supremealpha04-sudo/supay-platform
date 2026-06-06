
'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'
import { FaCrown, FaCheck, FaGem, FaRocket, FaChartLine, FaWallet } from 'react-icons/fa'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function PremiumPage() {
  const { profile, refreshProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const tiers = [
    {
      name: 'Silver',
      priceSpy: 500,
      priceUsd: 5,
      color: 'from-gray-400 to-gray-500',
      benefits: [
        '2x earnings on all tasks and ads',
        '50% off withdrawal fees',
        '5 exclusive tasks per week',
        'Priority support'
      ]
    },
    {
      name: 'Gold',
      priceSpy: 2000,
      priceUsd: 20,
      color: 'from-yellow-500 to-yellow-600',
      popular: true,
      benefits: [
        '2.5x earnings on all tasks and ads',
        '75% off withdrawal fees',
        '10 exclusive tasks per week',
        'Priority support',
        'Early access to new features'
      ]
    },
    {
      name: 'Platinum',
      priceSpy: 10000,
      priceUsd: 100,
      color: 'from-accent-500 to-orange-600',
      benefits: [
        '3x earnings on all tasks and ads',
        '90% off withdrawal fees',
        '20 exclusive tasks per week',
        'Priority support',
        'Early access to new features',
        'Monthly bonus of 500 SPY'
      ]
    }
  ]

  async function subscribe(tier: string, priceSpy: number) {
    if ((profile?.spy_balance || 0) < priceSpy) {
      toast.error(`Insufficient SPY. Need ${priceSpy} SPY. Deposit $${priceSpy / 100} to continue.`)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/premium/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, userId: profile?.id })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(`🎉 Welcome to ${tier} Premium! Your earnings are now boosted.`)
        await refreshProfile()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Subscription failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6 text-center">
        <FaCrown className="w-16 h-16 text-accent-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-white mb-2">Upgrade to Premium</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Get up to 3x earnings, exclusive tasks, and massive discounts on withdrawal fees.
          Premium pays for itself within days!
        </p>
      </div>

      {/* Current Status */}
      {profile?.is_premium && (
        <div className="glass rounded-xl p-4 bg-green-500/10 border border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400">✓ Premium Active</p>
              <p className="text-sm text-gray-400">Valid until {profile.premium_until ? new Date(profile.premium_until).toLocaleDateString() : 'N/A'}</p>
            </div>
            <Link href="/dashboard/nft" className="px-4 py-2 glass rounded-lg">
              Get NFT Badge
            </Link>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier, index) => (
          <motion.div
            key={tier.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`glass rounded-2xl p-6 relative ${tier.popular ? 'border-accent-500 shadow-lg shadow-accent-500/20' : ''}`}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent-500 rounded-full text-xs font-semibold">
                MOST POPULAR
              </div>
            )}
            
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${tier.color} flex items-center justify-center mx-auto mb-4`}>
              <FaGem className="w-8 h-8 text-white" />
            </div>
            
            <h3 className="text-2xl font-bold text-white text-center">{tier.name}</h3>
            <p className="text-center text-gray-400 mt-1">
              {tier.priceSpy.toLocaleString()} SPY / month
            </p>
            <p className="text-center text-sm text-gray-500 mb-6">
              or ${tier.priceUsd} (instant deposit)
            </p>
            
            <ul className="space-y-3 mb-6">
              {tier.benefits.map((benefit, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                  <FaCheck className="text-green-400 w-4 h-4" />
                  {benefit}
                </li>
              ))}
            </ul>
            
            <button
              onClick={() => subscribe(tier.name, tier.priceSpy)}
              disabled={isLoading || profile?.is_premium}
              className={`w-full py-3 rounded-xl font-semibold transition ${
                tier.popular
                  ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:shadow-lg'
                  : 'glass text-white hover:bg-white/10'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {profile?.is_premium ? 'Already Premium' : 'Upgrade Now'}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Benefits Comparison */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <FaChartLine /> Premium vs Free
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-navy-800 rounded-lg">
              <span className="text-gray-400">Daily Ad Limit</span>
              <span className="text-white">20 → 50 → 100 → Unlimited</span>
            </div>
            <div className="flex justify-between p-3 bg-navy-800 rounded-lg">
              <span className="text-gray-400">Earnings Multiplier</span>
              <span className="text-white">1x → 2x → 2.5x → 3x</span>
            </div>
            <div className="flex justify-between p-3 bg-navy-800 rounded-lg">
              <span className="text-gray-400">Withdrawal Fee</span>
              <span className="text-white">5% → 2.5% → 1% → 0%</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-navy-800 rounded-lg">
              <span className="text-gray-400">Exclusive Tasks</span>
              <span className="text-white">0 → 5 → 10 → 20 per week</span>
            </div>
            <div className="flex justify-between p-3 bg-navy-800 rounded-lg">
              <span className="text-gray-400">NFT Access</span>
              <span className="text-white">No → Yes (Bronze+)</span>
            </div>
            <div className="flex justify-between p-3 bg-navy-800 rounded-lg">
              <span className="text-gray-400">Monthly Bonus</span>
              <span className="text-white">0 → 0 → 0 → 500 SPY</span>
            </div>
          </div>
        </div>
      </div>

      {/* ROI Calculator */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <FaRocket /> Calculate Your ROI
        </h3>
        <div className="p-4 bg-navy-800 rounded-lg">
          <p className="text-gray-400 text-sm mb-2">Example with Silver Premium (500 SPY/month):</p>
          <ul className="space-y-1 text-sm text-gray-300">
            <li>• Daily task rewards: 3 SPY → 6 SPY (+90 SPY/month)</li>
            <li>• Ad rewards: 60 SPY → 120 SPY (+60 SPY/month)</li>
            <li>• Daily bonus: 90 SPY → 180 SPY (+90 SPY/month)</li>
            <li className="text-accent-500 font-semibold mt-2">Total extra earnings: +240 SPY/month</li>
            <li className="text-green-400">Premium cost: 500 SPY → Net: -260 SPY first month</li>
            <li className="text-green-400">After 2 months: +220 SPY profit!</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
