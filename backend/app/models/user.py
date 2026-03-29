import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, Boolean, Integer, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    balance: Mapped[float] = mapped_column(Float, default=1000.0, nullable=False)
    roblox_username: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    reputation_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_ratings: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    badges: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    orders: Mapped[list["Order"]] = relationship("Order", back_populates="buyer", foreign_keys="Order.buyer_id")
    inventory: Mapped[list["Inventory"]] = relationship("Inventory", back_populates="user")
    offers_selling: Mapped[list["Offer"]] = relationship("Offer", back_populates="seller", foreign_keys="Offer.seller_id")
    offers_bought: Mapped[list["Offer"]] = relationship("Offer", back_populates="buyer", foreign_keys="Offer.buyer_id")
    auctions_selling: Mapped[list["Auction"]] = relationship("Auction", back_populates="seller", foreign_keys="Auction.seller_id")
    auctions_won: Mapped[list["Auction"]] = relationship("Auction", back_populates="winner", foreign_keys="Auction.winner_id")
    bids: Mapped[list["Bid"]] = relationship("Bid", back_populates="bidder")
    ratings_given: Mapped[list["Rating"]] = relationship("Rating", back_populates="rater", foreign_keys="Rating.rater_id")
    ratings_received: Mapped[list["Rating"]] = relationship("Rating", back_populates="rated_user", foreign_keys="Rating.rated_user_id")
    transactions: Mapped[list["TransactionLog"]] = relationship("TransactionLog", back_populates="user")
    escrows_as_seller: Mapped[list["Escrow"]] = relationship("Escrow", back_populates="seller", foreign_keys="Escrow.seller_id")
    escrows_as_buyer: Mapped[list["Escrow"]] = relationship("Escrow", back_populates="buyer", foreign_keys="Escrow.buyer_id", primaryjoin="Escrow.buyer_id == User.id")
