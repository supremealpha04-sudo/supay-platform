import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: adminCheck } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!adminCheck?.is_admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || 'all'

  let query = supabase.from('profiles').select('*', { count: 'exact' })
  if (search) query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`)
  if (status === 'premium') query = query.eq('is_premium', true)
  if (status === 'banned') query = query.eq('is_banned', true)

  const { data: users, count } = await query.order('created_at', { ascending: false }).range((page - 1) * limit, page * limit - 1)
  return NextResponse.json({ users, count, page, limit })
}

export async function PUT(request: Request) {
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: adminCheck } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!adminCheck?.is_admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  const { userId, is_banned, is_admin } = await request.json()
  const updates: any = {}
  if (is_banned !== undefined) updates.is_banned = is_banned
  if (is_admin !== undefined) updates.is_admin = is_admin

  const { data: updated, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ user: updated })
}