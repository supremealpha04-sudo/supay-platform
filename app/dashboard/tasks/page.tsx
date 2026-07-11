'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  ArrowLeft, CheckCircle, Clock, DollarSign, Filter,
  Search, Star, Zap, Globe, Smartphone, Share2,
  Video, FileText, ChevronRight, Loader2, ExternalLink,
  Play, BarChart3, TrendingUp, Users, Instagram, Twitter,
  Linkedin, Youtube, Facebook, Award, Gift, Sparkles,
  AlertCircle, RefreshCw, Check
} from 'lucide-react'
import toast from 'react-hot-toast'
import './tasks.css'

const supabase = createClient()

// ============================================
// TYPES
// ============================================
interface Task {
  id: string
  title: string
  description: string
  reward_spy: number
  task_url: string
  task_type: 'link' | 'survey' | 'video' | 'install' | 'social_follow'
  required_time_seconds: number
  max_completions: number
  is_active: boolean
  created_at: string
  expires_at?: string
  social_platform?: 'whatsapp' | 'tiktok' | 'instagram' | 'twitter' | 'youtube' | 'facebook'
  social_username?: string
}

interface UserTask {
  id: string
  user_id: string
  task_id: string
  status: 'started' | 'completed' | 'verified'
  started_at: string
  completed_at?: string
  verification_data?: any
}

// ============================================
// CONSTANTS
// ============================================
const SOCIAL_TASKS = [
  {
    id: 'social-whatsapp',
    title: 'Join SupremeAmer WhatsApp Channel',
    description: 'Follow our WhatsApp channel for exclusive updates and earning tips',
    reward_spy: 10,
    task_url: 'https://whatsapp.com/channel/0029Vb61UIaId7nVZcvJwt1s',
    task_type: 'social_follow' as const,
    required_time_seconds: 30,
    max_completions: 1,
    is_active: true,
    social_platform: 'whatsapp' as const,
    social_username: 'SupremeAmer'
  },
  {
    id: 'social-tiktok',
    title: 'Follow SupremeAlpha on TikTok',
    description: 'Follow our TikTok account for daily crypto tips and rewards',
    reward_spy: 15,
    task_url: 'https://vm.tiktok.com/ZS9M9d1oKtaHF-TQSE6/',
    task_type: 'social_follow' as const,
    required_time_seconds: 30,
    max_completions: 1,
    is_active: true,
    social_platform: 'tiktok' as const,
    social_username: 'SupremeAlpha'
  },
  {
    id: 'social-instagram',
    title: 'Follow SupremeAmer on Instagram',
    description: 'Follow our Instagram for exclusive content and giveaways',
    reward_spy: 12,
    task_url: 'https://instagram.com/supremeamer',
    task_type: 'social_follow' as const,
    required_time_seconds: 30,
    max_completions: 1,
    is_active: true,
    social_platform: 'instagram' as const,
    social_username: '@supremeamer'
  }
]

const typeIcons: Record<string, any> = {
  link: Globe,
  survey: FileText,
  video: Video,
  install: Smartphone,
  social_follow: Users
}

const typeColors: Record<string, string> = {
  link: 'blue',
  survey: 'purple',
  video: 'red',
  install: 'green',
  social_follow: 'pink'
}

const socialIcons: Record<string, any> = {
  whatsapp: Share2,
  tiktok: Video,
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  facebook: Facebook
}

const socialColors: Record<string, string> = {
  whatsapp: '#25D366',
  tiktok: '#000000',
  instagram: '#E4405F',
  twitter: '#1DA1F2',
  youtube: '#FF0000',
  facebook: '#1877F2'
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function TasksPage() {
  const { profile, user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [userTasks, setUserTasks] = useState<UserTask[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeType, setActiveType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [completingTask, setCompletingTask] = useState<string | null>(null)
  const [showSocialModal, setShowSocialModal] = useState(false)
  const [selectedSocialTask, setSelectedSocialTask] = useState<Task | null>(null)
  const [stats, setStats] = useState({ available: 0, completed: 0, totalEarned: 0 })

  // ===== DATA FETCHING =====
  const fetchTasks = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // Fetch active tasks from database
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('is_active', true)
        .order('reward_spy', { ascending: false })

      // Fetch user's task completions
      const { data: userTasksData, error: userTasksError } = await supabase
        .from('user_tasks')
        .select('*')
        .eq('user_id', user.id)

      // Combine database tasks with social tasks
      let allTasks: Task[] = []
      
      if (!tasksError && tasksData) {
        allTasks = [...tasksData]
      }

      // Add social tasks if they don't already exist in database
      const existingSocialIds = new Set(allTasks.map(t => t.id))
      SOCIAL_TASKS.forEach(st => {
        if (!existingSocialIds.has(st.id)) {
          allTasks.push(st as Task)
        }
      })

      setTasks(allTasks)

      // Process user tasks
      let userTaskData: UserTask[] = []
      if (!userTasksError && userTasksData) {
        userTaskData = userTasksData
      }

      // Check social tasks completion status
      const socialUserTasks = SOCIAL_TASKS.map(st => {
        const existing = userTaskData.find(ut => ut.task_id === st.id)
        if (existing) return existing
        return {
          id: `social-${st.id}`,
          user_id: user.id,
          task_id: st.id,
          status: 'available' as const,
          started_at: new Date().toISOString(),
          verification_data: null
        }
      })

      // Merge with existing user tasks
      const allUserTasks = [...userTaskData]
      socialUserTasks.forEach(st => {
        if (!allUserTasks.find(ut => ut.task_id === st.task_id)) {
          allUserTasks.push(st as UserTask)
        }
      })

      setUserTasks(allUserTasks)

      // Calculate stats
      const completed = allUserTasks.filter((ut: UserTask) => ut.status === 'completed' || ut.status === 'verified').length
      const totalEarned = allUserTasks.reduce((sum: number, ut: UserTask) => {
        const task = allTasks.find((t: Task) => t.id === ut.task_id)
        return (ut.status === 'completed' || ut.status === 'verified') ? sum + (task?.reward_spy || 0) : sum
      }, 0) || 0

      setStats({
        available: allTasks.length - completed,
        completed,
        totalEarned
      })

    } catch (e) {
      console.error('Error fetching tasks:', e)
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user?.id])

  // ===== EFFECTS =====
  useEffect(() => {
    if (user) {
      fetchTasks()
    }
  }, [user, fetchTasks])

  // ===== TASK HANDLERS =====
  const startTask = useCallback(async (task: Task) => {
    if (!user?.id) return

    // Check if it's a social task
    if (task.task_type === 'social_follow') {
      setSelectedSocialTask(task)
      setShowSocialModal(true)
      return
    }

    setCompletingTask(task.id)

    try {
      // Record that user started this task
      const { error } = await supabase
        .from('user_tasks')
        .insert({
          user_id: user.id,
          task_id: task.id,
          status: 'started',
          started_at: new Date().toISOString()
        })

      if (error) throw error

      // Open task URL in new tab
      window.open(task.task_url, '_blank')

      // Refresh user tasks
      await fetchTasks()
      toast.success('Task started! Complete it and verify to earn rewards.')
    } catch (e) {
      console.error('Error starting task:', e)
      toast.error('Failed to start task')
    } finally {
      setCompletingTask(null)
    }
  }, [user?.id, fetchTasks])

  const verifyTask = useCallback(async (taskId: string) => {
    if (!user?.id) return

    setCompletingTask(taskId)

    try {
      // Simulate verification (in real app, verify with backend)
      await new Promise(resolve => setTimeout(resolve, 1500))

      const { error } = await supabase
        .from('user_tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('task_id', taskId)

      if (error) throw error

      await fetchTasks()
      toast.success('Task verified! Rewards added to your account.')
    } catch (e) {
      console.error('Error verifying task:', e)
      toast.error('Failed to verify task')
    } finally {
      setCompletingTask(null)
    }
  }, [user?.id, fetchTasks])

  const verifySocialTask = useCallback(async (taskId: string) => {
    if (!user?.id) return

    setCompletingTask(taskId)
    setShowSocialModal(false)

    try {
      // Check if user already completed this social task
      const existing = userTasks.find(ut => ut.task_id === taskId)
      if (existing && (existing.status === 'completed' || existing.status === 'verified')) {
        toast.error('You already completed this task!')
        setCompletingTask(null)
        return
      }

      // Record social task completion
      const { error } = await supabase
        .from('user_tasks')
        .upsert({
          user_id: user.id,
          task_id: taskId,
          status: 'completed',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          verification_data: {
            verified_at: new Date().toISOString(),
            method: 'social_follow'
          }
        }, {
          onConflict: 'user_id,task_id'
        })

      if (error) throw error

      await fetchTasks()
      toast.success('🎉 Social follow verified! You earned SPY rewards!')
    } catch (e) {
      console.error('Error verifying social task:', e)
      toast.error('Failed to verify social follow')
    } finally {
      setCompletingTask(null)
      setSelectedSocialTask(null)
    }
  }, [user?.id, userTasks, fetchTasks])

  const refreshTasks = useCallback(async () => {
    setRefreshing(true)
    await fetchTasks()
    toast.success('Tasks refreshed!')
  }, [fetchTasks])

  // ===== HELPERS =====
  const getTaskStatus = useCallback((taskId: string) => {
    const userTask = userTasks.find(ut => ut.task_id === taskId)
    return userTask?.status || 'available'
  }, [userTasks])

  const getSocialIcon = useCallback((platform?: string) => {
    if (!platform) return Share2
    return socialIcons[platform] || Share2
  }, [])

  const getSocialColor = useCallback((platform?: string) => {
    if (!platform) return '#60a5fa'
    return socialColors[platform] || '#60a5fa'
  }, [])

  const formatTime = useCallback((seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }, [])

  // ===== FILTERED TASKS =====
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesType = activeType === 'all' || task.task_type === activeType
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesType && matchesSearch
    })
  }, [tasks, activeType, searchQuery])

  // ===== SOCIAL MODAL =====
  const SocialVerificationModal = () => {
    if (!selectedSocialTask) return null

    const Icon = getSocialIcon(selectedSocialTask.social_platform)
    const color = getSocialColor(selectedSocialTask.social_platform)

    return (
      <div className="modal-overlay" onClick={() => setShowSocialModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={() => setShowSocialModal(false)}>
            <ArrowLeft size={20} />
          </button>
          
          <div className="modal-icon" style={{ background: `${color}20`, color: color }}>
            <Icon size={32} />
          </div>
          
          <h2>Follow & Earn</h2>
          <p className="modal-desc">{selectedSocialTask.description}</p>
          
          <div className="modal-social-info">
            <div className="social-platform-badge" style={{ borderColor: color }}>
              <Icon size={16} style={{ color }} />
              <span style={{ color }}>
                {selectedSocialTask.social_platform?.toUpperCase()}
              </span>
            </div>
            <div className="social-username">{selectedSocialTask.social_username}</div>
          </div>

          <div className="modal-reward">
            <Zap size={18} className="reward-icon" />
            <span>+{selectedSocialTask.reward_spy} SPY</span>
          </div>

          <div className="modal-actions">
            <a 
              href={selectedSocialTask.task_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="modal-follow-btn"
              style={{ background: color }}
            >
              <ExternalLink size={18} />
              Follow Now
            </a>
            <button 
              className="modal-verify-btn"
              onClick={() => verifySocialTask(selectedSocialTask.id)}
              disabled={completingTask === selectedSocialTask.id}
            >
              {completingTask === selectedSocialTask.id ? (
                <Loader2 size={18} className="spin" />
              ) : (
                <>
                  <Check size={18} />
                  I Followed, Verify!
                </>
              )}
            </button>
          </div>

          <p className="modal-hint">
            ⚡ Follow the page, then click "I Followed, Verify!" to claim your reward
          </p>
        </div>
      </div>
    )
  }

  // ===== RENDER =====
  return (
    <div className="tasks-page">
      {/* Header */}
      <div className="tasks-header">
        <div className="header-left">
          <Link href="/dashboard" className="back-link">
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>
          <h1 className="page-title">Earn Tasks</h1>
          <p className="page-subtitle">Complete tasks and earn SPY tokens instantly</p>
        </div>
        <div className="header-stats">
          <div className="header-stat">
            <div className="stat-icon-wrap blue">
              <Zap size={18} />
            </div>
            <div>
              <span className="stat-value">{stats.available}</span>
              <span className="stat-label">Available</span>
            </div>
          </div>
          <div className="header-stat">
            <div className="stat-icon-wrap green">
              <CheckCircle size={18} />
            </div>
            <div>
              <span className="stat-value">{stats.completed}</span>
              <span className="stat-label">Completed</span>
            </div>
          </div>
          <div className="header-stat">
            <div className="stat-icon-wrap purple">
              <TrendingUp size={18} />
            </div>
            <div>
              <span className="stat-value">{stats.totalEarned}</span>
              <span className="stat-label">SPY Earned</span>
            </div>
          </div>
        </div>
      </div>

      {/* Social Tasks Banner */}
      <div className="social-banner">
        <div className="banner-content">
          <Sparkles size={20} className="banner-icon" />
          <div>
            <h4>Follow & Earn SPY!</h4>
            <p>Follow our social channels for instant rewards</p>
          </div>
        </div>
        <div className="banner-social-icons">
          {SOCIAL_TASKS.map(task => {
            const Icon = getSocialIcon(task.social_platform)
            const color = getSocialColor(task.social_platform)
            const status = getTaskStatus(task.id)
            const isCompleted = status === 'completed' || status === 'verified'
            return (
              <div 
                key={task.id}
                className={`banner-social-item ${isCompleted ? 'completed' : ''}`}
                style={{ borderColor: isCompleted ? '#4ade80' : color }}
                title={isCompleted ? 'Completed!' : task.title}
              >
                <Icon size={18} style={{ color: isCompleted ? '#4ade80' : color }} />
                {isCompleted && <Check size={12} className="check-badge" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="tasks-toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <button 
          className="refresh-btn" 
          onClick={refreshTasks}
          disabled={refreshing}
        >
          <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
        </button>
      </div>

      {/* Type Filters */}
      <div className="type-filters">
        <button 
          className={`type-pill ${activeType === 'all' ? 'active' : ''}`}
          onClick={() => setActiveType('all')}
        >
          <BarChart3 size={14} />
          All Tasks
        </button>
        <button 
          className={`type-pill ${activeType === 'link' ? 'active' : ''}`}
          onClick={() => setActiveType('link')}
        >
          <Globe size={14} />
          Link Visit
        </button>
        <button 
          className={`type-pill ${activeType === 'survey' ? 'active' : ''}`}
          onClick={() => setActiveType('survey')}
        >
          <FileText size={14} />
          Surveys
        </button>
        <button 
          className={`type-pill ${activeType === 'video' ? 'active' : ''}`}
          onClick={() => setActiveType('video')}
        >
          <Video size={14} />
          Videos
        </button>
        <button 
          className={`type-pill ${activeType === 'install' ? 'active' : ''}`}
          onClick={() => setActiveType('install')}
        >
          <Smartphone size={14} />
          App Installs
        </button>
        <button 
          className={`type-pill ${activeType === 'social_follow' ? 'active' : ''}`}
          onClick={() => setActiveType('social_follow')}
        >
          <Users size={14} />
          Social Follow
        </button>
      </div>

      {/* Tasks Grid */}
      {loading ? (
        <div className="tasks-loading">
          <div className="loading-spinner" />
          <p>Loading available tasks...</p>
        </div>
      ) : (
        <div className="tasks-grid">
          {filteredTasks.map(task => {
            const status = getTaskStatus(task.id)
            const TypeIcon = typeIcons[task.task_type] || Zap
            const colorClass = typeColors[task.task_type] || 'blue'
            const isSocial = task.task_type === 'social_follow'
            const SocialIcon = isSocial ? getSocialIcon(task.social_platform) : null
            const socialColor = isSocial ? getSocialColor(task.social_platform) : null

            return (
              <div key={task.id} className={`task-card ${status}`}>
                <div className="task-card-top">
                  <div className={`task-type-icon ${colorClass}`}>
                    {isSocial && SocialIcon ? (
                      <SocialIcon size={22} style={{ color: socialColor || undefined }} />
                    ) : (
                      <TypeIcon size={22} />
                    )}
                  </div>
                  <div className="task-reward-badge">
                    <Zap size={14} />
                    +{task.reward_spy} SPY
                  </div>
                </div>

                <h3 className="task-title">{task.title}</h3>
                <p className="task-description">{task.description}</p>

                {isSocial && task.social_platform && (
                  <div className="social-platform-tag" style={{ borderColor: socialColor || undefined }}>
                    <span style={{ color: socialColor || undefined }}>
                      Follow on {task.social_platform.toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="task-meta-row">
                  <span className={`task-type-tag ${colorClass}`}>
                    {task.task_type === 'social_follow' ? 'Social' : task.task_type}
                  </span>
                  <span className="task-time">
                    <Clock size={12} />
                    {formatTime(task.required_time_seconds)}
                  </span>
                  <span className="task-slots">
                    <Users size={12} />
                    {task.max_completions} slots
                  </span>
                </div>

                <div className="task-footer">
                  {status === 'completed' || status === 'verified' ? (
                    <button className="task-btn done" disabled>
                      <CheckCircle size={16} />
                      Completed
                    </button>
                  ) : status === 'started' ? (
                    <button 
                      className="task-btn verify"
                      onClick={() => verifyTask(task.id)}
                      disabled={completingTask === task.id}
                    >
                      {completingTask === task.id ? (
                        <Loader2 size={16} className="spin" />
                      ) : (
                        <CheckCircle size={16} />
                      )}
                      Verify Completion
                    </button>
                  ) : (
                    <button 
                      className={`task-btn start ${isSocial ? 'social' : ''}`}
                      onClick={() => startTask(task)}
                      disabled={completingTask === task.id}
                      style={isSocial ? { 
                        background: socialColor || undefined,
                        borderColor: socialColor || undefined
                      } : undefined}
                    >
                      {completingTask === task.id ? (
                        <Loader2 size={16} className="spin" />
                      ) : isSocial ? (
                        <Users size={16} />
                      ) : (
                        <ExternalLink size={16} />
                      )}
                      {isSocial ? 'Follow & Earn' : 'Start Task'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {filteredTasks.length === 0 && !loading && (
        <div className="empty-state">
          <Search size={48} className="empty-icon" />
          <h3>No tasks available</h3>
          <p>Check back later for new earning opportunities</p>
        </div>
      )}

      {/* Social Verification Modal */}
      {showSocialModal && <SocialVerificationModal />}
    </div>
  )
}