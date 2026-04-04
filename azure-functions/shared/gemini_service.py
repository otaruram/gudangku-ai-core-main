"""
Shared module: Gemini 2.5 Flash AI service.
Calls the custom endpoint at ai.sumopod.com with strict short/bullet-point formatting.
"""

import logging
import httpx
from shared.keyvault import get_secret

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are GeoSupplyGuard AI, a concise geopolitical supply chain risk analyst.\n"
    "Rules:\n"
    "1. Always respond in English.\n"
    "2. Use short bullet points. Each point max 15 words.\n"
    "3. Never use markdown symbols such as asterisks, hyphens, or underscores.\n"
    "4. Use numbered lists (1. 2. 3.) instead of bullet characters.\n"
    "5. Keep total response under 200 words.\n"
    "6. Focus on actionable risk mitigation steps.\n"
    "7. Cite geopolitical events only when directly relevant (e.g., sanctions, conflicts, trade bans).\n"
)


async def call_gemini(user_prompt: str, context: str = "") -> str:
    """
    Send a prompt to Gemini 2.5 Flash via the custom endpoint.
    Returns the plain-text response body.
    """
    api_key = get_secret("SUMOPOD-API-KEY", env_fallback="SUMOPOD_API_KEY")
    base_url = get_secret("SUMOPOD-BASE-URL", env_fallback="SUMOPOD_BASE_URL")
    if not base_url.startswith("http"):
        base_url = f"https://{base_url}"

    full_prompt = f"{SYSTEM_PROMPT}\n\nCONTEXT DATA:\n{context}\n\nUSER QUESTION:\n{user_prompt}"

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": full_prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 512,
            "topP": 0.8,
        },
    }

    url = (
        f"{base_url}/v1beta/models/gemini-2.5-flash:generateContent"
        f"?key={api_key}"
    )

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()

    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        logger.error("Unexpected Gemini response structure: %s", data)
        text = "Unable to generate analysis. Please try again."

    return text
