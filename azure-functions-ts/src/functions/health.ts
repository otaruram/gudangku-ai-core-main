/**
 * GET /health — Public health check endpoint.
 */
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";

app.http("health", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "health",
  handler: async (_req: HttpRequest): Promise<HttpResponseInit> => {
    return {
      status: 200,
      jsonBody: {
        status: "GeoSupplyGuard API is Online",
        version: "2.0.0",
        runtime: "node",
      },
    };
  },
});
