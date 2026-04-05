/**
 * POST /api/telegram/webhook — Telegram Bot webhook endpoint.
 * GET  /api/telegram/register — Register webhook URL with Telegram (admin-only, one-time).
 *
 * Secured via Telegram's X-Telegram-Bot-Api-Secret-Token header.
 */
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { handleTelegramUpdate, registerWebhook } from "../shared/telegramBot";
import { getSecret } from "../shared/keyVault";

/**
 * Webhook handler — receives updates from Telegram.
 * No JWT auth needed — verified by Telegram secret token.
 */
async function telegramWebhookHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // Verify Telegram secret token
    const expectedSecret = await getSecret("TELEGRAM-WEBHOOK-SECRET", "TELEGRAM_WEBHOOK_SECRET");
    const incomingSecret = req.headers.get("x-telegram-bot-api-secret-token") ?? "";

    if (incomingSecret !== expectedSecret) {
      context.warn("Telegram webhook: invalid secret token");
      return { status: 403, jsonBody: { error: "Forbidden" } };
    }

    const update = (await req.json()) as any;
    context.log("Telegram update received:", update.update_id);

    // Process asynchronously — respond 200 immediately to avoid Telegram retries
    handleTelegramUpdate(update).catch((err) => {
      context.error("Telegram update processing failed:", err);
    });

    return { status: 200, jsonBody: { ok: true } };
  } catch (err: any) {
    context.error("Telegram webhook error:", err);
    return { status: 200, jsonBody: { ok: true } }; // Always 200 to prevent Telegram retries
  }
}

app.http("telegramWebhook", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "api/telegram/webhook",
  handler: telegramWebhookHandler,
});

/**
 * One-time registration endpoint.
 * Call: GET /api/telegram/register?secret=<TELEGRAM_WEBHOOK_SECRET>
 */
async function telegramRegisterHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  // Simple secret guard (not full auth, just prevent random calls)
  const secret = req.query.get("secret") ?? "";
  const expectedSecret = await getSecret("TELEGRAM-WEBHOOK-SECRET", "TELEGRAM_WEBHOOK_SECRET");

  if (secret !== expectedSecret) {
    return { status: 403, jsonBody: { error: "Forbidden" } };
  }

  const host = process.env.WEBHOOK_HOST ?? "func-geosupplyguard-ts.azurewebsites.net";
  const webhookUrl = `https://${host}/api/telegram/webhook`;

  context.log("Registering Telegram webhook:", webhookUrl);

  try {
    const result = await registerWebhook(webhookUrl);
    return { status: 200, jsonBody: { message: result, webhook_url: webhookUrl } };
  } catch (err: any) {
    context.error("Webhook registration failed:", err);
    return { status: 500, jsonBody: { error: err.message } };
  }
}

app.http("telegramRegister", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "api/telegram/register",
  handler: telegramRegisterHandler,
});
