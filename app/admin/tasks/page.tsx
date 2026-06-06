
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit, Trash2, Eye, Power, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

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

  useEffect(() => {
    fetchTasks()
  }, [])

  async function fetchTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setTasks(data)
    }
    setIsLoading(false)
  }

  async function toggleTaskStatus(taskId: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('tasks')
      .update({ is_active: !currentStatus })
      .eq('id', taskId)

    if (!error) {
      toast.success(`Task ${!currentStatus ? 'activated' : 'deactivated'}`)
      fetchTasks()
    }
  }

  async function deleteTask(taskId: string) {
    if (confirm('Are you sure you want to delete this task?')) {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (!error) {
        toast.success('Task deleted')
        fetchTasks()
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-accent-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Tasks</h1>
          <p className="text-gray-400 mt-1">Manage earning tasks</p>
        </div>
        <Link
          href="/admin/tasks/create"
          className="px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Task
        </Link>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 gap-4">
        {tasks.map((task) => (
          <div key={task.id} className="glass rounded-xl p-5">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white">{task.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${task.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {task.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 rounded-full text-xs">{task.task_type}</span>
                </div>
                <p className="text-gray-400 text-sm mb-3">{task.description}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Reward:</span>
                    <span className="text-accent-500 ml-1">{task.reward_spy} SPY</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Time:</span>
                    <span className="text-white ml-1">{task.required_time_seconds}s</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Completions:</span>
                    <span className="text-white ml-1">{task.total_completions} / {task.max_completions}</span>
                  </div>
                  {task.task_url && (
                    <div>
                      <span className="text-gray-500">URL:</span>
                      <a href={task.task_url} target="_blank" rel="noopener noreferrer" className="text-accent-500 ml-1 hover:underline inline-flex items-center gap-1">
                        Link <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin/tasks/edit/${task.id}`}
                  className="p-2 hover:bg-white/10 rounded-lg transition"
                >
                  <Edit className="w-4 h-4 text-gray-400" />
                </Link>
                <button
                  onClick={() => toggleTaskStatus(task.id, task.is_active)}
                  className="p-2 hover:bg-white/10 rounded-lg transition"
                >
                  <Power className={`w-4 h-4 ${task.is_active ? 'text-green-400' : 'text-gray-400'}`} />
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-2 hover:bg-white/10 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No tasks created yet</p>
            <Link href="/admin/tasks/create" className="text-accent-500 hover:underline mt-2 inline-block">
              Create your first task
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
