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
from collections import defaultdict
import time

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
- A tua voz deve corresponder ao género do nome ({agent_identity}) - se é nome masculino, voz masculina; se é feminino, voz feminina

Comporta-te exatamente como {agent_identity} se comportaria numa situação real."""

    return prompt

def detect_gender_from_name(name: str) -> str:
    """
    Detect gender from Portuguese names to select appropriate voice.
    
    Args:
        name: The person's name (can be full name or just first name)
    
    Returns:
        'male' or 'female' based on name analysis
    """
    if not name:
        return 'female'  # Default to female voice
    
    # Extract first name (before comma or first word)
    first_name = name.split(',')[0].strip().split()[0].lower()
    
    # Common Portuguese male names
    male_names = {
        'joão', 'josé', 'antónio', 'manuel', 'francisco', 'carlos', 'pedro', 'paulo', 'luis', 'miguel',
        'fernando', 'jorge', 'ricardo', 'bruno', 'andré', 'rui', 'nuno', 'tiago', 'hugo', 'daniel',
        'rafael', 'david', 'marco', 'sérgio', 'vítor', 'diogo', 'gonçalo', 'rodrigo', 'fábio', 'nelson',
        'alberto', 'armando', 'eduardo', 'henrique', 'joaquim', 'leonardo', 'marcelo', 'roberto', 'samuel',
        'alexandre', 'cristiano', 'emanuel', 'gabriel', 'gustavo', 'joão', 'leonardo', 'márcio', 'mário',
        'martim', 'mateus', 'paulo', 'renato', 'ricardo', 'simão', 'tomás', 'vasco', 'xavier'
    }
    
    # Common Portuguese female names
    female_names = {
        'maria', 'ana', 'joana', 'catarina', 'sofia', 'inês', 'beatriz', 'carolina', 'mariana', 'rita',
        'sara', 'patrícia', 'carla', 'sandra', 'cristina', 'helena', 'isabel', 'paula', 'teresa', 'vera',
        'alexandra', 'andreia', 'bárbara', 'cláudia', 'diana', 'elisabete', 'fernanda', 'gabriela', 'lúcia',
        'marta', 'mónica', 'raquel', 'sónia', 'susana', 'vanessa', 'alice', 'amélia', 'ângela', 'célia',
        'conceição', 'fátima', 'graça', 'leonor', 'liliana', 'manuela', 'natália', 'olívia', 'rosa', 'sílvia'
    }
    
    if first_name in male_names:
        return 'male'
    elif first_name in female_names:
        return 'female'
    else:
        # Default to female if name not recognized
        return 'female'

def get_voice_for_gender(gender: str) -> str:
    """
    Get appropriate voice based on gender.
    
    Args:
        gender: 'male' or 'female'
    
    Returns:
        Voice name for OpenAI Realtime API
    """
    if gender == 'male':
        return 'echo'  # Male voice
    else:
        return 'coral'  # Female voice (default)

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

def format_transcript_from_session_history(session_history: Dict[str, Any]) -> str:
    """
    Convert LiveKit session history into a clean, readable transcript string.
    Based on official LiveKit documentation for OpenAI Realtime API.

    Args:
        session_history: The session.history.to_dict() output from LiveKit AgentSession

    Returns:
        A formatted transcript string with the complete conversation
    """
    try:
        log.info("🔍 Extracting transcript from LiveKit session history")
        
        # According to LiveKit docs, session.history.to_dict() contains conversation items
        # The structure follows the OpenAI Realtime API conversation format
        items = session_history.get("items", [])
        
        if not items:
            log.warning("❌ No conversation items found in session_history")
            log.debug(f"Session history structure: {list(session_history.keys())}")
            return "No conversation found."
        
        log.info(f"📝 Found {len(items)} conversation items")
        
        transcript_lines = []
        transcript_lines.append("=== CONVERSATION TRANSCRIPT ===")
        transcript_lines.append("")
        
        for i, item in enumerate(items):
            try:
                # Each item should have a role and content according to OpenAI Realtime API
                role = item.get("role", "unknown")
                content = item.get("content", [])
                
                # Handle different content formats
                if isinstance(content, str):
                    # Simple string content
                    text_content = content
                elif isinstance(content, list):
                    # List of content objects (OpenAI format)
                    text_parts = []
                    for content_item in content:
                        if isinstance(content_item, dict):
                            if content_item.get("type") == "text":
                                text_parts.append(content_item.get("text", ""))
                            elif "text" in content_item:
                                text_parts.append(content_item["text"])
                        elif isinstance(content_item, str):
                            text_parts.append(content_item)
                    text_content = " ".join(text_parts)
                else:
                    # Fallback for other formats
                    text_content = str(content)
                
                # Clean up the text content
                text_content = text_content.strip()
                
                if text_content:
                    # Format based on role
                    if role == "user":
                        speaker = "👤 User"
                    elif role == "assistant":
                        speaker = "🤖 Assistant"
                    elif role == "system":
                        speaker = "⚙️ System"
                    else:
                        speaker = f"❓ {role.title()}"
                    
                    transcript_lines.append(f"{speaker}: {text_content}")
                    transcript_lines.append("")
                
            except Exception as item_error:
                log.warning(f"⚠️ Error processing conversation item {i}: {item_error}")
                continue
        
        if len(transcript_lines) <= 2:  # Only header lines
            log.warning("❌ No valid conversation content found")
            return "No valid conversation content found."
        
        transcript = "\n".join(transcript_lines)
        log.info(f"✅ Successfully formatted transcript with {len(transcript_lines)} lines")
        
        return transcript
        
    except Exception as e:
        log.error(f"❌ Error formatting transcript: {e}")
        log.debug(f"Session history type: {type(session_history)}")
        log.debug(f"Session history keys: {list(session_history.keys()) if isinstance(session_history, dict) else 'Not a dict'}")
        return f"Error formatting transcript: {str(e)}"

async def send_transcript_webhook(
    call_metadata: Dict[str, Any], 
    formatted_transcript: str,
    session_start_time: datetime,
    session_end_time: datetime
) -> bool:
    """
    Send a single, clean webhook request with consolidated transcript.
    
    Args:
        call_metadata: Information about the call (persona, phone, etc.)
        formatted_transcript: Clean, formatted transcript string
        session_start_time: When the session started
        session_end_time: When the session ended
    
    Returns:
        bool: True if webhook sent successfully, False otherwise
    """
    if not MAKE_WEBHOOK_URL:
        log.warning("MAKE_WEBHOOK_URL not configured - transcript not sent")
        return False
    
    try:
        # Calculate call duration
        duration_seconds = int((session_end_time - session_start_time).total_seconds())
        
        # ✅ SECURITY: Hash sensitive data for privacy
        phone_hash = hash_sensitive_data(call_metadata.get("phone_number", "unknown"))
        customer_hash = hash_sensitive_data(call_metadata.get("customer_name", "Website User"))
        
        # Analyze transcript for better analytics
        transcript_lines = [line for line in formatted_transcript.split('\n') if line.strip()]
        agent_messages = len([line for line in transcript_lines if line.startswith('Agente:')])
        client_messages = len([line for line in transcript_lines if line.startswith('Cliente:')])
        total_messages = len(transcript_lines)
        
        # Determine call outcome based on transcript content
        call_outcome = "completed"
        if "erro" in formatted_transcript.lower() or "falha" in formatted_transcript.lower():
            call_outcome = "error"
        elif total_messages < 2:
            call_outcome = "no_conversation"
        elif agent_messages == 0 or client_messages == 0:
            call_outcome = "one_sided"
        
        # Build comprehensive webhook payload
        payload = {
            "call_metadata": {
                "call_id": call_metadata.get("call_id", "unknown"),
                "room_name": call_metadata.get("room_name", "unknown"),
                "persona": call_metadata.get("persona", "default"),
                "phone_hash": phone_hash,
                "customer_hash": customer_hash,
                "start_time": session_start_time.isoformat(),
                "end_time": session_end_time.isoformat(),
                "duration_seconds": duration_seconds,
                "call_outcome": call_outcome
            },
            "transcript": {
                "content": formatted_transcript,  # ✅ Single consolidated transcript
                "format": "text",
                "language": "pt-PT",
                "encoding": "utf-8"
            },
            "analytics": {
                "total_messages": total_messages,
                "agent_messages": agent_messages,
                "client_messages": client_messages,
                "conversation_turns": max(agent_messages, client_messages),
                "avg_message_length": len(formatted_transcript) // max(total_messages, 1),
                "timestamp_utc": session_end_time.isoformat()
            },
            "technical": {
                "agent_version": "1.0",
                "model_used": "gpt-4o-mini-realtime-preview",
                "livekit_session": True,
                "webhook_version": "2.0"
            }
        }
        
        # Prepare headers
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "ChamadaAI-Agent/1.0",
            "X-Webhook-Version": "2.0"
        }
        
        # ✅ SECURITY: Authentication if configured
        if MAKE_WEBHOOK_SECRET:
            headers["Authorization"] = f"Bearer {MAKE_WEBHOOK_SECRET}"
            headers["X-Timestamp"] = str(int(session_end_time.timestamp()))
        
        # Send webhook with retries and exponential backoff
        for attempt in range(WEBHOOK_RETRIES):
            try:
                timeout = aiohttp.ClientTimeout(total=WEBHOOK_TIMEOUT)
                async with aiohttp.ClientSession(timeout=timeout) as session:
                    log.info(f"📤 Sending consolidated transcript to webhook (attempt {attempt + 1}/{WEBHOOK_RETRIES})")
                    log.info(f"📊 Transcript: {total_messages} messages ({agent_messages} agent, {client_messages} client)")
                    
                    async with session.post(MAKE_WEBHOOK_URL, json=payload, headers=headers) as response:
                        if response.status == 200:
                            log.info(f"✅ Transcript sent successfully - Status: {response.status}")
                            return True  # ✅ Success - stop retrying
                        else:
                            response_text = await response.text()
                            log.warning(f"❌ Webhook failed with status {response.status}: {response_text}")
                            
                            # Don't retry on client errors (4xx)
                            if 400 <= response.status < 500:
                                log.error(f"🚫 Client error {response.status} - not retrying")
                                return False
                            
            except asyncio.TimeoutError:
                log.warning(f"⏰ Timeout on attempt {attempt + 1} - webhook took longer than {WEBHOOK_TIMEOUT}s")
            except aiohttp.ClientError as e:
                log.warning(f"🔌 Connection error on attempt {attempt + 1}: {type(e).__name__}")
            except Exception as e:
                log.error(f"💥 Unexpected error on attempt {attempt + 1}: {type(e).__name__}")
            
            # Wait before retry with exponential backoff
            if attempt < WEBHOOK_RETRIES - 1:
                wait_time = min(2 ** attempt, 10)  # Cap at 10 seconds
                log.info(f"⏳ Waiting {wait_time}s before next attempt...")
                await asyncio.sleep(wait_time)
        
        log.error(f"❌ Failed to send transcript after {WEBHOOK_RETRIES} attempts")
        return False
        
    except Exception as e:
        log.error(f"💥 Critical error preparing webhook: {type(e).__name__}", exc_info=True)
        return False

# ─────────────────────── Global state for preventing duplicate webhooks ───────────────────────
# Use a dict with timestamps for automatic cleanup
_webhook_sent_jobs = defaultdict(float)  # job_id -> timestamp
_CLEANUP_INTERVAL = 3600  # Clean up entries older than 1 hour
_last_cleanup = time.time()

def _cleanup_old_webhook_jobs():
    """Clean up old job IDs to prevent memory leaks"""
    global _webhook_sent_jobs, _last_cleanup
    
    current_time = time.time()
    if current_time - _last_cleanup > _CLEANUP_INTERVAL:
        cutoff_time = current_time - _CLEANUP_INTERVAL
        old_jobs = [job_id for job_id, timestamp in _webhook_sent_jobs.items() if timestamp < cutoff_time]
        
        for job_id in old_jobs:
            del _webhook_sent_jobs[job_id]
        
        if old_jobs:
            log.info(f"🧹 Cleaned up {len(old_jobs)} old webhook job entries")
        
        _last_cleanup = current_time

async def save_transcript_to_webhook(
    session: AgentSession,
    call_metadata: Dict[str, Any],
    session_start_time: datetime
) -> None:
    """
    Extract transcript from session history, format it cleanly, and send ONE webhook request.
    This function is called as a shutdown callback when the call ends.
    """
    global _webhook_sent_jobs
    
    job_id = call_metadata.get("call_id", "unknown")
    
    # Clean up old entries periodically
    _cleanup_old_webhook_jobs()
    
    # ✅ PREVENT DUPLICATE WEBHOOKS
    if job_id in _webhook_sent_jobs:
        log.warning(f"🚫 Webhook already sent for job {job_id} - ignoring duplicate call")
        return
    
    # Mark as processing immediately to prevent race conditions
    _webhook_sent_jobs[job_id] = time.time()
    
    try:
        session_end_time = datetime.now(ZoneInfo("Europe/Lisbon"))
        
        # Get the complete conversation history
        log.info("📋 Extracting and formatting transcript from session...")
        
        # ✅ SAFETY: Check if session is still valid
        if not session or not hasattr(session, 'history'):
            log.warning("⚠️ Session or session.history is not available")
            formatted_transcript = "Agente: [Sessão não disponível para extração de transcript]"
        else:
            try:
                session_history = session.history.to_dict()
                
                # Add comprehensive debugging to understand the structure
                log.info(f"🔍 Session history type: {type(session_history)}")
                log.info(f"🔍 Session history keys: {list(session_history.keys()) if isinstance(session_history, dict) else 'Not a dict'}")
                
                # Log the full structure for debugging (first few items only to avoid spam)
                if isinstance(session_history, dict):
                    for key, value in session_history.items():
                        if isinstance(value, list):
                            log.info(f"🔍 Key '{key}' contains list with {len(value)} items")
                            if value:  # If list is not empty, show first item structure
                                log.info(f"🔍 First item in '{key}': {type(value[0])} - {value[0] if len(str(value[0])) < 200 else str(value[0])[:200] + '...'}")
                        else:
                            log.info(f"🔍 Key '{key}': {type(value)} - {value if len(str(value)) < 100 else str(value)[:100] + '...'}")
                
                # Extract and format the transcript
                formatted_transcript = format_transcript_from_session_history(session_history)
                
                if not formatted_transcript or formatted_transcript.startswith("Error") or formatted_transcript.startswith("No"):
                    log.warning(f"⚠️ Transcript extraction failed: {formatted_transcript}")
                    # Don't send webhook if transcript is empty or error
                    return
                
                log.info(f"📝 Transcript extracted successfully: {len(formatted_transcript)} characters")
                
                # Send the webhook with the transcript
                webhook_success = await send_transcript_webhook(
                    call_metadata=call_metadata,
                    formatted_transcript=formatted_transcript,
                    session_start_time=session_start_time,
                    session_end_time=session_end_time
                )
                
                if webhook_success:
                    log.info("✅ Transcript webhook sent successfully")
                else:
                    log.error("❌ Failed to send transcript webhook")
                
            except Exception as history_error:
                log.error(f"❌ Error accessing session history: {history_error}")
                formatted_transcript = f"Agente: [Erro ao acessar histórico da sessão: {str(history_error)}]"
        
        log.info(f"✅ Transcript formatted with {len(formatted_transcript.split())} words")
        log.info(f"📝 Complete transcript: {formatted_transcript}")
        
    except Exception as e:
        log.error(f"💥 Critical error saving transcript: {type(e).__name__}", exc_info=True)
    finally:
        # Keep the job ID marked as processed (will be cleaned up automatically after 1 hour)
        pass

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

        # Determine appropriate voice based on agent's gender
        selected_voice = "coral"  # Default female voice
        if persona == "custom":
            custom_agent_data = metadata.get("custom_agent_data")
            if custom_agent_data:
                agent_identity = custom_agent_data.get('agent_identity', '')
                detected_gender = detect_gender_from_name(agent_identity)
                selected_voice = get_voice_for_gender(detected_gender)
                log.info(f"Agent '{agent_identity}' detected as {detected_gender}, using voice: {selected_voice}")
        
        # Configure realtime model
        log.debug("Configuring realtime model")
        realtime_model = openai.realtime.RealtimeModel(
            model="gpt-4o-mini-realtime-preview-2024-12-17",
            voice=selected_voice,  # Gender-appropriate voice
            temperature=0.9,  # Lower temperature for more consistent language style
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