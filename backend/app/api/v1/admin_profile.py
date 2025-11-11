from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.schemas import (
    AdminProfileResponse,
    AdminProfileUpdate,
    AdminAvatarUpdate,
    AdminPasswordUpdate,
    UserResponse
)
from app.models.models import User
from app.api.dependencies import get_current_admin
from app.core.security import verify_password, get_password_hash
import base64
import os

router = APIRouter(prefix="/admin/profile", tags=["Admin Profile"])


@router.get("", response_model=AdminProfileResponse)
async def get_admin_profile(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get current admin profile."""
    db.refresh(current_admin)
    return current_admin


@router.put("", response_model=AdminProfileResponse)
async def update_admin_profile(
    profile_data: AdminProfileUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update admin profile information."""
    update_data = profile_data.model_dump(exclude_unset=True)
    
    # Check if phone number is being changed and if it's already taken
    if 'phone_number' in update_data and update_data['phone_number'] != current_admin.phone_number:
        existing_user = db.query(User).filter(
            User.phone_number == update_data['phone_number'],
            User.id != current_admin.id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already in use"
            )
    
    for key, value in update_data.items():
        setattr(current_admin, key, value)
    
    db.commit()
    db.refresh(current_admin)
    
    return current_admin


@router.put("/avatar", response_model=AdminProfileResponse)
async def update_admin_avatar(
    avatar_data: AdminAvatarUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update admin avatar (base64 image)."""
    try:
        # Decode base64 and save to uploads
        image_data = base64.b64decode(avatar_data.avatar_base64)
        
        # Create uploads directory if it doesn't exist
        os.makedirs("uploads/avatars", exist_ok=True)
        
        # Generate filename
        filename = f"avatar_{current_admin.id}.jpg"
        filepath = os.path.join("uploads/avatars", filename)
        
        # Save file
        with open(filepath, "wb") as f:
            f.write(image_data)
        
        # Update user avatar URL
        avatar_url = f"/uploads/avatars/{filename}"
        current_admin.avatar_url = avatar_url
        
        db.commit()
        db.refresh(current_admin)
        
        return current_admin
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to process avatar: {str(e)}"
        )


@router.put("/password")
async def update_admin_password(
    password_data: AdminPasswordUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update admin password."""
    
    # Verify current password
    if not verify_password(password_data.current_password, current_admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password
    current_admin.password_hash = get_password_hash(password_data.new_password)
    
    db.commit()
    
    return {"message": "Password updated successfully"}
