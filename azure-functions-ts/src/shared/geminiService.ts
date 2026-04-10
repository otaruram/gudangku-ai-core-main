/**
 * Gemini 2.5 Flash AI Service — with Redis caching.
 * Endpoint: ai.sumopod.com
 * Strict output: no markdown symbols, numbered bullet points only.
 */
import { getSecret } from "./keyVault";
import { getCachedResponse, setCachedResponse } from "./redisCache";

const SYSTEM_PROMPT = [
  "You are GeoSupplyGuard AI, a supply chain intelligence analyst for warehouse and inventory management.",
  "",
  "OUTPUT RULES:",
  "1. Always respond in English.",
  "2. Use numbered points (1. 2. 3.) for lists.",
  "3. NEVER use markdown symbols: no asterisks (*), no hyphens (-), no underscores (_), no hash (#), no backticks.",
  "4. Use plain numbered lists only. No bullet characters of any kind.",
  "5. Keep responses thorough but concise (300-500 words max).",
  "6. Focus on actionable recommendations with specific numbers.",
  "7. When given CSV data context, reference specific products, stock levels, and sales figures.",
  "8. For section headers use UPPERCASE TEXT followed by a colon, e.g. RISK ASSESSMENT:",
  "9. Always complete your analysis. Never stop mid-sentence.",
].join("\n");

interface GeminiResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

// Bump when prompt/format/token settings change to avoid stale cached responses.
const CACHE_VERSION = "v2_2048_tokens";
const REQUEST_TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetryStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

async function postWithRetry(
  url: string,
  payload: unknown,
  apiKey: string
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (res.ok) return res;

      if (!shouldRetryStatus(res.status) || attempt === MAX_RETRIES) {
        return res;
      }

      await sleep(300 * Math.pow(2, attempt));
      continue;
    } catch (err: any) {
      lastError = err;
      if (attempt === MAX_RETRIES) {
        break;
      }
      await sleep(300 * Math.pow(2, attempt));
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(`Gemini API request failed after retries: ${lastError?.message ?? "unknown error"}`);
}

/**
 * Call Gemini 2.5 Flash via Sumopod OpenAI-compatible API, with Redis caching.
 * If an identical query was answered within TTL (4h), return cached result.
 */
export async function callGemini(
  userPrompt: string,
  context: string = ""
): Promise<{ text: string; cached: boolean }> {
  // 1. Check Redis cache
  const cacheKey = `${CACHE_VERSION}::${userPrompt}::${context}`.trim();
  const cached = await getCachedResponse(cacheKey);
  if (cached) {
    return { text: cached, cached: true };
  }

  // 2. Build request (OpenAI-compatible format for Sumopod)
  const apiKey = await getSecret("SUMOPOD-API-KEY", "SUMOPOD_API_KEY");
  let baseUrl = await getSecret("SUMOPOD-BASE-URL", "SUMOPOD_BASE_URL");
  if (!baseUrl.startsWith("http")) baseUrl = `https://${baseUrl}`;

  const payload = {
    model: "gemini/gemini-2.5-flash",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: context ? `CONTEXT DATA:\n${context}\n\nQUESTION:\n${userPrompt}` : userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 2048,
    top_p: 0.8,
  };

  const url = `${baseUrl}/v1/chat/completions`;

  // 3. Call API with timeout + retries for transient failures
  const res = await postWithRetry(url, payload, apiKey);

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errBody}`);
  }

  const data = (await res.json()) as GeminiResponse;
  const text =
    data.choices?.[0]?.message?.content ??
    "Unable to generate analysis. Please try again.";

  // 4. Cache the response (4 hours TTL)
  await setCachedResponse(cacheKey, text, 4 * 60 * 60);

  return { text, cached: false };
}
