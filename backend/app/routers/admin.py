import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.user import User
from app.models.item import Item
from app.models.order import Order
from app.models.offer import Offer, OfferStatus
from app.models.auction import Auction, AuctionStatus
from app.models.transaction import TransactionLog
from app.schemas.user import UserResponse
from app.schemas.item import ItemResponse
from app.schemas.transaction import TransactionResponse
from app.deps import get_current_admin
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class AdminUserUpdate(BaseModel):
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    balance: Optional[float] = None


class RestockRequest(BaseModel):
    quantity: int


@router.get("/admin/dashboard")
async def admin_dashboard(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    total_users_result = await db.execute(select(func.count()).select_from(User))
    total_users = total_users_result.scalar()

    total_items_result = await db.execute(select(func.count()).select_from(Item))
    total_items = total_items_result.scalar()

    total_orders_result = await db.execute(select(func.count()).select_from(Order))
    total_orders = total_orders_result.scalar()

    total_volume_result = await db.execute(select(func.sum(Order.total_price)).select_from(Order))
    total_volume = total_volume_result.scalar() or 0.0

    active_offers_result = await db.execute(
        select(func.count()).select_from(Offer).where(Offer.status == OfferStatus.active)
    )
    active_offers = active_offers_result.scalar()

    active_auctions_result = await db.execute(
        select(func.count()).select_from(Auction).where(Auction.status == AuctionStatus.active)
    )
    active_auctions = active_auctions_result.scalar()

    return {
        "total_users": total_users,
        "total_items": total_items,
        "total_orders": total_orders,
        "total_volume": total_volume,
        "active_offers": active_offers,
        "active_auctions": active_auctions,
    }


@router.get("/admin/users", response_model=list[UserResponse])
async def list_all_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    offset = (page - 1) * page_size
    result = await db.execute(
        select(User).order_by(User.created_at.desc()).offset(offset).limit(page_size)
    )
    return result.scalars().all()


@router.put("/admin/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    update_data: AdminUserUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if update_data.is_active is not None:
        user.is_active = update_data.is_active
    if update_data.is_admin is not None:
        user.is_admin = update_data.is_admin
    if update_data.balance is not None:
        user.balance = update_data.balance

    db.add(user)
    await db.flush()
    return user


@router.get("/admin/items", response_model=list[ItemResponse])
async def list_all_items(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    offset = (page - 1) * page_size
    result = await db.execute(
        select(Item)
        .options(selectinload(Item.categories))
        .order_by(Item.name.asc())
        .offset(offset)
        .limit(page_size)
    )
    return result.scalars().all()


@router.post("/admin/items/{item_id}/restock", response_model=ItemResponse)
async def restock_item(
    item_id: uuid.UUID,
    restock_data: RestockRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    result = await db.execute(
        select(Item).options(selectinload(Item.categories)).where(Item.id == item_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    item.stock += restock_data.quantity
    db.add(item)
    await db.flush()
    return item


@router.get("/admin/transactions", response_model=list[TransactionResponse])
async def list_all_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    offset = (page - 1) * page_size
    result = await db.execute(
        select(TransactionLog)
        .order_by(TransactionLog.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    return result.scalars().all()
