from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.api.dependencies import get_db, get_current_admin
from app.models.models import DeliveryZone
from app.schemas.schemas import DeliveryZoneCreate, DeliveryZoneUpdate, DeliveryZoneResponse

router = APIRouter()


@router.get("", response_model=List[DeliveryZoneResponse])
def get_delivery_zones(
    db: Session = Depends(get_db)
):
    """Get all delivery zones"""
    zones = db.query(DeliveryZone).order_by(DeliveryZone.id).all()
    return zones


@router.post("", response_model=DeliveryZoneResponse, status_code=status.HTTP_201_CREATED)
def create_delivery_zone(
    zone: DeliveryZoneCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Create a new delivery zone (Admin only)"""
    db_zone = DeliveryZone(**zone.model_dump())
    db.add(db_zone)
    db.commit()
    db.refresh(db_zone)
    return db_zone


@router.put("/{zone_id}", response_model=DeliveryZoneResponse)
def update_delivery_zone(
    zone_id: int,
    zone: DeliveryZoneUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Update a delivery zone (Admin only)"""
    db_zone = db.query(DeliveryZone).filter(DeliveryZone.id == zone_id).first()
    if not db_zone:
        raise HTTPException(status_code=404, detail="Delivery zone not found")
    
    update_data = zone.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_zone, field, value)
    
    db.commit()
    db.refresh(db_zone)
    return db_zone


@router.delete("/{zone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_delivery_zone(
    zone_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Delete a delivery zone (Admin only)"""
    db_zone = db.query(DeliveryZone).filter(DeliveryZone.id == zone_id).first()
    if not db_zone:
        raise HTTPException(status_code=404, detail="Delivery zone not found")
    
    db.delete(db_zone)
    db.commit()
    return None
