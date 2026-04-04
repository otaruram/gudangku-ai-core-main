# LEARNING.md — GeoSupplyGuard Technical Guide

> Architecture decisions, patterns, and lessons learned during the migration from FastAPI to Azure Serverless

---

## 1. Architecture Evolution

### Before (v1 — FastAPI + Render)
- Python FastAPI monolith on Render free tier
- Prisma ORM → Supabase PostgreSQL
- Groq LLaMA for AI, Prophet for forecasting
- Cold starts: ~30s on free tier

### After (v2 — Azure Serverless)
- Azure Functions v4 (Node.js/TypeScript)
- Cosmos DB NoSQL (serverless containers)
- Gemini 2.5 Flash via custom endpoint
- Azure Redis Cache for AI response deduplication
- Azure Key Vault for secrets (managed identity)
- APIM Consumption tier for rate limiting
- Vercel Edge proxy to hide backend URL

---

## 2. Key Design Decisions

### Why Azure Functions over FastAPI on Render?
- **True serverless**: pay per execution, no cold starts on Consumption plan
- **Managed scaling**: handles bursts without container orchestration
- **Integrated ecosystem**: Key Vault, APIM, Cosmos DB all in same resource group
- **Managed identity**: no credential rotation headaches

### Why Cosmos DB over PostgreSQL?
- **Schemaless**: chat logs and prediction history have variable shapes
- **Serverless mode**: auto-scale to zero, no provisioned throughput waste
- **Partition keys**: natural partitioning by user ID
- **Azure-native**: direct SDK, no ORM needed

### Why Vercel Edge Proxy?
- **Security**: Azure APIM URL never exposed to browser DevTools
- **Same-origin**: no CORS issues, cookies work naturally
- **Edge performance**: proxy runs at nearest Vercel PoP

### Why Redis Caching?
- **Cost reduction**: identical AI queries return cached responses (4hr TTL)
- **SHA256 keys**: cache key = hash of `{model}:{systemPrompt}:{userMessage}`
- **Graceful degradation**: if Redis is down, queries still go to AI directly

---

## 3. Credit System Design

```
Daily Quota: 10 credits
OCR analysis: 1 credit
AI supply chain analysis: 3 credits

Lazy evaluation:
1. User calls /api/credits or /api/chat
2. System checks Cosmos DB users container
3. If no user doc → create with 10 credits
4. If last_refresh_date < today → reset to 10
5. Deduct credits only on successful AI call
```

Benefits of lazy evaluation:
- No cron jobs or timer triggers needed
- User record created on first API call
- Credits auto-reset on first daily request

---

## 4. Security Layers

| Layer | Implementation |
|-------|---------------|
| Auth | Supabase JWT (HS256) verified server-side |
| Secrets | Azure Key Vault with managed identity RBAC |
| Rate Limit | APIM policy: 5 req/min per subscription |
| Backend URL | Hidden behind Vercel Edge proxy |
| Cache Keys | SHA256 hashed (no plaintext queries) |
| CORS | Configured at APIM level |
| Env vars | `.env` and `local.settings.json` gitignored |

---

## 5. Azure Functions v4 Node.js Model

Key patterns used:

```typescript
// Function registration (src/functions/chat.ts)
import { app } from "@azure/functions";

app.http("chat", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "api/chat",
  handler: withAuth(chatHandler),
});
```

```typescript
// Auth middleware HOF (src/shared/auth.ts)
export function withAuth(handler) {
  return async (request, context) => {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const claims = jwt.verify(token, secret);
    // Inject claims into handler
    return handler(request, context, claims);
  };
}
```

```typescript
// Entry point (src/index.ts) — must import ALL function files
import "./functions/health";
import "./functions/chat";
import "./functions/credits";
// ... etc
```

### Deployment gotcha
- `main` in package.json must point to compiled entry: `"main": "dist/src/index.js"`
- `node_modules` must be included in deploy package (not gitignored in .funcignore)
- Use `func azure functionapp publish <name> --javascript` for Node.js

---

## 6. Cosmos DB Patterns

```typescript
// Singleton client (src/shared/cosmosClient.ts)
const client = new CosmosClient({ endpoint, key });
const database = client.database("geosupplyguard");

export const containers = {
  users: database.container("users"),
  chatLogs: database.container("chat_logs"),
  predictions: database.container("prediction_history"),
};
```

Containers use `/id` as partition key for simplicity. Query pattern:

```typescript
const { resources } = await containers.chatLogs.items
  .query({
    query: "SELECT * FROM c WHERE c.userId = @userId ORDER BY c._ts DESC",
    parameters: [{ name: "@userId", value: userId }],
  })
  .fetchAll();
```

---

## 7. Lessons Learned

1. **PowerShell + Key Vault references**: Use `az --%` stop-parsing token when setting app settings with parentheses/semicolons
2. **Provider registration**: `Microsoft.Cache` must be registered before creating Redis (`az provider register --namespace Microsoft.Cache`)
3. **APIM Consumption SKU**: Does NOT support `rate-limit-by-key` policy — use `rate-limit` instead
4. **CORS with credentials**: Cannot use `*` origin with `allow-credentials="true"` in APIM
5. **Azure Functions cold start**: First request after idle may take 5-10s on Consumption plan
6. **Redis provisioning**: Takes ~15-20 minutes; deploy Function App while waiting
7. **TypeScript strict mode**: `res.json()` returns `unknown` — use `as T` type assertion
8. **VITE env vars**: Only `VITE_*` prefix vars are exposed to browser bundle — backend URLs should NEVER have this prefix

---

## 8. Cost Optimization

| Service | Tier | Monthly Est. |
|---------|------|-------------|
| Functions | Consumption | ~$0 (1M free executions) |
| Cosmos DB | Serverless | ~$0-2 (low traffic) |
| Redis | Basic C0 | ~$16 |
| APIM | Consumption | ~$3.50/million calls |
| Key Vault | Standard | ~$0.03/10K operations |
| **Total** | | **~$20/month** |

Redis is the biggest cost. For hackathon demo, can disable Redis caching and save ~$16/month.
