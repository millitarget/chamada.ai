import os
import json
import logging
import asyncio
from uuid import uuid4

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

app = Flask(__name__)
CORS(app)

def run_async(coro):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)

@app.route('/api/start_call', methods=['POST'])
def start_call():
    data = request.get_json()
    phone_number = data.get('phone_number')
    persona = data.get('persona')
    customer_name = data.get('customer_name', 'Website User')

    if not phone_number or not persona:
        return jsonify({"error": "Phone number and persona are required"}), 400

    log.info(f"Received call request: Phone={phone_number}, Persona={persona}, Name={customer_name}")

    try:
        # Run async function to handle LiveKit API calls
        result = run_async(handle_livekit_call(persona, phone_number, customer_name))
        return jsonify(result), 200
    except Exception as e:
        log.error(f"An unexpected error occurred: {str(e)}", exc_info=True)
        return jsonify({"error": "An unexpected error occurred", "details": str(e)}), 500

async def handle_livekit_call(persona, phone_number, customer_name):
    """
    Handles the async LiveKit API calls using proper session management.
    """
    async with aiohttp.ClientSession() as session:
        # Create a RoomService instance directly
        rs = room_service.RoomService(session, LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
        
        # Create a unique room for the call
        room_name = f"call_{persona}_{uuid4().hex[:8]}"
        create_room_request = proto_room.CreateRoomRequest(name=room_name)
        
        log.info(f"Attempting to create room: {room_name}")
        livekit_room = await rs.create_room(create_room_request)
        log.info(f"Successfully created LiveKit room: {livekit_room.name} (SID: {livekit_room.sid})")

        # Prepare metadata for the agent
        job_metadata = {
            "phone_number": phone_number,
            "persona": persona,
            "customer_name": customer_name,
            "website_request_id": str(uuid4())
        }
        metadata_str = json.dumps(job_metadata)
        log.info(f"Dispatching job with metadata: {metadata_str}")

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
        log.info(f"Successfully dispatched job {dispatched_job.id} to agent '{AGENT_NAME}' in room '{livekit_room.name}'")

        return {
            "message": "Call initiated successfully.",
            "room_name": livekit_room.name,
            "job_id": dispatched_job.id
        }

if __name__ == '__main__':
    log.info("Starting Flask backend server for LiveKit call initiation.")
    app.run(host='0.0.0.0', port=5001, debug=True) 