'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, RefreshCw, Shield, DollarSign, Users, Bell, Database } from 'lucide-react'
import toast from 'react-hot-toast'

const supabase = createClient()

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState({
    min_deposit_usd: 7,
    max_deposit_usd: 5000,
    min_withdrawal_spy: 500,
    max_withdrawal_spy: 50000,
    withdrawal_fee_percent: 2,
    daily_ad_limit: 20,
    referral_bonus_spy: 10,
    referral_levels: 3,
    maintenance_mode: false,
    maintenance_message: 'Supay is under maintenance. Please check back soon.'
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    const { data } = await supabase
      .from('system_settings')
      .select('*')
      .single()

    if (data) {
      setSettings(data)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    const { error } = await supabase
      .from('system_settings')
      .upsert(settings)

    if (!error) {
      toast.success('Settings saved successfully')
    } else {
      toast.error('Failed to save settings')
    }
    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">System Settings</h1>
        <p className="text-gray-400 mt-1">Configure platform parameters</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Deposit Settings */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-accent-500" /> Deposit Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Minimum Deposit (USD)</label>
              <input
                type="number"
                value={settings.min_deposit_usd}
                onChange={(e) => setSettings({ ...settings, min_deposit_usd: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-navy-800 border border-primary-500/30 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Maximum Deposit (USD)</label>
              <input
                type="number"
                value={settings.max_deposit_usd}
                onChange={(e) => setSettings({ ...settings, max_deposit_usd: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-navy-800 border border-primary-500/30 rounded-xl text-white"
              />
            </div>
          </div>
        </div>

        {/* Withdrawal Settings */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-accent-500" /> Withdrawal Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Minimum Withdrawal (SPY)</label>
              <input
                type="number"
                value={settings.min_withdrawal_spy}
                onChange={(e) => setSettings({ ...settings, min_withdrawal_spy: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-navy-800 border border-primary-500/30 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Maximum Withdrawal (SPY)</label>
              <input
                type="number"
                value={settings.max_withdrawal_spy}
                onChange={(e) => setSettings({ ...settings, max_withdrawal_spy: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-navy-800 border border-primary-500/30 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Withdrawal Fee (%)</label>
              <input
                type="number"
                step="0.5"
                value={settings.withdrawal_fee_percent}
                onChange={(e) => setSettings({ ...settings, withdrawal_fee_percent: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 bg-navy-800 border border-primary-500/30 rounded-xl text-white"
              />
            </div>
          </div>
        </div>

        {/* Platform Settings */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-accent-500" /> Platform Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Daily Ad Limit</label>
              <input
                type="number"
                value={settings.daily_ad_limit}
                onChange={(e) => setSettings({ ...settings, daily_ad_limit: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-navy-800 border border-primary-500/30 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Referral Bonus (SPY)</label>
              <input
                type="number"
                value={settings.referral_bonus_spy}
                onChange={(e) => setSettings({ ...settings, referral_bonus_spy: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-navy-800 border border-primary-500/30 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Referral Levels</label>
              <input
                type="number"
                value={settings.referral_levels}
                onChange={(e) => setSettings({ ...settings, referral_levels: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-navy-800 border border-primary-500/30 rounded-xl text-white"
              />
            </div>
          </div>
        </div>

        {/* Maintenance Mode */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent-500" /> Maintenance Mode
          </h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenance_mode}
                onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                className="w-5 h-5 rounded border-primary-500/30 bg-navy-800 text-accent-500"
              />
              <span className="text-white">Enable Maintenance Mode</span>
            </label>
            {settings.maintenance_mode && (
              <div>
                <label className="block text-sm text-gray-300 mb-2">Maintenance Message</label>
                <textarea
                  value={settings.maintenance_message}
                  onChange={(e) => setSettings({ ...settings, maintenance_message: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-navy-800 border border-primary-500/30 rounded-xl text-white resize-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl text-white flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {isLoading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
