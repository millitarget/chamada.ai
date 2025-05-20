# tools/clinic_tools.py
# This file is kept for structure but is not used in Phase 1
# as the clinic persona uses only common_tools via config.py for now.

from __future__ import annotations
import logging
from typing import Awaitable, Callable, Dict, Any, List

log = logging.getLogger("clinic_tools")

# Placeholder stubs for clinic-specific tools
async def check_availability(date: str, service_type: str | None = None) -> dict:
    log.info(f"Checking availability for {date}, service: {service_type}")
    # In a real scenario, this would check a calendar or database
    return {"available_slots": ["10:00", "10:30", "14:00"], "reason": "Slots are examples"}

async def book_appointment(date: str, time: str, patient_name: str, service_type: str | None = None) -> dict:
    log.info(f"Booking appointment for {patient_name} on {date} at {time}, service: {service_type}")
    # In a real scenario, this would write to a calendar or database
    return {"ok": True, "confirmation_id": "CLINIC12345", "message": "Consulta marcada com sucesso."}

# No tools defined here for Phase 1
clinic_tools_list = [] 