import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]

  const { count } = await supabase
    .from('ad_watches')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', today)

  const remaining = Math.max(0, 20 - (count || 0))

  const { data: lastWatch } = await supabase
    .from('ad_watches')
    .select('created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let cooldown = 0
  if (lastWatch) {
    const lastTime = new Date(lastWatch.created_at).getTime()
    const diffSeconds = (Date.now() - lastTime) / 1000
    if (diffSeconds < 30) {
      cooldown = Math.ceil(30 - diffSeconds)
    }
  }

  return NextResponse.json({ remaining, cooldown, canWatch: remaining > 0 && cooldown === 0 })
}
