from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.order import Order, OrderStatus
from app.models.item import Item
from app.models.user import User
from app.models.inventory import Inventory
from app.schemas.order import OrderCreate, OrderResponse
from app.core.security import get_current_user

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """Create a new order (purchase item)."""

    if order_data.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity must be greater than 0"
        )
    
    # Get user
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get item
    item = db.query(Item).filter(Item.id == order_data.item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    # Check stock
    if item.available_copies < order_data.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not enough stock available"
        )
    
    # Calculate total and verify buyer has enough credit.
    total_price = round(item.current_price * order_data.quantity, 2)
    if user.balance < total_price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient credit. Required: {total_price:.2f}, Available: {user.balance:.2f}"
        )
    
    # Create order
    order = Order(
        user_id=current_user_id,
        item_id=order_data.item_id,
        quantity=order_data.quantity,
        unit_price=item.current_price,
        total_price=total_price,
        status=OrderStatus.COMPLETED
    )
    
    # Deduct balance after all checks.
    user.balance = round(user.balance - total_price, 2)
    
    # Update item availability
    item.available_copies -= order_data.quantity
    
    # Update or create inventory entry
    inventory = db.query(Inventory).filter(
        (Inventory.user_id == current_user_id) & (Inventory.item_id == order_data.item_id)
    ).first()
    
    if inventory:
        inventory.quantity += order_data.quantity
    else:
        inventory = Inventory(
            user_id=current_user_id,
            item_id=order_data.item_id,
            quantity=order_data.quantity
        )
        db.add(inventory)
    
    db.add(order)
    db.commit()
    db.refresh(order)
    
    return order


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """Get order details."""
    
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check if user has access to this order
    if order.user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return order
