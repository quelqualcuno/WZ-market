from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.models.item import item_category


class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text)
    
    # Relationships
    items = relationship(
        "Item",
        secondary=item_category,
        back_populates="categories"
    )
    
    def __repr__(self):
        return f"<Category(id={self.id}, name={self.name})>"


# ItemCategory is represented by the association table item_category
