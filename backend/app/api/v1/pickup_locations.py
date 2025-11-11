from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_admin
from app.models.models import PickupLocation
from app.schemas.schemas import (
    PickupLocationCreate,
    PickupLocationUpdate,
    PickupLocationResponse,
)

router = APIRouter()


@router.get("", response_model=List[PickupLocationResponse])
def list_pickup_locations(db: Session = Depends(get_db)):
    """Return all pickup locations ordered by display priority."""
    return (
        db.query(PickupLocation)
        .order_by(PickupLocation.display_order.asc(), PickupLocation.id.asc())
        .all()
    )


@router.post("", response_model=PickupLocationResponse, status_code=status.HTTP_201_CREATED)
def create_pickup_location(
    location: PickupLocationCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    """Create a new pickup location (admin only)."""
    db_location = PickupLocation(**location.model_dump())
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location


@router.put("/{location_id}", response_model=PickupLocationResponse)
def update_pickup_location(
    location_id: int,
    location: PickupLocationUpdate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    """Update an existing pickup location (admin only)."""
    db_location = (
        db.query(PickupLocation)
        .filter(PickupLocation.id == location_id)
        .first()
    )
    if not db_location:
        raise HTTPException(status_code=404, detail="Pickup location not found")

    update_data = location.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_location, field, value)

    db.commit()
    db.refresh(db_location)
    return db_location


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pickup_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    """Remove a pickup location (admin only)."""
    db_location = (
        db.query(PickupLocation)
        .filter(PickupLocation.id == location_id)
        .first()
    )
    if not db_location:
        raise HTTPException(status_code=404, detail="Pickup location not found")

    db.delete(db_location)
    db.commit()
    return None
