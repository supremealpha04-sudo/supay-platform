// app/dashboard/nft/components/NFTStats.tsx
'use client'

import { FaGem, FaFire, FaCoins, FaShoppingCart, FaRocket } from 'react-icons/fa'
import '../styles/nft.css'

interface NFTStatsProps {
  stats: {
    total: number
    staked: number
    earnings: number
  }
}

export default function NFTStats({ stats }: NFTStatsProps) {
  const items = [
    { 
      label: 'Total NFTs', 
      value: stats.total, 
      icon: FaGem, 
      color: 'text-accent-500',
      bgColor: 'bg-accent-500/10'
    },
    { 
      label: 'Staked', 
      value: stats.staked, 
      icon: FaFire, 
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10'
    },
    { 
      label: 'Earnings', 
      value: `${stats.earnings.toFixed(2)} SPY`, 
      icon: FaCoins, 
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    },
    { 
      label: 'Marketplace', 
      value: 'Active', 
      icon: FaShoppingCart, 
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      subValue: 'Buy & Sell'
    }
  ]

  return (
    <div className="nft-stats-grid">
      {items.map((item, i) => {
        const Icon = item.icon
        return (
          <div key={i} className={`nft-stat-card ${item.bgColor}`}>
            <div className="nft-stat-icon-wrapper">
              <Icon className={`${item.color} text-xl`} />
            </div>
            <p className="nft-stat-label">{item.label}</p>
            <p className="nft-stat-value">{item.value}</p>
            {item.subValue && (
              <p className="nft-stat-subvalue">{item.subValue}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
