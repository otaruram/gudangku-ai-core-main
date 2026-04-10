/**
 * GET /api/history/forecast/{id} — Specific forecast record.
 * GET /api/history/chat/{id} — Specific chat log.
 */
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { withAuth, UserClaims } from "../shared/auth";
import { getContainer } from "../shared/cosmosClient";

async function forecastDetailHandler(
  req: HttpRequest,
  _context: InvocationContext,
  claims: UserClaims
): Promise<HttpResponseInit> {
  const id = req.params.id;
  if (!id) return { status: 400, jsonBody: { error: "Missing id" } };

  try {
    const container = getContainer("prediction_history");
    const { resources } = await container.items
      .query({
        query: "SELECT TOP 1 * FROM c WHERE c.id = @id AND c.userId = @uid",
        parameters: [
          { name: "@id", value: id },
          { name: "@uid", value: claims.sub },
        ],
      })
      .fetchAll();
    const resource = resources?.[0];
    if (!resource) return { status: 404, jsonBody: { error: "Forecast not found" } };

    // Prevent IDOR: only owner can read this record
    if (resource.userId !== claims.sub) {
      return { status: 403, jsonBody: { error: "Forbidden" } };
    }

    return { status: 200, jsonBody: resource };
  } catch {
    return { status: 404, jsonBody: { error: "Forecast not found" } };
  }
}

async function chatDetailHandler(
  req: HttpRequest,
  _context: InvocationContext,
  claims: UserClaims
): Promise<HttpResponseInit> {
  const id = req.params.id;
  if (!id) return { status: 400, jsonBody: { error: "Missing id" } };

  try {
    const container = getContainer("chat_logs");
    const { resources } = await container.items
      .query({
        query: "SELECT TOP 1 * FROM c WHERE c.id = @id AND c.userId = @uid",
        parameters: [
          { name: "@id", value: id },
          { name: "@uid", value: claims.sub },
        ],
      })
      .fetchAll();
    const resource = resources?.[0];
    if (!resource) return { status: 404, jsonBody: { error: "Chat log not found" } };

    // Prevent IDOR: only owner can read this record
    if (resource.userId !== claims.sub) {
      return { status: 403, jsonBody: { error: "Forbidden" } };
    }

    return { status: 200, jsonBody: resource };
  } catch {
    return { status: 404, jsonBody: { error: "Chat log not found" } };
  }
}

app.http("historyForecastDetail", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "api/history/forecast/{id}",
  handler: withAuth(forecastDetailHandler),
});

app.http("historyChatDetail", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "api/history/chat/{id}",
  handler: withAuth(chatDetailHandler),
});
