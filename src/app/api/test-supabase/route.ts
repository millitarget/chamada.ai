import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Print environment variables (without revealing secret values)
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Supabase Anon Key configured:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    // Direct test - try to insert a test record
    try {
      const testIp = 'test-ip-' + Date.now();
      const now = Math.floor(Date.now() / 1000);
      
      // Try to insert a test record
      const { data, error } = await supabase
        .from('rate_limits')
        .insert([{ ip_address: testIp, last_call_time: now }])
        .select();
      
      if (error) {
        if (error.code === '42P01') { // Table doesn't exist
          return NextResponse.json({
            success: false,
            error: 'Rate limits table does not exist',
            details: error,
            message: 'You need to create the rate_limits table in Supabase'
          }, { status: 404 });
        }
        
        return NextResponse.json({
          success: false,
          error: 'Failed to insert test record',
          details: error,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          supabaseKeyConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Successfully connected to Supabase and inserted test record',
        data
      });
      
    } catch (error) {
      console.error('Test insert error:', error);
      return NextResponse.json({
        success: false,
        error: 'Error testing Supabase connection',
        details: error instanceof Error ? error.message : String(error),
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKeyConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Supabase test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to test Supabase connection',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 