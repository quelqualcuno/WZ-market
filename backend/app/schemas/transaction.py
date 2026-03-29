import uuid
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from app.models.transaction import TransactionType


class TransactionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    type: TransactionType
    amount: float
    description: str
    created_at: datetime
    reference_id: Optional[uuid.UUID]
    model_config = {"from_attributes": True}
