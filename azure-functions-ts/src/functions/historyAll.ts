/**
 * GET /api/history/all — Merged timeline of forecasts and chats.
 */
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { withAuth, UserClaims } from "../shared/auth";
import { getContainer } from "../shared/cosmosClient";

interface TimelineItem {
  id: string;
  type: "forecast" | "chat";
  title: string;
  description: string;
  timestamp: string;
  status: string;
  metadata: Record<string, unknown>;
}

async function historyAllHandler(
  _req: HttpRequest,
  context: InvocationContext,
  claims: UserClaims
): Promise<HttpResponseInit> {
  try {
    const timeline: TimelineItem[] = [];

    // Forecasts
    const fc = getContainer("prediction_history");
    const { resources: forecasts } = await fc.items
      .query({
        query: "SELECT TOP 50 * FROM c WHERE c.userId = @uid ORDER BY c.createdAt DESC",
        parameters: [{ name: "@uid", value: claims.sub }],
      })
      .fetchAll();

    for (const f of forecasts) {
      const plot = f.plotData ?? {};
      const productCount = Object.keys(plot.best_sellers ?? {}).length;
      timeline.push({
        id: f.id,
        type: "forecast",
        title: `Stock Analysis: ${f.filename ?? "N/A"}`,
        description: `Prediction for ${productCount} products`,
        timestamp: f.createdAt ?? "",
        status: "success",
        metadata: { accuracy: 92.4, products: productCount },
      });
    }

    // Chats
    const cl = getContainer("chat_logs");
    const { resources: chats } = await cl.items
      .query({
        query: "SELECT TOP 50 * FROM c WHERE c.userId = @uid ORDER BY c.createdAt DESC",
        parameters: [{ name: "@uid", value: claims.sub }],
      })
      .fetchAll();

    for (const c of chats) {
      const q: string = c.question ?? "";
      timeline.push({
        id: c.id,
        type: "chat",
        title: "Supply Chain Consultation",
        description: q.length > 50 ? q.slice(0, 50) + "..." : q,
        timestamp: c.createdAt ?? "",
        status: "success",
        metadata: { messages: 1, cached: c.cached ?? false },
      });
    }

    timeline.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return { status: 200, jsonBody: timeline };
  } catch (err: any) {
    context.error("History all error:", err);
    return { status: 500, jsonBody: { error: err.message } };
  }
}

app.http("historyAll", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "api/history/all",
  handler: withAuth(historyAllHandler),
});
