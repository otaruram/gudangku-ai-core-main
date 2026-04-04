/**
 * POST /api/chat — AI-powered geopolitical supply chain assistant.
 * Uses Redis caching + Credit system (3 credits per call).
 */
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { withAuth, UserClaims } from "../shared/auth";
import { callGemini } from "../shared/geminiService";
import { consumeCredits, CreditError } from "../shared/creditSystem";
import { getContainer } from "../shared/cosmosClient";
import { v4 as uuidv4 } from "uuid";

async function chatHandler(
  req: HttpRequest,
  context: InvocationContext,
  claims: UserClaims
): Promise<HttpResponseInit> {
  try {
    // 1. Parse request
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

    // 2. Check & deduct credits (supply_chain_ai = 3 credits)
    let userDoc;
    try {
      userDoc = await consumeCredits(claims.sub, "supply_chain_ai");
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

    // 3. Call Gemini (with Redis cache)
    const { text: answer, cached } = await callGemini(question);

    // 4. Persist chat log to Cosmos
    try {
      const container = getContainer("chat_logs");
      await container.items.create({
        id: uuidv4(),
        userId: claims.sub,
        question,
        answer,
        cached,
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
        remaining_credits: userDoc.current_credits,
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
