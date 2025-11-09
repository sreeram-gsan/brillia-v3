"""
Migration script to move existing student data to a specific approved student
Specifically for moving data to sreeram2910@gmail.com
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from dotenv import load_dotenv
import os
import uuid

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME", "brillia_db")
STUDENT_EMAIL = "sreeram2910@gmail.com"
STUDENT_NAME = "Sreeram"

async def migrate_student_data():
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DATABASE_NAME]
    print(f"Connected to MongoDB: {DATABASE_NAME}")
    
    print(f"Starting migration for {STUDENT_EMAIL}...")
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": STUDENT_EMAIL})
    
    if existing_user:
        print(f"✓ User already exists with ID: {existing_user['id']}")
        student_id = existing_user['id']
    else:
        # Create new approved student user
        student_id = str(uuid.uuid4())
        new_user = {
            "id": student_id,
            "email": STUDENT_EMAIL,
            "name": STUDENT_NAME,
            "picture": None,
            "role": "student",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
        print(f"✓ Created new user with ID: {student_id}")
    
    # Check for existing waitlist entry
    waitlist_entry = await db.waitlist.find_one({"email": STUDENT_EMAIL})
    
    if waitlist_entry:
        # Update to approved status
        await db.waitlist.update_one(
            {"email": STUDENT_EMAIL},
            {
                "$set": {
                    "status": "approved",
                    "approved_by": "system_migration",
                    "approved_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        print(f"✓ Updated waitlist entry to approved")
    else:
        # Create approved waitlist entry for record keeping
        new_entry = {
            "id": str(uuid.uuid4()),
            "email": STUDENT_EMAIL,
            "name": STUDENT_NAME,
            "picture": None,
            "institution": None,
            "invitation_code": None,
            "status": "approved",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "approved_by": "system_migration",
            "approved_at": datetime.now(timezone.utc).isoformat()
        }
        await db.waitlist.insert_one(new_entry)
        print(f"✓ Created approved waitlist entry")
    
    # Update all student-related data collections with this student_id
    # This assumes data might exist with a different student_id or needs to be linked
    
    # Update concept_mastery
    concept_result = await db.concept_mastery.update_many(
        {"student_id": {"$ne": student_id}},
        {"$set": {"student_id": student_id}}
    )
    print(f"✓ Updated {concept_result.modified_count} concept_mastery records")
    
    # Update student_progress
    progress_result = await db.student_progress.update_many(
        {"student_id": {"$ne": student_id}},
        {"$set": {"student_id": student_id}}
    )
    print(f"✓ Updated {progress_result.modified_count} student_progress records")
    
    # Update learning_cards
    cards_result = await db.learning_cards.update_many(
        {"student_id": {"$ne": student_id}},
        {"$set": {"student_id": student_id}}
    )
    print(f"✓ Updated {cards_result.modified_count} learning_cards records")
    
    # Update chat history
    chat_result = await db.chat_messages.update_many(
        {"student_id": {"$ne": student_id}},
        {"$set": {"student_id": student_id}}
    )
    print(f"✓ Updated {chat_result.modified_count} chat_messages records")
    
    # Update quiz attempts
    quiz_result = await db.quiz_attempts.update_many(
        {"student_id": {"$ne": student_id}},
        {"$set": {"student_id": student_id}}
    )
    print(f"✓ Updated {quiz_result.modified_count} quiz_attempts records")
    
    print(f"\n✅ Migration completed successfully!")
    print(f"Student ID: {student_id}")
    print(f"Email: {STUDENT_EMAIL}")
    print(f"Status: Approved")
    
    # Close connection
    client.close()
    print("Disconnected from MongoDB")

if __name__ == "__main__":
    asyncio.run(migrate_student_data())
