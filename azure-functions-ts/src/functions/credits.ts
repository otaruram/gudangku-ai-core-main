/**
 * GET /api/credits — Check current credit balance.
 */
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { withAuth, UserClaims } from "../shared/auth";
import { getCredits } from "../shared/creditSystem";

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
