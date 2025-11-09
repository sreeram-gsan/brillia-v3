from fastapi import APIRouter, HTTPException, status
from database import get_database
from datetime import datetime, timedelta
from collections import Counter
import re

router = APIRouter()

@router.get("/insights/{course_id}")
async def get_student_insights(course_id: str, student_id: str = "student-demo-001"):
    """
    Get personalized learning insights for a student in a specific course
    """
    db = get_database()
    
    # Get course info
    course = await db.courses.find_one({"id": course_id})
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # === QUIZ PERFORMANCE ===
    quiz_attempts = await db.quiz_attempts.find({
        "course_id": course_id,
        "student_id": student_id
    }).to_list(1000)
    
    total_quizzes = len(quiz_attempts)
    avg_score = 0
    quiz_scores = []
    
    if quiz_attempts:
        total_score = sum(attempt["score"] for attempt in quiz_attempts)
        total_possible = sum(attempt["total_questions"] for attempt in quiz_attempts)
        avg_score = round((total_score / total_possible) * 100) if total_possible > 0 else 0
        
        # Get individual quiz scores for trend
        quiz_scores = [
            {
                "date": datetime.fromisoformat(attempt["completed_at"]).strftime("%m/%d"),
                "score": round((attempt["score"] / attempt["total_questions"]) * 100) if attempt["total_questions"] > 0 else 0,
                "topic": attempt.get("topic") or "General"
            }
            for attempt in sorted(quiz_attempts, key=lambda x: x["completed_at"])[-7:]  # Last 7 quizzes
        ]
    
    # Topic-wise performance
    topic_performance = {}
    for attempt in quiz_attempts:
        topic = attempt.get("topic") or "General"
        if topic not in topic_performance:
            topic_performance[topic] = {"correct": 0, "total": 0}
        topic_performance[topic]["correct"] += attempt["score"]
        topic_performance[topic]["total"] += attempt["total_questions"]
    
    quiz_by_topic = [
        {
            "topic": topic,
            "score": round((data["correct"] / data["total"]) * 100) if data["total"] > 0 else 0,
            "attempts": data["total"] // 5  # Assuming 5 questions per quiz
        }
        for topic, data in topic_performance.items()
    ]
    quiz_by_topic.sort(key=lambda x: x["score"], reverse=True)
    
    # === CHAT TOPICS ===
    chat_messages = await db.chat_messages.find({
        "course_id": course_id,
        "student_id": student_id,
        "role": "user"
    }).to_list(1000)
    
    # Extract topics from questions
    all_text = " ".join([msg["content"].lower() for msg in chat_messages])
    words = re.findall(r'\b\w{5,}\b', all_text)
    word_counts = Counter(words)
    
    stop_words = {'what', 'which', 'where', 'when', 'would', 'could', 'should', 
                  'about', 'their', 'there', 'these', 'those', 'explain', 'understand'}
    
    most_discussed = [
        {"topic": word, "count": count}
        for word, count in word_counts.most_common(10)
        if word not in stop_words
    ]
    
    # === CONCEPT MASTERY ===
    concept_mastery_records = await db.concept_mastery.find({
        "course_id": course_id,
        "student_id": student_id
    }).to_list(1000)
    
    # Filter out generic concepts
    STOPWORDS = {
        'what', 'how', 'why', 'data', 'training', 'testing', 'test',
        'course', 'introduction', 'overview', 'student', 'learning',
        'concept', 'topic', 'material', 'process', 'method', 'system'
    }
    
    concept_heatmap = []
    for record in concept_mastery_records:
        concept = record["concept"]
        concept_lower = concept.lower()
        
        # Skip generic concepts
        if (concept_lower in STOPWORDS or 
            len(concept) < 4 or
            concept_lower.split()[0] in {'what', 'how', 'why'}):
            continue
        
        concept_heatmap.append({
            "concept": concept,
            "mastery": round(record["mastery_score"], 1),
            "interactions": record["interactions"],
            "students": 1  # Just this student
        })
    
    concept_heatmap.sort(key=lambda x: x["mastery"], reverse=True)
    
    # === LEARNING STREAK ===
    # Get activity over last 7 days
    now = datetime.utcnow()
    activity_streak = []
    
    for i in range(6, -1, -1):
        day_start = now - timedelta(days=i+1)
        day_end = now - timedelta(days=i)
        
        day_messages = [
            msg for msg in chat_messages
            if day_start <= msg["timestamp"] <= day_end
        ]
        
        day_quizzes = [
            attempt for attempt in quiz_attempts
            if day_start <= datetime.fromisoformat(attempt["completed_at"]) <= day_end
        ]
        
        activity_streak.append({
            "date": day_end.strftime("%m/%d"),
            "questions": len(day_messages),
            "quizzes": len(day_quizzes),
            "active": len(day_messages) > 0 or len(day_quizzes) > 0
        })
    
    return {
        "course_title": course.get("title", "Unknown"),
        "total_questions_asked": len(chat_messages),
        "total_quizzes": total_quizzes,
        "avg_quiz_score": avg_score,
        "quiz_scores": quiz_scores,
        "quiz_by_topic": quiz_by_topic,
        "most_discussed_topics": most_discussed,
        "concept_mastery": {
            "total_concepts": len(concept_heatmap),
            "heatmap_data": concept_heatmap
        },
        "activity_streak": activity_streak,
        "mastered_concepts": len([c for c in concept_heatmap if c["mastery"] >= 80]),
        "weak_concepts": [c["concept"] for c in concept_heatmap if c["mastery"] < 40][:5]
    }
