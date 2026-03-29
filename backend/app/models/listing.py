from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    CheckConstraint,
)
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from app.db.base import Base


class Listing(Base):
    __tablename__ = "listings"
    __table_args__ = (
        CheckConstraint("price >= 0", name="ck_listings_price_non_negative"),
        CheckConstraint("quantity > 0", name="ck_listings_quantity_positive"),
        CheckConstraint("auction_duration_hours > 0", name="ck_listings_auction_duration_positive"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, nullable=False)
    listing_type = Column(String, nullable=False)  # 'sale' or 'auction'
    price = Column(Float, nullable=False)
    status = Column(String, nullable=False, default="active")  # active, sold, cancelled, expired
    auction_duration_hours = Column(Integer, nullable=True)  # Hours for auction listings
    expires_at = Column(DateTime, nullable=True)  # When auction expires
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    seller = relationship("User", foreign_keys=[seller_id])
    item = relationship("Item", foreign_keys=[item_id])
    
    def is_expired(self):
        """Check if auction has expired."""
        if self.expires_at and self.status == "active":
            return datetime.utcnow() > self.expires_at
        return False
