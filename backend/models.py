from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime, timezone
from enum import Enum

# ======= UTILITY MODELS =======
class APIResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    message: Optional[str] = None

# ======= AUTH MODELS =======
class UserUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    avatar: Optional[str] = None

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    student_id: str
    department: str = ""
    year: int = 1

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    student_id: str
    department: str
    year: int
    avatar: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# ======= FOOD ORDER MODELS =======
class FoodItem(BaseModel):
    item_id: str
    name: str
    price: float
    emoji: str
    category: str
    popular: bool = False

class Canteen(BaseModel):
    id: str
    name: str
    rating: float
    time: str
    emoji: str
    color: str
    items: List[FoodItem]

class OrderItem(BaseModel):
    item_id: str
    name: str
    price: float
    quantity: int
    canteen: str

class OrderCreate(BaseModel):
    items: List[OrderItem]
    canteen: str
    total_amount: float
    special_instructions: Optional[str] = ""

class OrderResponse(BaseModel):
    id: str
    user_id: str
    items: List[OrderItem]
    canteen: str
    total_amount: float
    status: str
    special_instructions: str
    created_at: datetime
    estimated_time: int = 20

# ======= LIBRARY BOOKING MODELS =======
class LibrarySeat(BaseModel):
    seat_id: str
    isBooked: bool = False
    bookedBy: Optional[str] = None
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LibrarySeatResponse(BaseModel):
    seat_id: str
    isBooked: bool
    bookedBy: Optional[str] = None

class LibraryBookingCreate(BaseModel):
    seat_id: str
    date: str
    start_time: str
    end_time: str
    floor: int = 1
    zone: str = "General"

class LibraryBookingResponse(BaseModel):
    id: str
    user_id: str
    seat_id: str
    date: str
    start_time: str
    end_time: str
    floor: int
    zone: str
    status: str
    created_at: datetime

# ======= CERTIFICATE REQUEST MODELS =======
class CertificateType(str, Enum):
    bonafide = "Bonafide"
    transfer = "Transfer Certificate"
    degree = "Degree Certificate"
    conduct = "Conduct Certificate"
    migration = "Migration Certificate"

class CertificateRequestCreate(BaseModel):
    certificate_type: CertificateType
    student_name: str
    student_id: str
    reason: str
    additional_info: Optional[str] = ""

class CertificateRequestResponse(BaseModel):
    id: str
    request_id: str
    user_id: str
    certificate_type: str
    student_name: str
    student_id: str
    reason: str
    status: str
    created_at: datetime
    estimated_days: int = 7

# ======= EXAM NOTIFICATIONS =======
class ExamNotificationCreate(BaseModel):
    exam_name: str
    subject: str
    date: str
    time: str
    location: str
    duration: int
    semester: int
    department: str

class ExamNotificationResponse(BaseModel):
    id: str
    exam_name: str
    subject: str
    date: str
    time: str
    location: str
    duration: int
    semester: int
    department: str
    created_at: datetime

# ======= COMPLAINT MODELS =======
class ComplaintCategory(str, Enum):
    hostel = "Hostel"
    canteen = "Canteen"
    academic = "Academic"
    facilities = "Facilities"
    transport = "Transport"
    other = "Other"

class ComplaintCreate(BaseModel):
    category: ComplaintCategory
    subject: str
    description: str
    priority: str = "medium"

class ComplaintResponse(BaseModel):
    id: str
    complaint_id: str
    user_id: str
    category: str
    subject: str
    description: str
    status: str
    priority: str
    created_at: datetime
