# GeoSupplyGuard — Azure Serverless Migration Guide

Complete migration from FastAPI + PostgreSQL/Prisma (Gudangku) to Azure Functions + Cosmos DB + Gemini 1.5 Flash.

---

## Architecture Overview

```
BEFORE (Gudangku)                    AFTER (GeoSupplyGuard)
========================             ============================
FastAPI on VPS/Render         -->    Azure Functions (Serverless)
PostgreSQL + Prisma ORM       -->    Azure Cosmos DB (NoSQL API)
Groq (LLaMA 3.3 70B)         -->    Gemini 1.5 Flash @ ai.sumopod.com
Supabase Auth (JWT)           -->    Supabase Auth JWT (unchanged)
.env secrets                  -->    Azure Key Vault
```

---

## Final Folder Structure

```
azure-functions/
  host.json                     # Global config (route prefix, CORS, logging)
  local.settings.json           # Local dev env vars (gitignored)
  requirements.txt              # Python dependencies
  .funcignore                   # Deployment exclusions
  .gitignore

  shared/                       # Shared library (auto-available to all functions)
    __init__.py
    auth.py                     # JWT verification decorator (Supabase HS256)
    cosmos_client.py            # Cosmos DB singleton client
    keyvault.py                 # Azure Key Vault secret retrieval
    gemini_service.py           # Gemini 1.5 Flash API caller
    forecast_service.py         # Prophet forecasting + Cosmos persistence

  fn_health/                    # GET /health
    function.json
    __init__.py

  fn_chat/                      # POST /api/chat
    function.json
    __init__.py

  fn_forecast/                  # POST /api/forecast/{days}
    function.json
    __init__.py

  fn_history_all/               # GET /api/history/all
    function.json
    __init__.py

  fn_history_stats/             # GET /api/history/stats
    function.json
    __init__.py

  fn_history_forecast_detail/   # GET /api/history/forecast/{id}
    function.json
    __init__.py

  fn_history_chat_detail/       # GET /api/history/chat/{id}
    function.json
    __init__.py
```

---

## Step-by-Step Deployment

### 1. Prerequisites

```powershell
# Install Azure Functions Core Tools
npm install -g azure-functions-core-tools@4 --unsafe-perm true

# Install Azure CLI
winget install -e --id Microsoft.AzureCLI

# Login
az login
```

### 2. Create Azure Resources

```bash
# Variables
RG="rg-geosupplyguard"
LOCATION="southeastasia"
STORAGE="stgeosupplyguard"
FUNC_APP="func-geosupplyguard"
COSMOS_ACCT="cosmos-geosupplyguard"
KV_NAME="kv-geosupplyguard"

# Resource Group
az group create --name $RG --location $LOCATION

# Storage Account (required by Azure Functions)
az storage account create \
  --name $STORAGE --resource-group $RG \
  --location $LOCATION --sku Standard_LRS

# Cosmos DB Account + Database + Containers
az cosmosdb create --name $COSMOS_ACCT --resource-group $RG \
  --default-consistency-level Session --locations regionName=$LOCATION

az cosmosdb sql database create \
  --account-name $COSMOS_ACCT --resource-group $RG \
  --name geosupplyguard

az cosmosdb sql container create \
  --account-name $COSMOS_ACCT --resource-group $RG \
  --database-name geosupplyguard --name chat_logs \
  --partition-key-path "/id" --throughput 400

az cosmosdb sql container create \
  --account-name $COSMOS_ACCT --resource-group $RG \
  --database-name geosupplyguard --name prediction_history \
  --partition-key-path "/id" --throughput 400

# Key Vault
az keyvault create --name $KV_NAME --resource-group $RG --location $LOCATION

# Function App (Python 3.11, Consumption Plan)
az functionapp create \
  --name $FUNC_APP --resource-group $RG \
  --storage-account $STORAGE \
  --consumption-plan-location $LOCATION \
  --runtime python --runtime-version 3.11 \
  --functions-version 4 \
  --os-type Linux
```

### 3. Store Secrets in Key Vault

```bash
# Store secrets
az keyvault secret set --vault-name $KV_NAME \
  --name "GEMINI-API-KEY" --value "<your-gemini-key>"

az keyvault secret set --vault-name $KV_NAME \
  --name "SUPABASE-JWT-SECRET" --value "<your-supabase-jwt-secret>"

az keyvault secret set --vault-name $KV_NAME \
  --name "COSMOS-KEY" --value "$(az cosmosdb keys list \
    --name $COSMOS_ACCT --resource-group $RG \
    --query primaryMasterKey -o tsv)"
```

### 4. Grant Function App Access to Key Vault

```bash
# Enable system-assigned managed identity
az functionapp identity assign --name $FUNC_APP --resource-group $RG

# Get the principal ID
PRINCIPAL_ID=$(az functionapp identity show \
  --name $FUNC_APP --resource-group $RG --query principalId -o tsv)

# Grant Key Vault access
az keyvault set-policy --name $KV_NAME \
  --object-id $PRINCIPAL_ID \
  --secret-permissions get list
```

### 5. Configure Function App Settings

```bash
COSMOS_ENDPOINT=$(az cosmosdb show --name $COSMOS_ACCT \
  --resource-group $RG --query documentEndpoint -o tsv)

COSMOS_KEY=$(az cosmosdb keys list --name $COSMOS_ACCT \
  --resource-group $RG --query primaryMasterKey -o tsv)

az functionapp config appsettings set --name $FUNC_APP --resource-group $RG \
  --settings \
    COSMOS_ENDPOINT="$COSMOS_ENDPOINT" \
    COSMOS_KEY="$COSMOS_KEY" \
    COSMOS_DATABASE="geosupplyguard" \
    KEYVAULT_URL="https://$KV_NAME.vault.azure.net/" \
    GEMINI_API_KEY="@Microsoft.KeyVault(VaultName=$KV_NAME;SecretName=GEMINI-API-KEY)" \
    SUPABASE_JWT_SECRET="@Microsoft.KeyVault(VaultName=$KV_NAME;SecretName=SUPABASE-JWT-SECRET)"
```

### 6. Local Development

```powershell
cd azure-functions

# Create virtual environment
python -m venv .venv
.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Fill in local.settings.json with real values, then:
func start
```

Local endpoints will be available at:
- `http://localhost:7071/health`
- `http://localhost:7071/api/chat`
- `http://localhost:7071/api/forecast/30`
- `http://localhost:7071/api/history/all`
- `http://localhost:7071/api/history/stats`
- `http://localhost:7071/api/history/forecast/{id}`
- `http://localhost:7071/api/history/chat/{id}`

### 7. Deploy

```bash
cd azure-functions
func azure functionapp publish func-geosupplyguard
```

---

## API Endpoint Mapping (Old to New)

| Old (FastAPI)                | New (Azure Functions)             | Method |
|------------------------------|-----------------------------------|--------|
| `GET /`                      | `GET /health`                     | GET    |
| `POST /api/chat`             | `POST /api/chat`                  | POST   |
| `POST /api/forecast/{days}`  | `POST /api/forecast/{days}`       | POST   |
| `GET /api/history/all`       | `GET /api/history/all`            | GET    |
| `GET /api/history/stats`     | `GET /api/history/stats`          | GET    |
| `GET /api/history/forecast/{id}` | `GET /api/history/forecast/{id}` | GET |
| `GET /api/history/chat/{id}` | `GET /api/history/chat/{id}`      | GET    |

---

## Key Component Details

### Cosmos DB Connection (shared/cosmos_client.py)

```python
from azure.cosmos import CosmosClient, PartitionKey
import os

_client = None

def _get_client():
    global _client
    if _client is None:
        _client = CosmosClient(
            os.environ["COSMOS_ENDPOINT"],
            credential=os.environ["COSMOS_KEY"]
        )
    return _client

def get_container(name):
    db = _get_client().get_database_client(os.environ.get("COSMOS_DATABASE", "geosupplyguard"))
    return db.get_container_client(name)
```

### Key Vault Secret Retrieval (shared/keyvault.py)

```python
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient

def get_secret(name, env_fallback=None):
    # Tries Key Vault first, falls back to env var for local dev
    vault_url = os.environ.get("KEYVAULT_URL")
    if vault_url:
        client = SecretClient(vault_url, DefaultAzureCredential())
        return client.get_secret(name).value
    return os.environ[env_fallback or name]
```

### JWT Auth Decorator (shared/auth.py)

```python
@require_auth
async def main(req, *, user_claims):
    user_id = user_claims["sub"]
    # ... function body
```

Every protected endpoint uses the `@require_auth` decorator which:
1. Extracts the `Bearer` token from the `Authorization` header
2. Decodes using the Supabase JWT secret (HS256)
3. Injects `user_claims` dict or returns HTTP 401

### Gemini 1.5 Flash Prompt Structure (shared/gemini_service.py)

```
SYSTEM PROMPT:
  You are GeoSupplyGuard AI, a concise geopolitical supply chain risk analyst.
  Rules:
  1. Always respond in English.
  2. Use short bullet points. Each point max 15 words.
  3. Never use markdown symbols such as asterisks, hyphens, or underscores.
  4. Use numbered lists (1. 2. 3.) instead of bullet characters.
  5. Keep total response under 200 words.
  6. Focus on actionable risk mitigation steps.
  7. Cite geopolitical events only when directly relevant.

CONTEXT DATA:
  {live forecast summary + uploaded PDF text}

USER QUESTION:
  {user question}
```

API call target: `https://ai.sumopod.com/v1beta/models/gemini-1.5-flash:generateContent?key={API_KEY}`

---

## Data Migration (PostgreSQL to Cosmos DB)

To migrate existing data from PostgreSQL:

```python
# one-time-migration.py (run locally)
import asyncio, json, uuid
from prisma import Prisma
from azure.cosmos import CosmosClient

COSMOS_ENDPOINT = "https://<your-account>.documents.azure.com:443/"
COSMOS_KEY = "<key>"

async def migrate():
    prisma = Prisma()
    await prisma.connect()
    cosmos = CosmosClient(COSMOS_ENDPOINT, COSMOS_KEY)
    db = cosmos.get_database_client("geosupplyguard")

    # Migrate chat_logs
    cl = db.get_container_client("chat_logs")
    chats = await prisma.chatlog.find_many()
    for c in chats:
        cl.upsert_item({
            "id": c.id,
            "question": c.question,
            "answer": c.answer,
            "isHelpful": c.isHelpful,
            "createdAt": c.createdAt.isoformat(),
        })

    # Migrate prediction_history
    ph = db.get_container_client("prediction_history")
    preds = await prisma.predictionhistory.find_many()
    for p in preds:
        plot = p.plotData if isinstance(p.plotData, dict) else json.loads(p.plotData)
        ph.upsert_item({
            "id": p.id,
            "filename": p.filename,
            "plotData": plot,
            "createdAt": p.createdAt.isoformat(),
        })

    await prisma.disconnect()
    print("Migration complete")

asyncio.run(migrate())
```

---

## Frontend Changes Required

Update the API base URL in `fe/src/lib/config.ts`:

```typescript
// Old
export const API_BASE_URL = "https://gudangku-ai.onrender.com";

// New
export const API_BASE_URL = "https://func-geosupplyguard.azurewebsites.net";
```

All API paths remain identical (`/api/chat`, `/api/forecast/{days}`, `/api/history/*`), so no other frontend changes are needed.

---

## Cost Estimate (Azure Consumption Plan)

| Service           | Free Tier                        | Notes                         |
|-------------------|----------------------------------|-------------------------------|
| Azure Functions   | 1M executions/month free         | Pay per execution after       |
| Cosmos DB         | 1000 RU/s free (25 GB)           | Covers hackathon traffic      |
| Key Vault         | 10,000 operations/month free     | Secret reads are cheap        |
| Storage Account   | 5 GB free                        | Function app storage          |

For a hackathon, total cost is effectively $0 with the free tier.
