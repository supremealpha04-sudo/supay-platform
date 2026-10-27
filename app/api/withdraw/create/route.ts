// app/api/withdraw/create/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const MIN_WITHDRAWAL_SPY = 200
const MAX_WITHDRAWAL_SPY = 50000
const WITHDRAWAL_FEE_PERCENT = 2
const MIN_FEE_SPY = 10

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { amountSpy, method, address, bankDetails } = body
  const amount = Number(amountSpy)

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  }
  if (amount < MIN_WITHDRAWAL_SPY) {
    return NextResponse.json({ error: `Minimum withdrawal is ${MIN_WITHDRAWAL_SPY} SPY` }, { status: 400 })
  }
  if (amount > MAX_WITHDRAWAL_SPY) {
    return NextResponse.json({ error: `Maximum withdrawal is ${MAX_WITHDRAWAL_SPY} SPY per day` }, { status: 400 })
  }
  if (method === 'usdt' && (!address || address.length < 10)) {
    return NextResponse.json({ error: 'Invalid USDT address' }, { status: 400 })
  }
  if (method === 'bank' && !bankDetails) {
    return NextResponse.json({ error: 'Missing bank details' }, { status: 400 })
  }

  // 1) Atomically move available -> held. Fails if insufficient.
  const { error: holdErr } = await supabase.rpc('wallet_hold_for_withdrawal', {
    p_user_id: user.id,
    p_amount: amount,
  })
  if (holdErr) {
    const msg = holdErr.message?.toLowerCase().includes('insufficient')
      ? 'Insufficient balance'
      : 'Could not reserve funds'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // 2) Fee math
  const fee = Math.max(Math.ceil((amount * WITHDRAWAL_FEE_PERCENT) / 100), MIN_FEE_SPY)
  const net = amount - fee
  const amountUSD = net / 100

  // 3) Create withdrawal row (pending)
  const { data: withdrawal, error: insertErr } = await supabase
    .from('withdrawals')
    .insert({
      user_id: user.id,
      amount_spy: amount,
      amount_usd: amountUSD,
      fee_spy: fee,
      method,
      address: method === 'usdt' ? address : null,
      bank_details: method === 'bank' ? bankDetails : null,
      status: 'pending',
    })
    .select()
    .single()

  if (insertErr) {
    // rollback the hold
    await supabase.rpc('wallet_release_hold', { p_user_id: user.id, p_amount: amount })
    return NextResponse.json({ error: 'Failed to create withdrawal' }, { status: 500 })
  }

  // 4) Pending transaction row (shows in Pending section only)
  await supabase.from('transactions').insert({
    user_id: user.id,
    type: 'withdrawal',
    amount_spy: -amount,
    balance_after: null,
    status: 'pending',
    description:
      method === 'usdt'
        ? `Withdrawal to ${address.slice(0, 6)}…${address.slice(-4)}`
        : 'Withdrawal to bank',
    related_withdrawal_id: withdrawal.id,
  })

  return NextResponse.json({
    success: true,
    withdrawal_id: withdrawal.id,
    amount: net,
    fee,
  })
}
