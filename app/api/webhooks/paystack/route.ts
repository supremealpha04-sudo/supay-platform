// app/api/webhooks/paystack/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

export async function POST(request: Request) {
  const payload = await request.json()
  const signature = request.headers.get('x-paystack-signature')

  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET!)
    .update(JSON.stringify(payload))
    .digest('hex')

  if (hash !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const supabase = createServerSupabaseClient()
  const event = payload.event
  const data = payload.data

  if (event === 'charge.success') {
    const reference = data.reference

    const { data: deposit } = await supabase
      .from('deposits')
      .select('*')
      .eq('paystack_reference', reference)
      .single()

    if (deposit && deposit.status === 'pending') {
      await supabase
        .from('deposits')
        .update({ status: 'completed', confirmed_at: new Date().toISOString() })
        .eq('id', deposit.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('spy_balance')
        .eq('id', deposit.user_id)
        .single()

      await supabase
        .from('profiles')
        .update({ spy_balance: (profile?.spy_balance || 0) + deposit.spy_expected })
        .eq('id', deposit.user_id)

      await supabase.from('notifications').insert({
        user_id: deposit.user_id,
        title: '💰 Deposit Successful!',
        message: `You received ${deposit.spy_expected.toLocaleString()} SPY.`,
        type: 'success'
      })
    }
  }

  return NextResponse.json({ received: true })
}
