from __future__ import annotations

import asyncio
import logging
import os
import json
from datetime import datetime
from typing import Optional, Dict, Any
from dotenv import load_dotenv
from livekit import api, rtc
from livekit.agents import Agent, AgentSession, JobContext, cli, WorkerOptions, WorkerType
from livekit.plugins import openai
from openai.types.beta.realtime.session import TurnDetection

# Import prompt builders
from prompts.common_prompts import build_common_system_prompt, build_common_greeting
from prompts.clinic_prompts import build_clinic_prompt, build_clinic_greeting
from prompts.sales_prompts import build_sales_prompt, build_sales_greeting

# ─────────────────────── Configuração inicial ───────────────────────
load_dotenv(".env.local")
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
log = logging.getLogger("agent_outbound")

# ─────────────────────── Constantes configuráveis ───────────────────────
SIP_TRUNK_ID = "ST_SSjcbMkbf6nB"  # Same SIP trunk ID
CALLER_ID = "+351210607606"  # Twilio number from outbound-trunk.json

# Validate environment variables
LIVEKIT_URL = os.getenv("LIVEKIT_URL")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")

if not LIVEKIT_URL:
    log.warning("LIVEKIT_URL não definido no arquivo .env.local")
if not LIVEKIT_API_KEY or not LIVEKIT_API_SECRET:
    log.warning("LIVEKIT_API_KEY ou LIVEKIT_API_SECRET não definidos no arquivo .env.local")

# ─────────────────────── System Prompt Builders ───────────────────────
async def get_system_prompt(metadata: Dict[str, Any]) -> str:
    """
    Select and build the appropriate system prompt based on persona in metadata
    """
    persona = metadata.get("persona", "default")
    log.info(f"Building system prompt for persona: {persona}")
    
    # Initial data that might be needed for certain personas (could be expanded)
    initial_data = {}
    
    if persona == "clinica" or persona == "dentist":
        # For dental clinic use case
        return await build_clinic_prompt(initial_data, metadata)
    elif persona == "vendedor" or persona == "sales":
        # For sales representative use case
        return await build_sales_prompt(initial_data, metadata)
    else:
        # Default to common prompt for any other persona
        return await build_common_system_prompt(initial_data, metadata)

async def get_initial_greeting(metadata: Dict[str, Any]) -> str:
    """
    Select and build the appropriate greeting based on persona in metadata
    """
    persona = metadata.get("persona", "default")
    log.info(f"Building greeting for persona: {persona}")
    
    if persona == "clinica" or persona == "dentist":
        return await build_clinic_greeting(metadata)
    elif persona == "vendedor" or persona == "sales":
        return await build_sales_greeting(metadata)
    else:
        return await build_common_greeting(metadata)

# ─────────────────────── Entrypoint LiveKit ───────────────────────
async def entrypoint(ctx: JobContext):
    """Ponto de entrada principal do agente adaptável para diferentes personas"""
    try:
        log.info(f"Received job: id={ctx.job.id}, room={ctx.room.name}")

        # Extract metadata
        try:
            metadata = json.loads(ctx.job.metadata) if ctx.job.metadata else {}
            log.info(f"✅ METADATA: {metadata}")
        except json.JSONDecodeError as e:
            log.warning(f"Invalid metadata JSON format: {e}. Using empty metadata.")
            metadata = {}

        # Extract persona and customer information
        persona = metadata.get("persona", "default")
        phone_number = metadata.get("phone_number", "+351933792547")  # Include fallback
        customer_name = metadata.get("customer_name", "Website User")
        
        log.info(f"Using persona: {persona}")
        log.info(f"Phone number: {phone_number}")
        log.info(f"Customer name: {customer_name}")

        # Configure realtime model
        log.debug("Configuring realtime model")
        realtime_model = openai.realtime.RealtimeModel(
            model="gpt-4o-realtime-preview",
            voice="alloy",  # Better for Portuguese
            temperature=0.7,
            turn_detection=TurnDetection(
                type="semantic_vad",
                eagerness="auto",
                create_response=True,
                interrupt_response=True,
            ),
        )

        # Build the system prompt based on the persona
        system_prompt = await get_system_prompt(metadata)
        agent = Agent(instructions=system_prompt)
        session = AgentSession(llm=realtime_model)

        # 1. First, connect to LiveKit room
        log.debug("Connecting to room")
        await ctx.connect()
        log.info("Connected to room successfully")

        # 2. Initiate outbound call BEFORE starting the agent session
        log.info(f"Dialing {phone_number}...")
        try:
            formatted_phone = phone_number.replace("tel:", "") if phone_number.startswith("tel:") else phone_number
            log.info(f"Attempting SIP call: trunk={SIP_TRUNK_ID}, to={formatted_phone}, from={CALLER_ID}")
            await ctx.api.sip.create_sip_participant(
                api.CreateSIPParticipantRequest(
                    sip_trunk_id=SIP_TRUNK_ID,
                    sip_call_to=formatted_phone,
                    room_name=ctx.room.name,
                    participant_identity=f"sip_{formatted_phone.replace('+', '')}",
                    wait_until_answered=True,
                    krisp_enabled=True
                )
            )
            log.info("SIP call initiated successfully")
        except Exception as e:
            log.error(f"Failed to initiate outbound call: {str(e)}")
            log.error(f"Call parameters: trunk={SIP_TRUNK_ID}, phone={formatted_phone}, room={ctx.room.name}")
            if hasattr(e, 'metadata') and e.metadata:
                log.error(f"Error metadata: {e.metadata}")
            raise

        # 3. Start agent session AFTER call is initiated
        log.info("Starting agent session")
        await session.start(agent, room=ctx.room)
        log.info("Agent session started successfully")

        # 4. Send greeting based on the persona
        initial_greeting = await get_initial_greeting(metadata)
        
        log.info(f"Call connected, sending initial greeting: '{initial_greeting}'")
        await session.generate_reply(
            instructions=f"Diz apenas '{initial_greeting}' e espera pela resposta."
        )
        
        log.info("Initial greeting sent, waiting for client response")

    except Exception as e:
        log.error(f"Erro fatal no entrypoint: {str(e)}", exc_info=True)
        raise

# ─────────────────────── Run worker ───────────────────────
if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(entrypoint_fnc=entrypoint, worker_type=WorkerType.ROOM, agent_name="outbound-agent")
    )