from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    try:
        from core.database import get_database
        db = get_database()
        
        # If in MOCK mode, return placeholder but non-zero stats
        if db is None:
            return {"orders": 5, "bookings": 2, "certificates": 1, "complaints": 0}

        orders = await db["orders"].count_documents({})
        bookings = await db["library_bookings"].count_documents({"status": "confirmed"})
        certificates = await db["certificate_requests"].count_documents({})
        complaints = await db["complaints"].count_documents({})

        return {
            "orders": orders,
            "bookings": bookings,
            "certificates": certificates,
            "complaints": complaints
        }
    except Exception as e:
        print(f"Stats error: {e}")
        return {"orders": 0, "bookings": 0, "certificates": 0, "complaints": 0}

@router.get("/chart-data")
async def get_chart_data(current_user: dict = Depends(get_current_user)):
    try:
        from core.database import get_database
        db = get_database()
        
        if db is None:
            return {"weekly_orders": [2, 5, 3, 8, 4, 6, 2]}

        orders = await db["orders"].find().to_list(100)
        weekly = [0, 0, 0, 0, 0, 0, 0]

        for o in orders:
            if "created_at" in o:
                # weekday() returns 0 for Monday, 6 for Sunday
                d = o["created_at"].weekday()
                weekly[d] += 1

        return {"weekly_orders": weekly}
    except Exception as e:
        print(f"Chart data error: {e}")
        return {"weekly_orders": [0] * 7}
