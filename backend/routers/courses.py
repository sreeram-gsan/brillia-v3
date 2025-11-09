from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from models import CourseCreate, Course, EnrollmentRequest, Enrollment
from auth_utils import get_current_user
from database import get_database

router = APIRouter()

@router.post("/", response_model=Course)
async def create_course(course: Course):
    db = get_database()
    
    course_dict = course.model_dump()
    await db.courses.insert_one(course_dict)
    
    return course

@router.get("/", response_model=List[Course])
async def get_courses():
    db = get_database()
    
    # Get all courses
    courses = await db.courses.find({}).to_list(100)
    
    return [Course(**course) for course in courses]

@router.get("/my-courses", response_model=List[Course])
async def get_my_courses(current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    if current_user.get("role") == "student":
        # Get enrolled courses
        enrollments = await db.enrollments.find({"student_id": current_user["sub"]}).to_list(100)
        course_ids = [e["course_id"] for e in enrollments]
        courses = await db.courses.find({"id": {"$in": course_ids}}).to_list(100)
    else:
        # Get courses created by this professor
        courses = await db.courses.find({"professor_id": current_user["sub"]}).to_list(100)
    
    return [Course(**course) for course in courses]

@router.get("/{course_id}", response_model=Course)
async def get_course(course_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    course = await db.courses.find_one({"id": course_id})
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    return Course(**course)

@router.post("/enroll", response_model=Enrollment)
async def enroll_in_course(enrollment: EnrollmentRequest, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can enroll in courses"
        )
    
    db = get_database()
    
    # Check if course exists
    course = await db.courses.find_one({"id": enrollment.course_id})
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Check if already enrolled
    existing = await db.enrollments.find_one({
        "student_id": current_user["sub"],
        "course_id": enrollment.course_id
    })
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already enrolled in this course"
        )
    
    # Create enrollment
    enrollment_obj = Enrollment(
        student_id=current_user["sub"],
        course_id=enrollment.course_id
    )
    
    enrollment_dict = enrollment_obj.model_dump()
    await db.enrollments.insert_one(enrollment_dict)
    
    # Update student count
    await db.courses.update_one(
        {"id": enrollment.course_id},
        {"$inc": {"student_count": 1}}
    )
    
    return enrollment_obj

@router.delete("/{course_id}")
async def delete_course(course_id: str):
    db = get_database()
    
    course = await db.courses.find_one({"id": course_id})
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    await db.courses.delete_one({"id": course_id})
    await db.course_materials.delete_many({"course_id": course_id})
    await db.enrollments.delete_many({"course_id": course_id})
    
    return {"message": "Course deleted successfully"}
