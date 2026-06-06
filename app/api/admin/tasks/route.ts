import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

async function getAdminClient() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookies().get(name)?.value },
        set(name: string, value: string, options: any) { cookies().set({ name, value, ...options }) },
        remove(name: string, options: any) { cookies().set({ name, value: '', ...options }) },
      },
    }
  )
  return supabase
}

export async function GET(request: Request) {
  const supabase = await getAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: adminCheck } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!adminCheck?.is_admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  const { data: tasks } = await supabase.from('tasks').select('*').order('created_at', { ascending: false })
  return NextResponse.json({ tasks })
}

export async function POST(request: Request) {
  const supabase = await getAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: adminCheck } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!adminCheck?.is_admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  const taskData = await request.json()
  const { data: task, error } = await supabase.from('tasks').insert(taskData).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ task })
}

export async function PUT(request: Request) {
  const supabase = await getAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: adminCheck } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!adminCheck?.is_admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  const { taskId, ...updates } = await request.json()
  const { data: task, error } = await supabase.from('tasks').update(updates).eq('id', taskId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ task })
}

export async function DELETE(request: Request) {
  const supabase = await getAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: adminCheck } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!adminCheck?.is_admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('id')
  await supabase.from('tasks').delete().eq('id', taskId)
  return NextResponse.json({ success: true })
}