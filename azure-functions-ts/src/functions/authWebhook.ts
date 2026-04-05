/**
 * POST /auth/webhook — Supabase Database Webhook trigger.
 *
 * Supabase sends a POST request on auth.users INSERT (new signup).
 * Authentication: simple shared secret via x-webhook-secret header.
 *
 * Payload shape (Supabase Database Webhooks):
 *   { type: "INSERT", table: "users", schema: "auth", record: { id, email, raw_user_meta_data, ... } }
 */
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import * as crypto from "crypto";
import { getSecret } from "../shared/keyVault";
import { sendWelcomeEmail } from "../shared/emailService";
import { getContainer } from "../shared/cosmosClient";

app.http("authWebhook", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth/webhook",
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    // 1. Verify shared secret from x-webhook-secret header
    let webhookSecret: string;
    try {
      webhookSecret = await getSecret("SUPABASE-WEBHOOK-SECRET", "SUPABASE_WEBHOOK_SECRET");
    } catch {
      console.error("authWebhook: SUPABASE-WEBHOOK-SECRET not configured");
      return { status: 500, jsonBody: { error: "Webhook secret not configured" } };
    }

    const incomingSecret = req.headers.get("x-webhook-secret") ?? "";
    if (
      !incomingSecret ||
      !crypto.timingSafeEqual(
        Buffer.from(webhookSecret),
        Buffer.from(incomingSecret)
      )
    ) {
      console.warn("authWebhook: invalid or missing x-webhook-secret");
      return { status: 401, jsonBody: { error: "Unauthorized" } };
    }

    // 2. Parse body
    let event: any;
    try {
      const rawBody = await req.text();
      event = JSON.parse(rawBody);
    } catch {
      return { status: 400, jsonBody: { error: "Invalid JSON" } };
    }

    // 3. Only handle INSERT on auth.users (new signup)
    const table: string = event?.table ?? "";
    const eventType: string = event?.type ?? "";
    if (table !== "users" || eventType !== "INSERT") {
      // Acknowledge without acting — Supabase may send other events
      return { status: 200, jsonBody: { received: true } };
    }

    const record = event?.record ?? {};
    const userId: string = record.id ?? "";
    const email: string = record.email ?? "";
    const name: string =
      record.raw_user_meta_data?.full_name ??
      record.raw_user_meta_data?.name ??
      "";

    if (!userId || !email) {
      console.warn("authWebhook: INSERT event missing email", record);
      return { status: 200, jsonBody: { received: true } };
    }

    try {
      const container = getContainer("users");
      const { resource } = await container.item(userId, userId).read<any>();
      if (!resource) {
        await container.items.create({
          id: userId,
          email,
          current_credits: 10,
          last_refresh_date: new Date().toISOString().slice(0, 10),
          role: "user",
          welcomeEmailSent: true,
        });
      } else if (!resource.welcomeEmailSent) {
        await container.item(userId, userId).replace({
          ...resource,
          email: resource.email ?? email,
          welcomeEmailSent: true,
        });
      }
    } catch (err) {
      console.error("authWebhook: failed to bootstrap user document:", err);
    }

    // 5. Fire and forget — don't fail the webhook if email errors
    sendWelcomeEmail(email, name || undefined).catch((err) =>
      console.error("authWebhook: sendWelcomeEmail error:", err)
    );

    console.log(`authWebhook: welcome email queued for ${email}`);
    return { status: 200, jsonBody: { received: true } };
  },
});
