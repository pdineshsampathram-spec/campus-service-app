from fastapi import APIRouter, Depends, HTTPException
from models import ComplaintCreate, ComplaintResponse
from auth import get_current_user
from database import complaints_collection
from datetime import datetime, timezone
import uuid
import random
import string

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])

def generate_complaint_id():
    return "CMP-" + "".join(random.choices(string.digits, k=6))

def complaint_helper(complaint) -> dict:
    return {
        "id": str(complaint.get("_id", "")),
        "complaint_id": complaint.get("complaint_id", ""),
        "user_id": complaint.get("user_id", ""),
        "category": complaint.get("category", ""),
        "subject": complaint.get("subject", ""),
        "description": complaint.get("description", ""),
        "status": complaint.get("status", "open"),
        "priority": complaint.get("priority", "medium"),
        "created_at": complaint.get("created_at", datetime.now(timezone.utc)),
    }

@router.post("/", response_model=ComplaintResponse)
async def create_complaint(complaint_data: ComplaintCreate, current_user: dict = Depends(get_current_user)):
    complaint_id_str = str(uuid.uuid4())
    complaint_doc = {
        "_id": complaint_id_str,
        "complaint_id": generate_complaint_id(),
        "user_id": str(current_user["_id"]),
        "category": complaint_data.category.value,
        "subject": complaint_data.subject,
        "description": complaint_data.description,
        "status": "open",
        "priority": complaint_data.priority,
        "created_at": datetime.now(timezone.utc),
    }
    try:
        from core.database import get_database
        db = get_database()
        if db is None:
            raise HTTPException(status_code=533, detail="Database connection unavailable")
        await db["complaints"].insert_one(complaint_doc)
        return complaint_helper(complaint_doc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-complaints")
async def get_my_complaints(current_user: dict = Depends(get_current_user)):
    try:
        from core.database import get_database
        db = get_database()
        if db is None:
            return []
        complaints = []
        cursor = db["complaints"].find({"user_id": str(current_user["_id"])})
        cursor.sort("created_at", -1)
        async for c in cursor:
            complaints.append(complaint_helper(c))
        return complaints
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{complaint_id}/status")
async def update_status(complaint_id: str, status: str, current_user: dict = Depends(get_current_user)):
    try:
        from core.database import get_database
        db = get_database()
        if db is None:
            raise HTTPException(status_code=533, detail="Database connection unavailable")
            
        valid = ["open", "in_progress", "resolved", "closed"]
        if status not in valid:
            raise HTTPException(status_code=400, detail=f"Invalid status. Choose from: {valid}")
        
        # Check ownership
        result = await db["complaints"].update_one(
            {"_id": complaint_id, "user_id": str(current_user["_id"])},
            {"$set": {"status": status}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Complaint not found or unauthorized")
        return {"message": "Status updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
