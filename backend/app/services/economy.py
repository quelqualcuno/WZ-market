from sqlalchemy.ext.asyncio import AsyncSession
from app.models.item import Item
from app.models.price_history import PriceHistory, PriceSource
from datetime import datetime, timezone


async def adjust_price(item: Item, db: AsyncSession) -> None:
    """Anti-inflation logic: adjust item price based on stock levels."""
    if item.stock > 50:
        item.current_price = round(item.current_price * 0.99, 2)
    elif item.stock < 5:
        item.current_price = round(item.current_price * 1.05, 2)

    price_hist = PriceHistory(
        item_id=item.id,
        price=item.current_price,
        source=PriceSource.shop,
        recorded_at=datetime.now(timezone.utc),
    )
    db.add(price_hist)


async def record_price(item_id, price: float, source: PriceSource, db: AsyncSession) -> None:
    ph = PriceHistory(item_id=item_id, price=price, source=source)
    db.add(ph)
