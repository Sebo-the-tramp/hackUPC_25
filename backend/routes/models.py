"""Common Pydantic models for routes."""

from typing import List, Optional
from pydantic import BaseModel


class QuestionAnswer(BaseModel):
    """Model for question and answer pairs."""

    question: str
    answer: str
