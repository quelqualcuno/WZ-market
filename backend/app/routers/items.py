import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.item import Item, Category, ItemCategory, Rarity
from app.schemas.item import ItemCreate, ItemUpdate, ItemResponse, PriceHistoryResponse
from app.models.price_history import PriceHistory
from app.deps import get_current_admin
from typing import Optional

router = APIRouter()


@router.get("/items", response_model=list[ItemResponse])
async def list_items(
    category: Optional[str] = Query(None),
    rarity: Optional[Rarity] = Query(None),
    search: Optional[str] = Query(None),
    sort: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Item).options(selectinload(Item.categories))

    if category:
        query = query.join(ItemCategory, Item.id == ItemCategory.item_id).join(
            Category, ItemCategory.category_id == Category.id
        ).where(Category.slug == category)

    if rarity:
        query = query.where(Item.rarity == rarity)

    if search:
        query = query.where(Item.name.ilike(f"%{search}%"))

    if sort == "price_asc":
        query = query.order_by(Item.current_price.asc())
    elif sort == "price_desc":
        query = query.order_by(Item.current_price.desc())
    elif sort == "name":
        query = query.order_by(Item.name.asc())
    else:
        query = query.order_by(Item.name.asc())

    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/items/{item_id}", response_model=ItemResponse)
async def get_item(item_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Item).options(selectinload(Item.categories)).where(Item.id == item_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return item


@router.get("/items/{item_id}/price-history", response_model=list[PriceHistoryResponse])
async def get_price_history(item_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PriceHistory)
        .where(PriceHistory.item_id == item_id)
        .order_by(PriceHistory.recorded_at.desc())
        .limit(100)
    )
    return result.scalars().all()


@router.post("/items", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(
    item_data: ItemCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    item = Item(
        id=uuid.uuid4(),
        name=item_data.name,
        description=item_data.description,
        image_url=item_data.image_url,
        base_price=item_data.base_price,
        current_price=item_data.current_price,
        stock=item_data.stock,
        is_legacy=item_data.is_legacy,
        rarity=item_data.rarity,
    )
    db.add(item)
    await db.flush()

    if item_data.category_ids:
        for cat_id in item_data.category_ids:
            result = await db.execute(select(Category).where(Category.id == cat_id))
            cat = result.scalar_one_or_none()
            if cat:
                ic = ItemCategory(item_id=item.id, category_id=cat_id)
                db.add(ic)
        await db.flush()

    await db.refresh(item, ["categories"])
    return item


@router.put("/items/{item_id}", response_model=ItemResponse)
async def update_item(
    item_id: uuid.UUID,
    item_data: ItemUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    result = await db.execute(
        select(Item).options(selectinload(Item.categories)).where(Item.id == item_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    if item_data.name is not None:
        item.name = item_data.name
    if item_data.description is not None:
        item.description = item_data.description
    if item_data.image_url is not None:
        item.image_url = item_data.image_url
    if item_data.base_price is not None:
        item.base_price = item_data.base_price
    if item_data.current_price is not None:
        item.current_price = item_data.current_price
    if item_data.stock is not None:
        item.stock = item_data.stock
    if item_data.is_legacy is not None:
        item.is_legacy = item_data.is_legacy
    if item_data.rarity is not None:
        item.rarity = item_data.rarity

    if item_data.category_ids is not None:
        await db.execute(
            delete(ItemCategory).where(ItemCategory.item_id == item.id)
        )
        for cat_id in item_data.category_ids:
            result = await db.execute(select(Category).where(Category.id == cat_id))
            if result.scalar_one_or_none():
                ic = ItemCategory(item_id=item.id, category_id=cat_id)
                db.add(ic)
        await db.flush()

    db.add(item)
    await db.flush()
    await db.refresh(item, ["categories"])
    return item
