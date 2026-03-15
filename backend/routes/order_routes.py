from fastapi import APIRouter, Depends, HTTPException
from models import OrderCreate, OrderResponse
from auth import get_current_user
from database import orders_collection
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/api/orders", tags=["Food Orders"])

def order_helper(order) -> dict:
    return {
        "id": str(order.get("_id", "")),
        "user_id": order.get("user_id", ""),
        "items": order.get("items", []),
        "canteen": order.get("canteen", ""),
        "total_amount": order.get("total_amount", 0),
        "status": order.get("status", "pending"),
        "special_instructions": order.get("special_instructions", ""),
        "created_at": order.get("created_at", datetime.now(timezone.utc)),
        "estimated_time": order.get("estimated_time", 20),
    }

@router.post("/", response_model=OrderResponse)
async def create_order(order_data: OrderCreate, current_user: dict = Depends(get_current_user)):
    order_id = str(uuid.uuid4())
    order_doc = {
        "_id": order_id,
        "user_id": str(current_user["_id"]),
        "items": [item.dict() for item in order_data.items],
        "canteen": order_data.canteen,
        "total_amount": order_data.total_amount,
        "status": "confirmed",
        "special_instructions": order_data.special_instructions or "",
        "estimated_time": 20,
        "created_at": datetime.now(timezone.utc),
    }
    try:
        from core.database import get_database
        db = get_database()
        if db is None:
            raise HTTPException(status_code=533, detail="Database connection unavailable")
        await db["orders"].insert_one(order_doc)
        return order_helper(order_doc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-orders")
async def get_my_orders(current_user: dict = Depends(get_current_user)):
    try:
        from core.database import get_database
        db = get_database()
        if db is None:
            return []
        orders = []
        cursor = db["orders"].find({"user_id": str(current_user["_id"])})
        cursor.sort("created_at", -1)
        async for order in cursor:
            orders.append(order_helper(order))
        return orders
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    try:
        from core.database import get_database
        db = get_database()
        if db is None:
            raise HTTPException(status_code=533, detail="Database connection unavailable")
        order = await db["orders"].find_one({"_id": order_id, "user_id": str(current_user["_id"])})
        if order is None:
            raise HTTPException(status_code=404, detail="Order not found")
        return order_helper(order)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
