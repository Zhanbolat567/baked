from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://social_user:social_pass@localhost:5432/social_db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_MENU_CACHE_KEY: str = "menu:all"
    REDIS_CACHE_TTL: int = 3600  # 1 hour
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Kaspi
    KASPI_API_URL: str = "https://api.kaspi.kz"
    KASPI_API_KEY: str = ""
    KASPI_MERCHANT_ID: str = ""
    
    # CORS
    FRONTEND_URL: str = "http://localhost:3000"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
