// components/dashboard/ActivityFeed.tsx
'use client'

import { Clock, TrendingUp, TrendingDown } from 'lucide-react'

interface Activity {
  id: string
  type: string
  amount: number
  created_at: string
}

interface ActivityFeedProps {
  activities: Activity[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="glass rounded-xl p-5">
      <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4 text-accent-500" />
        Recent Activity
      </h3>
      {activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="flex justify-between items-center p-3 bg-navy-800 rounded-lg">
              <div>
                <p className="text-sm text-white capitalize">{activity.type.replace('_', ' ')}</p>
                <p className="text-xs text-gray-500">{new Date(activity.created_at).toLocaleString()}</p>
              </div>
              <div className={`flex items-center gap-1 ${activity.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {activity.amount > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="font-medium">
                  {activity.amount > 0 ? '+' : ''}{activity.amount} SPY
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">No recent activity</p>
      )}
    </div>
  )
}
