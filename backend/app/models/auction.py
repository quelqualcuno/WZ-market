import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import Float, Integer, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class AuctionStatus(str, enum.Enum):
    active = "active"
    ended = "ended"
    cancelled = "cancelled"


class Auction(Base):
    __tablename__ = "auctions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seller_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    item_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("items.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    starting_price: Mapped[float] = mapped_column(Float, nullable=False)
    current_price: Mapped[float] = mapped_column(Float, nullable=False)
    buyout_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[AuctionStatus] = mapped_column(SAEnum(AuctionStatus), default=AuctionStatus.active, nullable=False)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    winner_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    seller: Mapped["User"] = relationship("User", back_populates="auctions_selling", foreign_keys=[seller_id])
    winner: Mapped["User"] = relationship("User", back_populates="auctions_won", foreign_keys=[winner_id])
    item: Mapped["Item"] = relationship("Item", back_populates="auctions")
    bids: Mapped[list["Bid"]] = relationship("Bid", back_populates="auction", order_by="Bid.amount.desc()")


class Bid(Base):
    __tablename__ = "bids"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    auction_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("auctions.id"), nullable=False)
    bidder_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    auction: Mapped["Auction"] = relationship("Auction", back_populates="bids")
    bidder: Mapped["User"] = relationship("User", back_populates="bids")
