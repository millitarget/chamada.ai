from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, List, Dict, Any,Awaitable

# Updated imports using common_prompts instead of deleted restaurant_prompts
from prompts.common_prompts import build_common_system_prompt as build_restaurant_prompt
from prompts.common_prompts import build_common_greeting as build_restaurant_greeting
from prompts.clinic_prompts import build_clinic_prompt, build_clinic_greeting
from prompts.sales_prompts import build_sales_prompt, build_sales_greeting
# For Phase 1, all personas will use only common tools
from tools.common_tools import common_tools_list 

# Define types for clarity
PromptBuilder = Callable[[Dict[str, Any], Dict[str, Any]], Awaitable[str]] # Takes initial_data, metadata, returns prompt
GreetingBuilder = Callable[[Dict[str, Any]], Awaitable[str]] # Takes metadata, returns greeting string
ToolList = List[Callable[..., Awaitable[Dict[str, Any]]]]

@dataclass
class PersonaConfig:
    system_prompt_builder: PromptBuilder
    greeting_builder: GreetingBuilder
    voice: str
    tools: ToolList
    temperature: float
    # prewarm_data_fn removed for Phase 1 simplicity
    initial_data: Dict[str, Any] | None = None # Will be {} for Phase 1

# Actual persona configurations - Simplified for Phase 1
PERSONAE: Dict[str, PersonaConfig] = {
    "restaurante": PersonaConfig(
        system_prompt_builder=build_restaurant_prompt,
        greeting_builder=build_restaurant_greeting,
        voice="shimmer", 
        tools=common_tools_list, # Simplified to common tools
        temperature=0.7, 
        initial_data={}
    ),
    "clinica": PersonaConfig(
        system_prompt_builder=build_clinic_prompt,
        greeting_builder=build_clinic_greeting,
        voice="alloy", 
        tools=common_tools_list, # Simplified to common tools
        temperature=0.6,
        initial_data={}
    ),
    "vendedor": PersonaConfig(
        system_prompt_builder=build_sales_prompt,
        greeting_builder=build_sales_greeting,
        voice="nova", 
        tools=common_tools_list, # Simplified to common tools
        temperature=0.8,
        initial_data={}
    ),
}

async def get_persona_config(persona_key: str, metadata: Dict[str, Any] | None = None) -> PersonaConfig | None:
    """
    Retrieves the configuration for a given persona.
    For Phase 1, initial_data is always an empty dict, pre-warming is skipped.
    """
    config = PERSONAE.get(persona_key)
    if not config:
        return None
    # Ensure initial_data is set, even if empty, as prompt builders expect it.
    if config.initial_data is None:
        config.initial_data = {}
    return config 