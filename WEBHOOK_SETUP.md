# Webhook Transcript Setup Guide

## Overview
The agent now automatically captures complete conversation transcripts and sends them to a Make.com webhook when each call ends.

## Environment Variables Required

Add these variables to your `.env.local` file:

```bash
# Make.com Webhook Configuration
MAKE_WEBHOOK_URL=https://hook.eu1.make.com/your-webhook-id
MAKE_WEBHOOK_SECRET=your_optional_webhook_secret_for_auth
WEBHOOK_TIMEOUT=30
WEBHOOK_RETRIES=3
```

## Quick Start

1. **Add webhook URL** to your `.env.local` file
2. **Test the integration** before going live:
   ```bash
   python test_webhook.py
   ```
3. **Make a real test call** to verify end-to-end
4. **Check Make.com** for received data

## Testing Your Setup

We've included a test script to verify your webhook works correctly:

```bash
# Run the webhook test
python test_webhook.py
```

The test will:
- ✅ Check your environment configuration
- ✅ Send a sample transcript to your webhook
- ✅ Verify the response from Make.com
- ✅ Show you exactly what data will be sent

Example output:
```
🔧 WEBHOOK TRANSCRIPT TEST
============================================================

🧪 Testing webhook functionality...

🔗 Webhook URL: https://hook.eu1.make.com/abc123
📋 Sample transcript data:
   - Conversation items: 4
   - Duration: 330.0 seconds
   - Persona: clinica
   - Customer: João Silva (Teste)

📤 Sending test webhook...
✅ Transcript enviado com sucesso para Make.com - Status: 200
✅ TEST PASSED! Webhook delivered successfully
🎉 Your Make.com integration is working correctly

============================================================
✅ ALL TESTS PASSED - Ready for production!
============================================================
```

## Webhook Payload Structure

The webhook will receive a JSON payload with this structure:

```json
{
  "call_metadata": {
    "call_id": "unique_call_identifier",
    "room_name": "livekit_room_name",
    "persona": "clinica|vendedor|default",
    "phone_number": "+351933792547",
    "customer_name": "João Silva",
    "start_time": "2024-01-15T10:30:00+01:00",
    "end_time": "2024-01-15T10:35:30+01:00",
    "duration_seconds": 330,
    "call_outcome": "completed"
  },
  "transcript": {
    "full_conversation": {
      "items": [
        {
          "id": "item_123",
          "type": "message",
          "role": "assistant",
          "content": "Olá! Como posso ajudar?",
          "timestamp": "2024-01-15T10:30:15+01:00"
        },
        {
          "id": "item_124", 
          "type": "message",
          "role": "user",
          "content": "Gostaria de marcar uma consulta",
          "timestamp": "2024-01-15T10:30:25+01:00"
        }
      ]
    },
    "conversation_items": "...",
    "total_items": 15
  },
  "analytics": {
    "total_turns": 15,
    "timestamp_utc": "2024-01-15T09:35:30Z"
  },
  "technical": {
    "agent_version": "1.0",
    "model_used": "gpt-4o-realtime-preview",
    "livekit_session": true
  }
}
```

## Make.com Setup

1. **Create a new scenario** in Make.com
2. **Add a Webhook trigger** 
3. **Copy the webhook URL** to `MAKE_WEBHOOK_URL`
4. **Configure your workflow** to process the transcript data
5. **Test with `test_webhook.py`** to verify connection
6. **Make a test call** to verify real data flow

## Features

✅ **Automatic transcript capture** - No manual intervention needed
✅ **Complete conversation history** - Every turn of the conversation
✅ **Rich metadata** - Call details, duration, persona info
✅ **Reliable delivery** - Retry logic with exponential backoff
✅ **Error handling** - Graceful failure with detailed logging
✅ **Performance optimized** - Sent asynchronously after call ends
✅ **Easy testing** - Built-in test script for verification

## Error Handling

The system includes robust error handling:

- **3 retry attempts** with exponential backoff (1s, 2s, 4s)
- **30-second timeout** per attempt (configurable)
- **Detailed logging** for troubleshooting
- **Graceful failure** - Call success not affected by webhook issues

## Monitoring

Check your logs for webhook status:

```
✅ Transcript enviado com sucesso para Make.com - Status: 200
❌ Webhook falhou com status 400: Invalid payload
⏰ Timeout na tentativa 1 - webhook demorou mais de 30s
🔌 Erro de conexão na tentativa 2: Connection refused
```

## Troubleshooting

### Common Issues

**❌ "MAKE_WEBHOOK_URL não configurado"**
- Add your webhook URL to `.env.local`
- Restart the agent after changes

**❌ "Webhook falhou com status 400"**
- Check your Make.com scenario configuration
- Verify the webhook URL is correct

**❌ "Connection refused"** 
- Check your internet connection
- Verify the webhook URL is accessible

**❌ "Timeout after 30s"**
- Your Make.com scenario might be taking too long
- Consider increasing `WEBHOOK_TIMEOUT`

### Testing Steps

1. **Environment test**: `python test_webhook.py`
2. **Real call test**: Make a short test call
3. **Make.com verification**: Check your scenario received data
4. **Log review**: Check agent logs for any errors

## Next Steps

1. Add your webhook URL to `.env.local`
2. Run `python test_webhook.py` to verify setup
3. Restart your agent
4. Make a test call
5. Check Make.com for the received data
6. Build your workflow to process transcripts

## Security Notes

- Use `MAKE_WEBHOOK_SECRET` for webhook authentication
- Ensure your Make.com scenario validates the payload
- Consider rate limiting on your webhook endpoint
- Review data retention policies for transcripts 