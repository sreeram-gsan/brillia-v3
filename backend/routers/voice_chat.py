from fastapi import APIRouter, HTTPException, Request
from emergentintegrations.llm.openai import OpenAIChatRealtime
import os
from database import get_database

router = APIRouter()

# Initialize OpenAI Realtime Chat with Emergent LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
chat = OpenAIChatRealtime(api_key=EMERGENT_LLM_KEY)

# Register the realtime router with proper prefix
OpenAIChatRealtime.register_openai_realtime_router(router, chat)


@router.get("/test")
async def test_voice_endpoint():
    """
    Test endpoint to verify voice chat router is working
    """
    return {"message": "Voice chat endpoint is working", "status": "ok"}


@router.post("/context")
async def set_voice_context(request: Request):
    """
    Set course context for voice chat
    """
    try:
        data = await request.json()
        course_id = data.get("course_id")
        
        if not course_id:
            raise HTTPException(status_code=400, detail="course_id is required")
        
        db = get_database()
        
        # Get course materials for context
        materials = await db.materials.find({"course_id": course_id}).to_list(None)
        
        # Build context string
        context_parts = []
        for material in materials:
            context_parts.append(f"Title: {material.get('title', 'Untitled')}")
            context_parts.append(f"Type: {material.get('material_type', 'unknown')}")
            context_parts.append(f"Content: {material.get('content', '')[:500]}...")  # First 500 chars
            context_parts.append("---")
        
        context = "\n".join(context_parts) if context_parts else "No course materials available yet."
        
        return {
            "message": "Context set successfully",
            "course_id": course_id,
            "materials_count": len(materials),
            "context_preview": context[:200]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
