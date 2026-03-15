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

    try:
        await certificate_requests_collection.insert_one(cert_doc)
        return cert_helper(cert_doc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-requests")
async def get_my_requests(current_user: dict = Depends(get_current_user)):
    certs = []
    async for c in certificate_requests_collection.find({"user_id": str(current_user["_id"])}).sort("created_at", -1):
        certs.append(cert_helper(c))
    return certs

@router.get("/{cert_id}", response_model=CertificateRequestResponse)
async def get_certificate(cert_id: str, current_user: dict = Depends(get_current_user)):
    cert = await certificate_requests_collection.find_one({
        "_id": cert_id,
        "user_id": str(current_user["_id"])
    })
    if cert is None:
        raise HTTPException(status_code=404, detail="Certificate request not found")
    return cert_helper(cert)
