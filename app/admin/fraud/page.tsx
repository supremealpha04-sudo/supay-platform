'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, CheckCircle, Eye, Ban, Shield } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

const supabase = createClient()

interface FraudAlert {
  id: string
  user_id: string
  alert_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  metadata: any
  resolved: boolean
  created_at: string
  profiles: { username: string }
}

export default function AdminFraudPage() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAlerts()
  }, [])

  async function fetchAlerts() {
    const { data, error } = await supabase
      .from('fraud_alerts')
      .select('*, profiles(username)')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setAlerts(data)
    }
    setIsLoading(false)
  }

  async function resolveAlert(alertId: string, action: 'resolve' | 'ban_user') {
    const alert = alerts.find(a => a.id === alertId)
    
    if (action === 'ban_user' && alert) {
      await supabase
        .from('profiles')
        .update({ is_banned: true })
        .eq('id', alert.user_id)
      
      toast.error(`User ${alert.profiles?.username} has been banned`)
    }

    const { error } = await supabase
      .from('fraud_alerts')
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', alertId)

    if (!error) {
      toast.success('Alert resolved')
      fetchAlerts()
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-yellow-500/20 text-yellow-400'
      case 'medium': return 'bg-orange-500/20 text-orange-400'
      case 'high': return 'bg-red-500/20 text-red-400'
      case 'critical': return 'bg-purple-500/20 text-purple-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-accent-500 rounded-full animate-spin" />
      </div>
    )
  }

  const unresolvedAlerts = alerts.filter(a => !a.resolved).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Fraud Alerts</h1>
          <p className="text-gray-400 mt-1">Monitor and investigate suspicious activity</p>
        </div>
        {unresolvedAlerts > 0 && (
          <div className="glass rounded-xl px-4 py-2 bg-red-500/10 border border-red-500/30">
            <p className="text-red-400 text-sm font-medium">{unresolvedAlerts} Unresolved</p>
          </div>
        )}
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.map((alert) => (
          <div key={alert.id} className={`glass rounded-xl p-5 border-l-4 ${alert.resolved ? 'border-gray-500' : getSeverityColor(alert.severity).split(' ')[0]}`}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className={`w-5 h-5 ${getSeverityColor(alert.severity).split(' ')[1]}`} />
                  <span className={`px-2 py-0.5 rounded-full text-xs ${getSeverityColor(alert.severity)}`}>
                    {alert.severity.toUpperCase()}
                  </span>
                  <span className="text-gray-500 text-xs">{alert.alert_type}</span>
                </div>
                <Link href={`/admin/users/${alert.user_id}`} className="text-white font-medium hover:text-accent-500">
                  @{alert.profiles?.username}
                </Link>
                <p className="text-gray-400 text-sm mt-2">{alert.description}</p>
                {alert.metadata && (
                  <pre className="mt-2 p-2 bg-navy-800 rounded-lg text-xs text-gray-500 overflow-x-auto">
                    {JSON.stringify(alert.metadata, null, 2)}
                  </pre>
                )}
                <p className="text-xs text-gray-600 mt-2">{new Date(alert.created_at).toLocaleString()}</p>
              </div>
              {!alert.resolved && (
                <div className="flex gap-2">
                  <button
                    onClick={() => resolveAlert(alert.id, 'resolve')}
                    className="p-2 bg-green-500/20 rounded-lg text-green-400 hover:bg-green-500/30"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => resolveAlert(alert.id, 'ban_user')}
                    className="p-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30"
                  >
                    <Ban className="w-4 h-4" />
                  </button>
                  <Link
                    href={`/admin/users/${alert.user_id}`}
                    className="p-2 bg-primary-500/20 rounded-lg text-primary-400 hover:bg-primary-500/30"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              )}
              {alert.resolved && (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs">Resolved</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {alerts.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">No fraud alerts detected</p>
            <p className="text-xs text-gray-600 mt-1">System is monitoring all activity</p>
          </div>
        )}
      </div>
    </div>
  )
}
