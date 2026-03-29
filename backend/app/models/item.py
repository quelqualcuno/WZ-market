from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Text,
    DateTime,
    Boolean,
    Table,
    ForeignKey,
    CheckConstraint,
)
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

# Association table for many-to-many relationship
item_category = Table(
    "item_category",
    Base.metadata,
    Column("item_id", Integer, ForeignKey("items.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", Integer, ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True),
)


class Item(Base):
    __tablename__ = "items"
    __table_args__ = (
        CheckConstraint("current_price >= 0", name="ck_items_current_price_non_negative"),
        CheckConstraint("base_price >= 0", name="ck_items_base_price_non_negative"),
        CheckConstraint("total_copies >= 0", name="ck_items_total_copies_non_negative"),
        CheckConstraint("available_copies >= 0", name="ck_items_available_copies_non_negative"),
        CheckConstraint("available_copies <= total_copies", name="ck_items_available_le_total"),
        CheckConstraint("rarity_index > 0", name="ck_items_rarity_positive"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text)
    image_url = Column(String, nullable=True)
    current_price = Column(Float, nullable=False)
    base_price = Column(Float, nullable=False)
    total_copies = Column(Integer, nullable=False, default=0)
    available_copies = Column(Integer, nullable=False, default=0)
    is_legacy = Column(Boolean, nullable=False, default=False)
    rarity_index = Column(Float, nullable=False, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    categories = relationship(
        "Category",
        secondary=item_category,
        back_populates="items"
    )
    price_history = relationship("PriceHistory", back_populates="item", cascade="all, delete-orphan")
    inventory_items = relationship("Inventory", back_populates="item", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="item", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Item(id={self.id}, name={self.name}, price={self.current_price})>"
