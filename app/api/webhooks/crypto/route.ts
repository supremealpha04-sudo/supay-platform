// app/api/webhooks/crypto/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { Web3 } from 'web3'

const web3 = new Web3(process.env.NEXT_PUBLIC_BSC_RPC_URL)
const PLATFORM_WALLET = process.env.PLATFORM_WALLET_ADDRESS

export async function POST(request: Request) {
  const { txHash } = await request.json()

  const tx = await web3.eth.getTransactionReceipt(txHash)

  if (!tx || !tx.status) {
    return NextResponse.json({ error: 'Transaction not confirmed' }, { status: 400 })
  }

  // Parse transfer (simplified - would need proper ABI decoding)
  // This is where you'd decode the USDT transfer event

  const amountUSDT = 10 // Placeholder - would decode from logs
  const fromAddress = '0x...' // Placeholder
  const toAddress = tx.to

  if (toAddress?.toLowerCase() !== PLATFORM_WALLET?.toLowerCase()) {
    return NextResponse.json({ error: 'Wrong destination' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  // Find pending deposit or create one
  const { data: existing } = await supabase
    .from('deposits')
    .select('*')
    .eq('tx_hash', txHash)
    .single()

  if (!existing) {
    // Create deposit record
    const spyAmount = amountUSDT * 100
    const unlockDate = new Date()
    unlockDate.setDate(unlockDate.getDate() + 30)

    await supabase.from('deposits').insert({
      user_id: fromAddress, // Would need to map address to user
      amount_usd: amountUSDT,
      spy_expected: spyAmount,
      method: 'crypto',
      tx_hash: txHash,
      unlock_date: unlockDate.toISOString(),
      status: 'completed'
    })
  }

  return NextResponse.json({ received: true })
}
