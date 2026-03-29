from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.models.transaction import TransactionLog
from app.schemas.user import UserResponse, UserPublic, UserUpdate
from app.schemas.transaction import TransactionResponse
from app.deps import get_current_user

router = APIRouter()


@router.get("/users/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/users/me", response_model=UserResponse)
async def update_me(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if update_data.email is not None:
        result = await db.execute(
            select(User).where(User.email == update_data.email, User.id != current_user.id)
        )
        if result.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use")
        current_user.email = update_data.email

    if update_data.roblox_username is not None:
        current_user.roblox_username = update_data.roblox_username

    db.add(current_user)
    await db.flush()
    return current_user


@router.get("/users/{username}", response_model=UserPublic)
async def get_user_profile(username: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.get("/users/me/transaction-history", response_model=list[TransactionResponse])
async def get_transaction_history(
    page: int = 1,
    page_size: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * page_size
    result = await db.execute(
        select(TransactionLog)
        .where(TransactionLog.user_id == current_user.id)
        .order_by(TransactionLog.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    return result.scalars().all()
