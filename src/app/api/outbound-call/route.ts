import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Rate limiting constants
const RATE_LIMIT_WINDOW = 60 * 60; // 1 hour in seconds

/**
 * Check if an IP address is rate limited
 * @param ipAddress The client IP address
 * @returns [isLimited, remainingSeconds] - whether the IP is limited and seconds until reset
 */
async function checkRateLimit(ipAddress: string): Promise<[boolean, number]> {
  try {
    // Get current time
    const now = Math.floor(Date.now() / 1000);
    
    // Check if IP exists in the rate_limits table
    const { data, error } = await supabase
      .from('rate_limits')
      .select('last_call_time')
      .eq('ip_address', ipAddress)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Supabase query error:', error);
      return [false, 0]; // On error, allow the call but log the error
    }
    
    if (data) {
      const lastCallTime = data.last_call_time;
      const timeSinceLastCall = now - lastCallTime;
      
      if (timeSinceLastCall < RATE_LIMIT_WINDOW) {
        // IP is rate limited
        const remainingTime = RATE_LIMIT_WINDOW - timeSinceLastCall;
        return [true, remainingTime];
      }
      
      // Update last call time for existing record
      await supabase
        .from('rate_limits')
        .update({ last_call_time: now })
        .eq('ip_address', ipAddress);
        
      return [false, 0];
    } else {
      // Insert new record for IP
      await supabase
        .from('rate_limits')
        .insert([{ ip_address: ipAddress, last_call_time: now }]);
        
      return [false, 0];
    }
  } catch (err) {
    console.error('Rate limiting error:', err);
    return [false, 0]; // On error, allow the call but log the error
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP address
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      '127.0.0.1';
    
    // Check if IP is rate limited
    const [isLimited, remainingSeconds] = await checkRateLimit(ipAddress.split(',')[0]);
    
    if (isLimited) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded', 
          retryAfter: Math.ceil(remainingSeconds / 60) // Convert to minutes for user-friendly message
        },
        { status: 429 }
      );
    }
    
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
        'xi-api-key': process.env.ELEVENLABS_API_KEY || 'sk_d94f2950348df3ba0e76092bbcf1e9d51fa5fe66c8904317',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        'agent_id': process.env.ELEVEN_AGENT_ID || 'tLYQ1n0EtQQHx8lqbcPT',
        'agent_phone_number_id': process.env.ELEVEN_AGENT_PHONE_NUMBER_ID || 'EcZm7zeCaXukBOPwwwSN',
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