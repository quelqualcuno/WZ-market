from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class PriceHistory(Base):
    __tablename__ = "price_history"
    __table_args__ = (
        CheckConstraint("price >= 0", name="ck_price_history_price_non_negative"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id", ondelete="CASCADE"), nullable=False, index=True)
    price = Column(Float, nullable=False)
    recorded_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    item = relationship("Item", back_populates="price_history")
    
    def __repr__(self):
        return f"<PriceHistory(item_id={self.item_id}, price={self.price}, recorded_at={self.recorded_at})>"
