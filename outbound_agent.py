from __future__ import annotations

import asyncio
import logging
import os
import json
import aiohttp
from datetime import datetime
from typing import Optional, Dict, Any
from dotenv import load_dotenv
from livekit import api, rtc
from livekit.agents import Agent, AgentSession, JobContext, cli, WorkerOptions, WorkerType
from livekit.plugins import openai
from openai.types.beta.realtime.session import TurnDetection
from zoneinfo import ZoneInfo
import hashlib

# ─────────────────────── Configuração inicial ───────────────────────
load_dotenv(".env.local")
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
log = logging.getLogger("agent_outbound")

# ─────────────────────── Constantes configuráveis ───────────────────────
# ✅ SECURITY FIX: Move sensitive values to environment variables
SIP_TRUNK_ID = os.getenv("SIP_TRUNK_ID", "ST_SSjcbMkbf6nB")  # Should be in .env.local
CALLER_ID = os.getenv("CALLER_ID", "+351210607606")  # Should be in .env.local
DEFAULT_FALLBACK_PHONE = os.getenv("DEFAULT_FALLBACK_PHONE", "+351933792547")  # Emergency fallback

# Validate environment variables
LIVEKIT_URL = os.getenv("LIVEKIT_URL")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")

# Webhook configuration
MAKE_WEBHOOK_URL = os.getenv("MAKE_WEBHOOK_URL")
MAKE_WEBHOOK_SECRET = os.getenv("MAKE_WEBHOOK_SECRET")  # Optional for verification
WEBHOOK_TIMEOUT = int(os.getenv("WEBHOOK_TIMEOUT", "30"))
WEBHOOK_RETRIES = int(os.getenv("WEBHOOK_RETRIES", "3"))

# ✅ SECURITY: Validate critical environment variables
if not LIVEKIT_URL:
    log.warning("LIVEKIT_URL não definido no arquivo .env.local")
if not LIVEKIT_API_KEY or not LIVEKIT_API_SECRET:
    log.warning("LIVEKIT_API_KEY ou LIVEKIT_API_SECRET não definidos no arquivo .env.local")
if not MAKE_WEBHOOK_URL:
    log.warning("MAKE_WEBHOOK_URL não definido no arquivo .env.local - transcripts não serão enviados")
if not SIP_TRUNK_ID or SIP_TRUNK_ID == "ST_SSjcbMkbf6nB":
    log.warning("⚠️  Using default SIP_TRUNK_ID - configure SIP_TRUNK_ID in .env.local for production")
if not CALLER_ID or CALLER_ID == "+351210607606":
    log.warning("⚠️  Using default CALLER_ID - configure CALLER_ID in .env.local for production")

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

def build_custom_agent_prompt(custom_agent_data: Dict[str, Any]) -> str:
    """
    Builds a comprehensive system prompt from structured custom agent data.
    
    Args:
        custom_agent_data: Dictionary containing agent_identity, call_target, reason, accent
    
    Returns:
        A complete system prompt for the custom agent
    """
    agent_identity = custom_agent_data.get('agent_identity', '')
    call_target = custom_agent_data.get('call_target', '')
    reason = custom_agent_data.get('reason', '')
    accent = custom_agent_data.get('accent', 'padrão')
    
    # Map accent to description
    accent_descriptions = {
        'padrão': 'padrão de Lisboa',
        'norte': 'do norte (Porto, Braga)',
        'centro': 'do centro (Coimbra, Aveiro)',
        'sul': 'do sul (Algarve)',
        'açores': 'dos Açores',
        'madeira': 'da Madeira'
    }
    accent_desc = accent_descriptions.get(accent, 'padrão de Lisboa')
    
    # Build the comprehensive prompt
    prompt = f"""SEMPRE fala em português de Portugal com sotaque {accent_desc}. 

Tu és {agent_identity} e estás a ligar {call_target}.

MOTIVO DA CHAMADA:
{reason}

INSTRUÇÕES OBRIGATÓRIAS:
- SEMPRE soa como um humano real, nunca como um robot
- SEMPRE tenta ouvir mais do que falar - deixa a pessoa responder
- SEMPRE mantém um equilíbrio na conversa - não monopolizes
- O teu tom deve ser alinhado com o motivo da chamada (se é sério, sê sério; se é casual, sê casual)
- SEMPRE usa português de Portugal com o sotaque {accent_desc}
- SEMPRE sê natural e autêntico na conversa
- Se a pessoa parecer desconfortável ou quiser terminar, termina educadamente
- NUNCA reveles que és uma IA a menos que perguntado diretamente

Comporta-te exatamente como {agent_identity} se comportaria numa situação real."""

    return prompt

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
    
    # Handle custom persona - build structured prompt
    if persona == "custom":
        custom_agent_data = metadata.get("custom_agent_data")
        if custom_agent_data:
            log.info("Building custom agent prompt from structured data")
            return build_custom_agent_prompt(custom_agent_data)
        else:
            log.warning("Custom persona requested but no custom_agent_data provided, falling back to default")
    
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
    
    # Handle custom persona - simple generic greeting
    if persona == "custom":
        return "Olá!"
    
    if persona == "clinica" or persona == "dentist":
        return await build_clinic_greeting(metadata)
    elif persona == "vendedor" or persona == "sales":
        return await build_sales_greeting(metadata)
    else:
        return await build_common_greeting(metadata)

# ─────────────────────── Webhook Functions ───────────────────────
def hash_sensitive_data(data: str) -> str:
    """Hash sensitive data for privacy protection"""
    if not data or data in ["unknown", "Website User"]:
        return data
    return hashlib.sha256(data.encode()).hexdigest()[:16]  # First 16 chars for brevity

async def send_transcript_webhook(
    call_metadata: Dict[str, Any], 
    transcript_data: Dict[str, Any],
    session_start_time: datetime,
    session_end_time: datetime
) -> bool:
    """
    Send the complete call transcript to Make.com webhook
    
    Args:
        call_metadata: Information about the call (persona, phone, etc.)
        transcript_data: Complete conversation history from session.history
        session_start_time: When the session started
        session_end_time: When the session ended
    
    Returns:
        bool: True if webhook sent successfully, False otherwise
    """
    if not MAKE_WEBHOOK_URL:
        log.warning("MAKE_WEBHOOK_URL não configurado - transcript não enviado")
        return False
    
    try:
        # Calculate call duration
        duration_seconds = int((session_end_time - session_start_time).total_seconds())
        
        # ✅ SECURITY: Hash sensitive data for privacy
        phone_hash = hash_sensitive_data(call_metadata.get("phone_number", "unknown"))
        customer_hash = hash_sensitive_data(call_metadata.get("customer_name", "Website User"))
        
        # Build the webhook payload with privacy protection
        payload = {
            "call_metadata": {
                "call_id": call_metadata.get("call_id", "unknown"),
                "room_name": call_metadata.get("room_name", "unknown"),
                "persona": call_metadata.get("persona", "default"),
                "phone_hash": phone_hash,  # ✅ Hashed instead of plain text
                "customer_hash": customer_hash,  # ✅ Hashed instead of plain text
                "start_time": session_start_time.isoformat(),
                "end_time": session_end_time.isoformat(),
                "duration_seconds": duration_seconds,
                "call_outcome": "completed"  # We can expand this later
            },
            "transcript": {
                "full_conversation": transcript_data,
                "conversation_items": transcript_data.get("items", []),
                "total_items": len(transcript_data.get("items", [])),
            },
            "analytics": {
                "total_turns": len(transcript_data.get("items", [])),
                "timestamp_utc": session_end_time.isoformat()
            },
            "technical": {
                "agent_version": "1.0",
                "model_used": "gpt-4o-realtime-preview",
                "livekit_session": True
            }
        }
        
        # Prepare headers
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "ChamadaAI-Agent/1.0"
        }
        
        # ✅ SECURITY: Improved authentication
        if MAKE_WEBHOOK_SECRET:
            # Use proper Bearer token format
            headers["Authorization"] = f"Bearer {MAKE_WEBHOOK_SECRET}"
            # Add timestamp for replay attack prevention
            headers["X-Timestamp"] = str(int(session_end_time.timestamp()))
        
        # Send webhook with retries
        for attempt in range(WEBHOOK_RETRIES):
            try:
                async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=WEBHOOK_TIMEOUT)) as session:
                    log.info(f"📤 Enviando transcript para webhook (tentativa {attempt + 1}/{WEBHOOK_RETRIES})")
                    
                    async with session.post(MAKE_WEBHOOK_URL, json=payload, headers=headers) as response:
                        if response.status == 200:
                            log.info(f"✅ Transcript enviado com sucesso - Status: {response.status}")
                            return True
                        else:
                            log.warning(f"❌ Webhook falhou com status {response.status}")
                            
            except asyncio.TimeoutError:
                log.warning(f"⏰ Timeout na tentativa {attempt + 1} - webhook demorou mais de {WEBHOOK_TIMEOUT}s")
            except aiohttp.ClientError as e:
                log.warning(f"🔌 Erro de conexão na tentativa {attempt + 1}: {type(e).__name__}")
            except Exception as e:
                log.error(f"💥 Erro inesperado na tentativa {attempt + 1}: {type(e).__name__}")
            
            # Wait before retry (exponential backoff)
            if attempt < WEBHOOK_RETRIES - 1:
                wait_time = 2 ** attempt  # 1s, 2s, 4s
                log.info(f"⏳ Aguardando {wait_time}s antes da próxima tentativa...")
                await asyncio.sleep(wait_time)
        
        log.error(f"❌ Falha ao enviar transcript após {WEBHOOK_RETRIES} tentativas")
        return False
        
    except Exception as e:
        log.error(f"💥 Erro crítico ao preparar webhook: {type(e).__name__}", exc_info=True)
        return False

async def save_transcript_to_webhook(
    session: AgentSession,
    call_metadata: Dict[str, Any],
    session_start_time: datetime
) -> None:
    """
    Extract transcript from session history and send to webhook
    This function is called as a shutdown callback when the call ends
    """
    try:
        session_end_time = datetime.now(ZoneInfo("Europe/Lisbon"))
        
        # Get the complete conversation history
        log.info("📋 Extraindo transcript da sessão...")
        transcript_data = session.history.to_dict()
        
        log.info(f"✅ Transcript extraído: {len(transcript_data.get('items', []))} itens de conversa")
        # ✅ SECURITY FIX: Remove detailed logging of conversation content
        # log.debug(f"Transcript completo: {json.dumps(transcript_data, indent=2, default=str)}")
        
        # Send to webhook
        success = await send_transcript_webhook(
            call_metadata=call_metadata,
            transcript_data=transcript_data,
            session_start_time=session_start_time,
            session_end_time=session_end_time
        )
        
        if success:
            log.info("🎉 Transcript enviado com sucesso para Make.com!")
        else:
            log.error("💔 Falha ao enviar transcript para Make.com")
            
    except Exception as e:
        log.error(f"💥 Erro crítico ao salvar transcript: {type(e).__name__}", exc_info=True)

# ─────────────────────── Entrypoint LiveKit ───────────────────────
async def entrypoint(ctx: JobContext):
    """Ponto de entrada principal do agente adaptável para diferentes personas"""
    try:
        log.info(f"Received job: id={ctx.job.id}, room={ctx.room.name}")
        session_start_time = datetime.now(ZoneInfo("Europe/Lisbon"))

        # Extract metadata
        try:
            metadata = json.loads(ctx.job.metadata) if ctx.job.metadata else {}
            log.info(f"✅ METADATA: {metadata}")
        except json.JSONDecodeError as e:
            log.warning(f"Invalid metadata JSON format: {e}. Using empty metadata.")
            metadata = {}

        # Extract persona and customer information
        persona = metadata.get("persona", "default")
        phone_number = metadata.get("phone_number", DEFAULT_FALLBACK_PHONE)  # Use default fallback
        customer_name = metadata.get("customer_name", "Website User")
        
        # ✅ SECURITY: Log without sensitive data
        log.info(f"Processing call for persona: {persona}")
        log.info(f"Customer identifier: {hash_sensitive_data(customer_name)}")

        # Prepare call metadata for webhook
        call_metadata = {
            "call_id": ctx.job.id,
            "room_name": ctx.room.name,
            "persona": persona,
            "phone_number": phone_number,
            "customer_name": customer_name,
            "job_metadata": metadata
        }

        # Configure realtime model
        log.debug("Configuring realtime model")
        realtime_model = openai.realtime.RealtimeModel(
            model="gpt-4o-mini-realtime-preview-2024-12-17",
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

        # 📋 ADD TRANSCRIPT WEBHOOK CALLBACK
        log.info("🔗 Configurando callback para envio de transcript...")
        ctx.add_shutdown_callback(
            lambda: save_transcript_to_webhook(session, call_metadata, session_start_time)
        )
        log.info("✅ Callback de transcript configurado - será executado ao final da chamada")

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
        log.info("📋 Transcript será automaticamente capturado e enviado para webhook ao final da chamada")

    except Exception as e:
        log.error(f"Erro fatal no entrypoint: {str(e)}", exc_info=True)
        raise

# ─────────────────────── Run worker ───────────────────────
if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(entrypoint_fnc=entrypoint, worker_type=WorkerType.ROOM, agent_name="outbound-agent")
    ) 