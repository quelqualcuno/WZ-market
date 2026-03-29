import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.rating import Rating
from app.models.user import User
from app.schemas.rating import RatingCreate, RatingResponse
from app.deps import get_current_user

router = APIRouter()


@router.post("/ratings", response_model=RatingResponse, status_code=status.HTTP_201_CREATED)
async def submit_rating(
    rating_data: RatingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if rating_data.rated_user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot rate yourself")

    rated_result = await db.execute(select(User).where(User.id == rating_data.rated_user_id))
    rated_user = rated_result.scalar_one_or_none()
    if not rated_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    rating = Rating(
        id=uuid.uuid4(),
        rater_id=current_user.id,
        rated_user_id=rating_data.rated_user_id,
        order_id=rating_data.order_id,
        score=rating_data.score,
        comment=rating_data.comment,
    )
    db.add(rating)

    total = rated_user.total_ratings
    current_score = rated_user.reputation_score
    new_total = total + 1
    new_score = round(((current_score * total) + rating_data.score) / new_total, 2)
    rated_user.reputation_score = new_score
    rated_user.total_ratings = new_total
    db.add(rated_user)

    await db.flush()
    return rating


@router.get("/ratings/{username}", response_model=list[RatingResponse])
async def get_user_ratings(
    username: str,
    db: AsyncSession = Depends(get_db),
):
    user_result = await db.execute(select(User).where(User.username == username))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    result = await db.execute(
        select(Rating)
        .where(Rating.rated_user_id == user.id)
        .order_by(Rating.created_at.desc())
    )
    return result.scalars().all()
