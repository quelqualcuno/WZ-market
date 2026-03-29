from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import engine, Base
from app.routers import auth, users, items, shop, inventory, marketplace, auctions, ratings, admin
from app.models import *  # noqa: F401, F403


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    from app.database import AsyncSessionLocal
    from app.models.user import User
    from sqlalchemy import select, func

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(func.count()).select_from(User))
        count = result.scalar()
        if count == 0:
            await seed_data(db)
    yield


app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(users.router, prefix="/api", tags=["users"])
app.include_router(items.router, prefix="/api", tags=["items"])
app.include_router(shop.router, prefix="/api", tags=["shop"])
app.include_router(inventory.router, prefix="/api", tags=["inventory"])
app.include_router(marketplace.router, prefix="/api", tags=["marketplace"])
app.include_router(auctions.router, prefix="/api", tags=["auctions"])
app.include_router(ratings.router, prefix="/api", tags=["ratings"])
app.include_router(admin.router, prefix="/api", tags=["admin"])


@app.get("/health")
async def health():
    return {"status": "ok", "version": settings.VERSION}


async def seed_data(db):
    """Seed the database with sample items, categories, and admin user."""
    from app.models.item import Item, Category, ItemCategory, Rarity
    from app.models.user import User
    from app.services.auth import get_password_hash
    import uuid

    admin_user = User(
        id=uuid.uuid4(),
        username="admin",
        email="admin@zeromarket.io",
        hashed_password=get_password_hash("admin123"),
        balance=99999.0,
        is_admin=True,
        is_active=True,
        badges=["founder", "admin"],
    )
    db.add(admin_user)

    categories_data = [
        {"name": "Weapons", "slug": "weapons"},
        {"name": "Armor", "slug": "armor"},
        {"name": "Accessories", "slug": "accessories"},
        {"name": "Pets", "slug": "pets"},
        {"name": "Consumables", "slug": "consumables"},
    ]
    categories = {}
    for cat_data in categories_data:
        cat = Category(**cat_data)
        db.add(cat)
        categories[cat_data["slug"]] = cat

    await db.flush()

    items_data = [
        {"name": "Iron Sword", "description": "A basic iron sword", "base_price": 100.0, "current_price": 100.0, "stock": 50, "rarity": Rarity.common, "category": "weapons"},
        {"name": "Steel Blade", "description": "A sharp steel blade", "base_price": 250.0, "current_price": 250.0, "stock": 30, "rarity": Rarity.uncommon, "category": "weapons"},
        {"name": "Crystal Staff", "description": "A staff imbued with crystal magic", "base_price": 800.0, "current_price": 800.0, "stock": 15, "rarity": Rarity.rare, "category": "weapons"},
        {"name": "Void Blade", "description": "A sword forged in the void realm", "base_price": 2500.0, "current_price": 2500.0, "stock": 5, "rarity": Rarity.epic, "category": "weapons"},
        {"name": "World Zero Scepter", "description": "Legendary scepter of the World Zero realm", "base_price": 10000.0, "current_price": 10000.0, "stock": 2, "rarity": Rarity.legendary, "category": "weapons", "is_legacy": True},
        {"name": "Leather Vest", "description": "Basic leather protection", "base_price": 80.0, "current_price": 80.0, "stock": 60, "rarity": Rarity.common, "category": "armor"},
        {"name": "Chain Mail", "description": "Interlocked metal rings", "base_price": 300.0, "current_price": 300.0, "stock": 25, "rarity": Rarity.uncommon, "category": "armor"},
        {"name": "Mage Robes", "description": "Enchanted robes for magic users", "base_price": 700.0, "current_price": 700.0, "stock": 12, "rarity": Rarity.rare, "category": "armor"},
        {"name": "Dragon Scale Armor", "description": "Armor crafted from dragon scales", "base_price": 3000.0, "current_price": 3000.0, "stock": 4, "rarity": Rarity.epic, "category": "armor"},
        {"name": "Celestial Plate", "description": "Armor blessed by celestial beings", "base_price": 12000.0, "current_price": 12000.0, "stock": 1, "rarity": Rarity.legendary, "category": "armor", "is_legacy": True},
        {"name": "Basic Ring", "description": "A simple iron ring", "base_price": 50.0, "current_price": 50.0, "stock": 100, "rarity": Rarity.common, "category": "accessories"},
        {"name": "Silver Necklace", "description": "A fine silver necklace", "base_price": 200.0, "current_price": 200.0, "stock": 40, "rarity": Rarity.uncommon, "category": "accessories"},
        {"name": "Enchanted Amulet", "description": "An amulet with magical properties", "base_price": 600.0, "current_price": 600.0, "stock": 10, "rarity": Rarity.rare, "category": "accessories"},
        {"name": "Void Crystal Pendant", "description": "A pendant containing a void crystal", "base_price": 2000.0, "current_price": 2000.0, "stock": 6, "rarity": Rarity.epic, "category": "accessories"},
        {"name": "Baby Slime", "description": "A cute baby slime companion", "base_price": 150.0, "current_price": 150.0, "stock": 35, "rarity": Rarity.common, "category": "pets"},
        {"name": "Spirit Fox", "description": "A magical spirit fox", "base_price": 500.0, "current_price": 500.0, "stock": 20, "rarity": Rarity.uncommon, "category": "pets"},
        {"name": "Mini Dragon", "description": "A miniature dragon companion", "base_price": 1500.0, "current_price": 1500.0, "stock": 8, "rarity": Rarity.rare, "category": "pets"},
        {"name": "Shadow Wolf", "description": "A wolf from the shadow realm", "base_price": 4000.0, "current_price": 4000.0, "stock": 3, "rarity": Rarity.epic, "category": "pets"},
        {"name": "Health Potion", "description": "Restores health points", "base_price": 30.0, "current_price": 30.0, "stock": 200, "rarity": Rarity.common, "category": "consumables"},
        {"name": "Mana Elixir", "description": "Restores mana points", "base_price": 45.0, "current_price": 45.0, "stock": 150, "rarity": Rarity.common, "category": "consumables"},
        {"name": "Speed Boost Potion", "description": "Temporarily increases speed", "base_price": 120.0, "current_price": 120.0, "stock": 75, "rarity": Rarity.uncommon, "category": "consumables"},
        {"name": "Legendary Elixir", "description": "A rare elixir with powerful effects", "base_price": 5000.0, "current_price": 5000.0, "stock": 3, "rarity": Rarity.legendary, "category": "consumables"},
    ]

    for item_data in items_data:
        cat_slug = item_data.pop("category")
        is_legacy = item_data.pop("is_legacy", False)
        item = Item(**item_data, is_legacy=is_legacy)
        db.add(item)
        await db.flush()
        ic = ItemCategory(item_id=item.id, category_id=categories[cat_slug].id)
        db.add(ic)

    await db.commit()
