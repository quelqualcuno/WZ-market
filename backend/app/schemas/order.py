import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.order import OrderStatus


class OrderCreate(BaseModel):
    item_id: uuid.UUID
    quantity: int


class OrderResponse(BaseModel):
    id: uuid.UUID
    buyer_id: uuid.UUID
    item_id: uuid.UUID
    quantity: int
    unit_price: float
    total_price: float
    status: OrderStatus
    created_at: datetime
    model_config = {"from_attributes": True}
