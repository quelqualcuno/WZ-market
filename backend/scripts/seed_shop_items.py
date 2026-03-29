from __future__ import annotations

import random
import hashlib
from typing import Dict, List

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.base import Base
from app.db.session import engine
from app.models.category import Category
from app.models.item import Item


RARITY_TO_INDEX = {
    "Common": 1.0,
    "Rare": 2.0,
    "Epic": 3.0,
    "Legendary": 4.0,
}

RARITY_TO_STARS = {
    "Common": 1,
    "Rare": 2,
    "Epic": 3,
    "Legendary": 5,
}

TYPE_TO_CATEGORIES: Dict[str, List[str]] = {
    "pet": ["common", "dragon", "elemental"],
    "mount": ["basic", "wolf", "beast", "flying"],
    "armor": ["light", "heavy"],
    "weapon": ["sword", "bow", "staff", "spear", "greatsword"],
    "accessory": ["ring", "amulet"],
}

# Interesting names and adjectives for items
PET_NAMES = ["Flame", "Frost", "Tempest", "Shadow", "Light", "Nova", "Void", "Echo", "Wraith", "Spirit", "Phantom", "Specter", "Griffon", "Drake", "Wyvern"]
MOUNT_NAMES = ["Swiftfoot", "Thunderstrike", "Blackmane", "Frostbite", "Stormrunner", "Wildfire", "Voidstep", "Skyreaver", "Earthshaker", "Bonesplitter"]
WEAPON_NAMES = ["Deathbringer", "Ravager", "Soulseeker", "Eternumalignment", "Duskblade", "Spiritslayer", "Rimefang", "Darkshard", "Voidcutter", "Skyrender"]
ARMOR_NAMES = ["Guardian", "Sentinel", "Warden", "Bastion", "Rampart", "Fortress", "Aegis", "Paladin", "Nexus", "Titan"]
ACCESSORY_NAMES = ["Seal", "Charm", "Amulet", "Totem", "Rune", "Sigil", "Orb", "Gem", "Crown", "Eye"]

DESCRIPTORS = {
    "pet": ["Loyal companion", "Mystical creature", "Ancient beast", "Ethereal spirit", "Primal force", "Bound entity", "Wild spirit"],
    "mount": ["Swift steed", "Majestic creature", "Battle companion", "Loyal allies", "Supernatural being", "Celestial creature"],
    "armor": ["Ancient protection", "Legendary defense", "Soul-forged guard", "Mystical protection", "Divine armor", "Cursed protection"],
    "weapon": ["Fate-bound blade", "Soul-drinker weapon", "Cursed instrument", "Divine implement", "Void-touched arms"],
    "accessory": ["Mystical token", "Power source", "Binding charm", "Ancient artifact", "Cursed trinket"],
}

RARITIES = ["Common", "Rare", "Epic", "Legendary"]
TYPES = list(TYPE_TO_CATEGORIES.keys())


def _generate_image_url(seed: str, item_id: int) -> str:
    """Generate a consistent random image URL based on seed and item_id."""
    # Use picsum.photos for placeholder images with some variety
    combined = f"{seed}-{item_id}"
    hash_val = int(hashlib.md5(combined.encode()).hexdigest()[:8], 16)
    image_id = hash_val % 100  # Use different images from picsum
    return f"https://picsum.photos/300/300?random={image_id}&seed={seed}-{item_id}"


def _build_items(total: int = 2000) -> List[dict]:
    rng = random.Random(987654321)
    rows: List[dict] = []

    for idx in range(1, total + 1):
        rarity = rng.choice(RARITIES)
        item_type = rng.choice(TYPES)
        category = rng.choice(TYPE_TO_CATEGORIES[item_type])
        tier = rng.randint(1, 10)

        # Pick interesting names
        if item_type == "pet":
            base_name = rng.choice(PET_NAMES)
            descriptor = rng.choice(DESCRIPTORS["pet"])
        elif item_type == "mount":
            base_name = rng.choice(MOUNT_NAMES)
            descriptor = rng.choice(DESCRIPTORS["mount"])
        elif item_type == "weapon":
            base_name = rng.choice(WEAPON_NAMES)
            descriptor = rng.choice(DESCRIPTORS["weapon"])
        elif item_type == "armor":
            base_name = rng.choice(ARMOR_NAMES)
            descriptor = rng.choice(DESCRIPTORS["armor"])
        else:  # accessory
            base_name = rng.choice(ACCESSORY_NAMES)
            descriptor = rng.choice(DESCRIPTORS["accessory"])

        item_name = f"{rarity} {base_name} of {category.capitalize()} Tier {tier} #{idx}"

        if rarity == "Common":
            current_price = rng.randint(50, 200)
        elif rarity == "Rare":
            current_price = rng.randint(200, 999)
        elif rarity == "Epic":
            current_price = rng.randint(1000, 3999)
        else:
            current_price = rng.randint(4000, 12000)

        total_copies = rng.randint(50, 10000)
        available_copies = rng.randint(0, total_copies)

        # Create richer description
        effect = rng.choice(["grants +10 stamina", "provides protection from cold", "increases attack speed by 15%", "restores 5 health/sec", "grants invisibility", "increases luck by 20"])
        
        description = f"{descriptor}. Type: {item_type.capitalize()}. Category: {category.capitalize()}. Tier: {tier}. {effect}."

        rows.append(
            {
                "id": idx,
                "name": item_name,
                "type": item_type,
                "category": category,
                "rarity": rarity,
                "tier": tier,
                "current_price": float(current_price),
                "total_copies": total_copies,
                "available_copies": available_copies,
                "is_legacy": bool(rng.getrandbits(1)),
                "description": description,
                "image_url": _generate_image_url("zeromarket", idx),
            }
        )

    return rows


def _get_or_create_category(db: Session, cache: Dict[str, Category], category_name: str) -> Category:
    cat = cache.get(category_name)
    if cat is not None:
        return cat

    cat = db.query(Category).filter(Category.name == category_name).first()
    if cat is None:
        cat = Category(name=category_name, description=f"Auto category: {category_name}")
        db.add(cat)
        db.flush()

    cache[category_name] = cat
    return cat


def seed_items(db: Session, rows: List[dict]) -> None:
    category_cache: Dict[str, Category] = {}

    for row in rows:
        item = db.query(Item).filter(Item.id == row["id"]).first()
        rarity_index = RARITY_TO_INDEX[row["rarity"]] + (row["tier"] / 100.0)

        if item is None:
            item = Item(
                id=row["id"],
                name=row["name"],
                description=row["description"],
                image_url=row["image_url"],
                current_price=row["current_price"],
                base_price=row["current_price"],
                total_copies=row["total_copies"],
                available_copies=row["available_copies"],
                is_legacy=row["is_legacy"],
                rarity_index=rarity_index,
            )
            db.add(item)
            db.flush()
        else:
            item.name = row["name"]
            item.description = row["description"]
            item.image_url = row["image_url"]
            item.current_price = row["current_price"]
            item.base_price = row["current_price"]
            item.total_copies = row["total_copies"]
            item.available_copies = row["available_copies"]
            item.is_legacy = row["is_legacy"]
            item.rarity_index = rarity_index

        category = _get_or_create_category(db, category_cache, row["category"])
        if category not in item.categories:
            item.categories.append(category)


def main() -> None:
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    rows = _build_items(total=2000)
    db = SessionLocal()
    try:
        seed_items(db, rows)
        db.commit()
        print(f"Seed completato: {len(rows)} item pronti per lo shop")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
