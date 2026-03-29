import uuid
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from app.models.offer import OfferStatus
from app.schemas.item import ItemResponse
from app.schemas.user import UserPublic


class OfferCreate(BaseModel):
    item_id: uuid.UUID
    quantity: int
    price_per_unit: float
    expires_at: Optional[datetime] = None


class OfferResponse(BaseModel):
    id: uuid.UUID
    seller_id: uuid.UUID
    item_id: uuid.UUID
    quantity: int
    price_per_unit: float
    status: OfferStatus
    expires_at: Optional[datetime]
    created_at: datetime
    buyer_id: Optional[uuid.UUID]
    item: ItemResponse
    seller: UserPublic
    model_config = {"from_attributes": True}
