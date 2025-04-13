import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Ensure phone number has the +351 prefix
    let phoneNumber = body.phone || '';
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
    
    const formattedNumber = cleanNumber.startsWith('351') 
      ? `+${cleanNumber}` 
      : `+351${cleanNumber}`;
    
    // Make a request to ElevenLabs API
    const response = await fetch('https://api.us.elevenlabs.io/v1/convai/twilio/outbound_call', {
      method: 'POST',
      headers: {
        'xi-api-key': 'sk_d94f2950348df3ba0e76092bbcf1e9d51fa5fe66c8904317',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        'agent_id': 'tLYQ1n0EtQQHx8lqbcPT',
        'agent_phone_number_id': 'EcZm7zeCaXukBOPwwwSN',
        'to_number': formattedNumber
      })
    });
    
    // Get the response data
    let data;
    try {
      data = await response.json();
    } catch (error) {
      // If JSON parsing fails, return a text response
      const text = await response.text();
      return NextResponse.json(
        { success: false, error: 'Failed to parse response', text },
        { status: 500 }
      );
    }
    
    // Return the response from ElevenLabs
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'API call failed' },
        { status: response.status }
      );
    }
    
    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    console.error('Error in outbound-call API route:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 