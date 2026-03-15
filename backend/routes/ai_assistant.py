from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from auth import get_current_user
from services.ai_service import AIService
import logging

router = APIRouter(prefix="/api/ai-assistant", tags=["AI Assistant"])

class ChatRequest(BaseModel):
    query: str
    session_context: Optional[dict] = None

class ChatResponse(BaseModel):
    response: str
    intent: str
    context: Optional[dict] = None

@router.post("/", response_model=ChatResponse)
async def chat_with_assistant(
    request: ChatRequest, 
    current_user: dict = Depends(get_current_user)
):
    try:
        # Detect intent and get data-aware response
        response_text, context = await AIService.get_ai_response(
            request.query, 
            current_user, 
            request.session_context
        )
        
        return {
            "response": response_text,
            "intent": context.get("last_intent", "general"),
            "context": context
        }
    except Exception as e:
        logging.error(f"AI Assistant Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI Assistant Error: {str(e)}")
