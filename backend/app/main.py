from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.api.v1 import api_router
from app.db.session import engine
from app.db.base import Base
import os

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Social Coffee Shop API",
    description="API for Social Coffee Shop web application",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include API router
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Social Coffee Shop API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
