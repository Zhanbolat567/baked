from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.schemas import (
    UserResponse,
    AdminProfileUpdate,
    AdminAvatarUpdate,
    AdminPasswordUpdate,
)
from app.models.models import User
from app.api.dependencies import get_current_user
from app.core.security import verify_password, get_password_hash
import base64
import os

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("", response_model=UserResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return current authenticated user profile."""
    db.refresh(current_user)
    return current_user


@router.put("", response_model=UserResponse)
async def update_profile(
    profile_data: AdminProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile information."""
    update_data = profile_data.model_dump(exclude_unset=True)

    if 'phone_number' in update_data and update_data['phone_number'] != current_user.phone_number:
        existing_user = (
            db.query(User)
            .filter(User.phone_number == update_data['phone_number'], User.id != current_user.id)
            .first()
        )
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already in use",
            )

    for key, value in update_data.items():
        setattr(current_user, key, value)

    db.commit()
    db.refresh(current_user)

    return current_user


@router.put("/avatar", response_model=UserResponse)
async def update_avatar(
    avatar_data: AdminAvatarUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user avatar."""
    try:
        image_data = base64.b64decode(avatar_data.avatar_base64)

        os.makedirs("uploads/avatars", exist_ok=True)

        filename = f"avatar_{current_user.id}.jpg"
        filepath = os.path.join("uploads/avatars", filename)

        with open(filepath, "wb") as f:
            f.write(image_data)

        avatar_url = f"/uploads/avatars/{filename}"
        current_user.avatar_url = avatar_url

        db.commit()
        db.refresh(current_user)

        return current_user
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to process avatar: {exc}",
        )


@router.put("/password")
async def update_password(
    password_data: AdminPasswordUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user password."""
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    current_user.password_hash = get_password_hash(password_data.new_password)
    db.commit()

    return {"message": "Password updated successfully"}
