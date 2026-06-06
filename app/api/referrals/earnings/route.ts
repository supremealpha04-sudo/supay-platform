// app/api/referrals/earnings/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: referrals } = await supabase
    .from('referrals')
    .select('*, referred:referred_id(username, created_at)')
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false })

  const totalEarned = referrals?.reduce((sum, r) => sum + r.bonus_spy, 0) || 0

  return NextResponse.json({ referrals, totalEarned, count: referrals?.length || 0 })
}
