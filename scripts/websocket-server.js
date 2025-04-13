#!/usr/bin/env node

/**
 * WebSocket Server for Twilio and ElevenLabs integration
 * 
 * This script starts a standalone WebSocket server that handles the communication
 * between Twilio and ElevenLabs. Run this alongside your Next.js application
 * in production environments.
 */

const http = require('http');
const WebSocket = require('ws');
const { URL } = require('url');
require('dotenv').config({ path: '.env.local' });

// Configuration
const PORT = process.env.WEBSOCKET_PORT || 8080;
const ELEVENLABS_AGENT_ID = process.env.ELEVEN_AGENT_ID;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_WS_URL = 'wss://api.elevenlabs.io/v1/agent/tts-stream';

// Create HTTP server
const server = http.createServer((req, res) => {
  // Simple health check endpoint
  if (req.url === '/health') {
    res.writeHead(200);
    res.end('WebSocket server is running');
    return;
  }
  
  // Not found for other routes
  res.writeHead(404);
  res.end();
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  console.log('New Twilio connection established');
  
  // Parse URL parameters
  const url = new URL(req.url, `http://${req.headers.host}`);
  const prompt = url.searchParams.get('prompt') || '';
  const firstMessage = url.searchParams.get('first_message') || '';
  const callSid = url.searchParams.get('CallSid') || 'unknown';
  
  // Create ElevenLabs WebSocket connection
  const elevenLabsParams = new URLSearchParams({
    agent_id: ELEVENLABS_AGENT_ID,
    input_audio_encoding: 'mulaw',
    output_audio_encoding: 'mulaw',
  });
  
  const elevenLabsWs = new WebSocket(`${ELEVENLABS_WS_URL}?${elevenLabsParams.toString()}`, {
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
    },
  });
  
  elevenLabsWs.on('open', () => {
    console.log(`[${callSid}] ElevenLabs connection established`);
    
    // Override system prompt if provided
    if (prompt) {
      elevenLabsWs.send(
        JSON.stringify({
          text: prompt,
          type: 'system_prompt_override',
        })
      );
    }
    
    // Send first message if provided
    if (firstMessage) {
      elevenLabsWs.send(
        JSON.stringify({
          text: firstMessage,
          type: 'first_message_override',
        })
      );
    }
    
    // Set up bidirectional communication
    // Forward Twilio -> ElevenLabs
    ws.on('message', (data) => {
      if (elevenLabsWs.readyState === WebSocket.OPEN) {
        elevenLabsWs.send(
          JSON.stringify({
            audio: data.toString('base64'),
            type: 'audio',
          })
        );
      }
    });
    
    // Forward ElevenLabs -> Twilio
    elevenLabsWs.on('message', (data) => {
      if (ws.readyState === WebSocket.OPEN) {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'audio') {
          const audio = Buffer.from(message.audio, 'base64');
          ws.send(audio);
        }
        
        if (message.type === 'transcript') {
          console.log(`[${callSid}] Transcript: ${message.text}`);
        }
      }
    });
  });
  
  // Handle errors and connection closure
  ws.on('error', (error) => {
    console.error(`[${callSid}] Twilio WebSocket error:`, error);
  });
  
  ws.on('close', (code, reason) => {
    console.log(`[${callSid}] Twilio connection closed: ${code} - ${reason}`);
    if (elevenLabsWs.readyState === WebSocket.OPEN) {
      elevenLabsWs.close();
    }
  });
  
  elevenLabsWs.on('error', (error) => {
    console.error(`[${callSid}] ElevenLabs WebSocket error:`, error);
  });
  
  elevenLabsWs.on('close', (code, reason) => {
    console.log(`[${callSid}] ElevenLabs connection closed: ${code} - ${reason}`);
    if (ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
}); 