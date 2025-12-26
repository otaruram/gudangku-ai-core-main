from typing import List, Dict, Any
from app.core.db import db
import json
from datetime import datetime

async def get_combined_history() -> List[Dict[str, Any]]:
    """
    Fetches both PredictionHistory and ChatLog, merges them, 
    and returns a sorted timeline for the 'All' tab.
    """
    timeline = []
    
    # 1. Fetch Forecast History
    if db.is_connected():
        forecasts = await db.predictionhistory.find_many(
            order={'createdAt': 'desc'},
            take=50 
        )
        
        for f in forecasts:
            # Parse PlotData for stats
            accuracy = 92.4 # Mock for now
            product_count = 0
            if f.plotData:
                 try:
                     data = f.plotData if isinstance(f.plotData, dict) else json.loads(f.plotData)
                     product_count = len(data.get('best_sellers', {}))
                 except:
                     pass

            timeline.append({
                "id": f.id,
                "type": "forecast",
                "title": f"Analisis Stok: {f.filename}",
                "description": f"Prediksi untuk {product_count} produk",
                "timestamp": f.createdAt,
                "status": "success",
                "metadata": {
                    "accuracy": accuracy,
                    "products": product_count
                }
            })

        # 2. Fetch Chat History
        chats = await db.chatlog.find_many(
            order={'createdAt': 'desc'},
            take=50
        )
        
        for c in chats:
            timeline.append({
                "id": c.id,
                "type": "chat",
                "title": "Konsultasi Doc Assistant",
                "description": c.question[:50] + "..." if len(c.question) > 50 else c.question,
                "timestamp": c.createdAt,
                "status": "success",
                "metadata": {
                    "messages": 1 # Single turn for now
                }
            })
            
    # Sort by timestamp descending
    timeline.sort(key=lambda x: x['timestamp'], reverse=True)
    return timeline

async def get_history_stats() -> Dict[str, Any]:
    """
    Calculates KPI cards data.
    """
    stats = {
        "total_predictions": 0,
        "total_consultations": 0,
        "avg_accuracy": "92.4%",
        "response_time": "1.2s"
    }

    if db.is_connected():
        stats["total_predictions"] = await db.predictionhistory.count()
        stats["total_consultations"] = await db.chatlog.count()
        
    return stats

async def get_forecast_detail(id: str):
    if db.is_connected():
        return await db.predictionhistory.find_unique(where={'id': id})
    return None

async def get_chat_detail(id: str):
    if db.is_connected():
        return await db.chatlog.find_unique(where={'id': id})
    return None
