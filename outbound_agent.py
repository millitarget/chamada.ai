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
from zoneinfo import ZoneInfo

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

# ─────────────────────── Embedded Prompt Definitions ───────────────────────
# Common prompt definitions
BASE_AGENT_INSTRUCTIONS = (
    "Você é um assistente de IA conversacional amigável e útil. "
    "Seja conciso e direto ao ponto, a menos que seja solicitado o contrário. "
    "NUNCA invente respostas. Se você não sabe a resposta, diga que não sabe. "
    "SEMPRE use EXCLUSIVAMENTE Português de Portugal (não do Brasil) em todas as interações. "
    "Use expressões, vocabulário e construções frásicas típicas de Portugal, NUNCA do Brasil. "
    "Evite termos brasileiros como 'você' (prefira 'tu' ou o formal 'o senhor/a senhora'), 'legal', 'a gente', etc. "
    "Prefira dizer 'casa de banho' em vez de 'banheiro', 'autocarro' em vez de 'ônibus', 'pequeno-almoço' em vez de 'café da manhã'. "
)

# Common prompts
async def build_common_system_prompt(initial_data: Dict[str, Any], metadata: Dict[str, Any]) -> str:
    """
    Builds a generic system prompt for the selected persona for Phase 1.
    """
    persona_key = metadata.get("persona", "assistente virtual") # e.g. "restaurante", "clinica", "vendedor"
    customer_name = metadata.get("customer_name", "utilizador")

    # Determine a more descriptive name for the persona if available
    persona_display_names = {
        "restaurante": "agente de apoio a restaurantes",
        "clinica": "agente de apoio a clínicas dentárias",
        "vendedor": "agente de vendas",
        "assistente virtual": "assistente virtual"
    }
    persona_display_name = persona_display_names.get(persona_key, "assistente virtual")

    prompt = f"""O seu nome é {persona_key.capitalize()} e você é um {persona_display_name} amigável e prestável para uma demonstração.
O nome do cliente é {customer_name if customer_name and customer_name != "Website User" else 'Utilizador'}.

Você foi contactado porque o cliente clicou no botão 'Experimenta Grátis' no nosso website para uma demonstração da persona '{persona_key}'.
O objetivo principal desta chamada é demonstrar as suas capacidades de conversação como um {persona_display_name}.

Instruções Chave:
1.  Apresente-se cordialmente como o {persona_key.capitalize()}, um {persona_display_name}.
2.  Confirme que esta é uma chamada de demonstração para a persona '{persona_key}'.
3.  Mantenha a conversa curta e focada na demonstração.
4.  Você pode fornecer informações genéricas sobre o tipo de tarefas que um {persona_display_name} como você poderia realizar no dia-a-dia.
    Por exemplo:
    - Se for 'restaurante': "Normalmente, eu poderia ajudar com reservas, pedidos de menu, ou informações sobre o nosso horário."
    - Se for 'clinica': "Normalmente, eu poderia ajudar a marcar consultas, fornecer informações sobre os nossos tratamentos, ou dar moradas e contactos."
    - Se for 'vendedor': "Normalmente, eu poderia apresentar produtos, verificar stock, ou ajudar a processar uma encomenda."
    Adapte o exemplo à persona '{persona_key}'.
5.  Após uma breve interação ou se o cliente perguntar como proceder, pode mencionar que, numa situação real, haveria mais ferramentas e informações disponíveis.
6.  Se o cliente pedir para falar com um humano, quiser terminar a demonstração, ou se a conversa se desviar muito, utilize a ferramenta 'transfer_human' para encaminhar a chamada educadamente, mencionando que está a transferir para um colega humano.
7.  Seja breve, educado e profissional.
{BASE_AGENT_INSTRUCTIONS}
"""
    return prompt

async def build_common_greeting(metadata: Dict[str, Any]) -> str:
    """
    Builds a generic greeting for the selected persona for Phase 1.
    """
    persona_key = metadata.get("persona", "assistente virtual")
    customer_name = metadata.get("customer_name", None)

    persona_display_name = persona_key.capitalize()

    greeting_intro = f"Olá"
    if customer_name and customer_name != "Website User":
        greeting_intro += f" {customer_name}"
    
    greeting = f"{greeting_intro}! Sou o {persona_display_name}, o seu {persona_key} virtual para esta demonstração. Em que posso ser útil hoje?"
    return greeting

# Clinic prompts
PORTUGAL_TZ = ZoneInfo("Europe/Lisbon")
DAYS_PT = {
    "monday": "Segunda-feira", "tuesday": "Terça-feira", "wednesday": "Quarta-feira",
    "thursday": "Quinta-feira", "friday": "Sexta-feira", "saturday": "Sábado", "sunday": "Domingo"
}

async def build_clinic_greeting(metadata: Dict[str, Any]) -> str:
    customer_name = metadata.get("customer_name", "Utente")
    return f"Olá, {customer_name}, da Clínica Sorriso. Ligamos porque clicou no nosso botão 'Experimenta Grátis'. Como posso ajudar?"

async def build_clinic_prompt(persona_initial_data: Dict[str, Any], metadata: Dict[str, Any]) -> str:
    now = datetime.now(PORTUGAL_TZ)
    current_time = now.strftime("%H:%M")
    current_day_en = now.strftime("%A").lower()
    current_day_pt = DAYS_PT.get(current_day_en, current_day_en.capitalize())

    metadata_instructions = ""
    if metadata:
        customer_name = metadata.get("customer_name", "")
        instructions = metadata.get("instructions", "")
        if customer_name:
            metadata_instructions += f"\n\nDirige-te ao utente como '{customer_name}'."
        if instructions:
            metadata_instructions += f"\nInstruções específicas para esta chamada: {instructions}"

    return (
        f"Função: És um assistente virtual da Clínica Dentária Sorriso. Estás a ligar a um utente que interagiu com o botão 'Experimenta Grátis' no website. "
        f"Usa EXCLUSIVAMENTE Português de Portugal (nunca do Brasil), com termos e expressões tipicamente portugueses. "
        + BASE_AGENT_INSTRUCTIONS + "\n"
        f"HORA ATUAL: {current_time} de {current_day_pt}.\n"
        + metadata_instructions
        + "\n\nOBJETIVO DA CHAMADA (FASE 1 - DEMONSTRAÇÃO SIMPLES):"
        + "\n1. Confirma que o utente se lembra de ter clicado no botão 'Experimenta Grátis' para a Clínica Sorriso."
        + "\n2. Explica brevemente que esta é uma demonstração da capacidade do nosso assistente virtual para marcar consultas ou dar informações básicas."
        + "\n3. Pergunta se o utente tem alguma questão simples sobre a clínica (ex: tipos de serviços gerais, localização genérica)."
        + "\n4. Se o utente quiser marcar uma consulta real ou tiver questões médicas complexas, informa que esta é uma demonstração e oferece transferir para um humano usando a ferramenta 'transfer_human'."
        + "\n5. Mantém a conversa curta e agradável."
        + "\n\nClínica Info Genérica (para a demo):"
        + "\n- Serviços: Consultas gerais, limpezas, branqueamentos."
        + "\n- Localização: Temos várias clínicas na cidade (não especificar morada exata)."
        + "\n- Marcações: Para marcações reais, o melhor é falar com a nossa receção."
        + "\n\nNÃO TENTES verificar disponibilidade real de horários ou marcar consultas nesta fase. Usa 'transfer_human' para esses casos."
    )

# Sales prompts
async def build_sales_prompt(initial_data: Dict[str, Any], metadata: Dict[str, Any]) -> str:
    """
    Build a system prompt for the sales persona.
    
    Args:
        initial_data: Pre-loaded data about the sales context
        metadata: Request-specific metadata, including customer information
    
    Returns:
        A formatted prompt string
    """
    log.info("Building sales system prompt")
    
    customer_name = metadata.get("customer_name", "")
    customer_specific = f"\nDirige-te ao cliente como '{customer_name}'." if customer_name else ""
    
    website_request_id = metadata.get("website_request_id", "")
    request_context = f"\nPedido da web: {website_request_id}" if website_request_id else ""
    
    instructions = metadata.get("instructions", "")
    additional_instructions = f"\nInstruções específicas: {instructions}" if instructions else ""
    
    return (
        "Função: És um representante de vendas profissional da Chamada.ai para o nosso serviço 'Experimenta Grátis'. "
        "Usa EXCLUSIVAMENTE Português de Portugal (nunca do Brasil), com linguagem formal mas acessível. "
        "Utiliza sempre expressões, vocabulário e construções frásicas típicas de Portugal, NUNCA do Brasil. "
        f"{customer_specific}"
        f"{request_context}"
        f"{additional_instructions}\n\n"
        "Objetivo da chamada:\n"
        "1. Apresentar o serviço de chamadas automatizadas da Chamada.ai\n"
        "2. Explicar que é possível criar assistentes virtuais para diversos casos de uso\n"
        "3. Recolher informações sobre o interesse do cliente\n"
        "4. Agendar uma demonstração mais detalhada\n\n"
        "Pontos importantes a mencionar:\n"
        "- Processo simples e rápido de implementação\n"
        "- Capacidade de personalização para diferentes negócios\n"
        "- Disponibilidade para esclarecimento de dúvidas\n\n"
        "Lembra-te:\n"
        "- Sê sempre atencioso e paciente\n"
        "- Adapta o discurso consoante o interesse do cliente\n"
        "- Não insistas demasiado se o cliente não mostrar interesse\n"
        "- Agradece pelo tempo dispensado no final da chamada"
    )

async def build_sales_greeting(metadata: Dict[str, Any]) -> str:
    """
    Build a greeting message for the sales persona.
    
    Args:
        metadata: Request-specific metadata, including customer information
    
    Returns:
        A greeting string
    """
    log.info("Building sales greeting")
    
    customer_name = metadata.get("customer_name", "")
    
    if customer_name:
        return f"Olá {customer_name}, bom dia! Sou da Chamada.ai. Estou a ligar sobre o nosso serviço 'Experimenta Grátis' que permite criar assistentes virtuais para o seu negócio. Tem alguns minutos para falar sobre como isto pode ajudar a sua empresa?"
    else:
        return "Olá, bom dia! Sou da Chamada.ai. Estou a ligar sobre o nosso serviço 'Experimenta Grátis' que permite criar assistentes virtuais para o seu negócio. Tem alguns minutos para falar sobre como isto pode ajudar a sua empresa?" 

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
            voice="coral",  # Optimized for European Portuguese
            temperature=0.85,  # Lower temperature for more consistent language style
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
            instructions=f"Diz apenas '{initial_greeting}' usando EXCLUSIVAMENTE Português de Portugal (não do Brasil). Usa expressões, vocabulário e sotaque típicos de Portugal, nunca do Brasil. Espera pela resposta."
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