from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from routers import auth, courses, chat, analytics, materials, quiz, student_analytics, personalized_learning, auth_router, voice_chat, profile
from database import connect_db, close_db

app = FastAPI(title="Brillia.ai API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database events
@app.on_event("startup")
async def startup_event():
    await connect_db()

@app.on_event("shutdown")
async def shutdown_event():
    await close_db()

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(courses.router, prefix="/api/courses", tags=["courses"])
app.include_router(materials.router, prefix="/api/materials", tags=["materials"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(quiz.router, prefix="/api/quiz", tags=["quiz"])
app.include_router(student_analytics.router, prefix="/api/student", tags=["student-analytics"])
app.include_router(personalized_learning.router, prefix="/api/personalized", tags=["personalized-learning"])
app.include_router(auth_router.router, prefix="/api/auth", tags=["authentication"])
app.include_router(voice_chat.router, prefix="/api/voice", tags=["voice-chat"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "Brillia.ai API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
