from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class OrderCreate(BaseModel):
    """Schema for creating an order."""
    item_id: int
    quantity: int = 1


class OrderResponse(BaseModel):
    """Schema for order response."""
    id: int
    user_id: int
    item_id: int
    quantity: int
    unit_price: float
    total_price: float
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
