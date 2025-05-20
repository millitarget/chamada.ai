from __future__ import annotations
import logging
import json
from typing import Awaitable, Callable, Dict, Any, List

from livekit import api
from livekit.agents.llm import function_tool
from livekit.protocol.sip import TransferSIPParticipantRequest

# This import will be problematic if transfer_human is moved here and AGENT_CONTEXT is in main file.
# We need to refactor how AGENT_CONTEXT and TRANSFER_PHONE_NUMBER are accessed.
# For now, this is a placeholder.
# from quitanda_outbound_agent import AGENT_CONTEXT, TRANSFER_PHONE_NUMBER 

log = logging.getLogger("common_tools")

# Placeholder for AGENT_CONTEXT and TRANSFER_PHONE_NUMBER access
# These would ideally be passed to the tool function or accessed via a shared context object
# that is properly initialized and passed around.

class AgentContextAccess:
    _job_context = None
    _transfer_phone_number = None

    @staticmethod
    def get_job_context():
        if AgentContextAccess._job_context is None:
            log.error("JobContext not set in AgentContextAccess")
            # Attempt to import dynamically if not set (example, might not be best practice)
            try:
                from __main__ import AGENT_CONTEXT # Try to get it from the main script if run directly
                AgentContextAccess._job_context = AGENT_CONTEXT.get_job_context()
            except ImportError:
                log.error("Could not import AGENT_CONTEXT from __main__")
                pass # Fallback or raise error
        return AgentContextAccess._job_context

    @staticmethod
    def set_job_context(context):
        AgentContextAccess._job_context = context

    @staticmethod
    def get_transfer_phone_number() -> str | None:
        if AgentContextAccess._transfer_phone_number is None:
            log.warning("Transfer phone number not set in AgentContextAccess. Attempting to get from __main__ if available.")
            # This dynamic import from __main__ is fragile and generally not recommended for robust applications.
            # It's better to ensure TRANSFER_PHONE_NUMBER is explicitly passed or set during initialization.
            try:
                # Dynamically import from the executing script's scope if possible
                main_module = __import__("__main__")
                AgentContextAccess._transfer_phone_number = getattr(main_module, 'TRANSFER_PHONE_NUMBER', None)
                if AgentContextAccess._transfer_phone_number:
                    log.info(f"Dynamically loaded TRANSFER_PHONE_NUMBER: {AgentContextAccess._transfer_phone_number}")
                else:
                    log.error("TRANSFER_PHONE_NUMBER not found in __main__ module.")
                    # Consider a default fallback if absolutely necessary and make it clear
                    # AgentContextAccess._transfer_phone_number = "+10000000000" # Example default, log this choice
            except ImportError:
                log.error("Could not import __main__ module to get TRANSFER_PHONE_NUMBER.")
            except AttributeError:
                log.error("TRANSFER_PHONE_NUMBER not found as an attribute in __main__ module.")

        if AgentContextAccess._transfer_phone_number is None:
            log.error("TRANSFER_PHONE_NUMBER is still not set. Transfer will likely fail or use a default if hardcoded elsewhere.")
            # raise ValueError("Transfer phone number is not configured.") # Optionally raise an error

        return AgentContextAccess._transfer_phone_number

    @staticmethod
    def set_transfer_phone_number(phone_number: str):
        if not phone_number:
            log.warning("Attempted to set an empty or None transfer phone number.")
            return 
        AgentContextAccess._transfer_phone_number = phone_number
        log.info(f"Transfer phone number set in AgentContextAccess: {phone_number}")

@function_tool()
async def transfer_human(reason: str | None = None) -> dict:
    """
    Transfers the current call to a human agent.
    Use this function if the user explicitly asks to speak to a human,
    or if you are unable to help with their request.

    Args:
        reason: Optional reason for the transfer.
    """
    log.info(f"TRANSFERÊNCIA PARA HUMANO (common_tool) → Motivo: {reason}")
    try:
        job_ctx = AgentContextAccess.get_job_context()
        transfer_phone_number_val = AgentContextAccess.get_transfer_phone_number()

        if not job_ctx or not job_ctx.room:
            log.error("Transferência falhou: Contexto ou sala não disponível")
            return {"ok": False, "error": "Contexto ou sala não disponível"}
        
        room_name = job_ctx.room.name
        log.info(f"Room name: {room_name}")
        
        phone_number = None
        if job_ctx.job and job_ctx.job.metadata:
            try:
                metadata = json.loads(job_ctx.job.metadata)
                phone_number = metadata.get("phone_number")
            except json.JSONDecodeError as e:
                log.warning(f"Invalid metadata JSON format in transfer_human: {e}")
        
        if not phone_number:
            # Fallback: Try to get identity of the first SIP participant if available
            participants = await job_ctx.room.list_participants()
            for p_info in participants:
                if p_info.identity.startswith("sip_"):
                    phone_number = p_info.identity.replace("sip_","") # a bit of a guess
                    log.info(f"Using participant identity as fallback phone_number: {phone_number}")
                    break
            if not phone_number:
                 log.error("Transferência falhou: Não foi possível extrair número de telefone do metadata ou participante")
                 return {"ok": False, "error": "Número de telefone não encontrado para identificar participante SIP"}

        participant_identity = f"sip_{phone_number.replace('tel:', '').replace('+', '')}" # Ensure consistent formatting
        log.info(f"SIP participant identity: {participant_identity}")
        
        transfer_to = f"tel:{transfer_phone_number_val}" if not transfer_phone_number_val.startswith("tel:") else transfer_phone_number_val
        
        transfer_request = TransferSIPParticipantRequest(
            participant_identity=participant_identity,
            room_name=room_name,
            transfer_to=transfer_to,
            play_dialtone=False
        )
        log.info(f"Transfer request created: room={room_name}, participant={participant_identity}, to={transfer_to}")
        
        async with api.LiveKitAPI() as livekit_api:
            await livekit_api.sip.transfer_sip_participant(transfer_request)
            log.info(f"Successfully transferred participant {participant_identity} to {transfer_to}")
        
        return {
            "ok": True,
            "message": "Transferência iniciada com sucesso",
            "participant": participant_identity,
            "room": room_name,
            "transfer_to": transfer_to
        }
    except Exception as e:
        log.error(f"Erro ao transferir para humano (common_tool): {str(e)}", exc_info=True)
        return {"ok": False, "error": str(e)}

common_tools_list: List[Callable[..., Awaitable[Dict[str, Any]]]] = [
    transfer_human,
] 