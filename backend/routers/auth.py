from fastapi import APIRouter, HTTPException, status
from models import UserCreate, User, Token, UserInDB
from auth_utils import get_password_hash, verify_password, create_access_token
from database import get_database
from datetime import timedelta
from dotenv import load_dotenv
import os

load_dotenv()

router = APIRouter()

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))

@router.post("/register", response_model=Token)
async def register(user: UserCreate):
    db = get_database()
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user_in_db = UserInDB(
        **user.model_dump(exclude={"password"}),
        hashed_password=get_password_hash(user.password)
    )
    
    user_dict = user_in_db.model_dump()
    await db.users.insert_one(user_dict)
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user_in_db.id, "email": user_in_db.email, "role": user_in_db.role},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    user_response = User(**user_in_db.model_dump(exclude={"hashed_password"}))
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@router.post("/login", response_model=Token)
async def login(email: str, password: str):
    db = get_database()
    
    # Find user
    user_dict = await db.users.find_one({"email": email})
    if not user_dict:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    user_in_db = UserInDB(**user_dict)
    
    # Verify password
    if not verify_password(password, user_in_db.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user_in_db.id, "email": user_in_db.email, "role": user_in_db.role},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    user_response = User(**user_in_db.model_dump(exclude={"hashed_password"}))
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)
