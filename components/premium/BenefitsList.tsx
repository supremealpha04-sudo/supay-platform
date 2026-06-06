// components/premium/BenefitsList.tsx
'use client'

import { Check, Sparkles, Zap, Shield, Gift, Rocket } from 'lucide-react'

const benefits = [
  { icon: Zap, title: '2x-5x Earnings', description: 'Multiply your SPY earnings from all activities' },
  { icon: Gift, title: 'Monthly Bonus', description: 'Get bonus SPY every month you stay premium' },
  { icon: Shield, title: 'Priority Support', description: 'Get your issues resolved faster' },
  { icon: Rocket, title: 'Early Access', description: 'Be first to try new features and tasks' },
  { icon: Sparkles, title: 'Exclusive Tasks', description: 'Access higher-paying premium tasks' },
  { icon: Check, title: 'Reduced Fees', description: 'Lower withdrawal fees and better rates' }
]

export function BenefitsList() {
  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-xl font-bold text-white mb-4 text-center">Premium Benefits</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {benefits.map((benefit, i) => {
          const Icon = benefit.icon
          return (
            <div key={i} className="flex gap-3 p-3 rounded-lg hover:bg-white/5 transition">
              <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                <Icon className="w-5 h-5 text-accent-500" />
              </div>
              <div>
                <p className="text-white font-medium">{benefit.title}</p>
                <p className="text-xs text-gray-400">{benefit.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
