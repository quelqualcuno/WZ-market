import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import String, Float, Boolean, Integer, DateTime, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Rarity(str, enum.Enum):
    common = "common"
    uncommon = "uncommon"
    rare = "rare"
    epic = "epic"
    legendary = "legendary"


class Item(Base):
    __tablename__ = "items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    base_price: Mapped[float] = mapped_column(Float, nullable=False)
    current_price: Mapped[float] = mapped_column(Float, nullable=False)
    stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_legacy: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    rarity: Mapped[Rarity] = mapped_column(SAEnum(Rarity), nullable=False, default=Rarity.common)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    categories: Mapped[list["Category"]] = relationship(
        "Category", secondary="item_categories", back_populates="items"
    )
    orders: Mapped[list["Order"]] = relationship("Order", back_populates="item")
    inventory_entries: Mapped[list["Inventory"]] = relationship("Inventory", back_populates="item")
    price_history: Mapped[list["PriceHistory"]] = relationship("PriceHistory", back_populates="item")
    offers: Mapped[list["Offer"]] = relationship("Offer", back_populates="item")
    auctions: Mapped[list["Auction"]] = relationship("Auction", back_populates="item")
    escrows: Mapped[list["Escrow"]] = relationship("Escrow", back_populates="item")


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)

    items: Mapped[list["Item"]] = relationship(
        "Item", secondary="item_categories", back_populates="categories"
    )


class ItemCategory(Base):
    __tablename__ = "item_categories"

    item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("items.id", ondelete="CASCADE"), primary_key=True
    )
    category_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True
    )
