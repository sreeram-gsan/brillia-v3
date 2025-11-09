"""
Script to populate sample data for personalized learning demo
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import random

MONGO_URL = "mongodb://localhost:27017/"
DATABASE_NAME = "brillia_db"

async def populate_sample_data():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DATABASE_NAME]
    
    student_id = "student-demo-001"
    course_id = "course-id-001"
    
    print("🎯 Populating sample data for personalized learning...")
    
    # 1. Create concept mastery records (mix of strong and weak concepts)
    concepts_data = [
        {"concept": "Algorithms", "mastery": 35, "interactions": 8, "correct": 2, "total": 6},
        {"concept": "Data Structures", "mastery": 42, "interactions": 12, "correct": 5, "total": 10},
        {"concept": "Binary Search", "mastery": 28, "interactions": 5, "correct": 1, "total": 4},
        {"concept": "Sorting Algorithms", "mastery": 55, "interactions": 15, "correct": 8, "total": 12},
        {"concept": "Recursion", "mastery": 38, "interactions": 10, "correct": 3, "total": 8},
        {"concept": "Arrays", "mastery": 72, "interactions": 20, "correct": 14, "total": 18},
        {"concept": "Linked Lists", "mastery": 48, "interactions": 11, "correct": 5, "total": 9},
        {"concept": "Hash Tables", "mastery": 85, "interactions": 25, "correct": 22, "total": 24},
        {"concept": "Trees", "mastery": 58, "interactions": 14, "correct": 8, "total": 13},
        {"concept": "Graph Algorithms", "mastery": 32, "interactions": 7, "correct": 2, "total": 5},
    ]
    
    # Clear existing concept mastery for this student/course
    await db.concept_mastery.delete_many({"student_id": student_id, "course_id": course_id})
    
    for concept_data in concepts_data:
        concept_record = {
            "id": f"concept-{student_id}-{concept_data['concept']}",
            "course_id": course_id,
            "student_id": student_id,
            "concept": concept_data["concept"],
            "mastery_score": concept_data["mastery"],
            "interactions": concept_data["interactions"],
            "correct_answers": concept_data["correct"],
            "total_questions": concept_data["total"],
            "last_interaction": (datetime.utcnow() - timedelta(days=random.randint(0, 7))).isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        result = await db.concept_mastery.insert_one(concept_record)
        # Remove MongoDB's _id from the record
        del concept_record['_id'] if '_id' in concept_record else None
    
    print(f"✅ Created {len(concepts_data)} concept mastery records")
    
    # 2. Create student progress with some XP and achievements
    await db.student_progress.delete_many({"student_id": student_id, "course_id": course_id})
    
    progress_record = {
        "id": f"progress-{student_id}-{course_id}",
        "student_id": student_id,
        "course_id": course_id,
        "xp": 180,  # Level 1 (almost level 2)
        "level": 1,
        "badges_earned": ["first_steps"],  # Has earned one badge
        "study_streak": 3,  # 3 day streak
        "last_activity_date": datetime.utcnow().date().isoformat(),
        "total_cards_completed": 5,
        "total_quizzes_passed": 2,
        "created_at": (datetime.utcnow() - timedelta(days=7)).isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    await db.student_progress.insert_one(progress_record)
    print(f"✅ Created student progress: Level {progress_record['level']}, {progress_record['xp']} XP, {progress_record['study_streak']} day streak")
    
    # 3. Create some quiz attempts for topic performance
    await db.quiz_attempts.delete_many({"student_id": student_id, "course_id": course_id})
    
    quiz_attempts = [
        {"topic": "Algorithms", "score": 2, "total": 5, "days_ago": 2},
        {"topic": "Data Structures", "score": 3, "total": 5, "days_ago": 1},
        {"topic": "Binary Search", "score": 1, "total": 5, "days_ago": 3},
        {"topic": "Recursion", "score": 2, "total": 5, "days_ago": 1},
    ]
    
    for attempt in quiz_attempts:
        quiz_record = {
            "id": f"quiz-{student_id}-{attempt['topic']}-{random.randint(1000, 9999)}",
            "quiz_id": f"quiz-{random.randint(1000, 9999)}",
            "student_id": student_id,
            "course_id": course_id,
            "score": attempt["score"],
            "total_questions": attempt["total"],
            "topic": attempt["topic"],
            "answers": [],
            "completed_at": (datetime.utcnow() - timedelta(days=attempt["days_ago"])).isoformat()
        }
        await db.quiz_attempts.insert_one(quiz_record)
    
    print(f"✅ Created {len(quiz_attempts)} quiz attempts")
    
    # 4. Create some chat messages for engagement
    await db.chat_messages.delete_many({"student_id": student_id, "course_id": course_id})
    
    chat_messages = [
        {"content": "What is the difference between arrays and linked lists?", "days_ago": 2},
        {"content": "Can you explain how binary search works?", "days_ago": 3},
        {"content": "How do I implement recursion?", "days_ago": 1},
        {"content": "What are the time complexities of sorting algorithms?", "days_ago": 1},
        {"content": "Explain hash tables and their use cases", "days_ago": 4},
    ]
    
    session_id = f"session-{student_id}-{course_id}"
    
    for msg in chat_messages:
        chat_record = {
            "id": f"msg-{random.randint(100000, 999999)}",
            "session_id": session_id,
            "student_id": student_id,
            "course_id": course_id,
            "role": "user",
            "content": msg["content"],
            "timestamp": datetime.utcnow() - timedelta(days=msg["days_ago"]),
            "understanding_level": None
        }
        await db.chat_messages.insert_one(chat_record)
    
    print(f"✅ Created {len(chat_messages)} chat messages")
    
    print("\n🎉 Sample data population complete!")
    print(f"📊 Summary:")
    print(f"   - 10 concepts tracked (4 need mastery, 6 proficient/mastered)")
    print(f"   - Student at Level 1 with 180 XP (80 XP to next level)")
    print(f"   - 3 day study streak")
    print(f"   - 1 badge earned (First Steps)")
    print(f"   - 5 cards completed, 2 quizzes passed")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(populate_sample_data())
