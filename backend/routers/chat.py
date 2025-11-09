from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from models import ChatRequest, ChatResponse, ChatMessage
from auth_utils import get_current_user
from database import get_database
from ai_engine import generate_teaching_response
from concept_tracker import extract_concepts_from_materials, detect_concepts_in_text, update_concept_mastery
from intent_detector import detect_quiz_intent
import uuid
from datetime import datetime

router = APIRouter()

@router.post("/send")
async def send_message(chat_request: ChatRequest):
    """
    Send a chat message - now with intelligent quiz intent detection and personalization
    """
    db = get_database()
    
    # First, check if this is a quiz request using AI
    intent = await detect_quiz_intent(chat_request.message)
    
    if intent["is_quiz_request"] and intent["confidence"] > 0.6:
        # Return quiz intent signal to frontend
        return {
            "type": "quiz_intent",
            "topic": intent["topic"],
            "message": chat_request.message,
            "confidence": intent["confidence"]
        }
    
    # Continue with normal chat flow
    db = get_database()
    
    # Mock student ID for demo
    student_id = "student-demo-001"
    
    # Get student profile to personalize based on major
    student_major = None
    if hasattr(chat_request, 'student_id') and chat_request.student_id:
        student = await db.users.find_one({"id": chat_request.student_id})
        if student:
            student_major = student.get('major')
    
    # Get course and materials
    course = await db.courses.find_one({"id": chat_request.course_id})
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    materials = await db.course_materials.find({"course_id": chat_request.course_id}).to_list(100)
    
    # Extract course concepts and detect which ones are in the question
    course_concepts = await extract_concepts_from_materials(materials)
    detected_concepts = await detect_concepts_in_text(chat_request.message, course_concepts)
    
    # Update concept mastery for detected concepts
    for concept in detected_concepts:
        await update_concept_mastery(
            student_id=student_id,
            course_id=chat_request.course_id,
            concept=concept,
            interaction_type='question',
            weight=1.0
        )
    
    # Generate or use existing session ID
    session_id = chat_request.session_id or str(uuid.uuid4())
    
    # Get chat history for this session
    history = await db.chat_messages.find({
        "session_id": session_id,
        "student_id": student_id
    }).sort("timestamp", 1).to_list(100)
    
    # Save user message
    user_message = ChatMessage(
        session_id=session_id,
        student_id=student_id,
        course_id=chat_request.course_id,
        role="user",
        content=chat_request.message
    )
    await db.chat_messages.insert_one(user_message.model_dump())
    
    # Generate AI response
    try:
        ai_response = await generate_teaching_response(
            course=course,
            materials=materials,
            user_message=chat_request.message,
            chat_history=history,
            session_id=session_id,
            student_major=student_major
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating response: {str(e)}"
        )
    
    # Extract message content for storage
    message_content = ai_response.get("message", "")
    
    # Save AI message
    assistant_message = ChatMessage(
        session_id=session_id,
        student_id=student_id,
        course_id=chat_request.course_id,
        role="assistant",
        content=message_content
    )
    await db.chat_messages.insert_one(assistant_message.model_dump())
    
    return ChatResponse(
        session_id=session_id,
        message=message_content,
        key_topics=ai_response.get("key_topics", []),
        concept_graph=ai_response.get("concept_graph", []),
        markdown_content=ai_response.get("markdown_content", message_content),
        sources=ai_response.get("sources", []),
        student_major=student_major,
        timestamp=datetime.utcnow()
    )

@router.get("/history/{course_id}", response_model=List[ChatMessage])
async def get_chat_history(course_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can view chat history"
        )
    
    db = get_database()
    
    # Get all messages for this student in this course
    messages = await db.chat_messages.find({
        "student_id": current_user["sub"],
        "course_id": course_id
    }).sort("timestamp", 1).to_list(200)
    
    return [ChatMessage(**msg) for msg in messages]

@router.get("/sessions/{course_id}")
async def get_chat_sessions(course_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can view sessions"
        )
    
    db = get_database()
    
    # Get unique session IDs for this student in this course
    sessions = await db.chat_messages.aggregate([
        {
            "$match": {
                "student_id": current_user["sub"],
                "course_id": course_id
            }
        },
        {
            "$group": {
                "_id": "$session_id",
                "last_message": {"$last": "$timestamp"},
                "message_count": {"$sum": 1}
            }
        },
        {"$sort": {"last_message": -1}}
    ]).to_list(50)
    
    return [{"session_id": s["_id"], "last_message": s["last_message"], "message_count": s["message_count"]} for s in sessions]
