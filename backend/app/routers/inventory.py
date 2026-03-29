import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.inventory import Inventory
from app.models.item import Item
from app.models.transaction import TransactionLog, TransactionType
from app.schemas.inventory import InventoryResponse, SellItemRequest
from app.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/inventory", response_model=list[InventoryResponse])
async def get_inventory(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Inventory)
        .options(selectinload(Inventory.item).selectinload(Item.categories))
        .where(Inventory.user_id == current_user.id)
        .order_by(Inventory.created_at.desc())
    )
    return result.scalars().all()


@router.post("/inventory/{item_id}/sell")
async def sell_item(
    item_id: uuid.UUID,
    sell_data: SellItemRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    inv_result = await db.execute(
        select(Inventory).where(
            Inventory.user_id == current_user.id, Inventory.item_id == item_id
        )
    )
    inventory = inv_result.scalar_one_or_none()
    if not inventory:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found in inventory")

    if inventory.quantity < sell_data.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient quantity. Available: {inventory.quantity}",
        )

    item_result = await db.execute(select(Item).where(Item.id == item_id))
    item = item_result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    refund = round(item.current_price * sell_data.quantity * 0.7, 2)

    inventory.quantity -= sell_data.quantity
    if inventory.quantity == 0:
        await db.delete(inventory)
    else:
        db.add(inventory)

    item.stock += sell_data.quantity
    db.add(item)

    current_user.balance = round(current_user.balance + refund, 2)
    db.add(current_user)

    tx = TransactionLog(
        id=uuid.uuid4(),
        user_id=current_user.id,
        type=TransactionType.sale,
        amount=refund,
        description=f"Sold {sell_data.quantity}x {item.name} for {refund} (70% refund)",
        reference_id=item_id,
    )
    db.add(tx)

    await db.flush()
    return {"message": "Items sold successfully", "refund": refund, "new_balance": current_user.balance}
