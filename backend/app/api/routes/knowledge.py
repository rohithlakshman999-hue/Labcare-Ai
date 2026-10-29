from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.models.all_models import KnowledgeDocument
from app.schemas.schemas import KnowledgeDocumentResponse
from app.services.rag_engine import RAGEngine

router = APIRouter(prefix="/knowledge", tags=["Knowledge Base"])

@router.get("", response_model=List[KnowledgeDocumentResponse])
def list_knowledge_documents(
    query: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(KnowledgeDocument)
    if category:
        q = q.filter(KnowledgeDocument.fault_category == category)
    if query:
        search_fmt = f"%{query}%"
        q = q.filter(
            (KnowledgeDocument.title.ilike(search_fmt)) |
            (KnowledgeDocument.fault_category.ilike(search_fmt)) |
            (KnowledgeDocument.symptoms.ilike(search_fmt))
        )
    return q.all()

@router.get("/{doc_id}", response_model=KnowledgeDocumentResponse)
def get_knowledge_document(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(KnowledgeDocument).filter(
        (KnowledgeDocument.doc_id == doc_id) | (KnowledgeDocument.id == int(doc_id) if doc_id.isdigit() else False)
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Knowledge document not found.")
    return doc
