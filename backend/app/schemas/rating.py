import uuid
from datetime import datetime
from pydantic import BaseModel, field_validator
from typing import Optional


class RatingCreate(BaseModel):
    rated_user_id: uuid.UUID
    order_id: Optional[uuid.UUID] = None
    score: int
    comment: Optional[str] = None

    @field_validator("score")
    @classmethod
    def validate_score(cls, v):
        if v < 1 or v > 5:
            raise ValueError("Score must be between 1 and 5")
        return v


class RatingResponse(BaseModel):
    id: uuid.UUID
    rater_id: uuid.UUID
    rated_user_id: uuid.UUID
    order_id: Optional[uuid.UUID]
    score: int
    comment: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}
