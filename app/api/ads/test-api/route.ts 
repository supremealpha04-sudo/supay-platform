// app/api/ads/test-api/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.ADSTERRA_API_KEY
  
  console.log('🔍 Testing Adsterra API Key...')
  console.log('API Key exists:', !!apiKey)
  console.log('API Key preview:', apiKey ? `${apiKey.substring(0, 10)}...` : 'not set')
  
  if (!apiKey) {
    return NextResponse.json({
      success: false,
      message: 'ADSTERRA_API_KEY is not set in environment variables',
      suggestion: 'Add ADSTERRA_API_KEY to your .env.local file and restart the server'
    })
  }

  try {
    // Test the API key with a simple request
    const response = await fetch('https://api3.adsterratools.com/publisher/stats.json', {
      headers: {
        'X-API-Key': apiKey
      }
    })
    
    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      message: 'API key is working',
      apiKeyPreview: apiKey.substring(0, 10) + '...',
      responseData: data
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'API key test failed',
      error: error.message,
      suggestion: 'Check if your API key is valid and has proper permissions'
    })
  }
}