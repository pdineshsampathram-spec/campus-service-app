import logging
import json
import re
import uuid
from datetime import datetime, timezone, timedelta
from database import (
    orders_collection, 
    library_bookings_collection, 
    certificate_requests_collection,
    library_seats_collection
)

logger = logging.getLogger("uvicorn")

class AIService:
    @staticmethod
    async def detect_intent(query: str, context: dict = None) -> str:
        query = query.lower()
        
        # Follow-up intent handling
        if context and context.get("last_intent"):
            if any(word in query for word in ["cancel", "unbook", "remove", "don't want it"]):
                if context["last_intent"] == "book_seat":
                    return "cancel_seat"
            if any(word in query for word in ["yes", "confirm", "go ahead"]):
                return f"confirm_{context['last_intent']}"

        if any(word in query for word in ["order", "spending", "spent", "buy", "bought"]):
            if "spent" in query or "spending" in query:
                return "check_spending"
            if "order" in query and any(item in query for item in ["coffee", "tea", "burger", "pizza", "sandwich"]):
                return "place_order"
            return "check_orders"
        
        if "certificate" in query or "status" in query and "cert" in query:
            return "check_certificate_status"
        
        if "book" in query and ("library" in query or "seat" in query):
            return "book_seat"
        
        if "cancel" in query or "unbook" in query:
            return "cancel_seat"
            
        if "exam" in query or "prepare" in query or "study" in query:
            return "exam_help"
            
        return "general"

    @staticmethod
    async def get_user_spending(user_id: str) -> str:
        total = 0
        count = 0
        cursor = orders_collection.find({"user_id": user_id})
        async for order in cursor:
            total += order.get("total_amount", 0)
            count += 1
        
        if count == 0:
            return "You haven't placed any food orders yet."
        return f"You have placed {count} orders with a total spending of ₹{total}."

    @staticmethod
    async def get_recent_orders(user_id: str) -> str:
        orders = []
        cursor = orders_collection.find({"user_id": user_id}).sort("created_at", -1).limit(5)
        async for order in cursor:
            items_str = ", ".join([item["name"] for item in order.get("items", [])])
            orders.append(f"• {order['canteen']}: {items_str} (₹{order['total_amount']})")
        
        if not orders:
            return "You don't have any recent orders."
        return "Your recent orders:\n" + "\n".join(orders)

    @staticmethod
    async def get_certificate_status(user_id: str) -> str:
        certs = []
        cursor = certificate_requests_collection.find({"user_id": user_id}).sort("created_at", -1).limit(3)
        async for cert in cursor:
            certs.append(f"• {cert['certificate_type']}: {cert['status']}")
        
        if not certs:
            return "You haven't requested any certificates yet."
        return "Your certificate requests:\n" + "\n".join(certs)

    @staticmethod
    async def book_seat_action(query: str, user_id: str) -> tuple:
        # Extract seat ID (e.g. "F1-A12" or just "12")
        seat_match = re.search(r'seat\s*([a-z0-9\-]+)', query, re.I)
        seat_id = seat_match.group(1).upper() if seat_match else None
        
        if not seat_id:
            return "Which seat would you like to book? (e.g., 'Book seat F1-A1')", {"last_intent": "book_seat"}
        
        # Default to F1- prefix if missing
        if not seat_id.startswith("F1-"):
            seat_id = f"F1-{seat_id}"

        # Logic to book seat
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        
        # Check availability
        existing = await library_seats_collection.find_one({"seat_id": seat_id, "date": today})
        if existing:
            return f"Sorry, seat {seat_id} is already booked for today.", None
            
        booking_data = {
            "_id": str(uuid.uuid4()),
            "user_id": user_id,
            "seat_id": seat_id,
            "date": today,
            "start_time": "09:00",
            "end_time": "12:00",
            "floor": 1,
            "zone": "Main Hall",
            "status": "confirmed",
            "created_at": datetime.now(timezone.utc)
        }
        
        await library_bookings_collection.insert_one(booking_data)
        await library_seats_collection.insert_one({
            "seat_id": seat_id,
            "date": today,
            "isBooked": True,
            "user_id": user_id
        })
        
        return f"Seat {seat_id} has been successfully booked for you for today (9 AM - 12 PM).", {"last_booked_seat": seat_id}

    @staticmethod
    async def cancel_seat_action(user_id: str, context: dict) -> str:
        seat_id = context.get("last_booked_seat")
        
        if not seat_id:
            # Find most recent active booking
            booking = await library_bookings_collection.find_one(
                {"user_id": user_id, "status": "confirmed"},
                sort=[("created_at", -1)]
            )
            if not booking:
                return "I couldn't find any active seat bookings to cancel."
            seat_id = booking["seat_id"]

        await library_bookings_collection.update_many(
            {"user_id": user_id, "seat_id": seat_id, "status": "confirmed"},
            {"$set": {"status": "cancelled"}}
        )
        await library_seats_collection.delete_many({"seat_id": seat_id, "user_id": user_id})
        
        return f"Your booking for seat {seat_id} has been cancelled."

    @staticmethod
    async def place_order_action(query: str, user_id: str) -> str:
        # Simple menu matching
        menu = {
            "coffee": {"price": 40, "canteen": "Main Canteen"},
            "tea": {"price": 15, "canteen": "Main Canteen"},
            "burger": {"price": 80, "canteen": "Food Court"},
            "pizza": {"price": 150, "canteen": "Food Court"},
            "sandwich": {"price": 50, "canteen": "Main Canteen"}
        }
        
        found_item = None
        for item, details in menu.items():
            if item in query.lower():
                found_item = (item, details)
                break
        
        if not found_item:
            return "Sure! What would you like to order? I can help with coffee, tea, burgers, etc."
            
        item_name, details = found_item
        order_data = {
            "_id": str(uuid.uuid4()),
            "user_id": user_id,
            "canteen": details["canteen"],
            "items": [{"name": item_name.capitalize(), "price": details["price"], "quantity": 1}],
            "total_amount": details["price"],
            "status": "confirmed",
            "created_at": datetime.now(timezone.utc)
        }
        
        await orders_collection.insert_one(order_data)
        return f"I've placed an order for 1 {item_name.capitalize()} (₹{details['price']}) from {details['canteen']}. It should be ready soon!"

    @staticmethod
    async def get_ai_response(query: str, user_data: dict = None, context: dict = None) -> tuple:
        intent = await AIService.detect_intent(query, context)
        user_id = str(user_data.get("_id")) if user_data else None
        user_name = user_data.get("name", "Student")
        
        new_context = context.copy() if context else {}
        new_context["last_intent"] = intent

        if intent == "check_spending" and user_id:
            return await AIService.get_user_spending(user_id), new_context
        
        if intent == "check_orders" and user_id:
            return await AIService.get_recent_orders(user_id), new_context
        
        if intent == "check_certificate_status" and user_id:
            return await AIService.get_certificate_status(user_id), new_context

        if intent == "book_seat" and user_id:
            resp, ctx_up = await AIService.book_seat_action(query, user_id)
            new_context.update(ctx_up or {})
            return resp, new_context

        if intent == "cancel_seat" and user_id:
            return await AIService.cancel_seat_action(user_id, new_context), new_context

        if intent == "place_order" and user_id:
            return await AIService.place_order_action(query, user_id), new_context

        if intent == "exam_help":
            return f"Hi {user_name}! For exam preparation, I recommend focusing on key concepts, practicing previous years' questions, and taking regular breaks. Focusing on Data Structures? I can suggest a study schedule!", new_context
        
        if "services" in query.lower():
            return "We offer Food Ordering, Library Seat Booking, Certificate Requests, Exam Notifications, and Complaint Management. How can I help you today?", new_context

        return f"I'm your Campus Assistant. I can help you check your spending, track orders, or book a seat. Try asking 'Book seat 15'!", new_context
