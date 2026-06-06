import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

const MIN_DEPOSIT_USD = 7
const MAX_DEPOSIT_USD = 5000

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { amount, method } = await request.json()

  if (amount < MIN_DEPOSIT_USD) {
    return NextResponse.json({ error: `Minimum deposit is $${MIN_DEPOSIT_USD}` }, { status: 400 })
  }

  if (amount > MAX_DEPOSIT_USD) {
    return NextResponse.json({ error: `Maximum deposit is $${MAX_DEPOSIT_USD}` }, { status: 400 })
  }

  const spyAmount = amount * 100
  const depositId = crypto.randomUUID()
  const unlockDate = new Date()
  unlockDate.setDate(unlockDate.getDate() + 30)

  if (method === 'crypto') {
    const cryptoAddress = `0x${crypto.randomBytes(20).toString('hex')}`
    
    await supabase.from('deposits').insert({
      id: depositId,
      user_id: user.id,
      amount_usd: amount,
      spy_expected: spyAmount,
      method: 'crypto',
      crypto_address: cryptoAddress,
      unlock_date: unlockDate.toISOString(),
      status: 'pending'
    })

    return NextResponse.json({
      success: true,
      address: cryptoAddress,
      network: 'BEP-20',
      amount,
      spy_amount: spyAmount
    })
  }

  if (method === 'card') {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amount * 100,
        email: user.email,
        reference: `DEP_${depositId}`,
        metadata: { user_id: user.id, deposit_id: depositId, spy_amount: spyAmount },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet`
      })
    })

    const data = await response.json()
    
    await supabase.from('deposits').insert({
      id: depositId,
      user_id: user.id,
      amount_usd: amount,
      spy_expected: spyAmount,
      method: 'card',
      paystack_reference: data.data.reference,
      unlock_date: unlockDate.toISOString(),
      status: 'pending'
    })

    return NextResponse.json({
      success: true,
      authorization_url: data.data.authorization_url,
      reference: data.data.reference
    })
  }

  return NextResponse.json({ error: 'Invalid method' }, { status: 400 })
}
