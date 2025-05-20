from __future__ import annotations

import logging
from typing import Dict, Any, Awaitable

log = logging.getLogger("quitanda_outbound")

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