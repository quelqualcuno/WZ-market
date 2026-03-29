import uuid
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from app.models.auction import AuctionStatus
from app.schemas.item import ItemResponse
from app.schemas.user import UserPublic


class AuctionCreate(BaseModel):
    item_id: uuid.UUID
    quantity: int
    starting_price: float
    buyout_price: Optional[float] = None
    ends_at: datetime


class BidCreate(BaseModel):
    amount: float


class BidResponse(BaseModel):
    id: uuid.UUID
    auction_id: uuid.UUID
    bidder_id: uuid.UUID
    amount: float
    created_at: datetime
    bidder: UserPublic
    model_config = {"from_attributes": True}


class AuctionResponse(BaseModel):
    id: uuid.UUID
    seller_id: uuid.UUID
    item_id: uuid.UUID
    quantity: int
    starting_price: float
    current_price: float
    buyout_price: Optional[float]
    status: AuctionStatus
    starts_at: datetime
    ends_at: datetime
    created_at: datetime
    winner_id: Optional[uuid.UUID]
    item: ItemResponse
    seller: UserPublic
    bids: list[BidResponse] = []
    model_config = {"from_attributes": True}
