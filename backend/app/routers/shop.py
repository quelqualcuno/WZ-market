from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.item import Item
from app.models.order import Order, OrderStatus
from app.models.inventory import Inventory
from app.models.transaction import TransactionLog, TransactionType
from app.schemas.order import OrderCreate, OrderResponse
from app.services.economy import adjust_price, record_price
from app.models.price_history import PriceSource
from app.deps import get_current_user
from app.models.user import User
import uuid

router = APIRouter()


@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def buy_item(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Item).where(Item.id == order_data.item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    if item.stock < order_data.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock. Available: {item.stock}",
        )

    total_price = item.current_price * order_data.quantity
    if current_user.balance < total_price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient balance. Required: {total_price}, Available: {current_user.balance}",
        )

    current_user.balance = round(current_user.balance - total_price, 2)
    item.stock -= order_data.quantity

    inv_result = await db.execute(
        select(Inventory).where(
            Inventory.user_id == current_user.id, Inventory.item_id == item.id
        )
    )
    inventory = inv_result.scalar_one_or_none()
    if inventory:
        new_qty = inventory.quantity + order_data.quantity
        avg_price = (
            (inventory.acquired_price * inventory.quantity) + (item.current_price * order_data.quantity)
        ) / new_qty
        inventory.quantity = new_qty
        inventory.acquired_price = round(avg_price, 2)
        db.add(inventory)
    else:
        inventory = Inventory(
            id=uuid.uuid4(),
            user_id=current_user.id,
            item_id=item.id,
            quantity=order_data.quantity,
            acquired_price=item.current_price,
        )
        db.add(inventory)

    order = Order(
        id=uuid.uuid4(),
        buyer_id=current_user.id,
        item_id=item.id,
        quantity=order_data.quantity,
        unit_price=item.current_price,
        total_price=total_price,
        status=OrderStatus.completed,
    )
    db.add(order)

    tx = TransactionLog(
        id=uuid.uuid4(),
        user_id=current_user.id,
        type=TransactionType.purchase,
        amount=-total_price,
        description=f"Purchased {order_data.quantity}x {item.name} for {total_price}",
        reference_id=order.id,
    )
    db.add(tx)

    await record_price(item.id, item.current_price, PriceSource.shop, db)
    await adjust_price(item, db)

    db.add(item)
    db.add(current_user)

    await db.flush()
    return order
