import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { withdrawalId } = await request.json()

  const { data: withdrawal } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('id', withdrawalId)
    .eq('user_id', user.id)
    .single()

  if (!withdrawal || withdrawal.status !== 'pending') {
    return NextResponse.json({ error: 'Cannot cancel' }, { status: 400 })
  }

  await supabase
    .from('profiles')
    .update({ spy_balance: supabase.rpc('increment', { x: withdrawal.amount_spy }) })
    .eq('id', user.id)

  await supabase
    .from('withdrawals')
    .update({ status: 'cancelled' })
    .eq('id', withdrawalId)

  return NextResponse.json({ success: true })
}