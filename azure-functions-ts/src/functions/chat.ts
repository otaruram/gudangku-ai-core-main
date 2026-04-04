/**
 * POST /api/chat — AI-powered supply chain assistant.
 * Smart caching: cache hits are FREE (no credits consumed).
 * Rate limited: 10 requests/minute per user.
 */
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { withAuth, UserClaims } from "../shared/auth";
import { callGemini } from "../shared/geminiService";
import { consumeCredits, getCredits, CreditError } from "../shared/creditSystem";
import { checkRateLimit } from "../shared/redisCache";
import { getContainer } from "../shared/cosmosClient";
import { v4 as uuidv4 } from "uuid";

async function chatHandler(
  req: HttpRequest,
  context: InvocationContext,
  claims: UserClaims
): Promise<HttpResponseInit> {
  try {
    // 1. Rate limit check (10 req/min per user)
    const rateCheck = await checkRateLimit(claims.sub, 60, 10);
    if (!rateCheck.allowed) {
      return {
        status: 429,
        jsonBody: {
          error: "Rate limit exceeded. Please wait before sending another request.",
          retry_after_ms: rateCheck.retryAfterMs,
        },
      };
    }

    // 2. Parse request
    let question: string | undefined;

    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = (await req.json()) as { question?: string };
      question = body.question;
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      question = formData.get("question")?.toString();
    }

    if (!question) {
      return {
        status: 400,
        jsonBody: { error: "Missing 'question' field" },
      };
    }

    // 3. Call Gemini (checks Redis cache internally)
    const { text: answer, cached } = await callGemini(question);

    // 4. Only deduct credits when cache MISS (actual API call)
    let currentCredits: number;
    if (cached) {
      // Cache hit = FREE — just read balance
      const userDoc = await getCredits(claims.sub, claims.email);
      currentCredits = userDoc.current_credits;
    } else {
      // Cache miss = deduct 3 credits
      try {
        const userDoc = await consumeCredits(claims.sub, "supply_chain_ai", claims.email);
        currentCredits = userDoc.current_credits;
      } catch (err) {
        if (err instanceof CreditError) {
          return {
            status: 429,
            jsonBody: {
              error: err.message,
              remaining_credits: err.remaining,
              required_credits: err.required,
            },
          };
        }
        throw err;
      }
    }

    // 5. Persist chat log to Cosmos
    try {
      const container = getContainer("chat_logs");
      await container.items.create({
        id: uuidv4(),
        userId: claims.sub,
        question,
        answer,
        cached,
        creditCharged: cached ? 0 : 3,
        isHelpful: true,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      context.warn("Failed to save chat log: " + err);
    }

    return {
      status: 200,
      jsonBody: {
        response: answer,
        cached,
        remaining_credits: currentCredits,
        credit_charged: cached ? 0 : 3,
      },
    };
  } catch (err: any) {
    context.error("Chat function error:", err);
    return {
      status: 500,
      jsonBody: { error: err.message },
    };
  }
}

app.http("chat", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "api/chat",
  handler: withAuth(chatHandler),
});
