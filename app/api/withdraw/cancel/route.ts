// app/api/withdraw/cancel/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { withdrawalId } = await request.json().catch(() => ({}))
  if (!withdrawalId) return NextResponse.json({ error: 'Missing withdrawalId' }, { status: 400 })

  const { data: withdrawal, error } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('id', withdrawalId)
    .eq('user_id', user.id)
    .single()

  if (error || !withdrawal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (withdrawal.status !== 'pending') {
    return NextResponse.json({ error: 'Only pending withdrawals can be cancelled' }, { status: 400 })
  }

  // 1) Release hold back into available balance (atomic)
  const { error: releaseErr } = await supabase.rpc('wallet_release_hold', {
    p_user_id: user.id,
    p_amount: withdrawal.amount_spy,
  })
  if (releaseErr) {
    return NextResponse.json({ error: 'Could not release funds' }, { status: 500 })
  }

  // 2) Mark withdrawal + its linked transaction as cancelled
  await supabase.from('withdrawals').update({ status: 'cancelled' }).eq('id', withdrawalId)
  await supabase
    .from('transactions')
    .update({ status: 'cancelled' })
    .eq('related_withdrawal_id', withdrawalId)

  return NextResponse.json({ success: true })
}
