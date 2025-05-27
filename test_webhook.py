#!/usr/bin/env python3
"""
Test script to verify webhook functionality for transcript delivery
Run this to test your webhook setup before using with real calls
"""

import asyncio
import json
import os
from datetime import datetime
from dotenv import load_dotenv
from zoneinfo import ZoneInfo

# Import webhook functions from our agent
from outbound_agent import send_transcript_webhook

# Load environment variables
load_dotenv(".env.local")

async def test_webhook():
    """Test the webhook with sample data"""
    
    print("🧪 Testing webhook functionality...\n")
    
    # Check if webhook URL is configured
    webhook_url = os.getenv("MAKE_WEBHOOK_URL")
    if not webhook_url:
        print("❌ MAKE_WEBHOOK_URL not configured in .env.local")
        print("Please add your Make.com webhook URL to test")
        return False
    
    print(f"🔗 Webhook URL: {webhook_url}")
    
    # Create sample call metadata
    call_metadata = {
        "call_id": "test_call_123",
        "room_name": "test_room_456",
        "persona": "clinica",
        "phone_number": "+351933792547",
        "customer_name": "João Silva (Teste)",
        "job_metadata": {
            "persona": "clinica",
            "test_mode": True
        }
    }
    
    # Create sample transcript data (simulating session.history.to_dict())
    transcript_data = {
        "items": [
            {
                "id": "item_001",
                "type": "message",
                "role": "assistant",
                "content": "Olá João Silva, da Clínica Sorriso. Como posso ajudar?",
                "timestamp": "2024-01-15T10:30:00+01:00"
            },
            {
                "id": "item_002",
                "type": "message", 
                "role": "user",
                "content": "Gostaria de marcar uma consulta dentária",
                "timestamp": "2024-01-15T10:30:15+01:00"
            },
            {
                "id": "item_003",
                "type": "message",
                "role": "assistant", 
                "content": "Claro! Que tipo de consulta precisa? Temos disponibilidade esta semana.",
                "timestamp": "2024-01-15T10:30:30+01:00"
            },
            {
                "id": "item_004",
                "type": "message",
                "role": "user",
                "content": "Uma limpeza dentária, por favor.",
                "timestamp": "2024-01-15T10:30:45+01:00"
            }
        ],
        "conversation_id": "conv_test_123",
        "total_items": 4
    }
    
    # Create timestamps
    session_start_time = datetime.now(ZoneInfo("Europe/Lisbon")).replace(second=0, microsecond=0)
    session_end_time = session_start_time.replace(minute=session_start_time.minute + 5, second=30)
    
    print("📋 Sample transcript data:")
    print(f"   - Conversation items: {len(transcript_data['items'])}")
    print(f"   - Duration: {(session_end_time - session_start_time).total_seconds()} seconds")
    print(f"   - Persona: {call_metadata['persona']}")
    print(f"   - Customer: {call_metadata['customer_name']}")
    print()
    
    # Test webhook delivery
    print("📤 Sending test webhook...")
    try:
        success = await send_transcript_webhook(
            call_metadata=call_metadata,
            transcript_data=transcript_data,
            session_start_time=session_start_time,
            session_end_time=session_end_time
        )
        
        if success:
            print("✅ TEST PASSED! Webhook delivered successfully")
            print("🎉 Your Make.com integration is working correctly")
            return True
        else:
            print("❌ TEST FAILED! Webhook delivery failed")
            print("💡 Check your Make.com scenario and webhook URL")
            return False
            
    except Exception as e:
        print(f"💥 TEST ERROR: {str(e)}")
        return False

def main():
    """Main test function"""
    print("=" * 60)
    print("🔧 WEBHOOK TRANSCRIPT TEST")
    print("=" * 60)
    print()
    
    # Run the async test
    result = asyncio.run(test_webhook())
    
    print()
    print("=" * 60)
    if result:
        print("✅ ALL TESTS PASSED - Ready for production!")
    else:
        print("❌ TESTS FAILED - Check configuration")
    print("=" * 60)

if __name__ == "__main__":
    main() 