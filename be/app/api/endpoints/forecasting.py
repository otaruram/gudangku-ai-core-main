from fastapi import APIRouter, UploadFile, File
from app.services.prophet_service import generate_forecast

router = APIRouter()

@router.post("/forecast/{days}")
async def get_forecast(days: int, file: UploadFile = File(...)):
    results = await generate_forecast(file, horizon=days)
    return results
