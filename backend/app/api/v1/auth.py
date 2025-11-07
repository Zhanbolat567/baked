from typing import Set

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.schemas import UserCreate, UserLogin, Token, UserResponse
from app.models.models import User, UserRole
from app.core.security import verify_password, get_password_hash, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _normalize_phone_number(raw_phone: str) -> str:
    """Format phone number as digits only with Kazakhstan country code."""
    digits = ''.join(filter(str.isdigit, raw_phone or ""))

    if not digits:
        return ""

    if len(digits) == 11 and digits.startswith('8'):
        digits = '7' + digits[1:]

    if len(digits) == 10:
        digits = '7' + digits

    return digits


def _possible_phone_variants(raw_phone: str) -> Set[str]:
    """Return possible stored representations to cover legacy formats."""
    normalized = _normalize_phone_number(raw_phone)
    variants: Set[str] = set()

    if not normalized:
        return variants

    variants.add(normalized)
    variants.add(f"+{normalized}")

    if normalized.startswith('7') and len(normalized) == 11:
        legacy = f"8{normalized[1:]}"
        variants.add(legacy)
        variants.add(f"+{legacy}")

    return variants

@router.post("/register", response_model=Token)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    normalized_phone = _normalize_phone_number(user_data.phone_number)
    if not normalized_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid phone number format"
        )

    existing_user = (
        db.query(User)
        .filter(User.phone_number.in_(_possible_phone_variants(normalized_phone)))
        .first()
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this phone number already exists"
        )

    new_user = User(
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone_number=normalized_phone,
        password_hash=get_password_hash(user_data.password),
        role=UserRole.CLIENT
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(data={"sub": str(new_user.id)})

    return Token(
        access_token=access_token,
        user=UserResponse.model_validate(new_user)
    )

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login user."""
    normalized_phone = _normalize_phone_number(credentials.phone_number)
    if not normalized_phone:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone number or password"
        )

    user = (
        db.query(User)
        .filter(User.phone_number.in_(_possible_phone_variants(normalized_phone)))
        .first()
    )
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone number or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return Token(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )
