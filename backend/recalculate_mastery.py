"""
Recalculate all concept mastery scores with the new logic
"""
import asyncio
from database import get_database
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME", "brillia_db")

async def recalculate_all_mastery():
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DATABASE_NAME]
    print(f"Connected to MongoDB: {DATABASE_NAME}")
    
    # Get all concept mastery records
    records = await db.concept_mastery.find({}).to_list(None)
    print(f"Found {len(records)} concept mastery records")
    
    updated_count = 0
    for record in records:
        total_questions = record.get("total_questions", 0)
        correct_answers = record.get("correct_answers", 0)
        interactions = record.get("interactions", 0)
        
        # Recalculate mastery score using new logic
        if total_questions > 0:
            # Quiz accuracy percentage
            quiz_accuracy = (correct_answers / total_questions) * 100
            
            # Confidence factor based on number of questions
            if total_questions <= 2:
                confidence_factor = 0.4
            elif total_questions <= 4:
                confidence_factor = 0.6
            elif total_questions <= 6:
                confidence_factor = 0.8
            else:
                confidence_factor = 1.0
            
            # Apply confidence factor
            adjusted_quiz_score = quiz_accuracy * confidence_factor
            
            # Interaction bonus (max 15%)
            interaction_bonus = min(15, interactions * 1.5)
            
            # Final score
            new_mastery_score = min(100, adjusted_quiz_score + interaction_bonus)
        else:
            # No quiz data, score based on interactions only (max 30%)
            new_mastery_score = min(30, interactions * 3)
        
        # Update the record
        await db.concept_mastery.update_one(
            {"_id": record["_id"]},
            {"$set": {"mastery_score": new_mastery_score}}
        )
        
        updated_count += 1
        print(f"Updated {record['concept']}: {record.get('mastery_score', 0):.1f}% → {new_mastery_score:.1f}%")
    
    print(f"\n✅ Recalculated {updated_count} mastery scores!")
    
    # Close connection
    client.close()

if __name__ == "__main__":
    asyncio.run(recalculate_all_mastery())
