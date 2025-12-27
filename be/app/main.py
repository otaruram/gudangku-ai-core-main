from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.api.endpoints import forecasting, assistant

settings = get_settings()

from contextlib import asynccontextmanager
from app.core.db import connect_db, disconnect_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await disconnect_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS Settings
# 1. Frontend Domains (Hardcoded)
fe_origins = [
    "http://localhost:5000",
    "http://localhost:5173",  # Vite dev server
    "https://gudangku-steel.vercel.app",
    "https://gudangku.space",
]

# 2. Backend Domains (Hardcoded + From .env)
be_origins = [
    "http://localhost:5173",  # Local backend
    "https://gudangku-ai.onrender.com",  # Production backend
]

# 3. Additional domains from environment variable (if provided)
if settings.BACKEND_DOMAINS:
    env_origins = [origin.strip() for origin in settings.BACKEND_DOMAINS.split(",") if origin.strip()]
    be_origins.extend(env_origins)

# Remove duplicates while preserving order
seen = set()
origins = []
for origin in fe_origins + be_origins:
    if origin not in seen:
        seen.add(origin)
        origins.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "Gudangku API is Online", "version": settings.VERSION}

# Include Routers
# Include Routers
app.include_router(forecasting.router, prefix="/api", tags=["forecasting"])
app.include_router(assistant.router, prefix="/api", tags=["assistant"])
from app.routers import history
app.include_router(history.router, prefix="/api", tags=["history"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
