'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  ArrowLeft, User, Mail, MapPin, Calendar,
  Edit3, Camera, Shield, CheckCircle, Save,
  X, AlertCircle, Sparkles, Trophy, Users, Coins,
  Flame, Wallet, Settings, HelpCircle,
  ShieldCheck, Crown, Activity, BarChart3, Award
} from 'lucide-react'
import { ExtendedProfile, UserStats, Country } from '@/types/profile'
import './profile.css'

const supabase = createClient()

export default function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [countries, setCountries] = useState<Country[]>([])
  const [stats, setStats] = useState<UserStats>({
    total_earned_spy: 0,
    total_earned_usd: 0,
    total_withdrawn_usd: 0,
    total_referrals: 0,
    active_referrals: 0,
    total_ads_watched: 0,
    total_tasks_completed: 0,
    current_streak: 0,
    longest_streak: 0,
    last_activity: null
  })
  
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    country: '',
    bio: ''
  })

  const extendedProfile = profile as ExtendedProfile

  // ===== LOAD DATA =====
  const loadCountries = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error
      setCountries(data || [])
    } catch (err) {
      console.error('Error loading countries:', err)
    }
  }, [])

  const loadStats = useCallback(async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .rpc('get_user_stats', { p_user_id: user.id })

      if (error) throw error

      if (data && data[0]) {
        setStats(data[0])
      }
    } catch (err) {
      console.error('Error loading stats:', err)
    }
  }, [user?.id])

  // ===== EFFECTS =====
  useEffect(() => {
    async function init() {
      if (!profile) return
      
      setFormData({
        username: extendedProfile.username || '',
        full_name: extendedProfile.full_name || '',
        email: extendedProfile.email || '',
        country: extendedProfile.country || '',
        bio: extendedProfile.bio || ''
      })

      await Promise.all([
        loadCountries(),
        loadStats()
      ])

      setLoading(false)
    }

    init()
  }, [profile, extendedProfile, loadCountries, loadStats])

  // ===== HANDLERS =====
  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }, [])

  const handleSave = useCallback(async () => {
    if (!user?.id) return
    
    setSaving(true)
    setMessage(null)
    
    try {
      const updateData: any = {
        username: formData.username.trim(),
        full_name: formData.full_name.trim(),
        bio: formData.bio.trim(),
        updated_at: new Date().toISOString()
      }

      if (formData.country) {
        updateData.country = formData.country
        const selectedCountry = countries.find(c => c.name === formData.country)
        if (selectedCountry) {
          updateData.country_code = selectedCountry.code
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setEditMode(false)
      
      if (refreshProfile) {
        await refreshProfile()
      }

    } catch (error: any) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }, [user, formData, countries, refreshProfile])

  const handleCancel = useCallback(() => {
    setFormData({
      username: extendedProfile.username || '',
      full_name: extendedProfile.full_name || '',
      email: extendedProfile.email || '',
      country: extendedProfile.country || '',
      bio: extendedProfile.bio || ''
    })
    setEditMode(false)
    setMessage(null)
  }, [extendedProfile])

  // ===== COMPUTED =====
  const userName = extendedProfile.full_name || extendedProfile.username || 'User'
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const isAdmin = extendedProfile.is_admin === true

  const statsDisplay = [
    { 
      label: 'Total Earned', 
      value: `$${stats.total_earned_usd?.toFixed(2) || '0.00'}`,
      icon: Trophy,
      color: 'gold'
    },
    { 
      label: 'Referrals', 
      value: stats.total_referrals || 0,
      icon: Users,
      color: 'blue'
    },
    { 
      label: 'SPY Balance', 
      value: (extendedProfile.spy_balance || 0).toLocaleString(),
      icon: Coins,
      color: 'purple'
    },
    { 
      label: 'Day Streak', 
      value: extendedProfile.daily_bonus_streak || 0,
      icon: Flame,
      color: 'orange'
    }
  ]

  const extendedStats = [
    { 
      label: 'Ads Watched', 
      value: stats.total_ads_watched || 0,
      icon: Activity
    },
    { 
      label: 'Tasks Done', 
      value: stats.total_tasks_completed || 0,
      icon: CheckCircle
    },
    { 
      label: 'Active Referrals', 
      value: stats.active_referrals || 0,
      icon: Users
    },
    { 
      label: 'Longest Streak', 
      value: `${stats.longest_streak || 0}d`,
      icon: Award
    }
  ]

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner" />
        <p>Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header-bar">
        <Link href="/dashboard" className="back-btn">
          <ArrowLeft size={18} />
          Back
        </Link>
        <h1>My Profile</h1>
        <div className="header-actions">
          {isAdmin && (
            <Link href="/admin" className="admin-btn">
              <ShieldCheck size={16} />
              Admin
            </Link>
          )}
          {editMode && (
            <button 
              className="cancel-btn"
              onClick={handleCancel}
              disabled={saving}
            >
              <X size={16} />
              Cancel
            </button>
          )}
          <button 
            className={`edit-btn ${editMode ? 'save-mode' : ''}`}
            onClick={() => editMode ? handleSave() : setEditMode(true)}
            disabled={saving}
          >
            {editMode ? (
              <>
                <Save size={16} />
                {saving ? 'Saving...' : 'Save'}
              </>
            ) : (
              <>
                <Edit3 size={16} />
                Edit
              </>
            )}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`profile-message ${message.type}`}>
          <div className="message-content">
            {message.type === 'success' ? (
              <CheckCircle size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span>{message.text}</span>
          </div>
          <button 
            className="message-dismiss"
            onClick={() => setMessage(null)}
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Avatar Section */}
      <div className="avatar-section">
        <div className="avatar-wrapper">
          <div className="avatar-large">
            {initials}
            {editMode && (
              <button className="camera-btn" aria-label="Change avatar">
                <Camera size={14} />
              </button>
            )}
          </div>
          {editMode && (
            <div className="avatar-hint">Click camera to change</div>
          )}
        </div>
        <h2>{userName}</h2>
        <p className="user-role">
          {isAdmin ? (
            <>
              <Crown size={12} />
              Administrator
            </>
          ) : extendedProfile.is_premium ? (
            <>
              <Sparkles size={12} />
              Premium Member
            </>
          ) : (
            <>
              <Shield size={12} />
              Verified Member
            </>
          )}
        </p>
        <p className="user-since">
          <Calendar size={12} />
          Joined {extendedProfile.created_at ? new Date(extendedProfile.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : 'N/A'}
        </p>
      </div>

      {/* Profile Form */}
      <div className="profile-form">
        <div className="form-group">
          <label>
            <User size={14} /> 
            Username
          </label>
          {editMode ? (
            <input 
              type="text" 
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter username"
              disabled={saving}
              maxLength={30}
            />
          ) : (
            <div className="form-value">{formData.username || 'Not set'}</div>
          )}
        </div>

        <div className="form-group">
          <label>
            <User size={14} /> 
            Full Name
          </label>
          {editMode ? (
            <input 
              type="text" 
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Enter your full name"
              disabled={saving}
              maxLength={100}
            />
          ) : (
            <div className="form-value">{formData.full_name || 'Not set'}</div>
          )}
        </div>

        <div className="form-group">
          <label>
            <Mail size={14} /> 
            Email
          </label>
          <div className="form-value email">
            {formData.email}
            <span className="verified-badge">
              <CheckCircle size={14} />
              Verified
            </span>
          </div>
          <small className="field-hint">Email cannot be changed</small>
        </div>

        <div className="form-group">
          <label>
            <MapPin size={14} /> 
            Country
          </label>
          {editMode ? (
            <select 
              name="country"
              value={formData.country}
              onChange={handleChange}
              disabled={saving}
              className="country-select"
            >
              <option value="">Select your country</option>
              {countries.map((country) => (
                <option key={country.code} value={country.name}>
                  {country.flag} {country.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="form-value">
              {formData.country ? (
                <>
                  {countries.find(c => c.name === formData.country)?.flag || '🌍'}{' '}
                  {formData.country}
                </>
              ) : (
                'Not set'
              )}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>
            <Edit3 size={14} /> 
            Bio
          </label>
          {editMode ? (
            <textarea 
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us about yourself..."
              rows={4}
              disabled={saving}
              maxLength={200}
            />
          ) : (
            <div className="form-value bio">{formData.bio || 'No bio yet'}</div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="profile-stats">
        {statsDisplay.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className={`p-stat ${stat.color}`}>
              <div className="p-stat-icon">
                <Icon size={16} />
              </div>
              <div className="p-stat-content">
                <span className="p-stat-num">{stat.value}</span>
                <span className="p-stat-label">{stat.label}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Extended Stats */}
      <div className="profile-extended-stats">
        <h3 className="section-title">
          <BarChart3 size={16} />
          Activity Overview
        </h3>
        <div className="extended-stats-grid">
          {extendedStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="ext-stat">
                <Icon size={14} className="ext-stat-icon" />
                <span className="ext-stat-value">{stat.value}</span>
                <span className="ext-stat-label">{stat.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="profile-actions">
        <Link href="/dashboard/wallet" className="action-link">
          <Wallet size={16} />
          Wallet
        </Link>
        <Link href="/dashboard/settings" className="action-link">
          <Settings size={16} />
          Settings
        </Link>
        <Link href="/dashboard/help" className="action-link">
          <HelpCircle size={16} />
          Help
        </Link>
      </div>

      {/* Account Info */}
      <div className="account-info">
        <h3 className="section-title">
          <Shield size={16} />
          Account Information
        </h3>
        <div className="info-item">
          <span className="info-label">Member Since</span>
          <span className="info-value">
            {extendedProfile.created_at ? new Date(extendedProfile.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : 'N/A'}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Account Status</span>
          <span className={`info-value ${extendedProfile.is_banned ? 'status-rejected' : 'status-active'}`}>
            <CheckCircle size={12} />
            {extendedProfile.is_banned ? 'Banned' : 'Active'}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">KYC Status</span>
          <span className={`info-value status-${extendedProfile.kyc_status || 'none'}`}>
            {(extendedProfile.kyc_status || 'None').toUpperCase()}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Account Type</span>
          <span className={`info-value ${isAdmin ? 'status-admin' : extendedProfile.is_premium ? 'status-premium' : ''}`}>
            {isAdmin ? (
              <>
                <Crown size={12} /> Administrator
              </>
            ) : extendedProfile.is_premium ? (
              <>
                <Sparkles size={12} /> Premium
              </>
            ) : (
              'Standard'
            )}
          </span>
        </div>
        {stats.last_activity && (
          <div className="info-item">
            <span className="info-label">Last Active</span>
            <span className="info-value">
              {new Date(stats.last_activity).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
