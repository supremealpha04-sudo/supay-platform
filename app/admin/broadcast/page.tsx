'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Users, UserCheck, Target, Bell, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const supabase = createClient()

export default function AdminBroadcastPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    audience: 'all',
    type: 'info'
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    // Get target users based on audience
    let query = supabase.from('profiles').select('id')
    
    if (formData.audience === 'premium') {
      query = query.eq('is_premium', true)
    } else if (formData.audience === 'active') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      query = query.gte('last_active', weekAgo.toISOString())
    }

    const { data: users } = await query

    if (!users || users.length === 0) {
      toast.error('No users found for this audience')
      setIsLoading(false)
      return
    }

    // Insert notifications for all target users
    const notifications = users.map(user => ({
      user_id: user.id,
      title: formData.title,
      message: formData.message,
      type: formData.type,
      metadata: { broadcast: true }
    }))

    const { error } = await supabase
      .from('notifications')
      .insert(notifications)

    if (!error) {
      toast.success(`Broadcast sent to ${users.length} users`)
      setFormData({ title: '', message: '', audience: 'all', type: 'info' })
    } else {
      toast.error('Failed to send broadcast')
    }
    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Broadcast</h1>
        <p className="text-gray-400 mt-1">Send notifications to users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="glass rounded-xl p-6 space-y-5">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Weekend Bonus Event!"
                className="w-full px-4 py-2 bg-navy-800 border border-primary-500/30 rounded-xl text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Message</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                placeholder="Enter your broadcast message here..."
                className="w-full px-4 py-2 bg-navy-800 border border-primary-500/30 rounded-xl text-white resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Audience</label>
                <select
                  value={formData.audience}
                  onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                  className="w-full px-4 py-2 bg-navy-800 border border-primary-500/30 rounded-xl text-white"
                >
                  <option value="all">All Users</option>
                  <option value="premium">Premium Only</option>
                  <option value="active">Active (Last 7 days)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Notification Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 bg-navy-800 border border-primary-500/30 rounded-xl text-white"
                >
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" /> {isLoading ? 'Sending...' : 'Send Broadcast'}
            </button>
          </form>
        </div>

        {/* Info Panel */}
        <div className="space-y-4">
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-5 h-5 text-accent-500" />
              <h3 className="text-white font-medium">Audience Size</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">All Users</span>
                <span className="text-white">TBD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Premium Users</span>
                <span className="text-white">TBD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Active (7d)</span>
                <span className="text-white">TBD</span>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <Bell className="w-5 h-5 text-accent-500" />
              <h3 className="text-white font-medium">Best Practices</h3>
            </div>
            <ul className="text-xs text-gray-400 space-y-2">
              <li>• Keep messages clear and actionable</li>
              <li>• Don't spam - 1-2 broadcasts per week max</li>
              <li>• Include value propositions (bonuses, events)</li>
              <li>• Test with a small audience first</li>
            </ul>
          </div>

          <div className="glass rounded-xl p-4 bg-yellow-500/5 border border-yellow-500/20">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <p className="text-xs text-gray-300">
                Broadcasts are sent as in-app notifications. For push notifications, configure OneSignal in settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
