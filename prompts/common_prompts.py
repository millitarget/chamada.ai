from __future__ import annotations
from typing import Dict, Any, Awaitable

# This file can contain shared prompt building logic or base prompts
# used by multiple personas.

# Default instructions, can be appended to or used as a base
BASE_AGENT_INSTRUCTIONS = (
    "Você é um assistente de IA conversacional amigável e útil. "
    "Seja conciso e direto ao ponto, a menos que seja solicitado o contrário. "
    "NUNCA invente respostas. Se você não sabe a resposta, diga que não sabe. "
    "SEMPRE use EXCLUSIVAMENTE Português de Portugal (não do Brasil) em todas as interações. "
    "Use expressões, vocabulário e construções frásicas típicas de Portugal, NUNCA do Brasil. "
    "Evite termos brasileiros como 'você' (prefira 'tu' ou o formal 'o senhor/a senhora'), 'legal', 'a gente', etc. "
    "Prefira dizer 'casa de banho' em vez de 'banheiro', 'autocarro' em vez de 'ônibus', 'pequeno-almoço' em vez de 'café da manhã'. "
)

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

# Example of how old specific prompts might have looked, for reference. Not used in Phase 1 simplified.
# async def build_restaurant_specific_prompt(initial_data: Dict[str, Any], metadata: Dict[str, Any]) -> str:
#     return f"You are a restaurant agent... {initial_data.get('menu_specials', '')}"

# async def build_restaurant_specific_greeting(metadata: Dict[str, Any]) -> str:
#     return f"Welcome to our restaurant demo, {metadata.get('customer_name', 'valued customer')}!" 