// app/api/webhooks/coinbase/route.ts
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const signature = request.headers.get('x-cc-webhook-signature')
  const rawBody = await request.text()

  const expectedSignature = crypto
    .createHmac('sha256', process.env.COINBASE_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex')

  if (signature !== expectedSignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const payload = JSON.parse(rawBody)
  const event = payload.event

  if (event.type === 'charge:confirmed') {
    // Process successful crypto payment
    const charge = event.data
    const amount = charge.pricing.local.amount
    const userId = charge.metadata.user_id

    const spyAmount = parseFloat(amount) * 100
    const unlockDate = new Date()
    unlockDate.setDate(unlockDate.getDate() + 30)

    const supabase = createServerSupabaseClient()

    await supabase.from('deposits').insert({
      user_id: userId,
      amount_usd: parseFloat(amount),
      spy_expected: spyAmount,
      method: 'crypto',
      coinbase_charge_id: charge.id,
      unlock_date: unlockDate.toISOString(),
      status: 'completed'
    })
  }

  return NextResponse.json({ received: true })
}
