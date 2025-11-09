from fastapi import APIRouter, Depends, HTTPException, status
from models import AnalyticsData
from auth_utils import get_current_user
from database import get_database
from collections import Counter
import re

router = APIRouter()

@router.get("/course/{course_id}")
async def get_course_analytics(course_id: str):
    """
    Get comprehensive analytics for a course including chat and quiz data
    """
    db = get_database()
    
    # Get course info
    course = await db.courses.find_one({"id": course_id})
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Get all chat messages for this course
    all_messages = await db.chat_messages.find({"course_id": course_id}).to_list(1000)
    
    # Get all quiz attempts for this course
    quiz_attempts = await db.quiz_attempts.find({"course_id": course_id}).to_list(1000)
    
    # === CHAT ANALYTICS ===
    user_messages = [msg for msg in all_messages if msg["role"] == "user"]
    total_questions = len(user_messages)
    
    # Active students (unique student IDs from both chat and quizzes)
    chat_students = set(msg["student_id"] for msg in all_messages)
    quiz_students = set(attempt["student_id"] for attempt in quiz_attempts)
    active_students = len(chat_students | quiz_students)
    
    # Extract common topics from chat
    all_text = " ".join([msg["content"].lower() for msg in user_messages])
    words = re.findall(r'\b\w{4,}\b', all_text)
    word_counts = Counter(words)
    
    stop_words = {'what', 'how', 'why', 'when', 'where', 'which', 'this', 'that', 'with', 'from', 'about', 'could', 'would', 'should', 'help', 'explain', 'understand', 'please', 'thanks', 'thank', 'quiz', 'test'}
    common_topics = [
        {"topic": word, "count": count}
        for word, count in word_counts.most_common(10)
        if word not in stop_words
    ]
    
    # === QUIZ ANALYTICS ===
    total_quizzes = len(quiz_attempts)
    
    # Average quiz score
    avg_score = 0
    if quiz_attempts:
        total_score = sum(attempt["score"] for attempt in quiz_attempts)
        total_possible = sum(attempt["total_questions"] for attempt in quiz_attempts)
        avg_score = round((total_score / total_possible) * 100) if total_possible > 0 else 0
    
    # Quiz performance by topic
    topic_performance = {}
    for attempt in quiz_attempts:
        topic = attempt.get("topic") or "General"
        if topic not in topic_performance:
            topic_performance[topic] = {"correct": 0, "total": 0}
        
        topic_performance[topic]["correct"] += attempt["score"]
        topic_performance[topic]["total"] += attempt["total_questions"]
    
    quiz_topics = [
        {
            "topic": topic,
            "avg_score": round((data["correct"] / data["total"]) * 100) if data["total"] > 0 else 0,
            "attempts": data["total"] // 5  # Assuming 5 questions per quiz
        }
        for topic, data in topic_performance.items()
    ]
    
    # Struggling topics (lowest quiz scores)
    struggling_topics = sorted(quiz_topics, key=lambda x: x["avg_score"])[:5]
    
    # Most common wrong answers
    wrong_answers_topics = []
    for attempt in quiz_attempts:
        for answer in attempt.get("answers", []):
            if not answer.get("is_correct", True):
                question_topic = answer.get("topic", "Unknown")
                wrong_answers_topics.append(question_topic)
    
    wrong_answer_counts = Counter(wrong_answers_topics)
    confusion_points = [
        f"{topic} ({count} incorrect answers)"
        for topic, count in wrong_answer_counts.most_common(5)
    ]
    
    # === ENGAGEMENT METRICS ===
    from datetime import datetime, timedelta
    now = datetime.utcnow()
    engagement_trend = []
    
    for i in range(6, -1, -1):
        day_start = now - timedelta(days=i+1)
        day_end = now - timedelta(days=i)
        
        day_messages = [
            msg for msg in all_messages
            if day_start <= msg["timestamp"] <= day_end
        ]
        
        day_quizzes = [
            attempt for attempt in quiz_attempts
            if day_start <= datetime.fromisoformat(attempt["completed_at"]) <= day_end
        ]
        
        engagement_trend.append({
            "date": day_end.strftime("%m/%d"),
            "questions": len([m for m in day_messages if m["role"] == "user"]),
            "quizzes": len(day_quizzes)
        })
    
    return {
        "total_questions": total_questions,
        "active_students": active_students,
        "common_topics": common_topics,
        "confusion_points": confusion_points if confusion_points else ["No struggling topics yet"],
        "engagement_trend": engagement_trend,
        "total_quizzes": total_quizzes,
        "avg_quiz_score": avg_score,
        "quiz_topics": quiz_topics,
        "struggling_topics": [t["topic"] for t in struggling_topics] if struggling_topics else []
    }
