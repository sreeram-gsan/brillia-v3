from fastapi import APIRouter, HTTPException, status
from database import get_database
from models import LearningCard, CardDismissRequest, StudentProgress, StudyPlan, Badge
from datetime import datetime, date
from typing import List, Dict, Any
import random
from ai_engine import generate_content_summary, generate_quick_quiz

router = APIRouter()

# Badge definitions
BADGES = [
    {
        "id": "first_steps",
        "name": "First Steps",
        "description": "Complete your first learning card",
        "icon": "🎯",
        "requirement": "complete_1_card",
        "xp_reward": 50
    },
    {
        "id": "quiz_master",
        "name": "Quiz Master",
        "description": "Answer 5 quiz cards correctly",
        "icon": "🧠",
        "requirement": "complete_5_quizzes",
        "xp_reward": 100
    },
    {
        "id": "week_warrior",
        "name": "Week Warrior",
        "description": "Maintain a 7-day study streak",
        "icon": "🔥",
        "requirement": "7_day_streak",
        "xp_reward": 150
    },
    {
        "id": "concept_crusher",
        "name": "Concept Crusher",
        "description": "Master 3 concepts (reach 80% mastery)",
        "icon": "💪",
        "requirement": "master_3_concepts",
        "xp_reward": 200
    },
    {
        "id": "dedicated_learner",
        "name": "Dedicated Learner",
        "description": "Complete 20 learning cards",
        "icon": "📚",
        "requirement": "complete_20_cards",
        "xp_reward": 250
    }
]

def calculate_level(xp: int) -> int:
    """Calculate level based on XP (100 XP per level)"""
    return max(1, xp // 100)

def get_level_name(level: int) -> str:
    """Get level name based on level number"""
    if level < 5:
        return "Beginner"
    elif level < 15:
        return "Intermediate"
    else:
        return "Advanced"

async def update_student_progress(student_id: str, course_id: str, xp_gain: int, activity_type: str):
    """Update student progress, XP, level, and check for badges"""
    db = get_database()
    
    # Get or create student progress
    progress = await db.student_progress.find_one({
        "student_id": student_id,
        "course_id": course_id
    })
    
    today = date.today().isoformat()
    
    if not progress:
        progress = {
            "id": f"progress-{student_id}-{course_id}",
            "student_id": student_id,
            "course_id": course_id,
            "xp": 0,
            "level": 1,
            "badges_earned": [],
            "study_streak": 0,
            "last_activity_date": None,
            "total_cards_completed": 0,
            "total_quizzes_passed": 0,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
    
    # Update XP
    progress["xp"] += xp_gain
    progress["level"] = calculate_level(progress["xp"])
    
    # Update streak
    last_date = progress.get("last_activity_date")
    if last_date == today:
        # Same day, don't update streak
        pass
    elif last_date and (datetime.fromisoformat(last_date) + __import__('datetime').timedelta(days=1)).date().isoformat() == today:
        # Consecutive day
        progress["study_streak"] += 1
    else:
        # Streak broken or first time
        progress["study_streak"] = 1
    
    progress["last_activity_date"] = today
    
    # Update activity counters
    if activity_type == "card_completed":
        progress["total_cards_completed"] += 1
    elif activity_type == "quiz_passed":
        progress["total_quizzes_passed"] += 1
    
    # Check for new badges
    new_badges = []
    
    # Get concept mastery count for badge checking
    concept_mastery_count = await db.concept_mastery.count_documents({
        "student_id": student_id,
        "course_id": course_id,
        "mastery_score": {"$gte": 80}
    })
    
    for badge in BADGES:
        if badge["id"] in progress.get("badges_earned", []):
            continue
        
        earned = False
        
        if badge["requirement"] == "complete_1_card" and progress["total_cards_completed"] >= 1:
            earned = True
        elif badge["requirement"] == "complete_5_quizzes" and progress["total_quizzes_passed"] >= 5:
            earned = True
        elif badge["requirement"] == "7_day_streak" and progress["study_streak"] >= 7:
            earned = True
        elif badge["requirement"] == "master_3_concepts" and concept_mastery_count >= 3:
            earned = True
        elif badge["requirement"] == "complete_20_cards" and progress["total_cards_completed"] >= 20:
            earned = True
        
        if earned:
            progress["badges_earned"].append(badge["id"])
            progress["xp"] += badge["xp_reward"]
            progress["level"] = calculate_level(progress["xp"])
            new_badges.append(badge)
    
    progress["updated_at"] = datetime.utcnow().isoformat()
    
    # Upsert progress
    await db.student_progress.update_one(
        {"student_id": student_id, "course_id": course_id},
        {"$set": progress},
        upsert=True
    )
    
    return progress, new_badges


@router.get("/cards/{course_id}")
async def get_learning_cards(course_id: str, student_id: str = "student-demo-001"):
    """
    Get personalized learning cards for topics that need mastery
    """
    db = get_database()
    
    # Get existing cards
    existing_cards = await db.learning_cards.find({
        "course_id": course_id,
        "student_id": student_id,
        "dismissed": False
    }).to_list(100)
    
    # Remove MongoDB _id from results
    for card in existing_cards:
        card.pop('_id', None)
    
    # If we have cards, return them
    if len(existing_cards) >= 3:
        return {"cards": existing_cards}
    
    # Otherwise, generate new cards from concepts needing mastery
    concept_mastery_records = await db.concept_mastery.find({
        "course_id": course_id,
        "student_id": student_id,
        "mastery_score": {"$lt": 60}  # Concepts needing mastery
    }).sort("mastery_score", 1).to_list(10)
    
    cards = []
    
    for record in concept_mastery_records[:5]:  # Top 5 topics needing focus
        concept = record["concept"]
        mastery = record["mastery_score"]
        
        # Get course materials related to this concept
        materials = await db.materials.find({
            "course_id": course_id
        }).to_list(100)
        
        # Generate content summary using AI
        try:
            summary = await generate_content_summary(concept, materials)
        except Exception as e:
            print(f"Error generating summary: {e}")
            summary = f"Review the concept of {concept}. Focus on understanding the fundamentals and key relationships."
        
        # Decide card type (70% review, 30% quiz)
        card_type = "review" if random.random() < 0.7 else "quiz"
        
        quiz_question = None
        if card_type == "quiz":
            try:
                quiz_question = await generate_quick_quiz(concept, materials)
            except Exception as e:
                print(f"Error generating quiz: {e}")
                card_type = "review"  # Fallback to review
        
        # Priority based on mastery (lower mastery = higher priority)
        priority = 1 if mastery < 40 else (2 if mastery < 50 else 3)
        
        card = {
            "id": f"card-{student_id}-{concept}-{datetime.utcnow().timestamp()}",
            "course_id": course_id,
            "student_id": student_id,
            "concept": concept,
            "card_type": card_type,
            "content_summary": summary,
            "quiz_question": quiz_question,
            "priority": priority,
            "dismissed": False,
            "completed_at": None,
            "created_at": datetime.utcnow().isoformat()
        }
        
        result = await db.learning_cards.insert_one(card)
        # Remove MongoDB _id before returning
        card.pop('_id', None)
        cards.append(card)
    
    return {"cards": cards}


@router.post("/cards/dismiss")
async def dismiss_card(request: CardDismissRequest, student_id: str = "student-demo-001"):
    """
    Dismiss a learning card (mark as completed)
    """
    db = get_database()
    
    card = await db.learning_cards.find_one({"id": request.card_id})
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Card not found"
        )
    
    # Update card status
    await db.learning_cards.update_one(
        {"id": request.card_id},
        {
            "$set": {
                "dismissed": True,
                "completed_at": datetime.utcnow().isoformat()
            }
        }
    )
    
    # Award XP based on card type and correctness
    xp_gain = 0
    activity_type = "card_completed"
    
    if card["card_type"] == "quiz":
        if request.correct:
            xp_gain = 30
            activity_type = "quiz_passed"
        else:
            xp_gain = 10  # Partial credit for attempt
    else:
        xp_gain = 20  # Review card
    
    # Update student progress
    progress, new_badges = await update_student_progress(
        student_id,
        card["course_id"],
        xp_gain,
        activity_type
    )
    
    return {
        "success": True,
        "xp_gained": xp_gain,
        "new_badges": new_badges,
        "current_xp": progress["xp"],
        "current_level": progress["level"]
    }


@router.get("/progress/{course_id}")
async def get_student_progress(course_id: str, student_id: str = "student-demo-001"):
    """
    Get student's gamification progress (XP, level, badges, streak)
    """
    db = get_database()
    
    progress = await db.student_progress.find_one({
        "student_id": student_id,
        "course_id": course_id
    })
    
    if not progress:
        progress = {
            "xp": 0,
            "level": 1,
            "badges_earned": [],
            "study_streak": 0,
            "total_cards_completed": 0,
            "total_quizzes_passed": 0
        }
    
    # Calculate level info
    xp = progress.get("xp", 0)
    level = calculate_level(xp)  # Recalculate level based on XP
    xp_for_current_level = (level - 1) * 100
    xp_for_next_level = level * 100
    xp_progress = xp - xp_for_current_level
    
    # Get earned badges with details
    earned_badges = []
    for badge_id in progress.get("badges_earned", []):
        badge = next((b for b in BADGES if b["id"] == badge_id), None)
        if badge:
            earned_badges.append(badge)
    
    # Get available badges (not yet earned)
    available_badges = [b for b in BADGES if b["id"] not in progress.get("badges_earned", [])]
    
    return {
        "xp": xp,
        "level": level,
        "level_name": get_level_name(level),
        "xp_for_next_level": xp_for_next_level,
        "xp_progress": xp_progress,
        "xp_needed": xp_for_next_level - xp,
        "study_streak": progress.get("study_streak", 0),
        "total_cards_completed": progress.get("total_cards_completed", 0),
        "total_quizzes_passed": progress.get("total_quizzes_passed", 0),
        "badges_earned": earned_badges,
        "available_badges": available_badges[:3]  # Show next 3 badges to earn
    }


@router.get("/study-plan/{course_id}")
async def get_study_plan(course_id: str, student_id: str = "student-demo-001"):
    """
    Generate personalized study plan based on topics needing mastery
    """
    db = get_database()
    
    # Get concepts needing mastery
    concepts_to_master = await db.concept_mastery.find({
        "course_id": course_id,
        "student_id": student_id,
        "mastery_score": {"$lt": 60}
    }).sort("mastery_score", 1).to_list(10)
    
    if not concepts_to_master:
        return {
            "daily_focus": "Great job! All concepts are well understood. Try exploring advanced topics!",
            "recommended_topics": [],
            "total_estimated_time": 0
        }
    
    # Pick daily focus (concept needing most attention)
    daily_focus = concepts_to_master[0]["concept"] if concepts_to_master else "Review course materials"
    
    # Build recommended topics
    recommended_topics = []
    for record in concepts_to_master[:5]:
        mastery = record["mastery_score"]
        
        # Estimate time based on mastery level
        if mastery < 30:
            estimated_time = 45
        elif mastery < 50:
            estimated_time = 30
        else:
            estimated_time = 20
        
        # Priority
        priority = "High" if mastery < 40 else ("Medium" if mastery < 50 else "Low")
        
        recommended_topics.append({
            "concept": record["concept"],
            "current_mastery": round(mastery, 1),
            "estimated_time": estimated_time,
            "priority": priority,
            "recommended_action": "Take a quiz" if mastery < 40 else "Review materials"
        })
    
    total_time = sum(t["estimated_time"] for t in recommended_topics)
    
    return {
        "daily_focus": daily_focus,
        "recommended_topics": recommended_topics,
        "total_estimated_time": total_time
    }
