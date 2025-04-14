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
    // Log the IP we're checking
    console.log(`Checking rate limit for IP: ${ipAddress}`);
    
    // Get current time
    const now = Math.floor(Date.now() / 1000);
    
    // Check if IP exists in the rate_limits table
    console.log('Querying rate_limits table');
    const { data, error } = await supabase
      .from('rate_limits')
      .select('last_call_time')
      .eq('ip_address', ipAddress)
      .single();
    
    // Log query results
    console.log('Query result:', { data, error });
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Supabase query error:', error);
      return [false, 0]; // On error, allow the call but log the error
    }
    
    if (data) {
      const lastCallTime = data.last_call_time;
      const timeSinceLastCall = now - lastCallTime;
      
      console.log(`Last call time: ${new Date(lastCallTime * 1000).toISOString()}`);
      console.log(`Time since last call: ${timeSinceLastCall} seconds`);
      
      if (timeSinceLastCall < RATE_LIMIT_WINDOW) {
        // IP is rate limited
        const remainingTime = RATE_LIMIT_WINDOW - timeSinceLastCall;
        console.log(`IP is rate limited. ${remainingTime} seconds remaining.`);
        return [true, remainingTime];
      }
      
      // Update last call time for existing record
      console.log('Updating existing record');
      const { error: updateError } = await supabase
        .from('rate_limits')
        .update({ last_call_time: now })
        .eq('ip_address', ipAddress);
        
      if (updateError) {
        console.error('Error updating record:', updateError);
      } else {
        console.log('Record updated successfully');
      }
        
      return [false, 0];
    } else {
      // Insert new record for IP
      console.log('Inserting new record');
      const { error: insertError } = await supabase
        .from('rate_limits')
        .insert([{ ip_address: ipAddress, last_call_time: now }]);
        
      if (insertError) {
        console.error('Error inserting record:', insertError);
      } else {
        console.log('Record inserted successfully');
      }
        
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
    
    // Check if rate limiting is enabled (Supabase is configured)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const rateLimit = supabaseUrl && supabaseAnonKey;
    
    // Only check rate limit if Supabase is configured
    if (rateLimit) {
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
    } else {
      console.log('Rate limiting disabled - Supabase not configured');
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