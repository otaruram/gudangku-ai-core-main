from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    PROJECT_NAME: str = "Gudangku API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    GROQ_API_KEY: str
    SUPABASE_URL: str | None = None
    SUPABASE_KEY: str | None = None
    
    # CORS & Domain Settings
    FRONTEND_URL: str = "http://localhost:5000"
    PORT: int = 5173
    
    # Backend Domains (from .env)
    BACKEND_DOMAINS: str = "http://localhost:5173,https://gudangku-ai.onrender.com"
    
    class Config:
        env_file = ".env"
        extra = "ignore"

@lru_cache()
def get_settings():
    return Settings()
