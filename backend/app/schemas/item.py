import uuid
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from app.models.item import Rarity


class CategoryBase(BaseModel):
    name: str
    slug: str


class CategoryResponse(CategoryBase):
    id: int
    model_config = {"from_attributes": True}


class ItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    base_price: float
    current_price: float
    stock: int
    is_legacy: bool = False
    rarity: Rarity = Rarity.common


class ItemCreate(ItemBase):
    category_ids: Optional[list[int]] = []


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    base_price: Optional[float] = None
    current_price: Optional[float] = None
    stock: Optional[int] = None
    is_legacy: Optional[bool] = None
    rarity: Optional[Rarity] = None
    category_ids: Optional[list[int]] = None


class ItemResponse(ItemBase):
    id: uuid.UUID
    created_at: datetime
    categories: list[CategoryResponse] = []
    model_config = {"from_attributes": True}


class PriceHistoryResponse(BaseModel):
    id: uuid.UUID
    item_id: uuid.UUID
    price: float
    recorded_at: datetime
    source: str
    model_config = {"from_attributes": True}
