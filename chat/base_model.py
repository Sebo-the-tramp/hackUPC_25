from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import date

class Participant(BaseModel):
    name: str
    location: str
    passport: str
    budget: float
    availability: Optional[str]
    visited: Optional[List[str]] = []
    preferences: Optional[Dict[str, Any]] = {}

class BaseJourney(BaseModel):
    journey_id: str
    title: str
    creator: str
    status: str = "in_progress"
    participants: List[Participant]

    constraints: Optional[Dict[str, Any]] = {}
    inferred_context: Optional[Dict[str, Any]] = {}
    candidates: Optional[List[Dict[str, Any]]] = []
    final_choice: Optional[str] = None
    history: Optional[List[Dict[str, Any]]] = []
    metadata: Optional[Dict[str, Any]] = {}

    class Config:
        extra = "allow"  # allows adding fields not predefined
