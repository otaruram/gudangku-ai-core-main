"""
Azure Function: POST /api/forecast/{days}
Accepts a CSV upload and returns Prophet-based forecast + stock analysis.
"""

import json
import logging

import azure.functions as func

from shared.auth import require_auth
from shared.forecast_service import generate_forecast

logger = logging.getLogger(__name__)


def _json_serial(obj):
    """Fallback serializer for datetime/Timestamp."""
    if hasattr(obj, "isoformat"):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


@require_auth
async def main(req: func.HttpRequest, *, user_claims: dict) -> func.HttpResponse:
    try:
        days = int(req.route_params.get("days", 30))

        files = req.files
        if "file" not in files:
            return func.HttpResponse(
                body=json.dumps({"error": "Missing CSV file upload (field name: 'file')"}),
                status_code=400,
                mimetype="application/json",
            )

        uploaded = files["file"]
        file_bytes = uploaded.stream.read()
        filename = uploaded.filename or "upload.csv"

        result = await generate_forecast(file_bytes, filename, horizon=days)

        return func.HttpResponse(
            body=json.dumps(result, default=_json_serial),
            status_code=200,
            mimetype="application/json",
        )

    except ValueError as ve:
        return func.HttpResponse(
            body=json.dumps({"error": str(ve)}),
            status_code=400,
            mimetype="application/json",
        )
    except Exception as exc:
        logger.exception("Forecast function error")
        return func.HttpResponse(
            body=json.dumps({"error": str(exc)}),
            status_code=500,
            mimetype="application/json",
        )
