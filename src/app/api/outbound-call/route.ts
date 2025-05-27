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

/**
 * DEPRECATED: This endpoint is deprecated for security reasons.
 * Use /api/start_call instead which provides better security and routing.
 */
export async function POST(request: NextRequest) {
  console.warn('DEPRECATED: /api/outbound-call endpoint called. Use /api/start_call instead.');
  
  return NextResponse.json({
    success: false,
    error: 'This endpoint is deprecated',
    message: 'Please use /api/start_call instead for better security and functionality.',
    redirect: '/api/start_call'
  }, { status: 410 }); // 410 Gone - indicates the resource is no longer available
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'This endpoint is deprecated. Use /api/start_call for call requests.',
    documentation: 'See SECURITY_ENVIRONMENT.md for proper usage.'
  }, { status: 410 });
} 