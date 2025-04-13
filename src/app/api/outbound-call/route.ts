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
        'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjcxMTE1MjM1YTZjNjE0NTRlZmRlZGM0NWE3N2U0MzUxMzY3ZWViZTAiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoibnVubyBzZXF1ZWlyYSIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NMaGlVM3NRZU1XQk9qdHFDdVNDTmhCOUZzM2x0VXU1NjRVOEtwZ3VER2w9czk2LWMiLCJ3b3Jrc3BhY2VfaWQiOiJjNzZhM2EwNTBlYmM0OGU0YmJiN2FmMWU3ZGUwMzAxNCIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS94aS1sYWJzIiwiYXVkIjoieGktbGFicyIsImF1dGhfdGltZSI6MTcxNDIxMDkwMCwidXNlcl9pZCI6IlBHQzNnWDVYYUdUUUFRZXBLczlYNFNzbFlPMTMiLCJzdWIiOiJQR0MzZ1g1WGFHVFFBUWVwS3M5WDRTc2xZTzEzIiwiaWF0IjoxNzQ0NTQ0NDc3LCJleHAiOjE3NDQ1NDgwNzcsImVtYWlsIjoicmVhbG1hZHJpZG51bm9AZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZ29vZ2xlLmNvbSI6WyIxMDk3MDYwMTIxOTU0OTIwMDgwNzYiXSwiZW1haWwiOlsicmVhbG1hZHJpZG51bm9AZ21haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoiZ29vZ2xlLmNvbSJ9fQ.gbRS_-qVcW84iDZJQTcdADJvsNyts9ZliNaZEzII7pyGNi2_4qeq6JN1oQwkaSRBgI2v6P7W9ZAARLBgTrFcGx8gi_dS6xt27VzebzrsVc7rJSIQuyYTG4wowd2SfIP1UTg-gQfpCjBT-ZqWupGqhr4Xg0G8cOShhfY6IT14yK1lWsrqN3gCbV2rtoYSB-5DHNx2sbTc0qWWdxMTcNrRr92ACP0gxeSei7NTE-jJHrAAy8t_MRGCrax2MP1wbnT-7DmYweMe2E9JMMCaoayBwfGb86_B0ft_1Q1tFXJWXZ8yUUjf3yDeFCqEg0zsCxIXWd7ZIb4d6ZTY8OVzrfe1QQ',
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