import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import Float, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class PriceSource(str, enum.Enum):
    shop = "shop"
    marketplace = "marketplace"
    auction = "auction"


class PriceHistory(Base):
    __tablename__ = "price_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("items.id"), nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    source: Mapped[PriceSource] = mapped_column(SAEnum(PriceSource), nullable=False)

    item: Mapped["Item"] = relationship("Item", back_populates="price_history")
