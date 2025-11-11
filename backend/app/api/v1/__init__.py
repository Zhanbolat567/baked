from fastapi import APIRouter
from app.api.v1 import auth, menu, orders, admin, admin_profile, user_profile, delivery_zones, pickup_locations

api_router = APIRouter()

# Include all routers
api_router.include_router(auth.router)
api_router.include_router(menu.router)
api_router.include_router(orders.router)
api_router.include_router(admin.router)
api_router.include_router(admin_profile.router)
api_router.include_router(user_profile.router)
api_router.include_router(delivery_zones.router, prefix="/delivery-zones", tags=["Delivery Zones"])
api_router.include_router(
	pickup_locations.router,
	prefix="/pickup-locations",
	tags=["Pickup Locations"],
)
