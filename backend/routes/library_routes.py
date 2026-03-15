from fastapi import APIRouter, Depends, HTTPException
from models import LibraryBookingCreate, LibraryBookingResponse, LibrarySeatResponse
from auth import get_current_user
from database import library_bookings_collection, library_seats_collection
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/api/library", tags=["Library Booking"])

def booking_helper(booking) -> dict:
    return {
        "id": str(booking.get("_id", "")),
        "user_id": booking.get("user_id", ""),
        "seat_id": booking.get("seat_id", ""),
        "date": booking.get("date", ""),
        "start_time": booking.get("start_time", ""),
        "end_time": booking.get("end_time", ""),
        "floor": booking.get("floor", 1),
        "zone": booking.get("zone", "General"),
        "status": booking.get("status", "confirmed"),
        "created_at": booking.get("created_at", datetime.now(timezone.utc)),
    }

@router.get("/seats")
async def get_today_seats():
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return await get_seats_status(today)

@router.get("/seats/{date}")
async def get_seats_status(date: str):
    # ... (existing logic)
    seats = []
    rows = ['A', 'B', 'C', 'D', 'E', 'F']
    for row in rows:
        for col in range(1, 11):
            seat_id = f"F1-{row}{col}"
            booking = await library_bookings_collection.find_one({
                "seat_id": seat_id,
                "date": date,
                "status": "confirmed"
            })
            seats.append({
                "seat_id": seat_id,
                "isBooked": True if booking else False,
                "bookedBy": booking.get("user_id") if booking else None
            })
    return seats

@router.post("/book-seat", response_model=LibraryBookingResponse)
async def book_seat(booking_data: LibraryBookingCreate, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    # Create the booking document
    booking_id = str(uuid.uuid4())
    booking_doc = {
        "_id": booking_id,
        "user_id": user_id,
        "seat_id": booking_data.seat_id,
        "date": booking_data.date,
        "start_time": booking_data.start_time,
        "end_time": booking_data.end_time,
        "floor": booking_data.floor,
        "zone": booking_data.zone,
        "status": "confirmed",
        "created_at": datetime.now(timezone.utc),
    }

    try:
        # Atomic insertion with unique index protection
        await library_bookings_collection.insert_one(booking_doc)
        
        # Update real-time seat collection (best-effort secondary tracking)
        await library_seats_collection.update_one(
            {"seat_id": booking_data.seat_id, "date": booking_data.date},
            {"$set": {
                "isBooked": True,
                "bookedBy": user_id,
                "timestamp": datetime.now(timezone.utc)
            }},
        )
        
        return booking_helper(booking_doc)
    except Exception as e:
        # Check for duplicate key error (MongoDB code 11000)
        error_str = str(e)
        if "duplicate key" in error_str.lower() or "11000" in error_str:
            # Determine which constraint failed
            if "user_id" in error_str:
                raise HTTPException(status_code=400, detail="You already have a confirmed booking for this date")
            raise HTTPException(status_code=400, detail="This seat has already been booked by another user")
        
        # For MockCollection or other errors, fallback to a safer check if needed
        raise HTTPException(status_code=500, detail=f"Booking failed: {error_str}")

@router.get("/my-bookings")
async def get_my_bookings(current_user: dict = Depends(get_current_user)):
    bookings = []
    cursor = library_bookings_collection.find({"user_id": str(current_user["_id"])})
    cursor.sort("created_at", -1)
    async for b in cursor:
        bookings.append(booking_helper(b))
    return bookings

@router.delete("/cancel/{booking_id}")
async def cancel_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    booking = await library_bookings_collection.find_one({"_id": booking_id, "user_id": str(current_user["_id"])})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    await library_bookings_collection.update_one(
        {"_id": booking_id},
        {"$set": {"status": "cancelled"}}
    )
    
    # Also update seat status
    await library_seats_collection.delete_one({"seat_id": booking["seat_id"], "date": booking["date"]})
    
    return {"message": "Booking cancelled successfully"}
@router.delete("/unbook-seat/{seat_id}")
async def unbook_seat(seat_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    # Find the active confirmed booking for this user and seat
    booking = await library_bookings_collection.find_one({
        "seat_id": seat_id,
        "user_id": user_id,
        "status": "confirmed"
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail="Active booking for this seat not found")
    
    # Update booking to cancelled
    await library_bookings_collection.update_one(
        {"_id": booking["_id"]},
        {"$set": {"status": "cancelled"}}
    )
    
    # Mark seat as available in real-time tracking
    await library_seats_collection.delete_one({
        "seat_id": seat_id,
        "date": booking["date"]
    })
    
    return {"message": f"Successfully unbooked seat {seat_id}"}
