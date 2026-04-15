"""
app/routers/user.py

GET  /api/user/profile   — fetch current user's personalization profile
PUT  /api/user/profile   — update user profile
"""
from __future__ import annotations

import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.db_models import UserProfile
from app.routers.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(tags=["User"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class ProfilePayload(BaseModel):
    interests:     list[str] = []
    skill_level:   str       = "intermediate"
    prefer_recent: bool      = False
    goal:          str       = "research"


class ProfileResponse(ProfilePayload):
    user_id: int


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/user/profile", response_model=ProfileResponse)
async def get_profile(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = int(current_user["sub"])
    profile = await db.scalar(select(UserProfile).where(UserProfile.user_id == user_id))
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return ProfileResponse(
        user_id=user_id,
        interests=profile.interests_list(),
        skill_level=profile.skill_level,
        prefer_recent=profile.prefer_recent,
        goal=profile.goal,
    )


@router.put("/user/profile", response_model=ProfileResponse)
async def update_profile(
    payload: ProfilePayload,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = int(current_user["sub"])
    profile = await db.scalar(select(UserProfile).where(UserProfile.user_id == user_id))
    if not profile:
        # Create if missing (shouldn't happen after signup)
        profile = UserProfile(user_id=user_id)
        db.add(profile)

    profile.interests     = json.dumps(payload.interests)
    profile.skill_level   = payload.skill_level
    profile.prefer_recent = payload.prefer_recent
    profile.goal          = payload.goal

    await db.commit()
    await db.refresh(profile)
    logger.info("Profile updated for user_id=%d", user_id)

    return ProfileResponse(
        user_id=user_id,
        interests=profile.interests_list(),
        skill_level=profile.skill_level,
        prefer_recent=profile.prefer_recent,
        goal=profile.goal,
    )
