import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.auction import Auction, AuctionStatus, Bid
from app.models.inventory import Inventory
from app.models.item import Item
from app.models.transaction import TransactionLog, TransactionType
from app.models.price_history import PriceSource
from app.schemas.auction import AuctionCreate, BidCreate, AuctionResponse, BidResponse
from app.services.economy import record_price
from app.deps import get_current_user
from app.models.user import User

router = APIRouter()


def _auction_query_with_relations():
    return select(Auction).options(
        selectinload(Auction.item).selectinload(Item.categories),
        selectinload(Auction.seller),
        selectinload(Auction.bids).selectinload(Bid.bidder),
    )


@router.get("/auctions", response_model=list[AuctionResponse])
async def list_auctions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)

    expired_result = await db.execute(
        select(Auction).where(
            Auction.status == AuctionStatus.active, Auction.ends_at <= now
        )
    )
    expired = expired_result.scalars().all()
    for auction in expired:
        auction.status = AuctionStatus.ended
        db.add(auction)
    if expired:
        await db.flush()

    offset = (page - 1) * page_size
    result = await db.execute(
        _auction_query_with_relations()
        .where(Auction.status == AuctionStatus.active)
        .order_by(Auction.ends_at.asc())
        .offset(offset)
        .limit(page_size)
    )
    return result.scalars().all()


@router.post("/auctions", response_model=AuctionResponse, status_code=status.HTTP_201_CREATED)
async def create_auction(
    auction_data: AuctionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    inv_result = await db.execute(
        select(Inventory).where(
            Inventory.user_id == current_user.id, Inventory.item_id == auction_data.item_id
        )
    )
    inventory = inv_result.scalar_one_or_none()
    if not inventory or inventory.quantity < auction_data.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient item quantity in inventory",
        )

    inventory.quantity -= auction_data.quantity
    if inventory.quantity == 0:
        await db.delete(inventory)
    else:
        db.add(inventory)

    now = datetime.now(timezone.utc)
    auction = Auction(
        id=uuid.uuid4(),
        seller_id=current_user.id,
        item_id=auction_data.item_id,
        quantity=auction_data.quantity,
        starting_price=auction_data.starting_price,
        current_price=auction_data.starting_price,
        buyout_price=auction_data.buyout_price,
        status=AuctionStatus.active,
        starts_at=now,
        ends_at=auction_data.ends_at,
    )
    db.add(auction)
    await db.flush()

    result = await db.execute(_auction_query_with_relations().where(Auction.id == auction.id))
    return result.scalar_one()


@router.get("/auctions/{auction_id}", response_model=AuctionResponse)
async def get_auction(auction_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(_auction_query_with_relations().where(Auction.id == auction_id))
    auction = result.scalar_one_or_none()
    if not auction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Auction not found")
    return auction


@router.post("/auctions/{auction_id}/bid", response_model=BidResponse)
async def place_bid(
    auction_id: uuid.UUID,
    bid_data: BidCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Auction).options(selectinload(Auction.bids)).where(Auction.id == auction_id)
    )
    auction = result.scalar_one_or_none()
    if not auction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Auction not found")
    if auction.status != AuctionStatus.active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Auction is not active")
    if auction.ends_at <= datetime.now(timezone.utc):
        auction.status = AuctionStatus.ended
        db.add(auction)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Auction has ended")
    if auction.seller_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot bid on your own auction")
    if bid_data.amount <= auction.current_price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Bid must be greater than current price: {auction.current_price}",
        )
    if current_user.balance < bid_data.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient balance. Required: {bid_data.amount}",
        )

    if auction.bids:
        sorted_bids = sorted(auction.bids, key=lambda b: b.amount, reverse=True)
        prev_top = sorted_bids[0]
        if prev_top.bidder_id != current_user.id:
            refund_result = await db.execute(select(User).where(User.id == prev_top.bidder_id))
            prev_bidder = refund_result.scalar_one()
            prev_bidder.balance = round(prev_bidder.balance + prev_top.amount, 2)
            db.add(prev_bidder)

    current_user.balance = round(current_user.balance - bid_data.amount, 2)
    db.add(current_user)

    bid = Bid(
        id=uuid.uuid4(),
        auction_id=auction_id,
        bidder_id=current_user.id,
        amount=bid_data.amount,
    )
    db.add(bid)

    auction.current_price = bid_data.amount
    db.add(auction)

    tx = TransactionLog(
        id=uuid.uuid4(),
        user_id=current_user.id,
        type=TransactionType.bid,
        amount=-bid_data.amount,
        description=f"Placed bid of {bid_data.amount} on auction {auction_id}",
        reference_id=auction_id,
    )
    db.add(tx)

    await db.flush()
    await db.refresh(bid, ["bidder"])
    return bid


@router.post("/auctions/{auction_id}/buyout", response_model=AuctionResponse)
async def buyout_auction(
    auction_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Auction).options(selectinload(Auction.bids)).where(Auction.id == auction_id)
    )
    auction = result.scalar_one_or_none()
    if not auction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Auction not found")
    if auction.status != AuctionStatus.active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Auction is not active")
    if not auction.buyout_price:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Auction has no buyout price")
    if auction.seller_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot buyout your own auction")
    if current_user.balance < auction.buyout_price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient balance. Required: {auction.buyout_price}",
        )

    if auction.bids:
        sorted_bids = sorted(auction.bids, key=lambda b: b.amount, reverse=True)
        prev_top = sorted_bids[0]
        refund_result = await db.execute(select(User).where(User.id == prev_top.bidder_id))
        prev_bidder = refund_result.scalar_one()
        prev_bidder.balance = round(prev_bidder.balance + prev_top.amount, 2)
        db.add(prev_bidder)

    current_user.balance = round(current_user.balance - auction.buyout_price, 2)
    db.add(current_user)

    seller_result = await db.execute(select(User).where(User.id == auction.seller_id))
    seller = seller_result.scalar_one()
    seller.balance = round(seller.balance + auction.buyout_price, 2)
    db.add(seller)

    inv_result = await db.execute(
        select(Inventory).where(
            Inventory.user_id == current_user.id, Inventory.item_id == auction.item_id
        )
    )
    buyer_inv = inv_result.scalar_one_or_none()
    if buyer_inv:
        buyer_inv.quantity += auction.quantity
        db.add(buyer_inv)
    else:
        buyer_inv = Inventory(
            id=uuid.uuid4(),
            user_id=current_user.id,
            item_id=auction.item_id,
            quantity=auction.quantity,
            acquired_price=auction.buyout_price,
        )
        db.add(buyer_inv)

    auction.status = AuctionStatus.ended
    auction.winner_id = current_user.id
    auction.current_price = auction.buyout_price
    db.add(auction)

    await record_price(auction.item_id, auction.buyout_price, PriceSource.auction, db)

    tx_buyer = TransactionLog(
        id=uuid.uuid4(),
        user_id=current_user.id,
        type=TransactionType.auction_win,
        amount=-auction.buyout_price,
        description=f"Bought out auction {auction_id} for {auction.buyout_price}",
        reference_id=auction_id,
    )
    db.add(tx_buyer)

    tx_seller = TransactionLog(
        id=uuid.uuid4(),
        user_id=auction.seller_id,
        type=TransactionType.escrow_release,
        amount=auction.buyout_price,
        description=f"Auction {auction_id} bought out for {auction.buyout_price}",
        reference_id=auction_id,
    )
    db.add(tx_seller)

    await db.flush()

    result = await db.execute(_auction_query_with_relations().where(Auction.id == auction_id))
    return result.scalar_one()
