// app/api/ads/adsterra/check/route.ts
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { adTier } = body
    
    console.log('🔍 Checking Adsterra availability for:', adTier)
    
    const apiKey = process.env.ADSTERRA_API_KEY
    
    if (!apiKey) {
      console.error('❌ ADSTERRA_API_KEY is not set')
      // Return available: true for testing (so UI shows ads)
      return NextResponse.json({ 
        available: true, 
        ecpm: 1.50,
        message: 'API key not set - using fallback'
      })
    }

    // Try to fetch real data from Adsterra
    try {
      const response = await fetch('https://api3.adsterratools.com/publisher/stats.json', {
        headers: {
          'X-API-Key': apiKey
        }
      })
      
      const data = await response.json()
      console.log('✅ Adsterra API response:', data)
      
      // Check if we have inventory
      const available = data.status === 'success' && data.inventory > 0
      
      return NextResponse.json({ 
        available: available || true, // Fallback to true if no inventory
        ecpm: data.ecpm || 1.50,
        inventory: data.inventory || 0,
        data: data // For debugging
      })
    } catch (apiError) {
      console.error('⚠️ Adsterra API error, using fallback:', apiError)
      // Return available: true so users can still see ads
      return NextResponse.json({ 
        available: true, 
        ecpm: 1.50,
        message: 'Using fallback - API error'
      })
    }
  } catch (error) {
    console.error('❌ Adsterra check error:', error)
    // Always return available for testing
    return NextResponse.json({ 
      available: true, 
      ecpm: 1.50,
      message: 'Using fallback - server error'
    })
  }
}