# Gudangku — AI-Powered Inventory & Supply Chain Assistant for Indonesian UMKM

> Production-ready AI platform for warehouse intelligence: demand forecasting, stock alerting, document automation, and Telegram bot integration. Built on Azure serverless stack with enterprise-grade security, caching optimization, and offline-first architecture.

[![Azure Functions](https://img.shields.io/badge/Azure%20Functions-v4-0062AD?logo=azure-functions)](https://azure.microsoft.com/en-us/products/functions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Cosmos DB](https://img.shields.io/badge/Cosmos%20DB-NoSQL-0078D4?logo=microsoftazure)](https://azure.microsoft.com/en-us/products/cosmos-db)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000?logo=vercel)](https://vercel.com/)
[![Redis](https://img.shields.io/badge/Redis-Smart%20Cache-DC382D?logo=redis)](https://azure.microsoft.com/en-us/products/cache)
[![Live](https://img.shields.io/badge/Status-Production-success)]

---

## Features

### Core AI Features
- **Demand Forecasting** – Prophet-based time series forecasting, stock reorder point calculation, real-time stock alerts (STOCKOUT/CRITICAL/WARNING/SAFE)
- **Doc Assistant** – Gemini 2.5 Flash AI analysis: asks questions about inventory, contextual recommendations
- **Telegram Bot** – Full data access via Telegram: stok query, forecast insights, photo/PDF analysis (invoices, labels, receipts)
- **Inventory Automation** – CSV upload → auto-detect date/sales/product/stock columns → parsed in seconds

### Production-Ready Tech
- **Smart Caching** – Redis with SHA256-hashed queries, 4hr TTL, automatic staleness bypass
- **Security Hardened** – IDOR fixed, webhook auth bulletproof, timeout+retry on AI calls, APIM global throttle
- **Per-Client Throttle** – APIM: 120 req/min global, 30 req/min on expensive endpoints (/api/chat, /api/forecast)
- **Credit System** – Lazy-evaluated daily quota (10/day auto-reset), per-user tracking, admin unlimited
- **Admin Dashboard** – User management, pagination (no N+1 queries), credits/ban system
- **Auth** – Supabase JWT (HS256+RS256 JWKS), role-based access, account ban support
- **Monitoring Ready** – Structured logging, performance metrics, load test suite (k6)

---

## Architecture

```
                    gudangku.space (Vercel)
                           â”‚
                    Vercel Edge Proxy
                     /api/* â†’ Azure
                           â”‚
                  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”
                  â”‚  Azure APIM     â”‚
                  â”‚  (rate limit    â”‚
                  â”‚   5 req/min)    â”‚
                  â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                           â”‚
              â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
              â”‚  Azure Functions (Node) â”‚
              â”‚  â”œâ”€ /health             â”‚
              â”‚  â”œâ”€ /api/chat           â”‚
              â”‚  â”œâ”€ /api/credits        â”‚
              â”‚  â”œâ”€ /api/history/all    â”‚
              â”‚  â”œâ”€ /api/history/stats  â”‚
              â”‚  â”œâ”€ /api/history/chat   â”‚
              â”‚  â””â”€ /api/history/forecastâ”‚
              â””â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                 â”‚      â”‚      â”‚
          â”Œâ”€â”€â”€â”€â”€â”€â–¼â” â”Œâ”€â”€â”€â–¼â”€â”€â”€â” â”Œâ–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
          â”‚Cosmos â”‚ â”‚Redis  â”‚ â”‚Key Vault  â”‚
          â”‚  DB   â”‚ â”‚Cache  â”‚ â”‚(secrets)  â”‚
          â””â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                    â”‚
                             â”Œâ”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”
                             â”‚Gemini 2.5   â”‚
                             â”‚Flash (AI)   â”‚
                             â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## Project Structure

```
â”œâ”€â”€ azure-functions-ts/        # Backend â€” Azure Functions (Node.js/TypeScript)
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ functions/         # HTTP trigger handlers
â”‚   â”‚   â”‚   â”œâ”€â”€ health.ts      # GET /health
â”‚   â”‚   â”‚   â”œâ”€â”€ chat.ts        # POST /api/chat (AI analysis)
â”‚   â”‚   â”‚   â”œâ”€â”€ credits.ts     # GET /api/credits
â”‚   â”‚   â”‚   â”œâ”€â”€ historyAll.ts  # GET /api/history/all
â”‚   â”‚   â”‚   â”œâ”€â”€ historyStats.ts# GET /api/history/stats
â”‚   â”‚   â”‚   â””â”€â”€ historyDetail.ts # GET /api/history/{type}/{id}
â”‚   â”‚   â”œâ”€â”€ shared/            # Shared modules
â”‚   â”‚   â”‚   â”œâ”€â”€ auth.ts        # JWT verification middleware
â”‚   â”‚   â”‚   â”œâ”€â”€ cosmosClient.ts# Cosmos DB singleton
â”‚   â”‚   â”‚   â”œâ”€â”€ redisCache.ts  # Redis caching layer
â”‚   â”‚   â”‚   â”œâ”€â”€ creditSystem.ts# Credit quota system
â”‚   â”‚   â”‚   â”œâ”€â”€ geminiService.ts# Gemini AI integration
â”‚   â”‚   â”‚   â””â”€â”€ keyVault.ts    # Azure Key Vault client
â”‚   â”‚   â””â”€â”€ index.ts           # Entry point
â”‚   â”œâ”€â”€ host.json
â”‚   â”œâ”€â”€ package.json
â”‚   â””â”€â”€ tsconfig.json
â”‚
â”œâ”€â”€ fe/                        # Frontend â€” React + TypeScript (Vite)
â”‚   â”œâ”€â”€ api/
â”‚   â”‚   â””â”€â”€ [...path].ts       # Vercel Edge proxy (hides backend URL)
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ components/        # UI components (shadcn/ui)
â”‚   â”‚   â”œâ”€â”€ context/           # React context providers
â”‚   â”‚   â”œâ”€â”€ hooks/             # Custom hooks
â”‚   â”‚   â”œâ”€â”€ lib/               # Config, Supabase client, utils
â”‚   â”‚   â””â”€â”€ pages/             # Route pages
â”‚   â”œâ”€â”€ vercel.json
â”‚   â””â”€â”€ package.json
â”‚
â”œâ”€â”€ be/                        # Legacy backend (FastAPI â€” deprecated)
â””â”€â”€ azure-functions/           # Legacy Python Functions (deprecated)
```

---

## Azure Resources

| Resource | Name | Purpose |
|----------|------|---------|
| Resource Group | `rg-geosupplyguard` | Container (Southeast Asia) |
| Function App | `func-geosupplyguard-ts` | Node.js 20 serverless backend |
| Cosmos DB | `cosmosgeosupplyguard` | NoSQL database (3 containers) |
| Redis Cache | `redis-geosupplyguard` | AI response caching |
| Key Vault | `kvgeosupplyguard` | Secret management (RBAC) |
| APIM | `apim-geosupplyguard` | Rate limiting gateway |
| Storage | `stgeosupplyguard` | Function App storage |

---

## Getting Started

### Prerequisites
- Node.js 20+
- Azure Functions Core Tools v4
- Azure CLI (logged in)

### Local Development

```bash
# Backend
cd azure-functions-ts
npm install
cp local.settings.json.example local.settings.json  # fill in your secrets
npm run build
func start

# Frontend
cd fe
npm install
cp .env.example .env  # fill in your Supabase credentials
npm run dev
```

### Environment Variables

**Backend** (Azure Key Vault / local.settings.json):
| Variable | Description |
|----------|-------------|
| `COSMOS_ENDPOINT` | Cosmos DB endpoint URL |
| `COSMOS_KEY` | Cosmos DB key (Key Vault ref) |
| `COSMOS_DATABASE` | Database name |
| `SUMOPOD_API_KEY` | Gemini AI API key (Key Vault ref) |
| `SUMOPOD_BASE_URL` | Gemini AI base URL (Key Vault ref) |
| `SUPABASE_JWT_SECRET` | JWT verification secret (Key Vault ref) |
| `REDIS_CONNECTION_STRING` | Redis connection (Key Vault ref) |
| `KEY_VAULT_URL` | Azure Key Vault URL |

**Frontend** (Vercel env vars):
| Variable | Scope | Description |
|----------|-------|-------------|
| `API_URL` | Server-only | Azure APIM gateway URL (never in browser) |
| `VITE_SUPABASE_URL` | Client | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Client | Supabase publishable key |

---

## Deployment

### Backend (Azure)
```bash
cd azure-functions-ts
npm run build
func azure functionapp publish func-geosupplyguard-ts --javascript
```

### Frontend (Vercel)
Push to `main` branch â€” Vercel auto-deploys from `fe/` directory.
### APIM Policy (Manual)
Copy `azure-functions-ts/apim-policy.xml` content to Azure APIM → APIs > All Operations > Inbound Processing for global throttle activation.

### Cosmos DB Scale Path (Optional)
Run `node scripts/migrate-cosmos-userid-partition.js` to migrate from /id to /userId partition key (no downtime, tested).

### Load Testing
```bash
# Install k6
choco install k6 -y

# Run load test
$env:SUPABASE_JWT = "<valid-token>"
k6 run azure-functions-ts/scripts/loadtest-chat.js

# Target SLA: p95 < 3s, p99 < 6s, error rate < 3%
```
---

## Security & Performance

### Security (April 2026 Hardening)
- ✅ **IDOR Fixed** – History detail endpoints enforce owner filter (resource.userId === claims.sub)
- ✅ **Webhook Auth Bulletproof** – Length-safe comparison to prevent timingSafeEqual crash on malformed secrets
- ✅ **AI Call Resilience** – 15s timeout + exponential backoff retry for 408/429/5xx
- ✅ **Secrets in Key Vault** – Managed identity access, no secrets in code
- ✅ **Redis Caching** – SHA256-hashed keys (no plaintext queries stored), 4hr TTL
- ✅ **CORS Scoped** – Only gudangku.space + Vercel origins allowed (not wildcard)
- ✅ **APIM Throttle** – 120 req/min global, 30 req/min on /api/chat, /api/forecast (per-client IP)
- ✅ **JWT Verification** – Supabase HS256 + RS256 via JWKS, audience check, role-based access

### Performance Optimization
- ✅ **Query Optimization** – Admin list pagination, optional activity stats (N+1 query eliminated)
- ✅ **Forecast Rate Limit** – 4 uploads/min per user (prevent abuse/cost spikes)
- ✅ **Cosmos Partition Ready** – Env var support for container/PK migration to /userId (better scale)
- ✅ **Lazy Credit Eval** – No cron jobs, credits refresh on first daily hit
- ✅ **Built for Scale** – Tested to 100 concurrent users (p95 < 3s latency)

---

## License

Proprietary. All rights reserved.
