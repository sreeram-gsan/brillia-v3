from fastapi import APIRouter, HTTPException, Request, Response, status, Header
from database import get_database
from models import User, UserSession
from datetime import datetime, timedelta, timezone
from typing import Optional
import httpx
import uuid

router = APIRouter()

ALLOWED_TEACHER_EMAIL = "brilliateaching@gmail.com"
EMERGENT_AUTH_API = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"


async def get_current_user(request: Request) -> Optional[User]:
    """
    Get current user from session token (cookie or Authorization header)
    """
    db = get_database()
    
    # Try to get session_token from cookie first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.replace("Bearer ", "")
    
    if not session_token:
        return None
    
    # Check if session exists and is valid
    session = await db.user_sessions.find_one({
        "session_token": session_token,
        "expires_at": {"$gt": datetime.now(timezone.utc).isoformat()}
    })
    
    if not session:
        return None
    
    # Get user
    user = await db.users.find_one({"id": session["user_id"]})
    if not user:
        return None
    
    user.pop('_id', None)
    return User(**user)


@router.post("/process-admin-session")
async def process_admin_session(
    request: Request,
    response: Response,
    x_session_id: str = Header(..., alias="X-Session-ID")
):
    """
    Process session_id from Emergent Auth and create admin user session
    """
    db = get_database()
    
    # Call Emergent Auth API to get user data
    try:
        async with httpx.AsyncClient() as client:
            auth_response = await client.get(
                EMERGENT_AUTH_API,
                headers={"X-Session-ID": x_session_id},
                timeout=10.0
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid session ID"
                )
            
            user_data = auth_response.json()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to validate session: {str(e)}"
        )
    
    # Check if this is the allowed admin email
    email = user_data.get("email")
    if email != ALLOWED_TEACHER_EMAIL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only brilliateaching@gmail.com is allowed to access admin features"
        )
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": email})
    
    if existing_user:
        user_id = existing_user["id"]
        # Update role to admin if it's not already
        await db.users.update_one(
            {"email": email},
            {"$set": {"role": "admin"}}
        )
    else:
        # Create new user with admin role
        user = User(
            email=email,
            name=user_data.get("name", ""),
            picture=user_data.get("picture"),
            role="admin"
        )
        user_dict = user.dict()
        await db.users.insert_one(user_dict)
        user_id = user.id
    
    # Create session
    session_token = user_data.get("session_token")
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    session = UserSession(
        user_id=user_id,
        session_token=session_token,
        expires_at=expires_at
    )
    
    session_dict = session.dict()
    session_dict["expires_at"] = session_dict["expires_at"].isoformat()
    session_dict["created_at"] = session_dict["created_at"].isoformat()
    
    await db.user_sessions.insert_one(session_dict)
    
    # Set httpOnly cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,  # 7 days
        path="/"
    )
    
    # Get user data to return
    user = await db.users.find_one({"id": user_id})
    user.pop('_id', None)
    
    return {
        "user": User(**user).dict(),
        "session_token": session_token
    }


@router.post("/process-session")
async def process_session(
    request: Request,
    response: Response,
    x_session_id: str = Header(..., alias="X-Session-ID")
):
    """
    Process session_id from Emergent Auth and create teacher user session
    """
    db = get_database()
    
    # Call Emergent Auth API to get user data
    try:
        async with httpx.AsyncClient() as client:
            auth_response = await client.get(
                EMERGENT_AUTH_API,
                headers={"X-Session-ID": x_session_id},
                timeout=10.0
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid session ID"
                )
            
            user_data = auth_response.json()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to validate session: {str(e)}"
        )
    
    # Check if this is the allowed teacher email
    email = user_data.get("email")
    if email != ALLOWED_TEACHER_EMAIL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only brilliateaching@gmail.com is allowed to access teacher features"
        )
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": email})
    
    if existing_user:
        user_id = existing_user["id"]
    else:
        # Create new user
        user = User(
            email=email,
            name=user_data.get("name", ""),
            picture=user_data.get("picture"),
            role="teacher"
        )
        user_dict = user.dict()
        await db.users.insert_one(user_dict)
        user_id = user.id
    
    # Create session
    session_token = user_data.get("session_token")
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    session = UserSession(
        user_id=user_id,
        session_token=session_token,
        expires_at=expires_at
    )
    
    session_dict = session.dict()
    session_dict["expires_at"] = session_dict["expires_at"].isoformat()
    session_dict["created_at"] = session_dict["created_at"].isoformat()
    
    await db.user_sessions.insert_one(session_dict)
    
    # Set httpOnly cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,  # 7 days
        path="/"
    )
    
    # Get user data to return
    user = await db.users.find_one({"id": user_id})
    user.pop('_id', None)
    
    return {
        "user": User(**user).dict(),
        "session_token": session_token
    }


@router.get("/me")
async def get_me(request: Request):
    """
    Get current authenticated user
    """
    user = await get_current_user(request)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    return user.dict()


@router.post("/logout")
async def logout(request: Request, response: Response):
    """
    Logout current user
    """
    db = get_database()
    
    # Get session token
    session_token = request.cookies.get("session_token")
    
    if session_token:
        # Delete session from database
        await db.user_sessions.delete_one({"session_token": session_token})
    
    # Clear cookie
    response.delete_cookie(
        key="session_token",
        path="/",
        secure=True,
        samesite="none"
    )
    
    return {"message": "Logged out successfully"}


@router.post("/process-student-session")
async def process_student_session(
    request: Request,
    response: Response,
    x_session_id: str = Header(..., alias="X-Session-ID")
):
    """
    Process session_id from Emergent Auth for student waitlist
    """
    db = get_database()
    
    # Call Emergent Auth API to get user data
    try:
        async with httpx.AsyncClient() as client:
            auth_response = await client.get(
                EMERGENT_AUTH_API,
                headers={"X-Session-ID": x_session_id},
                timeout=10.0
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid session ID"
                )
            
            user_data = auth_response.json()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to validate session: {str(e)}"
        )
    
    email = user_data.get("email")
    name = user_data.get("name", "")
    picture = user_data.get("picture")
    
    # Check if user already exists and is approved
    existing_user = await db.users.find_one({"email": email, "role": "student"})
    
    if existing_user:
        # User exists, create session
        session_token = user_data.get("session_token")
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        session = {
            "id": str(uuid.uuid4()),
            "user_id": existing_user["id"],
            "session_token": session_token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.user_sessions.insert_one(session)
        
        # Set cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7 * 24 * 60 * 60,
            path="/"
        )
        
        existing_user.pop('_id', None)
        return {
            "status": "approved",
            "user": existing_user,
            "session_token": session_token
        }
    
    # Check if already in waitlist
    waitlist_entry = await db.waitlist.find_one({"email": email})
    
    if waitlist_entry:
        # Update last activity
        await db.waitlist.update_one(
            {"email": email},
            {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        waitlist_entry.pop('_id', None)
        return {
            "status": "waitlist",
            "waitlist": waitlist_entry
        }
    
    # Add to waitlist
    new_entry = {
        "id": str(uuid.uuid4()),
        "email": email,
        "name": name,
        "picture": picture,
        "institution": None,
        "invitation_code": None,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "approved_by": None,
        "approved_at": None
    }
    
    # Ensure unique index on email
    await db.waitlist.create_index("email", unique=True)
    
    await db.waitlist.insert_one(new_entry)
    new_entry.pop('_id', None)
    
    return {
        "status": "waitlist",
        "waitlist": new_entry
    }


@router.get("/waitlist")
async def get_waitlist(request: Request):
    """
    Get all waitlist entries (admin only)
    """
    db = get_database()
    
    # Check if user is admin
    user = await get_current_user(request)
    if not user or user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Get all waitlist entries
    entries = await db.waitlist.find({}).sort("created_at", -1).to_list(1000)
    
    # Remove MongoDB _id
    for entry in entries:
        entry.pop('_id', None)
    
    return {"waitlist": entries}


@router.post("/waitlist/{entry_id}/approve")
async def approve_waitlist(entry_id: str, request: Request):
    """
    Approve a waitlist entry and create student user
    """
    db = get_database()
    
    # Check if user is admin
    user = await get_current_user(request)
    if not user or user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Get waitlist entry
    entry = await db.waitlist.find_one({"id": entry_id})
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Waitlist entry not found"
        )
    
    # Create student user
    student_user = {
        "id": str(uuid.uuid4()),
        "email": entry["email"],
        "name": entry["name"],
        "picture": entry.get("picture"),
        "role": "student",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(student_user)
    
    # Update waitlist status
    await db.waitlist.update_one(
        {"id": entry_id},
        {
            "$set": {
                "status": "approved",
                "approved_by": user.email,
                "approved_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"message": "Student approved successfully", "user_id": student_user["id"]}


@router.post("/waitlist/{entry_id}/reject")
async def reject_waitlist(entry_id: str, request: Request):
    """
    Reject a waitlist entry
    """
    db = get_database()
    
    # Check if user is admin
    user = await get_current_user(request)
    if not user or user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Update waitlist status
    result = await db.waitlist.update_one(
        {"id": entry_id},
        {
            "$set": {
                "status": "rejected",
                "approved_by": user.email,
                "approved_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Waitlist entry not found"
        )
    
    return {"message": "Student rejected"}
