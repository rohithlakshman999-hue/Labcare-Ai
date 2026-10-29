from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.models.all_models import ChatMessage
from app.schemas.schemas import ChatRequest, ChatResponse
from app.services.chatbot_service import ChatbotService

router = APIRouter(prefix="/chat", tags=["AI Chatbot"])

@router.post("", response_model=ChatResponse)
async def send_chat_message(payload: ChatRequest, db: Session = Depends(get_db)):
    result = await ChatbotService.process_chat(
        db=db,
        message=payload.message,
        session_id=payload.session_id or "default_session",
        device_id=payload.device_id
    )
    return ChatResponse(**result)

@router.get("/history")
def get_chat_history(session_id: str = "default_session", limit: int = 50, db: Session = Depends(get_db)):
    msgs = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at.asc()).limit(limit).all()
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "created_at": m.created_at.isoformat(),
            "sources": m.sources_used
        }
        for m in msgs
    ]

@router.delete("/history")
def clear_chat_history(session_id: str = "default_session", db: Session = Depends(get_db)):
    db.query(ChatMessage).filter(ChatMessage.session_id == session_id).delete()
    db.commit()
    return {"message": f"Chat history cleared for session {session_id}."}
