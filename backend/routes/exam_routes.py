from fastapi import APIRouter, Depends, HTTPException
from models import ExamNotificationCreate, ExamNotificationResponse
from auth import get_current_user
from database import exam_notifications_collection
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/api/exams", tags=["Exam Notifications"])

def exam_helper(exam) -> dict:
    return {
        "id": str(exam.get("_id", "")),
        "exam_name": exam.get("exam_name", ""),
        "subject": exam.get("subject", ""),
        "date": exam.get("date", ""),
        "time": exam.get("time", ""),
        "location": exam.get("location", ""),
        "duration": exam.get("duration", 180),
        "semester": exam.get("semester", 1),
        "department": exam.get("department", ""),
        "created_at": exam.get("created_at", datetime.now(timezone.utc)),
    }

@router.get("/")
async def get_exams(current_user: dict = Depends(get_current_user)):
    exams = []
    async for exam in exam_notifications_collection.find().sort("date", 1):
        exams.append(exam_helper(exam))
    return exams

    try:
        await exam_notifications_collection.insert_one(exam_doc)
        return exam_helper(exam_doc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/upcoming")
async def get_upcoming_exams(current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    exams = []
    async for exam in exam_notifications_collection.find({"date": {"$gte": today}}).sort("date", 1).limit(10):
        exams.append(exam_helper(exam))
    return exams
