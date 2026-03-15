from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.auth_routes import router as auth_router
from routes.food_routes import router as food_router
from routes.order_routes import router as order_router
from routes.library_routes import router as library_router
from routes.certificate_routes import router as cert_router
from routes.exam_routes import router as exam_router
from routes.complaint_routes import router as complaint_router
from routes.ai_assistant import router as ai_assistant_router
from database import (
    users_collection, exam_notifications_collection,
    orders_collection, complaints_collection, 
    library_bookings_collection, certificate_requests_collection,
    init_db
)
from auth import get_password_hash
import asyncio
from datetime import datetime, timezone
import uuid

app = FastAPI(
    title="Campus Service Platform API",
    description="Unified campus services: Food, Library, Certificates, Exams, Complaints",
    version="1.0.0"
)

from fastapi import Request, Response
from fastapi.responses import JSONResponse
import time
import json

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def standardize_and_log_middleware(request: Request, call_next):
    start_time = time.time()
    
    # 1. Process Request
    try:
        response = await call_next(request)
    except Exception as e:
        # Handle uncaught exceptions
        process_time = time.time() - start_time
        print(f"❌ [ERROR] {request.method} {request.url.path} - 500 Internal Error - {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Internal Server Error: {str(e)}"}
        )

    process_time = time.time() - start_time
    status_code = response.status_code
    
    # 2. Log Request
    log_color = "✅" if status_code < 400 else "⚠️" if status_code < 500 else "❌"
    print(f"{log_color} [{request.method}] {request.url.path} - {status_code} ({process_time:.3f}s)")

    # 3. Standardize Response (only for Application/JSON and non-internal routes)
    path = request.url.path
    is_internal = path.startswith("/openapi.json") or path.startswith("/docs") or path.startswith("/redoc")
    
    if not is_internal and "application/json" in response.headers.get("content-type", "").lower():
        # Read response body
        response_body = b""
        async for chunk in response.body_iterator:
            response_body += chunk
            
        try:
            data = json.loads(response_body.decode())
            # Don't double-wrap if already standardized
            if isinstance(data, dict) and ("success" in data):
                standardized_content = data
            else:
                standardized_content = {
                    "success": status_code < 400,
                    "data": data if status_code < 400 else None,
                    "message": data.get("detail") if isinstance(data, dict) and not (status_code < 400) else None
                }
            
            headers = dict(response.headers)
            headers.pop("content-length", None)
            
            return JSONResponse(
                status_code=status_code,
                content=standardized_content,
                headers=headers
            )
        except Exception as e:
            # Fallback for non-JSON or other errors
            return Response(
                content=response_body,
                status_code=status_code,
                headers=dict(response.headers),
                media_type=response.media_type
            )

    return response

# Include routers
app.include_router(auth_router)
app.include_router(food_router)
app.include_router(order_router)
app.include_router(library_router)
app.include_router(cert_router)
app.include_router(exam_router)
app.include_router(complaint_router)
app.include_router(ai_assistant_router)

EXAM_SEED_DATA = [
    {
        "_id": str(uuid.uuid4()),
        "exam_name": "Mid Semester Examination",
        "subject": "Data Structures and Algorithms",
        "date": "2026-03-25",
        "time": "09:00 AM",
        "location": "Exam Hall A - Block 3",
        "duration": 180,
        "semester": 4,
        "department": "Computer Science",
        "created_at": datetime.now(timezone.utc),
    },
    {
        "_id": str(uuid.uuid4()),
        "exam_name": "End Semester Examination",
        "subject": "Database Management Systems",
        "date": "2026-04-10",
        "time": "02:00 PM",
        "location": "Exam Hall B - Block 2",
        "duration": 180,
        "semester": 4,
        "department": "Computer Science",
        "created_at": datetime.now(timezone.utc),
    },
    {
        "_id": str(uuid.uuid4()),
        "exam_name": "Mid Semester Examination",
        "subject": "Computer Networks",
        "date": "2026-03-28",
        "time": "11:00 AM",
        "location": "Exam Hall C - Block 1",
        "duration": 150,
        "semester": 6,
        "department": "Computer Science",
        "created_at": datetime.now(timezone.utc),
    },
    {
        "_id": str(uuid.uuid4()),
        "exam_name": "Quiz 2",
        "subject": "Machine Learning",
        "date": "2026-03-20",
        "time": "10:00 AM",
        "location": "CS Lab 201",
        "duration": 60,
        "semester": 6,
        "department": "Computer Science",
        "created_at": datetime.now(timezone.utc),
    },
    {
        "_id": str(uuid.uuid4()),
        "exam_name": "End Semester Examination",
        "subject": "Operating Systems",
        "date": "2026-04-15",
        "time": "09:00 AM",
        "location": "Exam Hall A - Block 3",
        "duration": 180,
        "semester": 5,
        "department": "Computer Science",
        "created_at": datetime.now(timezone.utc),
    },
    {
        "_id": str(uuid.uuid4()),
        "exam_name": "Internal Assessment",
        "subject": "Software Engineering",
        "date": "2026-04-02",
        "time": "02:00 PM",
        "location": "Seminar Hall 1",
        "duration": 120,
        "semester": 5,
        "department": "Computer Science",
        "created_at": datetime.now(timezone.utc),
    },
]

async def seed_database():
    # Seed a demo user if none exist
    from database import users_collection, exam_notifications_collection, complaints_collection, library_bookings_collection, certificate_requests_collection, canteens_collection
    
    user_count = await users_collection.count_documents({})
    if user_count == 0:
        demo_user = {
            "_id": "demo-user-001",
            "name": "Alex Johnson",
            "email": "alex@campus.edu",
            "password": get_password_hash("Demo@1234"),
            "student_id": "CS21B001",
            "department": "Computer Science",
            "year": 3,
            "avatar": None,
        }
        await users_collection.insert_one(demo_user)
        print("✅ Demo user created: alex@campus.edu / Demo@1234")

    # Seed exams
    exam_count = await exam_notifications_collection.count_documents({})
    if exam_count == 0:
        await exam_notifications_collection.insert_many(EXAM_SEED_DATA)
        print(f"✅ Seeded {len(EXAM_SEED_DATA)} exam notifications")

    # Seed some complaints
    complaint_count = await complaints_collection.count_documents({})
    if complaint_count == 0:
        sample_complaints = [
            {
                "_id": str(uuid.uuid4()),
                "complaint_id": "CMP-001234",
                "user_id": "demo-user-001",
                "category": "Hostel",
                "subject": "Water supply issue in Block C",
                "description": "The water supply in Block C rooms has been intermittent for the past 3 days.",
                "status": "in_progress",
                "priority": "high",
                "created_at": datetime.now(timezone.utc),
            },
            {
                "_id": str(uuid.uuid4()),
                "complaint_id": "CMP-002345",
                "user_id": "demo-user-001",
                "category": "Canteen",
                "subject": "Food quality concern",
                "description": "The quality of food in the main canteen has degraded recently.",
                "status": "open",
                "priority": "medium",
                "created_at": datetime.now(timezone.utc),
            },
        ]
        await complaints_collection.insert_many(sample_complaints)
        print("✅ Seeded sample complaints")

    # Seed library bookings
    booking_count = await library_bookings_collection.count_documents({})
    if booking_count == 0:
        sample_bookings = [
            {
                "_id": str(uuid.uuid4()),
                "user_id": "demo-user-001",
                "seat_id": "F1-A3",
                "date": "2026-03-15",
                "start_time": "09:00",
                "end_time": "12:00",
                "floor": 1,
                "zone": "General",
                "status": "confirmed",
                "created_at": datetime.now(timezone.utc),
            },
        ]
        await library_bookings_collection.insert_many(sample_bookings)
        print("✅ Seeded library bookings")

    # Seed canteen data
    canteen_count = await canteens_collection.count_documents({})
    if canteen_count == 0:
        sample_canteens = [
            {
                "_id": "main",
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
                ],
            },
            {
                "_id": "cafe",
                "name": "Campus Café",
                "rating": 4.2,
                "time": "10-15 min",
                "emoji": "☕",
                "color": "from-amber-400 to-orange-400",
                "items": [
                    {"item_id": "cf-1", "name": "Margherita Pizza", "price": 120, "emoji": "🍕", "category": "Pizza", "popular": True},
                    {"item_id": "cf-2", "name": "Cappuccino", "price": 45, "emoji": "☕", "category": "Beverages", "popular": True},
                ],
            }
        ]
        await canteens_collection.insert_many(sample_canteens)
        print("✅ Seeded canteen data")

@app.on_event("startup")
async def startup_event():
    print("🚀 Campus Service Platform API starting...")
    await init_db()
    try:
        await seed_database()
        print("✅ Database ready")
    except Exception as e:
        print(f"⚠️  Seeding failed: {e}")

@app.get("/")
async def root():
    from database import db
    mode = "MOCK" if hasattr(db, "__dict__") and "MockDB" in str(type(db)) else "LOCKED"
    try:
         # More reliable check
         from database import MockDB
         if isinstance(db, MockDB): mode = "MOCK"
         else: mode = "LIVE"
    except: pass

    return {
        "message": "Campus Service Platform API",
        "version": "1.0.0",
        "mode": mode,
        "status": "running"
    }

@app.get("/api/dashboard/stats")
async def get_dashboard_stats(current_user: dict = __import__('fastapi').Depends(__import__('auth').get_current_user)):
    from database import (
        orders_collection, library_bookings_collection, 
        certificate_requests_collection, complaints_collection
    )
    user_id = str(current_user["_id"])
    total_orders = await orders_collection.count_documents({"user_id": user_id})
    active_bookings = await library_bookings_collection.count_documents({"user_id": user_id, "status": "confirmed"})
    pending_certs = await certificate_requests_collection.count_documents({"user_id": user_id, "status": {"$in": ["pending", "processing"]}})
    open_complaints = await complaints_collection.count_documents({"user_id": user_id, "status": {"$in": ["open", "in_progress"]}})
    
    return {
        "total_orders": total_orders,
        "active_bookings": active_bookings,
        "pending_certificates": pending_certs,
        "open_complaints": open_complaints,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
