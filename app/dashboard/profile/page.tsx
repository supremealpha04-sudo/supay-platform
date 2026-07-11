'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, User, Mail, Phone, MapPin, Calendar,
  Edit3, Camera, Shield, CheckCircle, Save,
  X, AlertCircle, Sparkles, Trophy, Users, Coins,
  Flame, RefreshCw
} from 'lucide-react'
import './profile.css'

const supabase = createClient()

// Extended type to handle optional fields
interface ExtendedProfile {
  id?: string
  username?: string
  full_name?: string
  email?: string
  phone?: string
  country?: string
  bio?: string
  avatar_url?: string
  spy_balance?: number
  total_earned_usd?: number
  referral_count?: number
  daily_bonus_streak?: number
  created_at?: string
  updated_at?: string
}

export default function ProfilePage() {
  const { profile, user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    phone: '',
    country: '',
    bio: ''
  })

  useEffect(() => {
    if (profile) {
      // Cast to ExtendedProfile to handle optional fields
      const extendedProfile = profile as ExtendedProfile
      setFormData({
        username: extendedProfile.username || '',
        full_name: extendedProfile.full_name || '',
        email: extendedProfile.email || '',
        phone: extendedProfile.phone || '',
        country: extendedProfile.country || '',
        bio: extendedProfile.bio || ''
      })
      setLoading(false)
    }
  }, [profile])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }, [])

  const handleSave = useCallback(async () => {
    if (!user?.id) return
    
    setSaving(true)
    setMessage(null)
    
    try {
      const updateData: any = {
        username: formData.username,
        full_name: formData.full_name,
        updated_at: new Date().toISOString()
      }

      // Only add optional fields if they have values
      if (formData.phone) updateData.phone = formData.phone
      if (formData.country) updateData.country = formData.country
      if (formData.bio) updateData.bio = formData.bio

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setEditMode(false)
      
      // Refresh the page data
      setTimeout(() => {
        router.refresh()
      }, 1000)
    } catch (error: any) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }, [user, formData, router])

  const handleCancel = useCallback(() => {
    // Reset form data to profile values
    if (profile) {
      const extendedProfile = profile as ExtendedProfile
      setFormData({
        username: extendedProfile.username || '',
        full_name: extendedProfile.full_name || '',
        email: extendedProfile.email || '',
        phone: extendedProfile.phone || '',
        country: extendedProfile.country || '',
        bio: extendedProfile.bio || ''
      })
    }
    setEditMode(false)
    setMessage(null)
  }, [profile])

  const userName = profile?.full_name || profile?.username || 'User'
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  // Stats data
  const stats = [
    { 
      label: 'Total Earned', 
      value: `$${profile?.total_earned_usd?.toFixed(2) || '0.00'}`,
      icon: Trophy,
      color: 'gold'
    },
    { 
      label: 'Referrals', 
      value: profile?.referral_count || 0,
      icon: Users,
      color: 'blue'
    },
    { 
      label: 'SPY Balance', 
      value: profile?.spy_balance || 0,
      icon: Coins,
      color: 'purple'
    },
    { 
      label: 'Day Streak', 
      value: profile?.daily_bonus_streak || 0,
      icon: Flame,
      color: 'orange'
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
          <Shield size={12} />
          {profile?.is_admin ? 'Admin' : 'Verified Member'}
        </p>
        <p className="user-since">
          <Calendar size={12} />
          Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
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
              placeholder="Enter full name"
              disabled={saving}
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
            <Phone size={14} /> 
            Phone
          </label>
          {editMode ? (
            <input 
              type="tel" 
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
              disabled={saving}
            />
          ) : (
            <div className="form-value">{formData.phone || 'Not set'}</div>
          )}
        </div>

        <div className="form-group">
          <label>
            <MapPin size={14} /> 
            Country
          </label>
          {editMode ? (
            <input 
              type="text" 
              name="country"
              value={formData.country}
              onChange={handleChange}
              placeholder="Enter country"
              disabled={saving}
            />
          ) : (
            <div className="form-value">{formData.country || 'Not set'}</div>
          )}
        </div>

        <div className="form-group">
          <label>
            <Calendar size={14} /> 
            Bio
          </label>
          {editMode ? (
            <textarea 
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us about yourself"
              rows={3}
              disabled={saving}
            />
          ) : (
            <div className="form-value bio">{formData.bio || 'No bio yet'}</div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="profile-stats">
        {stats.map((stat, index) => {
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
        <div className="info-item">
          <span className="info-label">Member Since</span>
          <span className="info-value">
            {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : 'N/A'}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Account Status</span>
          <span className="info-value status-active">
            <CheckCircle size={12} />
            Active
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">KYC Status</span>
          <span className={`info-value status-${profile?.kyc_status || 'none'}`}>
            {(profile?.kyc_status || 'None').toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  )
}