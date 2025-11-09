from fastapi import APIRouter, HTTPException, status
from typing import List
from models import QuizRequest, QuizResponse, QuizQuestion
from database import get_database
from ai_engine import generate_quiz
import uuid
from datetime import datetime

router = APIRouter()

@router.get("/concept-mastery/{course_id}")
async def get_concept_mastery_heatmap(course_id: str):
    """
    Get concept mastery heatmap data for a course
    """
    from concept_tracker import get_course_concept_mastery
    
    try:
        mastery_data = await get_course_concept_mastery(course_id)
        return mastery_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching concept mastery: {str(e)}"
        )

@router.post("/cleanup-concepts/{course_id}")
async def cleanup_bad_concepts(course_id: str):
    """
    Remove generic/useless concepts from the database
    """
    db = get_database()
    
    STOPWORDS = {
        'what', 'how', 'why', 'when', 'where', 'who', 'which', 'that', 'this',
        'data', 'training', 'testing', 'test', 'train', 'information',
        'course', 'lesson', 'lecture', 'introduction', 'overview', 'example',
        'student', 'professor', 'learning', 'understanding', 'concept', 'topic',
        'material', 'process', 'method', 'system', 'the', 'and', 'for', 'with'
    }
    
    try:
        # Get all concepts for this course
        all_concepts = await db.concept_mastery.find({"course_id": course_id}).to_list(1000)
        
        deleted_count = 0
        for record in all_concepts:
            concept = record["concept"]
            concept_lower = concept.lower()
            concept_words = concept_lower.split()
            
            # Delete if concept matches stopword criteria
            should_delete = (
                concept_lower in STOPWORDS or
                len(concept) < 4 or
                (len(concept_words) == 1 and len(concept) < 5) or
                all(word in STOPWORDS for word in concept_words) or
                concept_words[0] in {'what', 'how', 'why', 'when', 'where'}
            )
            
            if should_delete:
                await db.concept_mastery.delete_one({"_id": record["_id"]})
                deleted_count += 1
        
        return {
            "status": "success",
            "deleted_count": deleted_count,
            "message": f"Cleaned up {deleted_count} generic concepts"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error cleaning concepts: {str(e)}"
        )

@router.post("/submit")
async def submit_quiz_results(submission: dict):
    """
    Store quiz attempt results for analytics and update concept mastery
    """
    db = get_database()
    from concept_tracker import update_concept_mastery
    
    # Mock student ID for demo
    student_id = "student-demo-001"
    
    # Create quiz attempt record
    attempt = {
        "id": str(uuid.uuid4()),
        "quiz_id": submission.get("quiz_id"),
        "student_id": student_id,
        "course_id": submission.get("course_id"),
        "score": submission.get("score"),
        "total_questions": submission.get("total_questions"),
        "topic": submission.get("topic"),
        "answers": submission.get("answers", []),
        "completed_at": datetime.utcnow().isoformat()
    }
    
    await db.quiz_attempts.insert_one(attempt)
    
    # Update concept mastery based on quiz answers
    for answer in submission.get("answers", []):
        topic = answer.get("topic", submission.get("topic", "General"))
        is_correct = answer.get("is_correct", False)
        
        await update_concept_mastery(
            student_id=student_id,
            course_id=submission.get("course_id"),
            concept=topic,
            interaction_type='quiz_correct' if is_correct else 'quiz_incorrect',
            weight=1.5  # Quiz answers have higher weight than questions
        )
    
    return {"status": "success", "message": "Quiz attempt recorded"}

@router.post("/generate", response_model=QuizResponse)
async def generate_quiz_endpoint(quiz_request: QuizRequest):
    """
    Generate a quiz based on course materials - with topic filtering
    """
    db = get_database()
    from intent_detector import filter_materials_by_topic
    
    # Get course and materials
    course = await db.courses.find_one({"id": quiz_request.course_id})
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    all_materials = await db.course_materials.find({"course_id": quiz_request.course_id}).to_list(100)
    
    if not all_materials:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No course materials found for this course"
        )
    
    # Filter materials by topic if specified
    if quiz_request.topic:
        print(f"Filtering materials for topic: {quiz_request.topic}")
        materials = await filter_materials_by_topic(all_materials, quiz_request.topic)
        print(f"Filtered to {len(materials)} relevant materials")
    else:
        materials = all_materials
    
    # Generate quiz questions
    try:
        print(f"Generating quiz for course: {course.get('title')}, topic: {quiz_request.topic}")
        questions_data = await generate_quiz(
            course=course,
            materials=materials,
            topic=quiz_request.topic,
            num_questions=quiz_request.num_questions
        )
        
        print(f"Generated {len(questions_data) if questions_data else 0} questions")
        
        if not questions_data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate quiz questions"
            )
        
        # Convert to QuizQuestion models
        questions = [QuizQuestion(**q) for q in questions_data]
        
        return QuizResponse(
            quiz_id=str(uuid.uuid4()),
            questions=questions,
            course_title=course.get('title', 'Unknown Course')
        )
    except Exception as e:
        print(f"ERROR in quiz generation: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating quiz: {str(e)}"
        )
