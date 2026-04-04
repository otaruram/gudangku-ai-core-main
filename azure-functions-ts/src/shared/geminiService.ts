/**
 * Gemini 2.5 Flash AI Service — with Redis caching.
 * Endpoint: ai.sumopod.com
 * Strict output: no markdown symbols, numbered bullet points only.
 */
import { getSecret } from "./keyVault";
import { getCachedResponse, setCachedResponse } from "./redisCache";

const SYSTEM_PROMPT = [
  "You are GeoSupplyGuard AI, a concise geopolitical supply chain risk analyst.",
  "",
  "STRICT OUTPUT RULES:",
  "1. Always respond in English.",
  "2. Use short numbered points (1. 2. 3.). Each point max 15 words.",
  "3. NEVER use markdown symbols: no asterisks (*), no hyphens (-), no underscores (_), no hash (#), no backticks.",
  "4. Use plain numbered lists only. No bullet characters of any kind.",
  "5. Keep total response under 200 words.",
  "6. Focus on actionable risk mitigation steps.",
  "7. Cite geopolitical events only when directly relevant (sanctions, conflicts, trade bans).",
  "8. For section headers use UPPERCASE TEXT followed by a colon, e.g. RISK ASSESSMENT:",
].join("\n");

interface GeminiResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
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
  const cacheKey = `${userPrompt}::${context}`.trim();
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
    max_tokens: 512,
    top_p: 0.8,
  };

  const url = `${baseUrl}/v1/chat/completions`;

  // 3. Call API
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

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
