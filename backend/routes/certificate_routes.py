from fastapi import APIRouter, Depends, HTTPException
from models import CertificateRequestCreate, CertificateRequestResponse
from auth import get_current_user
from database import certificate_requests_collection
from datetime import datetime, timezone
import uuid
import random
import string

router = APIRouter(prefix="/api/certificates", tags=["Certificate Requests"])

def generate_request_id():
    return "CERT-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=8))

def cert_helper(cert) -> dict:
    return {
        "id": str(cert.get("_id", "")),
        "request_id": cert.get("request_id", ""),
        "user_id": cert.get("user_id", ""),
        "certificate_type": cert.get("certificate_type", ""),
        "student_name": cert.get("student_name", ""),
        "student_id": cert.get("student_id", ""),
        "reason": cert.get("reason", ""),
        "status": cert.get("status", "pending"),
        "created_at": cert.get("created_at", datetime.now(timezone.utc)),
        "estimated_days": cert.get("estimated_days", 7),
    }

@router.post("/request", response_model=CertificateRequestResponse)
async def request_certificate(cert_data: CertificateRequestCreate, current_user: dict = Depends(get_current_user)):
    cert_id = str(uuid.uuid4())
    request_id = generate_request_id()
    cert_doc = {
        "_id": cert_id,
        "request_id": request_id,
        "user_id": str(current_user["_id"]),
        "certificate_type": cert_data.certificate_type.value,
        "student_name": cert_data.student_name,
        "student_id": cert_data.student_id,
        "reason": cert_data.reason,
        "additional_info": cert_data.additional_info or "",
        "status": "pending",
        "estimated_days": 7,
        "created_at": datetime.now(timezone.utc),
    }
    try:
        from core.database import get_database
        db = get_database()
        if db is None:
            raise HTTPException(status_code=533, detail="Database connection unavailable")
        await db["certificate_requests"].insert_one(cert_doc)
        return cert_helper(cert_doc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-requests")
async def get_my_requests(current_user: dict = Depends(get_current_user)):
    try:
        from core.database import get_database
        db = get_database()
        if db is None:
            return []
        certs = []
        async for c in db["certificate_requests"].find({"user_id": str(current_user["_id"])}).sort("created_at", -1):
            certs.append(cert_helper(c))
        return certs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{cert_id}", response_model=CertificateRequestResponse)
async def get_certificate(cert_id: str, current_user: dict = Depends(get_current_user)):
    try:
        from core.database import get_database
        db = get_database()
        if db is None:
            raise HTTPException(status_code=533, detail="Database connection unavailable")
        cert = await db["certificate_requests"].find_one({
            "_id": cert_id,
            "user_id": str(current_user["_id"])
        })
        if cert is None:
            raise HTTPException(status_code=404, detail="Certificate request not found")
        return cert_helper(cert)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
