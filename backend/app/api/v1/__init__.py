from fastapi import APIRouter
from app.api.v1 import auth, menu, orders, admin

api_router = APIRouter()

# Include all routers
api_router.include_router(auth.router)
api_router.include_router(menu.router)
api_router.include_router(orders.router)
api_router.include_router(admin.router)
