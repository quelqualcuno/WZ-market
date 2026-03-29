from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.item import Item
from app.models.price_history import PriceHistory
from app.schemas.item import ItemCreate, ItemResponse, ItemListResponse

router = APIRouter(prefix="/items", tags=["items"])


@router.get("", response_model=ItemListResponse)
def list_items(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    sort_by: str = Query("name", regex="^(name|price|rarity)$")
):
    """List all items with pagination and filtering."""
    
    query = db.query(Item)
    
    # Apply search filter
    if search:
        query = query.filter(Item.name.ilike(f"%{search}%"))
    
    # Count total items
    total = query.count()
    
    # Apply sorting
    if sort_by == "price":
        query = query.order_by(Item.current_price)
    elif sort_by == "rarity":
        query = query.order_by(Item.rarity_index.desc())
    else:
        query = query.order_by(Item.name)
    
    # Apply pagination
    items = query.offset(skip).limit(limit).all()
    
    return ItemListResponse(
        items=items,
        total=total,
        page=skip // limit + 1,
        page_size=limit
    )


@router.get("/{item_id}", response_model=ItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    """Get item details."""
    
    item = db.query(Item).filter(Item.id == item_id).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    return item


@router.post("", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
def create_item(item_data: ItemCreate, db: Session = Depends(get_db)):
    """Create a new item (admin only for MVP)."""
    
    # Check if item already exists
    existing_item = db.query(Item).filter(Item.name == item_data.name).first()
    
    if existing_item:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item already exists"
        )
    
    # Create new item
    item = Item(
        name=item_data.name,
        description=item_data.description,
        image_url=item_data.image_url,
        base_price=item_data.base_price,
        current_price=item_data.base_price,
        total_copies=item_data.total_copies,
        available_copies=item_data.total_copies,
        is_legacy=item_data.is_legacy
    )
    
    db.add(item)
    db.commit()
    db.refresh(item)
    
    # Record initial price history
    price_history = PriceHistory(item_id=item.id, price=item.current_price)
    db.add(price_history)
    db.commit()
    
    return item
