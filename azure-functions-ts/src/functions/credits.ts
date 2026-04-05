/**
 * GET /api/credits — Check current credit balance.
 * POST /api/telegram/link — Generate a Telegram link code for the authenticated user.
 */
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { withAuth, UserClaims } from "../shared/auth";
import { getCredits } from "../shared/creditSystem";
import { getContainer } from "../shared/cosmosClient";

async function creditsHandler(
  _req: HttpRequest,
  context: InvocationContext,
  claims: UserClaims
): Promise<HttpResponseInit> {
  try {
    const user = await getCredits(claims.sub, claims.email);
    return {
      status: 200,
      jsonBody: {
        user_id: user.id,
        current_credits: user.current_credits,
        last_refresh_date: user.last_refresh_date,
        daily_quota: user.role === "admin" ? "unlimited" : 10,
        role: user.role ?? "user",
        telegram_linked: !!user.telegramChatId,
      },
    };
  } catch (err: any) {
    context.error("Credits check error:", err);
    return { status: 500, jsonBody: { error: err.message } };
  }
}

app.http("credits", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "api/credits",
  handler: withAuth(creditsHandler),
});

/**
 * Generate a one-time Telegram link code.
 */
async function telegramLinkHandler(
  _req: HttpRequest,
  context: InvocationContext,
  claims: UserClaims
): Promise<HttpResponseInit> {
  try {
    const container = getContainer("users");
    const user = await getCredits(claims.sub, claims.email);

    // Check if already linked
    if ((user as any).telegramChatId) {
      return {
        status: 200,
        jsonBody: { already_linked: true, message: "Akun Telegram sudah terhubung." },
      };
    }

    // Generate a short 6-char code
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();

    // Save to user doc
    const { resource } = await container.item(claims.sub, claims.sub).read();
    if (resource) {
      resource.telegramLinkCode = code;
      await container.item(claims.sub, claims.sub).replace(resource);
    }

    return {
      status: 200,
      jsonBody: {
        code,
        bot_url: "https://t.me/Kang_Supply_Bot",
        instruction: `Buka @Kang_Supply_Bot di Telegram, lalu ketik: /link ${code}`,
      },
    };
  } catch (err: any) {
    context.error("Telegram link error:", err);
    return { status: 500, jsonBody: { error: err.message } };
  }
}

app.http("telegramLink", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "api/telegram/link",
  handler: withAuth(telegramLinkHandler),
});
