import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookies().set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookies().set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: adminCheck } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!adminCheck?.is_admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { title, message, audience, type } = await request.json()

  let query = supabase.from('profiles').select('id')

  if (audience === 'premium') {
    query = query.eq('is_premium', true)
  } else if (audience === 'active') {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    query = query.gte('last_active', weekAgo.toISOString())
  }

  const { data: users } = await query

  if (!users || users.length === 0) {
    return NextResponse.json({ error: 'No users found' }, { status: 400 })
  }

  const notifications = users.map(u => ({
    user_id: u.id,
    title,
    message,
    type: type || 'info',
    metadata: { broadcast: true }
  }))

  await supabase.from('notifications').insert(notifications)

  return NextResponse.json({ success: true, sent_to: users.length })
}