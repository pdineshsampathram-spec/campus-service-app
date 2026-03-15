from fastapi import APIRouter, Depends
from auth import get_current_user
from database import (
    users_collection, 
    orders_collection, 
    library_bookings_collection, 
    certificate_requests_collection,
    complaints_collection
)
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    # Global stats for admin/overview (or scoped to user if needed, 
    # but the prompt says "total_users", "total_orders" implying global context)
    total_users = await users_collection.count_documents({})
    total_orders = await orders_collection.count_documents({})
    total_bookings = await library_bookings_collection.count_documents({"status": "confirmed"})
    pending_certs = await certificate_requests_collection.count_documents({"status": "pending"})
    
    # User specific stats for the UI cards (matching Dashboard.jsx initial state)
    user_id = str(current_user["_id"])
    my_orders = await orders_collection.count_documents({"user_id": user_id})
    my_bookings = await library_bookings_collection.count_documents({"user_id": user_id, "status": "confirmed"})
    my_certs = await certificate_requests_collection.count_documents({"user_id": user_id, "status": "pending"})
    my_complaints = await complaints_collection.count_documents({"user_id": user_id, "status": "open"})

    return {
        "total_users": total_users,
        "total_orders": total_orders,
        "total_bookings": total_bookings,
        "pending_certificates": pending_certs,
        # Field names expected by Dashboard.jsx
        "active_bookings": my_bookings,
        "open_complaints": my_complaints,
        "my_total_orders": my_orders,
        "my_pending_certificates": my_certs
    }

@router.get("/chart-data")
async def get_chart_data(current_user: dict = Depends(get_current_user)):
    # Last 7 days aggregation
    today = datetime.now(timezone.utc)
    labels = []
    order_counts = []
    booking_counts = []

    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_str = day.strftime("%a")
        start_of_day = datetime(day.year, day.month, day.day, tzinfo=timezone.utc)
        end_of_day = start_of_day + timedelta(days=1)
        
        labels.append(day_str)
        
        # Count orders for this day
        o_count = await orders_collection.count_documents({
            "created_at": {"$gte": start_of_day, "$lt": end_of_day}
        })
        order_counts.append(o_count)
        
        # Count bookings for this day
        b_count = await library_bookings_collection.count_documents({
            "created_at": {"$gte": start_of_day, "$lt": end_of_day},
            "status": "confirmed"
        })
        booking_counts.append(b_count)

    return {
        "labels": labels,
        "orders_per_day": order_counts,
        "bookings_per_day": booking_counts
    }
