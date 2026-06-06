// app/api/referrals/tree/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get level 1 referrals
  const { data: level1 } = await supabase
    .from('profiles')
    .select('id, username, referral_count, created_at')
    .eq('referred_by', user.id)

  // Get level 2 referrals (referrals of referrals)
  const level1Ids = level1?.map(l => l.id) || []
  const { data: level2 } = await supabase
    .from('profiles')
    .select('id, username, referral_count, created_at')
    .in('referred_by', level1Ids)

  return NextResponse.json({
    level1: level1 || [],
    level2: level2 || []
  })
}
