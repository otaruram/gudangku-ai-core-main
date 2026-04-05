/**
 * POST /auth/webhook — Supabase Auth webhook trigger.
 *
 * Supabase sends a signed POST request when auth events occur.
 * We listen for INSERT on auth.users (new signup) and send a welcome email.
 *
 * Signature verification: Supabase signs request with a shared secret
 * via HMAC-SHA256 (header: x-supabase-signature).
 */
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import * as crypto from "crypto";
import { getSecret } from "../shared/keyVault";
import { sendWelcomeEmail } from "../shared/emailService";

app.http("authWebhook", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth/webhook",
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    // 1. Read raw body for signature verification
    const rawBody = await req.text();

    // 2. Verify Supabase webhook signature
    let webhookSecret: string;
    try {
      webhookSecret = await getSecret("SUPABASE-WEBHOOK-SECRET", "SUPABASE_WEBHOOK_SECRET");
    } catch {
      console.error("authWebhook: SUPABASE-WEBHOOK-SECRET not configured");
      return { status: 500, jsonBody: { error: "Webhook secret not configured" } };
    }

    const signature = req.headers.get("x-supabase-signature") ?? "";
    const hmac = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature))) {
      console.warn("authWebhook: invalid signature");
      return { status: 401, jsonBody: { error: "Invalid signature" } };
    }

    // 3. Parse event
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return { status: 400, jsonBody: { error: "Invalid JSON" } };
    }

    // 4. Only handle INSERT on auth.users (new signup)
    const table: string = event?.table ?? "";
    const eventType: string = event?.type ?? "";
    if (table !== "users" || eventType !== "INSERT") {
      // Acknowledge without acting — Supabase may send other events
      return { status: 200, jsonBody: { received: true } };
    }

    const record = event?.record ?? {};
    const email: string = record.email ?? "";
    const name: string =
      record.raw_user_meta_data?.full_name ??
      record.raw_user_meta_data?.name ??
      "";

    if (!email) {
      console.warn("authWebhook: INSERT event missing email", record);
      return { status: 200, jsonBody: { received: true } };
    }

    // 5. Fire and forget — don't fail the webhook if email errors
    sendWelcomeEmail(email, name || undefined).catch((err) =>
      console.error("authWebhook: sendWelcomeEmail error:", err)
    );

    console.log(`authWebhook: welcome email queued for ${email}`);
    return { status: 200, jsonBody: { received: true } };
  },
});
