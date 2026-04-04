"""
Azure Function: GET /api/history/chat/{id}
Returns a specific chat log by ID.
"""

import json
import logging

import azure.functions as func

from shared.auth import require_auth
from shared.cosmos_client import get_container

logger = logging.getLogger(__name__)


@require_auth
async def main(req: func.HttpRequest, *, user_claims: dict) -> func.HttpResponse:
    record_id = req.route_params.get("id")
    if not record_id:
        return func.HttpResponse(
            body=json.dumps({"error": "Missing id parameter"}),
            status_code=400,
            mimetype="application/json",
        )
    try:
        container = get_container("chat_logs")
        item = container.read_item(item=record_id, partition_key=record_id)
        return func.HttpResponse(
            body=json.dumps(item),
            status_code=200,
            mimetype="application/json",
        )
    except Exception:
        return func.HttpResponse(
            body=json.dumps({"error": "Chat log not found"}),
            status_code=404,
            mimetype="application/json",
        )
