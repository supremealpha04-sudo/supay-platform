// components/referrals/ReferralTree.tsx
'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, User, Coins } from 'lucide-react'

interface ReferralNode {
  id: string
  username: string
  bonus_spy: number
  created_at: string
  children?: ReferralNode[]
}

interface ReferralTreeProps {
  referrals: ReferralNode[]
  level?: number
}

function ReferralNodeComponent({ node, level = 0 }: { node: ReferralNode; level?: number }) {
  const [expanded, setExpanded] = useState(false)
  const hasChildren = node.children && node.children.length > 0

  return (
    <div className="ml-4" style={{ marginLeft: level > 0 ? `${level * 24}px` : 0 }}>
      <div
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer"
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren && (
          <div className="w-4">
            {expanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
          </div>
        )}
        <User className="w-4 h-4 text-accent-500" />
        <span className="text-white text-sm">{node.username}</span>
        <span className="text-xs text-gray-500 ml-auto flex items-center gap-1">
          <Coins className="w-3 h-3" /> +{node.bonus_spy} SPY
        </span>
      </div>
      {expanded && node.children?.map((child) => (
        <ReferralNodeComponent key={child.id} node={child} level={level + 1} />
      ))}
    </div>
  )
}

export function ReferralTree({ referrals }: ReferralTreeProps) {
  if (referrals.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No referrals yet</p>
        <p className="text-sm text-gray-600">Share your link to start earning</p>
      </div>
    )
  }

  return (
    <div className="glass rounded-xl p-5">
      <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
        <User className="w-4 h-4 text-accent-500" />
        Referral Tree
      </h3>
      <div className="space-y-1">
        {referrals.map((ref) => (
          <ReferralNodeComponent key={ref.id} node={ref} />
        ))}
      </div>
    </div>
  )
}
