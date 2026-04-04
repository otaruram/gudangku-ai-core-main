"""
Shared module: Azure Cosmos DB client (NoSQL API).
Singleton pattern — initialized once per function app cold start.
"""

import os
from azure.cosmos import CosmosClient, PartitionKey

_client = None
_database = None

CONTAINERS = {
    "chat_logs": "/id",
    "prediction_history": "/id",
}


def _get_client() -> CosmosClient:
    global _client
    if _client is None:
        endpoint = os.environ["COSMOS_ENDPOINT"]
        key = os.environ["COSMOS_KEY"]
        _client = CosmosClient(endpoint, credential=key)
    return _client


def get_database():
    global _database
    if _database is None:
        db_name = os.environ.get("COSMOS_DATABASE", "geosupplyguard")
        _database = _get_client().get_database_client(db_name)
    return _database


def get_container(name: str):
    return get_database().get_container_client(name)


def ensure_containers():
    """Idempotent bootstrap — call once on first deploy or locally."""
    db = get_database()
    for name, pk_path in CONTAINERS.items():
        db.create_container_if_not_exists(id=name, partition_key=PartitionKey(path=pk_path))
