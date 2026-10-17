// app/api/ads/adsterra/get-ad/route.ts
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, adTier = 'display' } = body

    const apiKey = process.env.ADSTERRA_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        message: 'Adsterra API key not configured'
      }, { status: 500 })
    }

    // Your Adsterra Native Banner config from environment
    // Since you have the API key working, we use the script + container
    const adScript = `https://pl30607520.profitableratecpmnetwork.com/478289f3c17549c6c042b9e58c05b749/invoke.js`
    const containerId = 'container-478289f3c17549c6c042b9e58c05b749'

    return NextResponse.json({
      success: true,
      script: adScript,
      containerId: containerId,
      duration: 20,
      message: 'Ad loaded'
    })

  } catch (error) {
    console.error('❌ Adsterra get-ad error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to load ad'
    }, { status: 500 })
  }
}
