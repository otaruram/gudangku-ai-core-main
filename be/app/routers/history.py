from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.services import history_service

router = APIRouter(prefix="/history", tags=["History"])

@router.get("/all")
async def get_all_history():
    """Get merged timeline of all activities"""
    try:
        return await history_service.get_combined_history()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_history_stats():
    """Get KPI stats for History Dashboard"""
    try:
        return await history_service.get_history_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/forecast/{id}")
async def get_forecast_detail(id: str):
    """Get specific forecast data for Replay"""
    data = await history_service.get_forecast_detail(id)
    if not data:
        raise HTTPException(status_code=404, detail="Forecast not found")
    return data

@router.get("/chat/{id}")
async def get_chat_detail(id: str):
    """Get specific chat log for Replay"""
    data = await history_service.get_chat_detail(id)
    if not data:
        raise HTTPException(status_code=404, detail="Chat log not found")
    return data
