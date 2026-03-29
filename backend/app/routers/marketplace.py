import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.offer import Offer, OfferStatus
from app.models.inventory import Inventory
from app.models.item import Item
from app.models.transaction import TransactionLog, TransactionType, Escrow, EscrowStatus
from app.models.price_history import PriceSource
from app.schemas.offer import OfferCreate, OfferResponse
from app.services.economy import record_price
from app.deps import get_current_user
from app.models.user import User
from typing import Optional

router = APIRouter()


def _offer_query_with_relations():
    return select(Offer).options(
        selectinload(Offer.item).selectinload(Item.categories),
        selectinload(Offer.seller),
    )


@router.get("/offers", response_model=list[OfferResponse])
async def list_offers(
    item_id: Optional[uuid.UUID] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = _offer_query_with_relations().where(Offer.status == OfferStatus.active)

    if item_id:
        query = query.where(Offer.item_id == item_id)
    if min_price is not None:
        query = query.where(Offer.price_per_unit >= min_price)
    if max_price is not None:
        query = query.where(Offer.price_per_unit <= max_price)

    offset = (page - 1) * page_size
    query = query.order_by(Offer.created_at.desc()).offset(offset).limit(page_size)

    result = await db.execute(query)
    return result.scalars().all()


@router.post("/offers", response_model=OfferResponse, status_code=status.HTTP_201_CREATED)
async def create_offer(
    offer_data: OfferCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    inv_result = await db.execute(
        select(Inventory).where(
            Inventory.user_id == current_user.id, Inventory.item_id == offer_data.item_id
        )
    )
    inventory = inv_result.scalar_one_or_none()
    if not inventory or inventory.quantity < offer_data.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient item quantity in inventory",
        )

    inventory.quantity -= offer_data.quantity
    if inventory.quantity == 0:
        await db.delete(inventory)
    else:
        db.add(inventory)

    offer = Offer(
        id=uuid.uuid4(),
        seller_id=current_user.id,
        item_id=offer_data.item_id,
        quantity=offer_data.quantity,
        price_per_unit=offer_data.price_per_unit,
        status=OfferStatus.active,
        expires_at=offer_data.expires_at,
    )
    db.add(offer)

    total_amount = offer_data.price_per_unit * offer_data.quantity
    escrow = Escrow(
        id=uuid.uuid4(),
        seller_id=current_user.id,
        buyer_id=current_user.id,
        item_id=offer_data.item_id,
        quantity=offer_data.quantity,
        amount=total_amount,
        status=EscrowStatus.held,
    )
    db.add(escrow)

    tx = TransactionLog(
        id=uuid.uuid4(),
        user_id=current_user.id,
        type=TransactionType.offer,
        amount=0.0,
        description=f"Listed {offer_data.quantity}x item for {offer_data.price_per_unit} each",
        reference_id=offer.id,
    )
    db.add(tx)

    await db.flush()

    result = await db.execute(_offer_query_with_relations().where(Offer.id == offer.id))
    return result.scalar_one()


@router.get("/offers/{offer_id}", response_model=OfferResponse)
async def get_offer(offer_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(_offer_query_with_relations().where(Offer.id == offer_id))
    offer = result.scalar_one_or_none()
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")
    return offer


@router.post("/offers/{offer_id}/buy", response_model=OfferResponse)
async def buy_offer(
    offer_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        _offer_query_with_relations().where(Offer.id == offer_id)
    )
    offer = result.scalar_one_or_none()
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")
    if offer.status != OfferStatus.active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Offer is not active")
    if offer.seller_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot buy your own offer")

    if offer.expires_at and offer.expires_at < datetime.now(timezone.utc):
        offer.status = OfferStatus.expired
        db.add(offer)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Offer has expired")

    total = offer.price_per_unit * offer.quantity
    if current_user.balance < total:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient balance. Required: {total}",
        )

    current_user.balance = round(current_user.balance - total, 2)
    db.add(current_user)

    escrow_result = await db.execute(
        select(Escrow).where(
            Escrow.seller_id == offer.seller_id,
            Escrow.item_id == offer.item_id,
            Escrow.status == EscrowStatus.held,
        )
    )
    escrow = escrow_result.scalar_one_or_none()
    if escrow:
        escrow.status = EscrowStatus.released
        escrow.released_at = datetime.now(timezone.utc)
        escrow.buyer_id = current_user.id
        db.add(escrow)

    seller_result = await db.execute(select(User).where(User.id == offer.seller_id))
    seller = seller_result.scalar_one()
    seller.balance = round(seller.balance + total, 2)
    db.add(seller)

    inv_result = await db.execute(
        select(Inventory).where(
            Inventory.user_id == current_user.id, Inventory.item_id == offer.item_id
        )
    )
    buyer_inv = inv_result.scalar_one_or_none()
    if buyer_inv:
        new_qty = buyer_inv.quantity + offer.quantity
        avg_price = (
            (buyer_inv.acquired_price * buyer_inv.quantity) + (offer.price_per_unit * offer.quantity)
        ) / new_qty
        buyer_inv.quantity = new_qty
        buyer_inv.acquired_price = round(avg_price, 2)
        db.add(buyer_inv)
    else:
        buyer_inv = Inventory(
            id=uuid.uuid4(),
            user_id=current_user.id,
            item_id=offer.item_id,
            quantity=offer.quantity,
            acquired_price=offer.price_per_unit,
        )
        db.add(buyer_inv)

    offer.status = OfferStatus.sold
    offer.buyer_id = current_user.id
    db.add(offer)

    await record_price(offer.item_id, offer.price_per_unit, PriceSource.marketplace, db)

    tx_buyer = TransactionLog(
        id=uuid.uuid4(),
        user_id=current_user.id,
        type=TransactionType.purchase,
        amount=-total,
        description=f"Bought {offer.quantity}x item from marketplace for {total}",
        reference_id=offer.id,
    )
    db.add(tx_buyer)

    tx_seller = TransactionLog(
        id=uuid.uuid4(),
        user_id=offer.seller_id,
        type=TransactionType.escrow_release,
        amount=total,
        description=f"Sold {offer.quantity}x item on marketplace for {total}",
        reference_id=offer.id,
    )
    db.add(tx_seller)

    await db.flush()

    result = await db.execute(_offer_query_with_relations().where(Offer.id == offer_id))
    return result.scalar_one()


@router.delete("/offers/{offer_id}")
async def cancel_offer(
    offer_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Offer).where(Offer.id == offer_id))
    offer = result.scalar_one_or_none()
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")
    if offer.seller_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your offer")
    if offer.status != OfferStatus.active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Offer is not active")

    inv_result = await db.execute(
        select(Inventory).where(
            Inventory.user_id == current_user.id, Inventory.item_id == offer.item_id
        )
    )
    inventory = inv_result.scalar_one_or_none()
    if inventory:
        inventory.quantity += offer.quantity
        db.add(inventory)
    else:
        inventory = Inventory(
            id=uuid.uuid4(),
            user_id=current_user.id,
            item_id=offer.item_id,
            quantity=offer.quantity,
            acquired_price=offer.price_per_unit,
        )
        db.add(inventory)

    escrow_result = await db.execute(
        select(Escrow).where(
            Escrow.seller_id == current_user.id,
            Escrow.item_id == offer.item_id,
            Escrow.status == EscrowStatus.held,
        )
    )
    escrow = escrow_result.scalar_one_or_none()
    if escrow:
        escrow.status = EscrowStatus.refunded
        db.add(escrow)

    offer.status = OfferStatus.cancelled
    db.add(offer)

    await db.flush()
    return {"message": "Offer cancelled and items returned to inventory"}
