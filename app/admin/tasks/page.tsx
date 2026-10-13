'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  FaPlus, FaEdit, FaTrash, FaPower, 
  FaExternalLinkAlt, FaClipboardList, FaClock, FaCoins
} from 'react-icons/fa'
import Link from 'next/link'
import toast from 'react-hot-toast'
import './tasks.css'

const supabase = createClient()

interface Task {
  id: string
  title: string
  description: string
  reward_spy: number
  task_url: string
  task_type: string
  required_time_seconds: number
  is_active: boolean
  total_completions: number
  max_completions: number
  expires_at: string
  created_at: string
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setTasks(data)
    } else if (error) {
      console.error('Error fetching tasks:', error)
      toast.error('Failed to load tasks')
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const toggleTaskStatus = useCallback(async (taskId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('tasks')
      .update({ is_active: !currentStatus })
      .eq('id', taskId)

    if (!error) {
      toast.success(`Task ${!currentStatus ? 'activated' : 'deactivated'}`)
      fetchTasks()
    } else {
      toast.error('Failed to update task')
    }
  }, [fetchTasks])

  const deleteTask = useCallback(async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (!error) {
      toast.success('Task deleted')
      fetchTasks()
    } else {
      toast.error('Failed to delete task')
    }
  }, [fetchTasks])

  if (isLoading) {
    return (
      <div className="admin-tasks-loading">
        <div className="admin-tasks-spinner" />
      </div>
    )
  }

  return (
    <div className="admin-tasks-page">
      {/* Header */}
      <div className="admin-tasks-header">
        <div className="admin-tasks-header-left">
          <h1>Tasks</h1>
          <p>Manage earning tasks for users</p>
        </div>
        <Link href="/admin/tasks/create" className="admin-tasks-create-btn">
          <FaPlus /> Create Task
        </Link>
      </div>

      {/* Tasks List */}
      <div className="admin-tasks-list">
        {tasks.map((task) => (
          <div key={task.id} className="admin-task-card">
            <div className="admin-task-content">
              <div className="admin-task-main">
                <div className="admin-task-title-row">
                  <h3 className="admin-task-title">{task.title}</h3>
                  <span className={`admin-task-badge ${
                    task.is_active ? 'admin-task-badge-active' : 'admin-task-badge-inactive'
                  }`}>
                    {task.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="admin-task-badge admin-task-badge-type">
                    {task.task_type}
                  </span>
                </div>
                
                <p className="admin-task-description">{task.description}</p>
                
                <div className="admin-task-meta">
                  <div className="admin-task-meta-item">
                    <FaCoins className="text-green-400" />
                    <span className="admin-task-meta-label">Reward:</span>
                    <span className="admin-task-meta-value reward">{task.reward_spy} SPY</span>
                  </div>
                  <div className="admin-task-meta-item">
                    <FaClock className="text-blue-400" />
                    <span className="admin-task-meta-label">Time:</span>
                    <span className="admin-task-meta-value time">{task.required_time_seconds}s</span>
                  </div>
                  <div className="admin-task-meta-item">
                    <FaClipboardList className="text-purple-400" />
                    <span className="admin-task-meta-label">Completions:</span>
                    <span className="admin-task-meta-value">
                      {task.total_completions} / {task.max_completions}
                    </span>
                  </div>
                  {task.task_url && (
                    <div className="admin-task-meta-item">
                      <a 
                        href={task.task_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="admin-task-meta-link"
                      >
                        Visit Link <FaExternalLinkAlt className="text-xs" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="admin-task-actions">
                <Link
                  href={`/admin/tasks/edit/${task.id}`}
                  className="admin-task-action-btn edit"
                  title="Edit task"
                >
                  <FaEdit />
                </Link>
                <button
                  onClick={() => toggleTaskStatus(task.id, task.is_active)}
                  className="admin-task-action-btn power"
                  title={task.is_active ? 'Deactivate' : 'Activate'}
                >
                  <FaPower />
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="admin-task-action-btn delete"
                  title="Delete task"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="admin-tasks-empty">
            <FaClipboardList className="admin-tasks-empty-icon" />
            <h3>No tasks created yet</h3>
            <p>Create your first earning task to get started</p>
            <Link href="/admin/tasks/create" className="admin-tasks-empty-link">
              <FaPlus /> Create First Task
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
