# Load Test Quick Guide (k6)

## 1) Install k6

Windows (Chocolatey):

```powershell
choco install k6 -y
```

## 2) Run baseline chat load test

Set a valid Supabase JWT token first:

```powershell
$env:SUPABASE_JWT = "<valid-jwt>"
$env:BASE_URL = "https://func-geosupplyguard-ts.azurewebsites.net"
k6 run scripts/loadtest-chat.js
```

## 3) Useful overrides

```powershell
$env:QUESTION = "How to optimize reorder point for rice product?"
k6 run scripts/loadtest-chat.js
```

## 4) What to monitor while test runs

- Azure Function: CPU, memory, instance count, 5xx, p95 latency
- Cosmos DB: RU consumption, throttles (429), query latency
- Redis: connections, CPU, failed commands
- Upstream AI provider error rate and latency

## 5) Initial pass/fail target

- http_req_failed < 3%
- p95 latency < 3000 ms
- p99 latency < 6000 ms

If it fails, reduce expensive endpoint limits or increase plan capacity before heavy campaigns.
