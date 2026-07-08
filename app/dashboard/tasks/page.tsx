'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  ArrowLeft, CheckCircle, Clock, DollarSign, Filter,
  Search, Star, Zap, Globe, Smartphone, Share2,
  Video, FileText, ChevronRight, Loader2, ExternalLink,
  Play, BarChart3, TrendingUp
} from 'lucide-react'
import './tasks.css'

const supabase = createClient()

interface Task {
  id: string
  title: string
  description: string
  reward_spy: number
  task_url: string
  task_type: 'link' | 'survey' | 'video' | 'install'
  required_time_seconds: number
  max_completions: number
  is_active: boolean
  created_at: string
  expires_at?: string
}

interface UserTask {
  id: string
  user_id: string
  task_id: string
  status: 'started' | 'completed' | 'verified'
  started_at: string
  completed_at?: string
}

const typeIcons: Record<string, any> = {
  link: Globe,
  survey: FileText,
  video: Video,
  install: Smartphone
}

const typeColors: Record<string, string> = {
  link: 'blue',
  survey: 'purple',
  video: 'red',
  install: 'green'
}

export default function TasksPage() {
  const { profile, user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [userTasks, setUserTasks] = useState<UserTask[]>([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [completingTask, setCompletingTask] = useState<string | null>(null)
  const [stats, setStats] = useState({ available: 0, completed: 0, totalEarned: 0 })

  useEffect(() => {
    if (user) {
      fetchTasks()
    }
  }, [user])

  async function fetchTasks() {
    setLoading(true)
    try {
      // Fetch active tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('is_active', true)
        .order('reward_spy', { ascending: false })

      // Fetch user's task completions
      const { data: userTasksData, error: userTasksError } = await supabase
        .from('user_tasks')
        .select('*')
        .eq('user_id', user?.id)

      if (!tasksError && tasksData) {
        setTasks(tasksData)
      } else {
        setTasks([])
      }

      if (!userTasksError && userTasksData) {
        setUserTasks(userTasksData)
      }

      // Calculate stats
      const completed = userTasksData?.filter((ut: UserTask) => ut.status === 'completed').length || 0
      const totalEarned = userTasksData?.reduce((sum: number, ut: UserTask) => {
        const task = tasksData?.find((t: Task) => t.id === ut.task_id)
        return ut.status === 'completed' ? sum + (task?.reward_spy || 0) : sum
      }, 0) || 0

      setStats({
        available: (tasksData?.length || 0) - completed,
        completed,
        totalEarned
      })

    } catch (e) {
      console.error('Error fetching tasks:', e)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  async function startTask(task: Task) {
    if (!user?.id) return

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

      if (!error) {
        // Open task URL in new tab
        window.open(task.task_url, '_blank')

        // Refresh user tasks
        await fetchTasks()
      }
    } catch (e) {
      console.error('Error starting task:', e)
    } finally {
      setCompletingTask(null)
    }
  }

  async function verifyTask(taskId: string) {
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

      if (!error) {
        await fetchTasks()
      }
    } catch (e) {
      console.error('Error verifying task:', e)
    } finally {
      setCompletingTask(null)
    }
  }

  const getTaskStatus = (taskId: string) => {
    const userTask = userTasks.find(ut => ut.task_id === taskId)
    return userTask?.status || 'available'
  }

  const filteredTasks = tasks.filter(task => {
    const matchesType = activeType === 'all' || task.task_type === activeType
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

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

            return (
              <div key={task.id} className={`task-card ${status}`}>
                <div className="task-card-top">
                  <div className={`task-type-icon ${colorClass}`}>
                    <TypeIcon size={22} />
                  </div>
                  <div className="task-reward-badge">
                    <Zap size={14} />
                    +{task.reward_spy} SPY
                  </div>
                </div>

                <h3 className="task-title">{task.title}</h3>
                <p className="task-description">{task.description}</p>

                <div className="task-meta-row">
                  <span className={`task-type-tag ${colorClass}`}>
                    {task.task_type}
                  </span>
                  <span className="task-time">
                    <Clock size={12} />
                    {formatTime(task.required_time_seconds)}
                  </span>
                  <span className="task-slots">
                    <UsersIcon size={12} />
                    {task.max_completions} slots
                  </span>
                </div>

                <div className="task-footer">
                  {status === 'completed' ? (
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
                      className="task-btn start"
                      onClick={() => startTask(task)}
                      disabled={completingTask === task.id}
                    >
                      {completingTask === task.id ? (
                        <Loader2 size={16} className="spin" />
                      ) : (
                        <ExternalLink size={16} />
                      )}
                      Start Task
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
    </div>
  )
}

// Helper icon component
function UsersIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
