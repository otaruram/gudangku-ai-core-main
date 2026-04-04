"""
Azure Function: POST /api/chat
Accepts a question (form field) and optional PDF file.
Calls Gemini 1.5 Flash via custom endpoint for geopolitical supply chain analysis.
"""

import json
import uuid
import logging
from datetime import datetime

import azure.functions as func

from shared.auth import require_auth
from shared.gemini_service import call_gemini
from shared.forecast_service import get_latest_forecast_summary
from shared.cosmos_client import get_container

logger = logging.getLogger(__name__)


def _extract_pdf_text(file_bytes: bytes) -> str:
    """Extract text from a PDF byte stream (max 10 000 chars)."""
    try:
        import PyPDF2, io
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            text += (page.extract_text() or "") + "\n"
        return text[:10_000]
    except Exception as exc:
        return f"[Error reading PDF: {exc}]"


@require_auth
async def main(req: func.HttpRequest, *, user_claims: dict) -> func.HttpResponse:
    try:
        # --- Parse multipart form ---
        question = None
        file_bytes = None

        content_type = req.headers.get("Content-Type", "")
        if "multipart/form-data" in content_type:
            form = req.form
            question = form.get("question")
            files = req.files
            if "file" in files:
                file_bytes = files["file"].stream.read()
        else:
            try:
                body = req.get_json()
                question = body.get("question")
            except ValueError:
                question = req.params.get("question")

        if not question:
            return func.HttpResponse(
                body=json.dumps({"error": "Missing 'question' field"}),
                status_code=400,
                mimetype="application/json",
            )

        # --- Build context ---
        forecast_ctx = await get_latest_forecast_summary()
        doc_ctx = ""
        if file_bytes:
            doc_ctx = f"\nUPLOADED DOCUMENT CONTENTS:\n{_extract_pdf_text(file_bytes)}\n"

        context = f"{forecast_ctx}\n{doc_ctx}"
        answer = await call_gemini(question, context=context)

        # --- Persist to Cosmos ---
        try:
            container = get_container("chat_logs")
            container.upsert_item({
                "id": str(uuid.uuid4()),
                "userId": user_claims.get("sub", "unknown"),
                "question": question,
                "answer": answer,
                "isHelpful": True,
                "createdAt": datetime.utcnow().isoformat(),
            })
        except Exception as exc:
            logger.error("Failed to save chat log: %s", exc)

        return func.HttpResponse(
            body=json.dumps({"response": answer}),
            status_code=200,
            mimetype="application/json",
        )

    except Exception as exc:
        logger.exception("Chat function error")
        return func.HttpResponse(
            body=json.dumps({"error": str(exc)}),
            status_code=500,
            mimetype="application/json",
        )
