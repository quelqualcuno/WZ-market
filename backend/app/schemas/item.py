from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class CategoryResponse(BaseModel):
    """Schema for category response."""
    id: int
    name: str
    
    class Config:
        from_attributes = True


class ItemCreate(BaseModel):
    """Schema for creating an item."""
    name: str
    description: Optional[str] = None
    base_price: float
    total_copies: int
    is_legacy: bool = False
    image_url: Optional[str] = None


class ItemResponse(BaseModel):
    """Schema for item response."""
    id: int
    name: str
    description: Optional[str]
    image_url: Optional[str]
    current_price: float
    base_price: float
    total_copies: int
    available_copies: int
    is_legacy: bool
    rarity_index: float
    created_at: datetime
    updated_at: datetime
    categories: Optional[List[CategoryResponse]] = []
    
    class Config:
        from_attributes = True


class ItemListResponse(BaseModel):
    """Schema for items list."""
    items: List[ItemResponse]
    total: int
    page: int
    page_size: int
