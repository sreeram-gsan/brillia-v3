from fastapi import APIRouter, HTTPException, Request
from database import get_database
from routers.auth_router import get_current_user

router = APIRouter()


@router.get("/me")
async def get_profile(request: Request):
    """
    Get current user's profile
    """
    try:
        user = await get_current_user(request)
        if not user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        db = get_database()
        user_data = await db.users.find_one({"id": user.id})
        
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Remove sensitive data
        user_data.pop('_id', None)
        user_data.pop('hashed_password', None)
        
        return user_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/me")
async def update_profile(request: Request):
    """
    Update current user's profile
    """
    try:
        user = await get_current_user(request)
        if not user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        data = await request.json()
        db = get_database()
        
        # Only allow updating certain fields
        allowed_fields = ['name', 'major']
        update_data = {}
        
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No valid fields to update")
        
        # Update user in database
        result = await db.users.update_one(
            {"id": user.id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            # Check if user exists
            existing_user = await db.users.find_one({"id": user.id})
            if not existing_user:
                raise HTTPException(status_code=404, detail="User not found")
        
        # Get updated user data
        updated_user = await db.users.find_one({"id": user.id})
        updated_user.pop('_id', None)
        updated_user.pop('hashed_password', None)
        
        return {
            "message": "Profile updated successfully",
            "user": updated_user
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/majors")
async def get_majors():
    """
    Get list of available majors
    """
    majors = [
        # STEM
        "Computer Science",
        "Computer Engineering",
        "Software Engineering",
        "Information Technology",
        "Data Science",
        "Artificial Intelligence",
        "Cybersecurity",
        "Mathematics",
        "Physics",
        "Chemistry",
        "Biology",
        "Biochemistry",
        "Biomedical Engineering",
        "Chemical Engineering",
        "Civil Engineering",
        "Mechanical Engineering",
        "Electrical Engineering",
        "Aerospace Engineering",
        "Environmental Science",
        "Geology",
        
        # Business & Economics
        "Business Administration",
        "Finance",
        "Accounting",
        "Economics",
        "Marketing",
        "Management",
        "International Business",
        "Entrepreneurship",
        "Supply Chain Management",
        "Human Resources",
        
        # Social Sciences
        "Psychology",
        "Sociology",
        "Anthropology",
        "Political Science",
        "International Relations",
        "Public Policy",
        "Social Work",
        "Criminal Justice",
        "Geography",
        
        # Humanities
        "English",
        "History",
        "Philosophy",
        "Literature",
        "Linguistics",
        "Foreign Languages",
        "Religious Studies",
        "Art History",
        
        # Arts & Design
        "Fine Arts",
        "Graphic Design",
        "Interior Design",
        "Architecture",
        "Music",
        "Theater",
        "Film Studies",
        "Fashion Design",
        
        # Health Sciences
        "Nursing",
        "Public Health",
        "Health Administration",
        "Nutrition",
        "Kinesiology",
        "Pharmacy",
        "Pre-Medicine",
        "Pre-Dental",
        
        # Communication & Media
        "Communication",
        "Journalism",
        "Media Studies",
        "Public Relations",
        "Advertising",
        
        # Education
        "Education",
        "Early Childhood Education",
        "Special Education",
        
        # Law & Policy
        "Pre-Law",
        "Legal Studies",
        "Public Administration",
        
        # Other
        "Agriculture",
        "Environmental Studies",
        "Urban Planning",
        "Library Science",
        "Hospitality Management",
        "Sports Management",
        "Undecided"
    ]
    
    return {"majors": sorted(majors)}
