"""
Shared module: Azure Key Vault secret retrieval.
Falls back to environment variables for local development.
"""

import os
import logging
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient

_kv_client = None

logger = logging.getLogger(__name__)


def _get_kv_client():
    global _kv_client
    if _kv_client is None:
        vault_url = os.environ.get("KEYVAULT_URL")
        if not vault_url:
            return None
        credential = DefaultAzureCredential()
        _kv_client = SecretClient(vault_url=vault_url, credential=credential)
    return _kv_client


def get_secret(name: str, env_fallback: str = None) -> str:
    """
    Retrieve a secret from Azure Key Vault.
    Falls back to the environment variable `env_fallback` (or `name`)
    when Key Vault is unavailable (local dev).
    """
    fallback_key = env_fallback or name
    try:
        client = _get_kv_client()
        if client:
            secret = client.get_secret(name)
            return secret.value
    except Exception as exc:
        logger.warning("Key Vault lookup failed for '%s': %s", name, exc)

    value = os.environ.get(fallback_key)
    if not value:
        raise RuntimeError(
            f"Secret '{name}' not found in Key Vault or env var '{fallback_key}'"
        )
    return value
