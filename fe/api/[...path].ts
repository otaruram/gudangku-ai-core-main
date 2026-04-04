export const config = {
  runtime: "edge",
};

export default async function handler(request: Request) {
  const API_URL = process.env.API_URL;

  if (!API_URL) {
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\//, "");
  const targetUrl = `${API_URL}/${path}${url.search}`;

  // Forward only safe headers
  const headers = new Headers();
  const forwardHeaders = ["authorization", "content-type", "accept"];
  for (const key of forwardHeaders) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body:
      request.method !== "GET" && request.method !== "HEAD"
        ? request.body
        : undefined,
    // @ts-expect-error -- required for streaming body in edge runtime
    duplex: "half",
  });

  // Forward response with CORS headers
  const responseHeaders = new Headers();
  responseHeaders.set(
    "Content-Type",
    response.headers.get("Content-Type") || "application/json"
  );
  responseHeaders.set("Access-Control-Allow-Origin", "*");
  responseHeaders.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  responseHeaders.set(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type"
  );

  // Handle preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: responseHeaders });
  }

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}
