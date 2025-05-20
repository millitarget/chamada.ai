from __future__ import annotations
from typing import Dict, Any, Awaitable
from datetime import datetime as _dt
from zoneinfo import ZoneInfo

from prompts.common_prompts import BASE_AGENT_INSTRUCTIONS

PORTUGAL_TZ = ZoneInfo("Europe/Lisbon")
DAYS_PT = {
    "monday": "Segunda-feira", "tuesday": "Terça-feira", "wednesday": "Quarta-feira",
    "thursday": "Quinta-feira", "friday": "Sexta-feira", "saturday": "Sábado", "sunday": "Domingo"
}

async def build_clinic_greeting(metadata: Dict[str, Any]) -> str:
    customer_name = metadata.get("customer_name", "Utente")
    return f"Olá, {customer_name}, da Clínica Sorriso. Ligamos porque clicou no nosso botão 'Experimenta Grátis'. Como posso ajudar?"

async def build_clinic_prompt(persona_initial_data: Dict[str, Any], metadata: Dict[str, Any]) -> str:
    now = _dt.now(PORTUGAL_TZ)
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

# prewarm_clinic_data function is removed as it's not used in Phase 1 via config.py 