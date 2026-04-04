"""
Shared module: JWT authentication middleware.
Supports Supabase JWT tokens (HS256) or Azure AD / Entra ID tokens (RS256).
"""

import os
import logging
import jwt as pyjwt
from functools import wraps
import azure.functions as func

from shared.keyvault import get_secret

logger = logging.getLogger(__name__)


def _decode_supabase_jwt(token: str) -> dict:
    """Verify a Supabase-issued JWT using the shared HS256 secret."""
    secret = get_secret("SUPABASE-JWT-SECRET", env_fallback="SUPABASE_JWT_SECRET")
    payload = pyjwt.decode(
        token,
        secret,
        algorithms=["HS256"],
        options={"require": ["exp", "sub"]},
        audience="authenticated",
    )
    return payload


def extract_user(req: func.HttpRequest) -> dict:
    """
    Extract and validate the JWT from the Authorization header.
    Returns the decoded payload dict or raises ValueError.
    """
    auth_header = req.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise ValueError("Missing or malformed Authorization header")

    token = auth_header[7:]
    return _decode_supabase_jwt(token)


def require_auth(fn):
    """
    Decorator for Azure Function handlers.
    Injects `user_claims` kwarg on success; returns 401 on failure.
    """
    @wraps(fn)
    async def wrapper(req: func.HttpRequest, *args, **kwargs):
        try:
            claims = extract_user(req)
        except (pyjwt.ExpiredSignatureError, pyjwt.InvalidTokenError, ValueError) as exc:
            return func.HttpResponse(
                body=f'{{"error": "Unauthorized: {exc}"}}',
                status_code=401,
                mimetype="application/json",
            )
        kwargs["user_claims"] = claims
        return await fn(req, *args, **kwargs)

    return wrapper
