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

    try:
        await orders_collection.insert_one(order_doc)
        return order_helper(order_doc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-orders")
async def get_my_orders(current_user: dict = Depends(get_current_user)):
    orders = []
    cursor = orders_collection.find({"user_id": str(current_user["_id"])})
    cursor.sort("created_at", -1)
    async for order in cursor:
        orders.append(order_helper(order))
    return orders

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await orders_collection.find_one({"_id": order_id, "user_id": str(current_user["_id"])})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order_helper(order)
