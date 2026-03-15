from fastapi import APIRouter, HTTPException, status, Depends
from datetime import timedelta
import uuid
from models import UserCreate, UserLogin, Token, UserResponse, UserUpdate
from auth import get_password_hash, verify_password, create_access_token, get_current_user
from database import users_collection
from config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

def user_helper(user) -> dict:
    return {
        "id": str(user.get("_id", user.get("id", ""))),
        "name": user["name"],
        "email": user["email"],
        "student_id": user.get("student_id", ""),
        "department": user.get("department", ""),
        "year": user.get("year", 1),
        "avatar": user.get("avatar", None),
    }

@router.post("/register", response_model=Token)
async def register(user_data: UserCreate):
    try:
        from core.database import get_database
        db = get_database()
        if db is None:
            raise HTTPException(status_code=503, detail="Database connection unavailable")
            
        # Check if email already exists
        existing = await db["users"].find_one({"email": user_data.email})
        if existing is not None:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        existing_id = await db["users"].find_one({"student_id": user_data.student_id})
        if existing_id is not None:
            raise HTTPException(status_code=400, detail="Student ID already registered")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)
    
    user_doc = {
        "_id": user_id,
        "name": user_data.name,
        "email": user_data.email,
        "password": hashed_password,
        "student_id": user_data.student_id,
        "department": user_data.department,
        "year": user_data.year,
        "avatar": None,
    }
    
    await users_collection.insert_one(user_doc)
    
    access_token = create_access_token(
        data={"sub": user_id, "email": user_data.email},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_helper(user_doc)
    }

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin):
    try:
        from core.database import get_database
        db = get_database()
        if db is None:
            raise HTTPException(status_code=503, detail="Database connection unavailable")
        user = await db["users"].find_one({"email": user_data.email})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if user is None or not verify_password(user_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    access_token = create_access_token(
        data={"sub": str(user["_id"]), "email": user["email"]},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_helper(user)
    }

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    # Convert _id to string for the model
    user_data = dict(current_user)
    user_data["id"] = str(user_data["_id"])
    return user_data

@router.patch("/me", response_model=UserResponse)
async def update_profile(user_update: UserUpdate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    
    update_data = {k: v for k, v in user_update.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    await users_collection.update_one({"_id": user_id}, {"$set": update_data})
    
    updated_user = await users_collection.find_one({"_id": user_id})
    updated_user["id"] = str(updated_user["_id"])
    return updated_user
