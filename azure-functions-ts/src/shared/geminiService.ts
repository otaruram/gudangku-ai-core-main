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
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

/**
 * Call Gemini 2.5 Flash with Redis caching.
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

  // 2. Build request
  const apiKey = await getSecret("SUMOPOD-API-KEY", "SUMOPOD_API_KEY");
  let baseUrl = await getSecret("SUMOPOD-BASE-URL", "SUMOPOD_BASE_URL");
  if (!baseUrl.startsWith("http")) baseUrl = `https://${baseUrl}`;

  const fullPrompt = `${SYSTEM_PROMPT}\n\nCONTEXT DATA:\n${context}\n\nUSER QUESTION:\n${userPrompt}`;

  const payload = {
    contents: [{ parts: [{ text: fullPrompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 512,
      topP: 0.8,
    },
  };

  const url = `${baseUrl}/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  // 3. Call Gemini
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errBody}`);
  }

  const data = (await res.json()) as GeminiResponse;
  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text ??
    "Unable to generate analysis. Please try again.";

  // 4. Cache the response (4 hours TTL)
  await setCachedResponse(cacheKey, text, 4 * 60 * 60);

  return { text, cached: false };
}
