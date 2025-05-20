import { NextResponse } from 'next/server';

/**
 * API route for starting a call
 * In development: always proxies to Python backend
 * In production: connects to the Python backend on Digital Ocean
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Log the incoming request
    console.log('Call request received:', data);
    
    // Validate required fields
    if (!data.phone_number || !data.persona) {
      return NextResponse.json(
        { error: 'Missing required fields: phone_number and persona are required' },
        { status: 400 }
      );
    }
    
    // For development: Connect to local Python backend
    if (process.env.NODE_ENV === 'development') {
      // Use environment variable or fallback to localhost:5001
      const pythonBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001';
      const pythonBackendUrl = `${pythonBaseUrl}/api/start_call`;
      
      console.log('Proxying to local Python backend:', pythonBackendUrl);
      
      try {
        const response = await fetch(pythonBackendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          throw new Error(`Backend returned status ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Python backend response:', result);
        return NextResponse.json(result, { status: response.status });
      } catch (error) {
        console.error('Error connecting to local Python backend:', error);
        return NextResponse.json({
          error: 'Failed to connect to Python backend service',
          details: `Make sure your Python backend is running on ${pythonBaseUrl}. Error: ${(error as Error).message}`
        }, { status: 502 });
      }
    }
    
    // PRODUCTION CONFIGURATION (Digital Ocean):
    // The PRODUCTION_API_URL should be set to your Digital Ocean droplet URL
    // Example: PRODUCTION_API_URL=http://123.456.789.0/api/start_call
    // or if you have a domain: PRODUCTION_API_URL=https://api.chamada.ai/api/start_call
    
    // Get the production API URL (Digital Ocean droplet)
    const productionApiUrl = process.env.PRODUCTION_API_URL;
    
    // If the production API URL is configured, use it
    if (productionApiUrl) {
      console.log('Connecting to production backend on Digital Ocean:', productionApiUrl);
      
      try {
        const response = await fetch(productionApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Add authorization if your Digital Ocean server requires it
            ...(process.env.PRODUCTION_API_KEY && {
              'Authorization': `Bearer ${process.env.PRODUCTION_API_KEY}`
            })
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Production backend error:', response.status, errorText);
          throw new Error(`Digital Ocean backend returned status ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Digital Ocean backend response:', result);
        return NextResponse.json(result, { status: response.status });
      } catch (error) {
        console.error('Error connecting to Digital Ocean backend:', error);
        return NextResponse.json({
          error: 'Failed to connect to call service',
          details: 'Could not connect to the Digital Ocean server. Please check server logs or try again later.'
        }, { status: 503 });
      }
    }
    
    // No production URL configured
    console.warn('No PRODUCTION_API_URL environment variable found. Returning mock response.');
    return NextResponse.json({
      message: 'Pedido de chamada recebido com sucesso!',
      details: 'Para ativar chamadas reais em produção, configure a variável de ambiente PRODUCTION_API_URL no Vercel para apontar para o seu servidor Digital Ocean.',
      data: {
        scheduled: true,
        phone: data.phone_number,
        agent: data.persona,
        mock: true
      }
    });
  } catch (error) {
    console.error('Error processing call request:', error);
    return NextResponse.json(
      { error: 'Failed to process call request', details: (error as Error).message },
      { status: 500 }
    );
  }
} 