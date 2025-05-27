import os
import json
import logging
import asyncio
import re
from uuid import uuid4
from datetime import datetime, timedelta
from collections import defaultdict

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import aiohttp

# Updated imports based on inspection results
from livekit.api import room_service, agent_dispatch_service as ad_svc
from livekit.api.agent_dispatch_service import CreateAgentDispatchRequest
from livekit.protocol import room as proto_room

# ─────────────────────── Configuração inicial ───────────────────────
load_dotenv(".env.local")
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
log = logging.getLogger("website_backend")

# LiveKit Configuration
LIVEKIT_URL = os.getenv("LIVEKIT_URL")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")

if not all([LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET]):
    log.critical("LiveKit URL/API Key/Secret not found. Backend cannot start.")
    exit(1)

AGENT_NAME = "outbound-agent"

# Security Configuration
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,https://chamada-ai.vercel.app").split(",")
MAX_REQUESTS_PER_IP = int(os.getenv("MAX_REQUESTS_PER_IP", "3"))
RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "86400"))  # 24 hours in seconds
ALLOWED_PERSONAS = ["restaurante", "clinica_dentaria", "vendedor", "clinica", "dentist", "sales", "custom"]

# ✅ SECURITY FIX: API Key authentication for production
PRODUCTION_API_KEY = os.getenv("PRODUCTION_API_KEY")
REQUIRE_API_KEY = os.getenv("FLASK_ENV") == "production"

# Simple in-memory rate limiting (use Redis in production)
request_counts = defaultdict(list)

app = Flask(__name__)
# ✅ SECURITY FIX: Restrict CORS to allowed origins only
CORS(app, origins=ALLOWED_ORIGINS, methods=['POST'], allow_headers=['Content-Type'])

def validate_phone_number(phone: str) -> str:
    """Validate and sanitize Portuguese phone number"""
    if not phone:
        raise ValueError("Phone number is required")
    
    # Remove all non-digit characters except +
    clean_phone = re.sub(r'[^\d+]', '', phone)
    
    # Validate Portuguese phone number format
    if clean_phone.startswith('+351'):
        if len(clean_phone) != 13:  # +351 + 9 digits
            raise ValueError("Invalid Portuguese phone number format")
    elif clean_phone.startswith('351'):
        if len(clean_phone) != 12:  # 351 + 9 digits
            raise ValueError("Invalid Portuguese phone number format")
        clean_phone = '+' + clean_phone
    elif len(clean_phone) == 9:
        clean_phone = '+351' + clean_phone
    else:
        raise ValueError("Invalid phone number format. Use Portuguese format (+351XXXXXXXXX)")
    
    return clean_phone

def validate_persona(persona: str) -> str:
    """Validate persona against whitelist"""
    if not persona:
        raise ValueError("Persona is required")
    
    if persona not in ALLOWED_PERSONAS:
        raise ValueError(f"Invalid persona. Allowed: {', '.join(ALLOWED_PERSONAS)}")
    
    return persona

def validate_customer_name(name: str) -> str:
    """Validate and sanitize customer name"""
    if not name:
        return "Website User"
    
    # Remove potentially dangerous characters
    clean_name = re.sub(r'[<>"\']', '', name.strip())
    
    if len(clean_name) > 100:
        raise ValueError("Customer name too long")
    
    return clean_name or "Website User"

def check_rate_limit(ip_address: str) -> bool:
    """Simple rate limiting check"""
    now = datetime.now()
    cutoff = now - timedelta(seconds=RATE_LIMIT_WINDOW)
    
    # Debug logging
    log.info(f"🔍 Rate limit check for IP: {ip_address}")
    log.info(f"🔍 Current requests for this IP: {len(request_counts[ip_address])}")
    log.info(f"🔍 Max allowed requests: {MAX_REQUESTS_PER_IP}")
    log.info(f"🔍 Time window: {RATE_LIMIT_WINDOW} seconds")
    
    # Clean old requests
    old_count = len(request_counts[ip_address])
    request_counts[ip_address] = [
        req_time for req_time in request_counts[ip_address] 
        if req_time > cutoff
    ]
    new_count = len(request_counts[ip_address])
    
    if old_count != new_count:
        log.info(f"🔍 Cleaned {old_count - new_count} old requests")
    
    # Check if limit exceeded
    if len(request_counts[ip_address]) >= MAX_REQUESTS_PER_IP:
        log.warning(f"🚫 Rate limit exceeded for IP: {ip_address} ({len(request_counts[ip_address])}/{MAX_REQUESTS_PER_IP})")
        return False
    
    # Add current request
    request_counts[ip_address].append(now)
    log.info(f"✅ Rate limit OK for IP: {ip_address} ({len(request_counts[ip_address])}/{MAX_REQUESTS_PER_IP})")
    return True

def get_client_ip():
    """Get client IP address safely"""
    # Check for forwarded headers (from proxy/load balancer)
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    elif request.headers.get('X-Real-IP'):
        return request.headers.get('X-Real-IP')
    else:
        return request.remote_addr

def run_async(coro):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)

@app.route('/api/start_call', methods=['POST'])
def start_call():
    try:
        # ✅ SECURITY FIX: API Key authentication for production
        log.info(f"DEBUG - start_call() called, REQUIRE_API_KEY = {REQUIRE_API_KEY}")
        
        if REQUIRE_API_KEY:
            log.info("DEBUG - API key authentication is REQUIRED")
            auth_header = request.headers.get('Authorization')
            log.info(f"DEBUG - Authorization header: {auth_header[:20] + '...' if auth_header else 'None'}")
            
            if not auth_header or not auth_header.startswith('Bearer '):
                log.warning("Missing or invalid Authorization header")
                return jsonify({"error": "Authentication required"}), 401
            
            provided_key = auth_header.replace('Bearer ', '')
            log.info(f"DEBUG - Provided key length: {len(provided_key) if provided_key else 0}")
            log.info(f"DEBUG - Expected key length: {len(PRODUCTION_API_KEY) if PRODUCTION_API_KEY else 0}")
            
            if not PRODUCTION_API_KEY or provided_key != PRODUCTION_API_KEY:
                log.warning("Invalid API key provided")
                return jsonify({"error": "Invalid authentication"}), 401
            
            log.info("DEBUG - API key authentication PASSED")
        else:
            log.info("DEBUG - API key authentication is NOT required")

        # ✅ SECURITY: Rate limiting
        client_ip = get_client_ip()
        if not check_rate_limit(client_ip):
            log.warning(f"Rate limit exceeded for IP: {client_ip}")
            return jsonify({
                "error": "Rate limit exceeded", 
                "message": "Too many requests. Please try again later."
            }), 429

        # ✅ SECURITY: Validate request data exists
        if not request.is_json:
            return jsonify({"error": "Content-Type must be application/json"}), 400
        
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400

        # ✅ SECURITY: Input validation and sanitization
        try:
            phone_number = validate_phone_number(data.get('phone_number'))
            persona = validate_persona(data.get('persona'))
            customer_name = validate_customer_name(data.get('customer_name', ''))
            
            # Handle custom persona
            custom_prompt = None
            if persona == "custom":
                custom_prompt = data.get('custom_prompt', '').strip()
                if not custom_prompt:
                    raise ValueError("Custom prompt is required when using custom persona")
                if len(custom_prompt) > 500:  # Reasonable limit
                    raise ValueError("Custom prompt too long (max 500 characters)")
                    
        except ValueError as e:
            log.warning(f"Invalid input from IP {client_ip}: {str(e)}")
            return jsonify({"error": str(e)}), 400

        # ✅ SECURITY: Log without sensitive data
        log.info(f"Valid call request from IP: {client_ip}, Persona: {persona}")

        # Run async function to handle LiveKit API calls
        result = run_async(handle_livekit_call(persona, phone_number, customer_name, custom_prompt))
        return jsonify(result), 200
        
    except Exception as e:
        log.error(f"Unexpected error: {str(e)}", exc_info=True)
        return jsonify({
            "error": "Internal server error", 
            "message": "Please try again later"
        }), 500

async def handle_livekit_call(persona, phone_number, customer_name, custom_prompt=None):
    """
    Handles the async LiveKit API calls using proper session management.
    """
    async with aiohttp.ClientSession() as session:
        # Create a RoomService instance directly
        rs = room_service.RoomService(session, LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
        
        # Create a unique room for the call
        room_name = f"call_{persona}_{uuid4().hex[:8]}"
        create_room_request = proto_room.CreateRoomRequest(name=room_name)
        
        log.info(f"Creating room: {room_name}")
        livekit_room = await rs.create_room(create_room_request)
        log.info(f"✅ LiveKit room created: {livekit_room.name}")

        # Prepare metadata for the agent (without logging sensitive data)
        job_metadata = {
            "phone_number": phone_number,
            "persona": persona,
            "customer_name": customer_name,
            "website_request_id": str(uuid4())
        }
        
        # Add custom prompt if provided
        if custom_prompt:
            job_metadata["custom_prompt"] = custom_prompt
            
        metadata_str = json.dumps(job_metadata)
        log.info(f"Dispatching job for persona: {persona}")

        # Use the AgentDispatchService - a higher-level client that handles protobuf encoding
        agent_client = ad_svc.AgentDispatchService(
            session, LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
        )

        # Create a proper protobuf request object
        dispatch_req = CreateAgentDispatchRequest(
            room=livekit_room.name,
            agent_name=AGENT_NAME,
            metadata=metadata_str
        )
        
        # Call the service with the proper request object
        dispatched_job = await agent_client.create_dispatch(dispatch_req)
        log.info(f"✅ Job dispatched: {dispatched_job.id} to agent '{AGENT_NAME}'")

        return {
            "message": "Call initiated successfully.",
            "room_name": livekit_room.name,
            "job_id": dispatched_job.id
        }

if __name__ == '__main__':
    log.info("Starting Flask backend server for LiveKit call initiation.")
    log.info(f"🔧 Rate limiting config: {MAX_REQUESTS_PER_IP} requests per {RATE_LIMIT_WINDOW} seconds")
    log.info(f"🔧 Production mode: {REQUIRE_API_KEY}")
    log.info(f"🔧 Allowed origins: {ALLOWED_ORIGINS}")
    app.run(host='0.0.0.0', port=5001, debug=False) 