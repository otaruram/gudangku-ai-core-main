/**
 * Admin API endpoints — restricted to admin role.
 *
 * GET  /api/admin/users           — List all users with stats
 * GET  /api/admin/users/:id       — Get single user detail
 * PUT  /api/admin/users/:id/ban   — Ban/unban a user
 * PUT  /api/admin/users/:id/credits — Set user credits
 * DELETE /api/admin/users/:id     — Delete user account
 * GET  /api/admin/stats           — Platform overview stats
 */
import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { withAuth, UserClaims, corsHeaders } from "../shared/auth";
import { getContainer } from "../shared/cosmosClient";
import { getCredits, UserDocument } from "../shared/creditSystem";

/** Check if caller is admin */
async function requireAdmin(
  claims: UserClaims,
  req: HttpRequest
): Promise<HttpResponseInit | null> {
  const user = await getCredits(claims.sub, claims.email);
  if (user.role !== "admin") {
    return {
      status: 403,
      headers: corsHeaders(req),
      jsonBody: { error: "Forbidden — admin access only" },
    };
  }
  return null;
}

// ===================== GET /api/admin/users =====================
async function listUsersHandler(
  req: HttpRequest,
  context: InvocationContext,
  claims: UserClaims
): Promise<HttpResponseInit> {
  const forbidden = await requireAdmin(claims, req);
  if (forbidden) return forbidden;

  const container = getContainer("users");
  const { resources } = await container.items
    .query<UserDocument>("SELECT * FROM c ORDER BY c.last_refresh_date DESC")
    .fetchAll();

  // Get recent activity counts
  const chatContainer = getContainer("chat_logs");
  const forecastContainer = getContainer("prediction_history");

  const users = await Promise.all(
    resources.map(async (u) => {
      // Count chats
      const { resources: chatCount } = await chatContainer.items
        .query({ query: "SELECT VALUE COUNT(1) FROM c WHERE c.user_id = @uid", parameters: [{ name: "@uid", value: u.id }] })
        .fetchAll();
      // Count forecasts
      const { resources: forecastCount } = await forecastContainer.items
        .query({ query: "SELECT VALUE COUNT(1) FROM c WHERE c.user_id = @uid", parameters: [{ name: "@uid", value: u.id }] })
        .fetchAll();

      return {
        id: u.id,
        email: u.email ?? "unknown",
        current_credits: u.current_credits,
        last_refresh_date: u.last_refresh_date,
        role: u.role ?? "user",
        banned: u.banned ?? false,
        total_chats: chatCount[0] ?? 0,
        total_forecasts: forecastCount[0] ?? 0,
      };
    })
  );

  return {
    status: 200,
    jsonBody: { users, total: users.length },
  };
}

// ===================== GET /api/admin/stats =====================
async function statsHandler(
  req: HttpRequest,
  context: InvocationContext,
  claims: UserClaims
): Promise<HttpResponseInit> {
  const forbidden = await requireAdmin(claims, req);
  if (forbidden) return forbidden;

  const usersContainer = getContainer("users");
  const chatContainer = getContainer("chat_logs");
  const forecastContainer = getContainer("prediction_history");

  const [userCount, chatCount, forecastCount, activeToday] = await Promise.all([
    usersContainer.items.query("SELECT VALUE COUNT(1) FROM c").fetchAll(),
    chatContainer.items.query("SELECT VALUE COUNT(1) FROM c").fetchAll(),
    forecastContainer.items.query("SELECT VALUE COUNT(1) FROM c").fetchAll(),
    usersContainer.items.query({
      query: "SELECT VALUE COUNT(1) FROM c WHERE c.last_refresh_date = @today",
      parameters: [{ name: "@today", value: new Date().toISOString().slice(0, 10) }],
    }).fetchAll(),
  ]);

  // Count banned users
  const bannedCount = await usersContainer.items
    .query("SELECT VALUE COUNT(1) FROM c WHERE c.banned = true")
    .fetchAll();

  return {
    status: 200,
    jsonBody: {
      total_users: userCount.resources[0] ?? 0,
      active_today: activeToday.resources[0] ?? 0,
      total_chats: chatCount.resources[0] ?? 0,
      total_forecasts: forecastCount.resources[0] ?? 0,
      banned_users: bannedCount.resources[0] ?? 0,
    },
  };
}

// ===================== PUT /api/admin/users/:id/ban =====================
async function banUserHandler(
  req: HttpRequest,
  context: InvocationContext,
  claims: UserClaims
): Promise<HttpResponseInit> {
  const forbidden = await requireAdmin(claims, req);
  if (forbidden) return forbidden;

  const userId = req.params.id;
  if (!userId) return { status: 400, jsonBody: { error: "Missing user ID" } };

  // Prevent self-ban
  if (userId === claims.sub) {
    return { status: 400, jsonBody: { error: "Cannot ban yourself" } };
  }

  const body = (await req.json()) as { banned: boolean };
  const container = getContainer("users");

  try {
    const { resource } = await container.item(userId, userId).read<UserDocument>();
    if (!resource) return { status: 404, jsonBody: { error: "User not found" } };
    if (resource.role === "admin") {
      return { status: 400, jsonBody: { error: "Cannot ban an admin" } };
    }

    resource.banned = body.banned;
    await container.item(userId, userId).replace(resource);

    return {
      status: 200,
      jsonBody: { message: `User ${body.banned ? "banned" : "unbanned"}`, user_id: userId },
    };
  } catch {
    return { status: 404, jsonBody: { error: "User not found" } };
  }
}

// ===================== PUT /api/admin/users/:id/credits =====================
async function setCreditsHandler(
  req: HttpRequest,
  context: InvocationContext,
  claims: UserClaims
): Promise<HttpResponseInit> {
  const forbidden = await requireAdmin(claims, req);
  if (forbidden) return forbidden;

  const userId = req.params.id;
  if (!userId) return { status: 400, jsonBody: { error: "Missing user ID" } };

  const body = (await req.json()) as { credits: number };
  if (typeof body.credits !== "number" || body.credits < 0) {
    return { status: 400, jsonBody: { error: "credits must be a non-negative number" } };
  }

  const container = getContainer("users");
  try {
    const { resource } = await container.item(userId, userId).read<UserDocument>();
    if (!resource) return { status: 404, jsonBody: { error: "User not found" } };

    resource.current_credits = body.credits;
    await container.item(userId, userId).replace(resource);

    return {
      status: 200,
      jsonBody: { message: "Credits updated", user_id: userId, current_credits: body.credits },
    };
  } catch {
    return { status: 404, jsonBody: { error: "User not found" } };
  }
}

// ===================== DELETE /api/admin/users/:id =====================
async function deleteUserHandler(
  req: HttpRequest,
  context: InvocationContext,
  claims: UserClaims
): Promise<HttpResponseInit> {
  const forbidden = await requireAdmin(claims, req);
  if (forbidden) return forbidden;

  const userId = req.params.id;
  if (!userId) return { status: 400, jsonBody: { error: "Missing user ID" } };

  if (userId === claims.sub) {
    return { status: 400, jsonBody: { error: "Cannot delete yourself" } };
  }

  const container = getContainer("users");
  try {
    const { resource } = await container.item(userId, userId).read<UserDocument>();
    if (!resource) return { status: 404, jsonBody: { error: "User not found" } };
    if (resource.role === "admin") {
      return { status: 400, jsonBody: { error: "Cannot delete an admin account" } };
    }

    await container.item(userId, userId).delete();
    return { status: 200, jsonBody: { message: "User deleted", user_id: userId } };
  } catch {
    return { status: 404, jsonBody: { error: "User not found" } };
  }
}

// ===================== Register routes =====================
app.http("adminListUsers", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "api/admin/users",
  handler: withAuth(listUsersHandler),
});

app.http("adminStats", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "api/admin/stats",
  handler: withAuth(statsHandler),
});

app.http("adminBanUser", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "api/admin/users/{id}/ban",
  handler: withAuth(banUserHandler),
});

app.http("adminSetCredits", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "api/admin/users/{id}/credits",
  handler: withAuth(setCreditsHandler),
});

app.http("adminDeleteUser", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "api/admin/users/{id}",
  handler: withAuth(deleteUserHandler),
});
