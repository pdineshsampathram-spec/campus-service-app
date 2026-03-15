from fastapi import APIRouter, HTTPException, Depends
from typing import List
from models import Canteen, FoodItem
from database import db
from auth import get_current_user

router = APIRouter(prefix="/api/food", tags=["Food Ordering"])

# Mock data for seeding or if DB is empty
CANTEENS_DATA = [
    {
        "id": "main",
        "name": "Main Canteen",
        "rating": 4.5,
        "time": "15-25 min",
        "emoji": "🏛️",
        "color": "from-orange-400 to-red-400",
        "items": [
            {"item_id": "mc-1", "name": "Veg Burger", "price": 60, "emoji": "🍔", "category": "Snacks", "popular": True},
            {"item_id": "mc-2", "name": "Chicken Sandwich", "price": 80, "emoji": "🥪", "category": "Snacks", "popular": False},
            {"item_id": "mc-3", "name": "Masala Dosa", "price": 50, "emoji": "🫓", "category": "South Indian", "popular": True},
            {"item_id": "mc-4", "name": "Fried Rice", "price": 70, "emoji": "🍚", "category": "Rice", "popular": True},
            {"item_id": "mc-5", "name": "Coffee", "price": 20, "emoji": "☕", "category": "Beverages", "popular": False},
            {"item_id": "mc-6", "name": "Samosa", "price": 15, "emoji": "🥟", "category": "Snacks", "popular": True},
        ],
    },
    {
        "id": "cafe",
        "name": "Campus Café",
        "rating": 4.2,
        "time": "10-15 min",
        "emoji": "☕",
        "color": "from-amber-400 to-orange-400",
        "items": [
            {"item_id": "cf-1", "name": "Margherita Pizza", "price": 120, "emoji": "🍕", "category": "Pizza", "popular": True},
            {"item_id": "cf-2", "name": "Cappuccino", "price": 45, "emoji": "☕", "category": "Beverages", "popular": True},
            {"item_id": "cf-3", "name": "Chocolate Brownie", "price": 40, "emoji": "🍫", "category": "Desserts", "popular": False},
            {"item_id": "cf-4", "name": "Veg Wrap", "price": 70, "emoji": "🌯", "category": "Snacks", "popular": False},
            {"item_id": "cf-5", "name": "Cold Coffee", "price": 55, "emoji": "🧋", "category": "Beverages", "popular": True},
            {"item_id": "cf-6", "name": "French Fries", "price": 50, "emoji": "🍟", "category": "Snacks", "popular": True},
        ],
    },
    {
        "id": "south",
        "name": "South Kitchen",
        "rating": 4.7,
        "time": "20-30 min",
        "emoji": "🍲",
        "color": "from-green-400 to-emerald-500",
        "items": [
            {"item_id": "sk-1", "name": "Idli Sambar", "price": 40, "emoji": "🍱", "category": "South Indian", "popular": True},
            {"item_id": "sk-2", "name": "Curd Rice", "price": 45, "emoji": "🍚", "category": "Rice", "popular": False},
            {"item_id": "sk-3", "name": "Medu Vada", "price": 30, "emoji": "🍩", "category": "Snacks", "popular": True},
            {"item_id": "sk-4", "name": "Upma", "price": 35, "emoji": "🫕", "category": "South Indian", "popular": False},
            {"item_id": "sk-5", "name": "Filter Coffee", "price": 25, "emoji": "☕", "category": "Beverages", "popular": True},
            {"item_id": "sk-6", "name": "Pongal", "price": 50, "emoji": "🍲", "category": "South Indian", "popular": False},
        ],
    },
]

@router.get("/canteens", response_model=List[Canteen])
async def get_canteens(_: dict = Depends(get_current_user)):
    try:
        from core.database import get_database
        db = get_database()
        
        # If db is None (MOCK mode or connection failed), return seed data
        if db is None:
            return CANTEENS_DATA
            
        canteens = await db["canteens"].find().to_list(100)
        
        if not canteens:
            # Seed default data if empty
            await db["canteens"].insert_many(CANTEENS_DATA)
            canteens = CANTEENS_DATA
        
        # Convert _id to string for model compliance
        for c in canteens:
            if "_id" in c:
                c["id"] = str(c["_id"])
        return canteens
    except Exception as e:
        print(f"⚠️ Error fetching canteens: {e}")
        return CANTEENS_DATA

@router.get("/items/{item_id}", response_model=FoodItem)
async def get_food_item(item_id: str, _: dict = Depends(get_current_user)):
    try:
        from database import db
        # Search in DB first
        for canteen in CANTEENS_DATA:
            for item in canteen["items"]:
                if item["item_id"] == item_id:
                    return item
        
        raise HTTPException(status_code=404, detail="Item not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
