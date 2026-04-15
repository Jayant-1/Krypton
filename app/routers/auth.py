"""
app/routers/auth.py

POST /api/auth/signup  — create new account
POST /api/auth/login   — email + password → JWT token
GET  /api/auth/me      — return current user from token
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.db_models import User, UserProfile
from app.services.auth_service import create_access_token, hash_password, verify_password, decode_token

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Auth"])
bearer = HTTPBearer(auto_error=False)


# ── Request / Response schemas ────────────────────────────────────────────────

class SignupRequest(BaseModel):
    email:    str = Field(..., min_length=5, max_length=255)
    username: str = Field(..., min_length=2, max_length=50)
    password: str = Field(..., min_length=6, max_length=100)


class LoginRequest(BaseModel):
    email:    str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user_id:      int
    email:        str
    username:     str


class MeResponse(BaseModel):
    user_id:  int
    email:    str
    username: str


# ── Helpers ───────────────────────────────────────────────────────────────────

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
) -> dict:
    """Dependency — decode JWT and return payload. Raises 401 if invalid."""
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    return payload


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/auth/signup", response_model=AuthResponse, status_code=201)
async def signup(request: SignupRequest, db: AsyncSession = Depends(get_db)):
    """Create a new account and return a JWT token immediately."""
    # Check email uniqueness
    existing = await db.scalar(select(User).where(User.email == request.email.lower()))
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    existing_username = await db.scalar(select(User).where(User.username == request.username))
    if existing_username:
        raise HTTPException(status_code=409, detail="Username already taken")

    user = User(
        email=request.email.lower(),
        username=request.username,
        hashed_password=hash_password(request.password),
    )
    db.add(user)
    await db.flush()   # get user.id

    # Create default empty profile
    profile = UserProfile(user_id=user.id)
    db.add(profile)

    await db.commit()
    await db.refresh(user)

    token = create_access_token(user.id, user.email, user.username)
    logger.info("New user registered: %s (id=%d)", user.email, user.id)
    return AuthResponse(
        access_token=token,
        user_id=user.id,
        email=user.email,
        username=user.username,
    )


@router.post("/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Verify credentials and return a JWT token."""
    user = await db.scalar(select(User).where(User.email == request.email.lower()))
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")

    token = create_access_token(user.id, user.email, user.username)
    logger.info("User logged in: %s", user.email)
    return AuthResponse(
        access_token=token,
        user_id=user.id,
        email=user.email,
        username=user.username,
    )


@router.get("/auth/me", response_model=MeResponse)
async def me(current_user: dict = Depends(get_current_user)):
    """Return current user info from the JWT token."""
    return MeResponse(
        user_id=int(current_user["sub"]),
        email=current_user["email"],
        username=current_user["username"],
    )
