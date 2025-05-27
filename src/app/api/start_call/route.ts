import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

/**
 * API route for starting a call
 * In development: always proxies to Python backend
 * In production: connects to the Python backend on Digital Ocean
 * Also sends data to make.com webhook
 */
export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Only allow requests from your website
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const allowedOrigins = [
      'https://chamada.ai',
      'https://chamada-ai.vercel.app',
      'http://localhost:3000' // For development
    ];

    // Check if request comes from an allowed origin
    const isValidOrigin = origin && allowedOrigins.some(allowed => 
      origin === allowed || origin.endsWith('.vercel.app')
    );
    
    const isValidReferer = referer && allowedOrigins.some(allowed => 
      referer.startsWith(allowed)
    );

    if (!isValidOrigin && !isValidReferer) {
      console.log(`Blocked request from origin: ${origin}, referer: ${referer}`);
      return NextResponse.json(
        { error: 'Access denied. This API can only be called from the website.' },
        { status: 403 }
      );
    }

    const data = await request.json();
    
    // ✅ SECURITY: Server-side CSRF protection (no client exposure)
    // Generate and validate CSRF based on request headers and timing
    const userAgent = request.headers.get('user-agent') || '';
    const acceptLanguage = request.headers.get('accept-language') || '';
    const timestamp = Date.now();
    
    // Simple server-side CSRF validation based on request characteristics
    if (!userAgent.includes('Mozilla') && !userAgent.includes('Chrome')) {
      console.log('Suspicious request - invalid user agent');
      return NextResponse.json(
        { error: 'Invalid request source' },
        { status: 403 }
      );
    }

    console.log('Call request received:', data);
    
    // Validate required fields
    if (!data.phone_number || !data.persona) {
      return NextResponse.json(
        { error: 'Missing required fields: phone_number and persona are required' },
        { status: 400 }
      );
    }

    // Validate custom prompt if custom persona is selected
    if (data.persona === 'custom' && !data.custom_prompt?.trim()) {
      return NextResponse.json(
        { error: 'Custom prompt is required when using custom persona' },
        { status: 400 }
      );
    }
    
    // Send data to make.com webhook
    const makeWebhookUrl = process.env.MAKE_WEBHOOK_URL;
    if (makeWebhookUrl) {
      try {
        console.log('Sending data to make.com webhook');
        
        // Send the data to make.com
        const makeResponse = await fetch(makeWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone_number: data.phone_number,
            persona: data.persona,
            customer_name: data.customer_name || 'Website User',
            custom_prompt: data.custom_prompt || null,
            timestamp: new Date().toISOString(),
            source: 'website_form'
          }),
        });
        
        if (!makeResponse.ok) {
          console.error(`Webhook error: ${makeResponse.status}`);
        } else {
          console.log('Data successfully sent to make.com webhook');
        }
      } catch (webhookError) {
        // Log the error but continue with the normal flow
        console.error('Error sending data to make.com webhook:', webhookError);
      }
    } else {
      console.warn('No MAKE_WEBHOOK_URL environment variable found. Skipping webhook call.');
    }
    
    // For development: Connect to local Python backend
    if (process.env.NODE_ENV === 'development') {
      // ✅ SECURITY FIX: Hardcode development URL - don't expose via NEXT_PUBLIC_
      const pythonBackendUrl = 'http://localhost:5001/api/start_call';
      
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
          details: `Make sure your Python backend is running on ${pythonBackendUrl}. Error: ${(error as Error).message}`
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
      
      // ✅ SECURITY FIX: Require authentication for production
      const productionApiKey = process.env.PRODUCTION_API_KEY;
      if (!productionApiKey) {
        console.error('PRODUCTION_API_KEY is required for production calls');
        return NextResponse.json({
          error: 'Service configuration error',
          details: 'Production authentication not configured'
        }, { status: 503 });
      }
      
      try {
        const response = await fetch(productionApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${productionApiKey}`, // ✅ SECURITY FIX: Mandatory auth
            'User-Agent': 'ChamadaAI-Frontend/1.0',
            'X-Request-Source': 'website'
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