from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.inventory import Inventory
from app.models.user import User
from app.models.listing import Listing
from app.models.bid import Bid
from app.core.security import get_current_user
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta


class InventoryItemResponse(BaseModel):
    item_id: int
    item_name: str
    quantity: int
    unit_price: float
    total_value: float
    
    class Config:
        from_attributes = True


class InventoryResponse(BaseModel):
    items: List[InventoryItemResponse]
    total_value: float


class ListInventoryItemRequest(BaseModel):
    item_id: int
    quantity: int
    listing_type: str  # sale | auction
    price: float
    auction_duration_hours: Optional[int] = None  # Hours for auction listings


class ListInventoryItemResponse(BaseModel):
    message: str
    item_id: int
    listed_quantity: int
    listing_type: str
    price: float


class ListingResponse(BaseModel):
    id: int
    item_id: int
    item_name: str
    quantity: int
    listing_type: str
    price: float
    status: str
    created_at: str
    expires_at: Optional[str] = None
    auction_duration_hours: Optional[int] = None
    
    class Config:
        from_attributes = True


class UserListingsResponse(BaseModel):
    listings: List[ListingResponse]
    count: int


class UpdateListingPriceRequest(BaseModel):
    price: float


class BidRequest(BaseModel):
    amount: float


class BidResponse(BaseModel):
    id: int
    listing_id: int
    bidder_id: int
    bidder_username: str
    amount: float
    created_at: str
    
    class Config:
        from_attributes = True


class ListingBidsResponse(BaseModel):
    listing_id: int
    highest_bid: Optional[float] = None
    current_winning_bidder: Optional[str] = None
    total_bids: int
    bids: List[BidResponse]


router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("", response_model=InventoryResponse)
def get_inventory(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """Get user inventory."""
    
    # Check if user exists
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get inventory items
    inventory_items = db.query(Inventory).filter(
        Inventory.user_id == current_user_id
    ).all()
    
    # Build response
    items = []
    total_value = 0.0
    
    for inv_item in inventory_items:
        item_value = inv_item.item.current_price * inv_item.quantity
        total_value += item_value
        
        items.append(InventoryItemResponse(
            item_id=inv_item.item_id,
            item_name=inv_item.item.name,
            quantity=inv_item.quantity,
            unit_price=inv_item.item.current_price,
            total_value=item_value
        ))
    
    return InventoryResponse(
        items=items,
        total_value=total_value
    )


@router.post("/list", response_model=ListInventoryItemResponse)
def list_inventory_item(
    payload: ListInventoryItemRequest,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """List an owned inventory item in the market as sale or auction."""

    if payload.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity must be greater than 0"
        )

    if payload.price < 0 or payload.price > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Price must be between 0 and 100"
        )

    listing_type = payload.listing_type.lower().strip()
    if listing_type not in {"sale", "auction"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="listing_type must be 'sale' or 'auction'"
        )
    
    # For auctions, validate duration
    if listing_type == "auction":
        if not payload.auction_duration_hours or payload.auction_duration_hours <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="auction_duration_hours must be positive for auction listings"
            )

    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    inventory_item = db.query(Inventory).filter(
        Inventory.user_id == current_user_id,
        Inventory.item_id == payload.item_id,
    ).first()

    if not inventory_item or inventory_item.quantity < payload.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not enough quantity in inventory"
        )

    item = inventory_item.item
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )

    # Move copies from personal inventory to market listing
    inventory_item.quantity -= payload.quantity
    
    if inventory_item.quantity == 0:
        db.delete(inventory_item)
    
    # Calculate expiration time if auction
    expires_at = None
    if listing_type == "auction":
        expires_at = datetime.utcnow() + timedelta(hours=payload.auction_duration_hours)
    
    # Create a new listing record
    new_listing = Listing(
        seller_id=current_user_id,
        item_id=payload.item_id,
        quantity=payload.quantity,
        listing_type=listing_type,
        price=round(float(payload.price), 2),
        auction_duration_hours=payload.auction_duration_hours,
        expires_at=expires_at,
        status="active"
    )
    db.add(new_listing)
    
    db.commit()

    action_text = "in vendita" if listing_type == "sale" else "in asta"
    return ListInventoryItemResponse(
        message=f"Oggetto messo {action_text} con successo",
        item_id=payload.item_id,
        listed_quantity=payload.quantity,
        listing_type=listing_type,
        price=round(float(payload.price), 2),
    )


@router.get("/listings", response_model=UserListingsResponse)
def get_user_listings(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """Get user's active listings for sale or auction."""
    
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    listings = db.query(Listing).filter(
        Listing.seller_id == current_user_id,
        Listing.status == "active"
    ).all()
    
    listing_responses = []
    for listing in listings:
        listing_responses.append(ListingResponse(
            id=listing.id,
            item_id=listing.item_id,
            item_name=listing.item.name,
            quantity=listing.quantity,
            listing_type=listing.listing_type,
            price=listing.price,
            status=listing.status,
            created_at=listing.created_at.isoformat()
        ))
    
    return UserListingsResponse(
        listings=listing_responses,
        count=len(listing_responses)
    )


@router.patch("/listings/{listing_id}/price")
def update_listing_price(
    listing_id: int,
    payload: UpdateListingPriceRequest,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """Update the price of an active listing."""
    
    if payload.price < 0 or payload.price > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Price must be between 0 and 100"
        )
    
    listing = db.query(Listing).filter(
        Listing.id == listing_id,
        Listing.seller_id == current_user_id,
        Listing.status == "active"
    ).first()
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found or you don't have permission"
        )
    
    old_price = listing.price
    listing.price = round(float(payload.price), 2)
    db.commit()
    
    return {
        "message": "Prezzo aggiornato con successo",
        "listing_id": listing_id,
        "old_price": old_price,
        "new_price": listing.price
    }


@router.get("/auctions/active", response_model=UserListingsResponse)
def get_active_auctions(
    db: Session = Depends(get_db)
):
    """Get all active auction listings (public endpoint)."""
    
    # Get active auctions that haven't expired
    auctions = db.query(Listing).filter(
        Listing.listing_type == "auction",
        Listing.status == "active"
    ).all()
    
    # Filter out expired auctions
    active_auctions = []
    for auction in auctions:
        if not auction.is_expired():
            active_auctions.append(auction)
    
    auction_responses = []
    for auction in active_auctions:
        auction_responses.append(ListingResponse(
            id=auction.id,
            item_id=auction.item_id,
            item_name=auction.item.name,
            quantity=auction.quantity,
            listing_type=auction.listing_type,
            price=auction.price,
            status=auction.status,
            expires_at=auction.expires_at.isoformat() if auction.expires_at else None,
            auction_duration_hours=auction.auction_duration_hours,
            created_at=auction.created_at.isoformat()
        ))
    
    return UserListingsResponse(
        listings=auction_responses,
        count=len(auction_responses)
    )


@router.post("/auctions/{listing_id}/bid")
def place_bid(
    listing_id: int,
    payload: BidRequest,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """Place a bid on an active auction."""
    
    # Get auction
    listing = db.query(Listing).filter(
        Listing.id == listing_id,
        Listing.listing_type == "auction",
        Listing.status == "active"
    ).first()
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Auction not found or is not active"
        )
    
    # Check if auction has expired
    if listing.is_expired():
        listing.status = "expired"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Auction has expired"
        )
    
    # Get bidder
    bidder = db.query(User).filter(User.id == current_user_id).first()
    if not bidder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if bidder is the seller (can't bid on own auctions)
    if listing.seller_id == current_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot bid on your own auction"
        )
    
    # Validate bid amount
    if payload.amount <= 0 or payload.amount > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bid amount must be between 0 and 100"
        )
    
    # Check if bid is higher than starting price
    if payload.amount < listing.price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Bid must be at least {listing.price} (starting price)"
        )
    
    # Check if bid is higher than current highest bid
    highest_bid = db.query(Bid).filter(
        Bid.listing_id == listing_id
    ).order_by(Bid.amount.desc()).first()
    
    if highest_bid and payload.amount <= highest_bid.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Bid must be higher than current highest bid ({highest_bid.amount})"
        )
    
    # Create bid record
    bid = Bid(
        listing_id=listing_id,
        bidder_id=current_user_id,
        amount=round(float(payload.amount), 2)
    )
    db.add(bid)
    db.commit()
    db.refresh(bid)
    
    return {
        "message": "Offerta piazzata con successo",
        "bid_id": bid.id,
        "listing_id": listing_id,
        "amount": bid.amount
    }


@router.get("/auctions/{listing_id}/bids", response_model=ListingBidsResponse)
def get_auction_bids(
    listing_id: int,
    db: Session = Depends(get_db)
):
    """Get all bids for an auction (public endpoint)."""
    
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Auction not found"
        )
    
    bids = db.query(Bid).filter(
        Bid.listing_id == listing_id
    ).order_by(Bid.amount.desc()).all()
    
    bid_responses = []
    for bid in bids:
        bid_responses.append(BidResponse(
            id=bid.id,
            listing_id=bid.listing_id,
            bidder_id=bid.bidder_id,
            bidder_username=bid.bidder.username,
            amount=bid.amount,
            created_at=bid.created_at.isoformat()
        ))
    
    highest_bid = bids[0] if bids else None
    
    return ListingBidsResponse(
        listing_id=listing_id,
        highest_bid=highest_bid.amount if highest_bid else listing.price,
        current_winning_bidder=highest_bid.bidder.username if highest_bid else None,
        total_bids=len(bids),
        bids=bid_responses
    )


