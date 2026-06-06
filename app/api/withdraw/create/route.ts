import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const MIN_WITHDRAWAL_SPY = 500
const MAX_WITHDRAWAL_SPY = 50000
const WITHDRAWAL_FEE_PERCENT = 2
const MIN_FEE_SPY = 10

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { amountSpy, method, address, bankDetails } = await request.json()

  if (amountSpy < MIN_WITHDRAWAL_SPY) {
    return NextResponse.json({ error: `Minimum withdrawal is ${MIN_WITHDRAWAL_SPY} SPY` }, { status: 400 })
  }

  if (amountSpy > MAX_WITHDRAWAL_SPY) {
    return NextResponse.json({ error: `Maximum withdrawal is ${MAX_WITHDRAWAL_SPY} SPY per day` }, { status: 400 })
  }

  // Check withdrawable balance
  const { data: breakdown } = await supabase
    .from('user_spy_breakdown')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const withdrawableSpy = (breakdown?.earned_spy || 0) + (breakdown?.referral_spy || 0) + (breakdown?.staking_rewards_spy || 0)

  if (amountSpy > withdrawableSpy) {
    return NextResponse.json({ error: 'Insufficient withdrawable balance' }, { status: 400 })
  }

  const fee = Math.max(Math.ceil(amountSpy * WITHDRAWAL_FEE_PERCENT / 100), MIN_FEE_SPY)
  const amountAfterFee = amountSpy - fee
  const amountUSD = amountAfterFee / 100

  const { data: withdrawal, error } = await supabase
    .from('withdrawals')
    .insert({
      user_id: user.id,
      amount_spy: amountSpy,
      amount_usd: amountUSD,
      fee_spy: fee,
      method,
      address: method === 'usdt' ? address : null,
      bank_details: method === 'bank' ? bankDetails : null,
      status: 'pending'
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create withdrawal request' }, { status: 500 })
  }

  // Deduct from user balance
  await supabase
    .from('profiles')
    .update({ spy_balance: supabase.rpc('decrement', { row_id: user.id, amount: amountSpy }) })
    .eq('id', user.id)

  return NextResponse.json({
    success: true,
    withdrawal_id: withdrawal.id,
    amount: amountAfterFee,
    fee
  })
}
