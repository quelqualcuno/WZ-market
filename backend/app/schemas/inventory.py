import uuid
from datetime import datetime
from pydantic import BaseModel
from app.schemas.item import ItemResponse


class InventoryResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    item_id: uuid.UUID
    quantity: int
    acquired_price: float
    created_at: datetime
    updated_at: datetime
    item: ItemResponse
    model_config = {"from_attributes": True}


class SellItemRequest(BaseModel):
    quantity: int
