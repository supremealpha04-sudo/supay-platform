// components/referrals/ReferralLeaderboard.tsx
'use client'

import { Trophy, Medal, Users, Coins } from 'lucide-react'

interface LeaderboardUser {
  username: string
  referral_count: number
  referral_earnings: number
}

interface ReferralLeaderboardProps {
  users: LeaderboardUser[]
  currentUserRank?: number
}

export function ReferralLeaderboard({ users, currentUserRank }: ReferralLeaderboardProps) {
  const getMedal = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-400" />
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />
    return null
  }

  return (
    <div className="glass rounded-xl p-5">
      <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-accent-500" />
        Referral Leaderboard
      </h3>

      <div className="space-y-2">
        {users.slice(0, 10).map((user, index) => (
          <div key={user.username} className="flex items-center justify-between p-3 bg-navy-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-6 text-center">
                {getMedal(index) || <span className="text-xs text-gray-500">{index + 1}</span>}
              </div>
              <span className="text-white text-sm">{user.username}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Users className="w-3 h-3" />
                {user.referral_count}
              </div>
              <div className="flex items-center gap-1 text-xs text-accent-500">
                <Coins className="w-3 h-3" />
                {user.referral_earnings} SPY
              </div>
            </div>
          </div>
        ))}
      </div>

      {currentUserRank && currentUserRank > 10 && (
        <div className="mt-4 pt-4 border-t border-primary-500/20">
          <div className="flex justify-between items-center p-3 bg-navy-800 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-6 text-center">{currentUserRank}</span>
              <span className="text-white text-sm">You</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Users className="w-3 h-3" />
                {users.find(u => u.username === 'You')?.referral_count || 0}
              </div>
              <div className="flex items-center gap-1 text-xs text-accent-500">
                <Coins className="w-3 h-3" />
                {users.find(u => u.username === 'You')?.referral_earnings || 0} SPY
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
