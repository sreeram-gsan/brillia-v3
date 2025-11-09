from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid

class UserRole(str, Enum):
    PROFESSOR = "professor"
    STUDENT = "student"

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: UserRole

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "email": "professor@university.edu",
                "name": "Dr. Smith",
                "role": "professor",
                "created_at": "2024-01-01T00:00:00"
            }
        }

class UserInDB(User):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class CourseBase(BaseModel):
    title: str
    description: str
    objectives: Optional[List[str]] = []

class CourseCreate(CourseBase):
    pass

class Course(CourseBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    professor_id: str
    professor_name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    student_count: int = 0

class CourseMaterial(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    course_id: str
    title: str
    content: str
    material_type: str  # syllabus, lecture, assignment, notes
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    student_id: str
    course_id: str
    role: str  # user or assistant
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    understanding_level: Optional[str] = None  # confused, partial, clear

class ChatRequest(BaseModel):
    course_id: str
    message: str
    session_id: Optional[str] = None
    student_id: Optional[str] = None

class ChatResponse(BaseModel):
    session_id: str
    message: str
    timestamp: datetime
    key_topics: Optional[List[str]] = []
    concept_graph: Optional[List[Dict[str, Any]]] = []
    markdown_content: Optional[str] = None
    sources: Optional[List[str]] = []
    student_major: Optional[str] = None

class EnrollmentRequest(BaseModel):
    course_id: str

class Enrollment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    course_id: str
    enrolled_at: datetime = Field(default_factory=datetime.utcnow)

class AnalyticsData(BaseModel):
    total_questions: int
    active_students: int
    common_topics: List[Dict[str, Any]]
    confusion_points: List[str]
    engagement_trend: List[Dict[str, Any]]

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: int  # Index of correct option (0-3)
    explanation: str
    topic: str

class QuizRequest(BaseModel):
    course_id: str
    topic: Optional[str] = None  # Specific topic or None for general quiz
    num_questions: int = 5

class QuizResponse(BaseModel):
    quiz_id: str
    questions: List[QuizQuestion]
    course_title: str

class QuizAttempt(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    quiz_id: str
    student_id: str
    course_id: str
    score: int
    total_questions: int
    topic: Optional[str] = None
    answers: List[Dict[str, Any]]  # List of {question_index, selected_answer, is_correct}
    completed_at: datetime = Field(default_factory=datetime.utcnow)

class QuizSubmission(BaseModel):
    quiz_id: str
    course_id: str
    score: int
    total_questions: int
    topic: Optional[str] = None
    answers: List[Dict[str, Any]]

class ConceptMastery(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    course_id: str
    student_id: str
    concept: str
    mastery_score: float  # 0-100
    interactions: int  # Number of interactions with this concept
    correct_answers: int  # Quiz questions answered correctly
    total_questions: int  # Total quiz questions on this concept
    last_interaction: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Badge(BaseModel):
    id: str
    name: str
    description: str
    icon: str  # Emoji or icon identifier
    requirement: str
    xp_reward: int

class StudentProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    course_id: str
    xp: int = 0
    level: int = 1
    badges_earned: List[str] = []  # List of badge IDs
    study_streak: int = 0  # Consecutive days
    last_activity_date: Optional[str] = None  # ISO date string
    total_cards_completed: int = 0
    total_quizzes_passed: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class LearningCard(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    course_id: str
    student_id: str
    concept: str
    card_type: str  # "review" or "quiz"
    content_summary: str
    quiz_question: Optional[Dict[str, Any]] = None  # For quiz cards
    priority: int  # 1 (high) to 3 (low)
    dismissed: bool = False
    completed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CardDismissRequest(BaseModel):
    card_id: str
    correct: Optional[bool] = None  # For quiz cards

class StudyPlan(BaseModel):
    daily_focus: str  # Main topic to focus today
    recommended_topics: List[Dict[str, Any]]  # [{concept, estimated_time, priority}]
    total_estimated_time: int  # In minutes

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "student"  # "teacher" or "student"
    major: Optional[str] = None  # Student's major/field of study
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class WaitlistEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    picture: Optional[str] = None
    institution: Optional[str] = None
    invitation_code: Optional[str] = None
    status: str = "pending"  # "pending", "approved", "rejected"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None

