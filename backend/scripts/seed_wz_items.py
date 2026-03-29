from __future__ import annotations

import random
import hashlib
from typing import Dict, List, Tuple

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.base import Base
from app.db.session import engine
from app.models.category import Category
from app.models.item import Item


# World Zero Weapons Data
WEAPONS_DATA = {
    "longsword": [
        ("Bronze Shortsword", 1, "World 1"),
        ("Crimson Blade", 2, "World 1"),
        ("Razor", 3, "World 1"),
        ("Roseglass Sword", 3, "World 1"),
        ("Mechanical Blade", 4, "World 1"),
        ("Void Slayer", 5, "World 1"),
        ("Goblin Blade", 1, "World 2"),
        ("Silent Edge", 2, "World 2"),
        ("Justice", 3, "World 2"),
        ("Crystal Longsword", 3, "World 2"),
        ("Blade Fury", 4, "World 2"),
        ("Widowmaker", 4, "World 2"),
        ("Spire Slayer", 5, "World 2"),
        ("Coldsteel Longsword", 1, "World 3"),
        ("Mythril Longsword", 2, "World 3"),
        ("Pink Longsword", 2, "World 3"),
        ("Glacier Longsword", 3, "World 3"),
        ("Frozen Longsword", 4, "World 3"),
        ("Glacier Edge", 5, "World 3"),
        ("Sand Hill Longsword", 1, "World 4"),
        ("Ruby Longsword", 2, "World 4"),
        ("Jagged Longsword", 3, "World 4"),
        ("Frenzy", 4, "World 4"),
        ("Lava Light Blade", 4, "World 4"),
        ("Titanslayer", 5, "World 4"),
        ("Winged Longsword", 1, "World 5"),
        ("Dark Crystal Longsword", 2, "World 5"),
        ("Corrupted Longsword", 3, "World 5"),
        ("Inferno Longsword", 4, "World 5"),
        ("Infernus Teeth", 5, "World 5"),
        ("Opulent Longsword", 3, "World 6"),
        ("Atlantic Longsword", 4, "World 6"),
        ("Deeptrench", 5, "World 6"),
        ("Mezuvian Longsword", 3, "World 7"),
        ("Firestorm Longsword", 4, "World 7"),
        ("Gilded Champion", 5, "World 7"),
        ("Sapphire Longsword", 3, "World 8"),
        ("Emerald Longsword", 4, "World 8"),
        ("Reliquary Longsword", 5, "World 8"),
        ("Cobalt Longsword", 3, "World 9"),
        ("Midnight Longsword", 4, "World 9"),
        ("Aether Longsword", 5, "World 9"),
        ("Quartz Longsword", 3, "World 10"),
        ("Fluorite Longsword", 4, "World 10"),
        ("Astral Edge", 5, "World 10"),
        ("Zero Longsword", 6, "Every World"),
    ],
    "greatsword": [
        ("Bronze Greatsword", 1, "World 1"),
        ("Jagged Greatsword", 3, "World 1"),
        ("Brass Greatsword", 5, "World 1"),
        ("Steel Greatsword", 1, "World 2"),
        ("Sacred Greatsword", 2, "World 2"),
        ("Crystal Greatsword", 3, "World 2"),
        ("Slicer Greatsword", 4, "World 2"),
        ("Spirebane", 5, "World 2"),
        ("Obsidian Greatsword", 1, "World 3"),
        ("Frozen Greatsword", 2, "World 3"),
        ("Dark Ice Greatsword", 3, "World 3"),
        ("Golden Greatsword", 4, "World 3"),
        ("Permafrost", 5, "World 3"),
        ("Winged Greatsword", 1, "World 4"),
        ("Slated Greatsword", 2, "World 4"),
        ("Traveler's Greatsword", 3, "World 4"),
        ("Ruby Greatsword", 4, "World 4"),
        ("Greatsword of Ruin", 5, "World 4"),
        ("Fiery Greatsword", 1, "World 5"),
        ("Pink Greatsword", 2, "World 5"),
        ("Inferno Greatsword", 3, "World 5"),
        ("Dual Heat Greatsword", 4, "World 5"),
        ("Fiery Eye", 5, "World 5"),
        ("Amethyst Greatsword", 3, "World 6"),
        ("Atlantic Greatsword", 4, "World 6"),
        ("Siren's Watch", 5, "World 6"),
        ("Goldwing Greatsword", 3, "World 7"),
        ("Battled Greatsword", 4, "World 7"),
        ("Legacy", 5, "World 7"),
        ("Sapphire Greatsword", 3, "World 8"),
        ("Emerald Greatsword", 4, "World 8"),
        ("Reliquary Greatsword", 5, "World 8"),
        ("Cobalt Greatsword", 3, "World 9"),
        ("Midnight Greatsword", 4, "World 9"),
        ("Aether Greatsword", 5, "World 9"),
        ("Quartz Greatsword", 3, "World 10"),
        ("Fluorite Greatsword", 4, "World 10"),
        ("Shatterblade", 5, "World 10"),
        ("Zero Greatsword", 6, "Every World"),
    ],
    "staff": [
        ("Wooden Staff", 1, "World 1"),
        ("Sunlight Staff", 2, "World 1"),
        ("Ruby Staff", 3, "World 1"),
        ("Crystal Staff", 4, "World 1"),
        ("Enchanted Staff", 4, "World 1"),
        ("Rising Eagle Staff", 4, "World 1"),
        ("Spider Staff", 5, "World 1"),
        ("Wicked Staff", 5, "World 1"),
        ("Winged Staff", 1, "World 2"),
        ("Blooming Staff", 2, "World 2"),
        ("Forest Staff", 3, "World 2"),
        ("Astral Staff", 4, "World 2"),
        ("Cerberus Staff", 5, "World 2"),
        ("Snowflake Staff", 1, "World 3"),
        ("Icemaker Staff", 2, "World 3"),
        ("Crescent Staff", 3, "World 3"),
        ("Flowering Staff", 4, "World 3"),
        ("Will O' The Wisp", 5, "World 3"),
        ("Red Blast Staff", 1, "World 4"),
        ("Ancient Staff", 2, "World 4"),
        ("Snake Staff", 3, "World 4"),
        ("Mirage Staff", 4, "World 4"),
        ("Staff of Scarabs", 5, "World 4"),
        ("Enriched Oranged Staff", 1, "World 5"),
        ("Sun Flower Staff", 2, "World 5"),
        ("Black Hole Staff", 3, "World 5"),
        ("Blossom Crystal Staff", 4, "World 5"),
        ("Firecaster", 5, "World 5"),
        ("Cyclone Staff", 3, "World 6"),
        ("Waterfly Staff", 4, "World 6"),
        ("Staff of the Deep", 5, "World 6"),
        ("Mezuvian Staff", 3, "World 7"),
        ("Nightfall Staff", 4, "World 7"),
        ("Wings of Dare", 5, "World 7"),
        ("Sapphire Staff", 3, "World 8"),
        ("Emerald Staff", 4, "World 8"),
        ("Reliquary Staff", 5, "World 8"),
        ("Cobalt Staff", 3, "World 9"),
        ("Midnight Staff", 4, "World 9"),
        ("Aether Staff", 5, "World 9"),
        ("Quartz Staff", 3, "World 10"),
        ("Fluorite Staff", 4, "World 10"),
        ("Crystal Nova", 5, "World 10"),
        ("Zero Staff", 6, "Every World"),
    ],
    "greataxe": [
        ("Steel Greataxe", 1, "World 1"),
        ("Hookblade Greataxe", 2, "World 1"),
        ("Gladiator Greataxe", 3, "World 1"),
        ("Battle Greataxe", 4, "World 1"),
        ("Blazing Sun Greataxe", 4, "World 1"),
        ("Splinter Greataxe", 5, "World 1"),
        ("Darkblade Greataxe", 1, "World 2"),
        ("Steel Wheel Greataxe", 2, "World 2"),
        ("Crystal Greataxe", 3, "World 2"),
        ("Fanged Greataxe", 4, "World 2"),
        ("Lion Greataxe", 5, "World 2"),
        ("Coldsteel Greataxe", 1, "World 3"),
        ("Winged Greataxe", 2, "World 3"),
        ("Icebreaker Greataxe", 3, "World 3"),
        ("Golden Greataxe", 4, "World 3"),
        ("Snowstorm", 5, "World 3"),
        ("Sand Dune Greataxe", 1, "World 4"),
        ("Talon Greataxe", 2, "World 4"),
        ("Ruby Greataxe", 3, "World 4"),
        ("Jeweled Greataxe", 4, "World 4"),
        ("Deathgod", 5, "World 4"),
        ("Pink Greataxe", 1, "World 5"),
        ("Feiry Greataxe", 2, "World 5"),
        ("Sunflower Greataxe", 3, "World 5"),
        ("Inferno Greataxe", 4, "World 5"),
        ("Blossomfield", 5, "World 5"),
        ("Venomshard Axe", 3, "World 6"),
        ("Blossomfield", 4, "World 6"),
        ("Kraken's Stare", 5, "World 6"),
        ("Sky Axe", 3, "World 7"),
        ("Underworld Axe", 4, "World 7"),
        ("Shining Banner", 5, "World 7"),
        ("Sapphire Greataxe", 3, "World 8"),
        ("Emerald Greataxe", 4, "World 8"),
        ("Reliquary Greataxe", 5, "World 8"),
        ("Cobalt Greataxe", 3, "World 9"),
        ("Midnight Greataxe", 4, "World 9"),
        ("Aether Greataxe", 5, "World 9"),
        ("Quartz Greataxe", 3, "World 10"),
        ("Fluorite Greataxe", 4, "World 10"),
        ("Nebula Breaker", 5, "World 10"),
        ("Zero Greataxe", 6, "Every World"),
    ],
    "scythe": [
        ("Farmer's Scythe", 1, "World 1"),
        ("Dark Scythe", 3, "World 1"),
        ("Wretched Scythe", 5, "World 1"),
        ("Leaf Scythe", 1, "World 2"),
        ("Quilled Scythe", 3, "World 2"),
        ("Meteorfall", 5, "World 2"),
        ("Icy Scythe", 1, "World 3"),
        ("Pink Scythe", 3, "World 3"),
        ("Claw of Winter", 5, "World 3"),
        ("Sand Scythe", 1, "World 4"),
        ("Jaded Scythe", 3, "World 4"),
        ("Sandstorm", 5, "World 4"),
        ("Fury Scythe", 1, "World 5"),
        ("Blackened Scythe", 2, "World 5"),
        ("Magma Scythe", 3, "World 5"),
        ("Blood Scythe", 4, "World 5"),
        ("Ignition", 5, "World 5"),
        ("Venomshard Scythe", 3, "World 6"),
        ("Waterwhisp Scythe", 4, "World 6"),
        ("Squidbane", 5, "World 6"),
        ("Sky Scythe", 3, "World 7"),
        ("Firestorm Scythe", 4, "World 7"),
        ("Grim Day", 5, "World 7"),
        ("Sapphire Scythe", 3, "World 8"),
        ("Emerald Scythe", 4, "World 8"),
        ("Reliquary Scythe", 5, "World 8"),
        ("Cobalt Scythe", 3, "World 9"),
        ("Midnight Scythe", 4, "World 9"),
        ("Aether Scythe", 5, "World 9"),
        ("Quartz Scythe", 3, "World 10"),
        ("Fluorite Scythe", 4, "World 10"),
        ("Void Harvester", 5, "World 10"),
        ("Zero Scythe", 6, "Every World"),
    ],
    "spear": [
        ("Winged Spear", 1, "Starter Weapon"),
        ("Bronze Spear", 1, "World 1"),
        ("Gem Spear", 4, "World 1"),
        ("Wicked Spear", 5, "World 1"),
        ("Mossy Bluespear", 1, "World 2"),
        ("Enflamed Spear", 4, "World 2"),
        ("Thornbreaker", 5, "World 2"),
        ("Ice Spear", 1, "World 3"),
        ("Chilled Spear", 4, "World 3"),
        ("Winter's Might", 5, "World 3"),
        ("Sand Spear", 1, "World 4"),
        ("Sandstone Spear", 4, "World 4"),
        ("Sandblaster", 5, "World 4"),
        ("Fury Spear", 1, "World 5"),
        ("Corrupted Spear", 2, "World 5"),
        ("Flamedance Spear", 3, "World 5"),
        ("Inferno Spear", 4, "World 5"),
        ("Torchblazer Spear", 5, "World 5"),
        ("Amethyst Spear", 3, "World 6"),
        ("Crestwater Spear", 4, "World 6"),
        ("Neptune's Trident", 5, "World 6"),
        ("Mezuvian Spear", 3, "World 7"),
        ("Firestorm Spear", 4, "World 7"),
        ("Proudmaker", 5, "World 7"),
        ("Sapphire Spear", 3, "World 8"),
        ("Emerald Spear", 4, "World 8"),
        ("Reliquary Spear", 5, "World 8"),
        ("Cobalt Spear", 3, "World 9"),
        ("Midnight Spear", 4, "World 9"),
        ("Aether Spear", 5, "World 9"),
        ("Quartz Spear", 3, "World 10"),
        ("Fluorite Pike", 4, "World 10"),
        ("Starfall Pike", 5, "World 10"),
        ("Zero Spear", 6, "Every World"),
    ],
    "bow": [
        ("Wooden Bow", 1, "World 1"),
        ("Spiked Bow", 4, "World 1"),
        ("Wicked Bow", 5, "World 1"),
        ("Jungle Bow", 1, "World 2"),
        ("Drift Wood Bow", 4, "World 2"),
        ("Thornmaker", 5, "World 2"),
        ("Icecaster Bow", 1, "World 3"),
        ("Chilled Bow", 4, "World 3"),
        ("Winter's Bite", 5, "World 3"),
        ("Ruinous Bow", 1, "World 4"),
        ("Bleached Bow", 4, "World 4"),
        ("Royalty", 5, "World 4"),
        ("Thorn Bow", 1, "World 5"),
        ("Voidharp Bow", 2, "World 5"),
        ("Scaled Bow", 3, "World 5"),
        ("Inferno Bow", 4, "World 5"),
        ("Ignis' Draw", 5, "World 5"),
        ("Seascale Bow", 3, "World 6"),
        ("Goldharp Bow", 4, "World 6"),
        ("Sirens Song", 5, "World 6"),
        ("Sky Bow", 3, "World 7"),
        ("Webbed Bow", 4, "World 7"),
        ("Greatbow", 5, "World 7"),
        ("Sapphire Bow", 3, "World 8"),
        ("Emerald Bow", 4, "World 8"),
        ("Reliquary Bow", 5, "World 8"),
        ("Cobalt Bow", 3, "World 9"),
        ("Midnight Bow", 4, "World 9"),
        ("Aether Bow", 5, "World 9"),
        ("Quartz Bow", 3, "World 10"),
        ("Fluorite Bow", 4, "World 10"),
        ("Galaxyreach", 5, "World 10"),
        ("Zero Bow", 6, "Every World"),
    ],
}

# Armor Data
ARMOR_DATA = {
    "light_armor": [
        ("Adventurer's Armor", 1, "World 1"),
        ("Traveler's Coat", 2, "World 1"),
        ("Guard Platemail", 3, "World 1"),
        ("Light Leather Armor", 4, "World 1"),
        ("Wild Hunt Armor", 4, "World 1"),
        ("Witch Hunter Armor", 5, "World 1"),
        ("Iron Armor", 1, "World 2"),
        ("Agile Knight Armor", 2, "World 2"),
        ("Shadow Field Cloak", 3, "World 2"),
        ("Black Flame Cloak", 4, "World 2"),
        ("Cloak of Embers", 5, "World 2"),
        ("Winter Hunter", 1, "World 3"),
        ("Mercenary Armor", 2, "World 3"),
        ("Midnight Knight", 3, "World 3"),
        ("Holy Armor", 4, "World 3"),
        ("Necromancer Cloak", 1, "World 4"),
        ("Desert Wanderer", 2, "World 4"),
        ("Cloak of Sand", 3, "World 4"),
        ("Salamander Plate", 4, "World 4"),
        ("Phoenix Plate", 5, "World 4"),
        ("Way of the Wind", 1, "World 5"),
        ("Great Hunt", 2, "World 5"),
        ("Paladin Armor", 3, "World 5"),
        ("Rogue Slayer", 4, "World 5"),
        ("Dragonkin", 5, "World 5"),
        ("Deep Sea Knight", 3, "World 6"),
        ("Aqua Flame Master", 4, "World 6"),
        ("Night Terror", 5, "World 6"),
        ("Blademaster Robe", 5, "World 6"),
        ("Mezuvian Armor", 3, "World 7"),
        ("Flame Demon Armor", 4, "World 7"),
        ("Angel Armor", 5, "World 7"),
        ("Sapphire Armor", 3, "World 8"),
        ("Emerald Armor", 4, "World 8"),
        ("Reliquary Armor", 5, "World 8"),
        ("Cobalt Armor", 3, "World 9"),
        ("Midnight Armor", 4, "World 9"),
        ("Aether Armor", 5, "World 9"),
        ("Quartz Armor", 3, "World 10"),
        ("Fluorite Armor", 4, "World 10"),
        ("Gemstone Guardian", 5, "World 10"),
        ("Zero Armor", 6, "Every World"),
    ],
    "cosmetic": [
        ("Adventurer's Armor", 1, "Cash Shop"),
        ("Blademaster Outfit", 1, "Cash Shop"),
        ("Casual Hoodie #1", 1, "Cash Shop"),
        ("Casual Hoodie #2", 1, "Cash Shop"),
        ("Casual Jacket", 1, "Cash Shop"),
        ("Casual Shirt", 1, "Cash Shop"),
        ("Casual Sweatshirt #1", 1, "Cash Shop"),
        ("Casual Sweatshirt #2", 1, "Cash Shop"),
        ("Chef's Outfit", 1, "Cash Shop"),
        ("Clown Costume", 1, "Cash Shop"),
        ("Dapper Outfit", 1, "Cash Shop"),
        ("Dragon Dress", 2, "Cash Shop"),
        ("Egyptian Cloak", 2, "Cash Shop"),
        ("Elder Ninja", 2, "Cash Shop"),
        ("Elegant Light Armor", 1, "Cash Shop"),
        ("Farmer Outfit", 1, "Cash Shop"),
        ("Female School Outfit", 1, "Cash Shop"),
        ("Female School Outfit [Black]", 1, "Cash Shop"),
        ("Flower Dress", 1, "Cash Shop"),
        ("Giraffe Onesie", 1, "Cash Shop"),
        ("Grand Pirate", 1, "Cash Shop"),
        ("Hunter Armor", 1, "Cash Shop"),
        ("Lightning Robe", 2, "Cash Shop"),
        ("Magical Girl Costume", 1, "Cash Shop"),
        ("Magical Girl Costume #2", 1, "Cash Shop"),
        ("Maid Outfit", 1, "Cash Shop"),
        ("Male School Outfit", 1, "Cash Shop"),
        ("Male School Outfit [Black]", 1, "Cash Shop"),
        ("Master Swordsman", 2, "Cash Shop"),
        ("Merchant Outfit", 1, "Cash Shop"),
        ("Mythic Mage Robe", 2, "Cash Shop"),
        ("Novice Ninja", 2, "Cash Shop"),
        ("Oasis Explorer (Female)", 2, "Cash Shop"),
        ("Oasis Explorer (Male)", 2, "Cash Shop"),
        ("Outcast Ninja", 2, "Cash Shop"),
        ("Platemail Armor", 1, "Cash Shop"),
        ("Popstar Outfit (F)", 2, "Cash Shop"),
        ("Popstar Outfit (M)", 2, "Cash Shop"),
        ("Shadowblade Cloak", 2, "Cash Shop"),
        ("Shark Onesie", 1, "Cash Shop"),
        ("Shinigami", 2, "Cash Shop"),
        ("Skilled Warrior Robe", 1, "Cash Shop"),
        ("Snowboarder Outfit", 1, "Cash Shop"),
        ("Sorcerer Robe", 1, "Cash Shop"),
        ("Summoner's Robe", 2, "Cash Shop"),
        ("Sundress", 2, "Cash Shop"),
        ("Tech Fox", 2, "Cash Shop"),
        ("Tech Fox #2", 2, "Cash Shop"),
        ("The Pirate King", 2, "Cash Shop"),
        ("Tiger Onesie", 1, "Cash Shop"),
        ("Traditional Samurai", 1, "Cash Shop"),
        ("Trench Coat #1", 2, "Cash Shop"),
        ("Trench Coat #2", 2, "Cash Shop"),
        ("Tuxedo Outfit", 1, "Cash Shop"),
        ("Tuxedo Outfit #2", 1, "Cash Shop"),
        ("Unicorn Onesie", 1, "Cash Shop"),
        ("Warlord's Armor", 2, "Cash Shop"),
        ("Water Robe", 2, "Cash Shop"),
        ("Zebra Onesie", 1, "Cash Shop"),
    ],
}


def _generate_image_url(seed: str, item_name: str) -> str:
    """Generate a consistent image URL based on seed and item name."""
    combined = f"{seed}-{item_name}".lower()
    hash_val = int(hashlib.md5(combined.encode()).hexdigest()[:8], 16)
    image_id = hash_val % 100
    return f"https://picsum.photos/300/300?random={image_id}&seed={seed}-{item_name}"


def _get_price_for_tier(tier: int) -> float:
    """Generate price based on tier in range 0-100."""
    tier_base = {
        1: 10.0,
        2: 25.0,
        3: 45.0,
        4: 65.0,
        5: 85.0,
        6: 100.0,
    }
    base = tier_base.get(tier, 20.0)
    variance = 6.0
    price = base + random.uniform(-variance, variance)
    return round(max(0.0, min(100.0, price)), 2)


def _build_weapon_items() -> List[dict]:
    """Build weapon items from World Zero data."""
    items = []
    item_id = 1
    rng = random.Random(123456789)

    for weapon_type, weapons in WEAPONS_DATA.items():
        for name, tier, origin in weapons:
            price = _get_price_for_tier(tier)
            total_copies = rng.randint(10, 500)
            available_copies = rng.randint(0, total_copies)
            rarity_index = float(tier) + rng.random() * 0.5

            items.append({
                "id": item_id,
                "name": name,
                "category": weapon_type.capitalize(),
                "weapon_type": weapon_type,
                "tier": tier,
                "origin": origin,
                "current_price": price,
                "base_price": price,
                "total_copies": total_copies,
                "available_copies": available_copies,
                "is_legacy": tier >= 5 and rng.random() > 0.7,
                "rarity_index": rarity_index,
                "image_url": _generate_image_url("wz-weapons", name),
                "description": f"Legendary weapon from {origin}. Tier {tier} weapon. Enhanced stats and unique abilities. Perfect for skilled players.",
            })
            item_id += 1

    return items


def _build_armor_items() -> List[dict]:
    """Build armor items from World Zero data."""
    items = []
    item_id = 10000
    rng = random.Random(987654321)

    for armor_type, armors in ARMOR_DATA.items():
        for name, tier, origin in armors:
            price = _get_price_for_tier(tier)
            total_copies = rng.randint(5, 300)
            available_copies = rng.randint(0, total_copies)
            rarity_index = float(tier) + rng.random() * 0.5

            category_name = armor_type.replace("_", " ").title()

            items.append({
                "id": item_id,
                "name": name,
                "category": category_name,
                "armor_type": armor_type,
                "tier": tier,
                "origin": origin,
                "current_price": price,
                "base_price": price,
                "total_copies": total_copies,
                "available_copies": available_copies,
                "is_legacy": tier >= 5 and rng.random() > 0.7,
                "rarity_index": rarity_index,
                "image_url": _generate_image_url("wz-armor", name),
                "description": f"Premium armor from {origin}. Tier {tier} armor. Provides excellent defense and elemental resistance.",
            })
            item_id += 1

    return items


def seed_items(db: Session, items: List[dict]) -> None:
    """Seed items into database."""
    category_cache = {}

    for item_data in items:
        # Get or create category
        category_name = item_data["category"]
        if category_name not in category_cache:
            category = db.query(Category).filter(Category.name == category_name).first()
            if not category:
                category = Category(name=category_name, description=f"{category_name} items from World Zero")
                db.add(category)
                db.flush()
            category_cache[category_name] = category
        else:
            category = category_cache[category_name]

        # Create or update item
        item = db.query(Item).filter(Item.name == item_data["name"]).first()
        if not item:
            item = Item(
                name=item_data["name"],
                description=item_data["description"],
                image_url=item_data["image_url"],
                current_price=item_data["current_price"],
                base_price=item_data["base_price"],
                total_copies=item_data["total_copies"],
                available_copies=item_data["available_copies"],
                is_legacy=item_data["is_legacy"],
                rarity_index=item_data["rarity_index"],
            )
            db.add(item)
            db.flush()

            if category not in item.categories:
                item.categories.append(category)


def main() -> None:
    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Build all items
    weapon_items = _build_weapon_items()
    armor_items = _build_armor_items()
    all_items = weapon_items + armor_items

    db = SessionLocal()
    try:
        seed_items(db, all_items)
        db.commit()
        print(f"✅ Seed completato: {len(all_items)} item di World Zero caricati nel catalogo!")
        print(f"   - Armi: {len(weapon_items)}")
        print(f"   - Armature: {len(armor_items)}")
    except Exception as e:
        db.rollback()
        print(f"❌ Errore: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
