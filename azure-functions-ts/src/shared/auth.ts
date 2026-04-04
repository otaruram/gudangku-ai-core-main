/**
 * JWT authentication middleware for Azure Functions v4.
 * Supports Supabase Auth (HS256 and RS256 via JWKS).
 */
import {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import * as jwt from "jsonwebtoken";
import JwksRsa from "jwks-rsa";
import { getSecret } from "./keyVault";
import { getContainer } from "./cosmosClient";

// JWKS client for RS256 — used when Supabase issues asymmetric tokens
const _supabaseUrl = process.env.SUPABASE_URL ?? "";
const _jwksClient = _supabaseUrl
  ? JwksRsa({
      jwksUri: `${_supabaseUrl}/auth/v1/.well-known/jwks.json`,
      cache: true,
      cacheMaxAge: 600_000,
    })
  : null;

export interface UserClaims {
  sub: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}

export type AuthenticatedHandler = (
  req: HttpRequest,
  context: InvocationContext,
  claims: UserClaims
) => Promise<HttpResponseInit>;

/**
 * Decode a Supabase-issued JWT — supports HS256, RS256, and ES256.
 */
async function decodeSupabaseJwt(token: string): Promise<UserClaims> {
  const header = jwt.decode(token, { complete: true })?.header as jwt.JwtHeader | undefined;
  const alg = header?.alg ?? "HS256";

  // Asymmetric algorithms — verify via JWKS
  if ((alg === "RS256" || alg === "ES256") && _jwksClient) {
    return new Promise((resolve, reject) => {
      const getKey = (hdr: jwt.JwtHeader, cb: jwt.SigningKeyCallback) => {
        _jwksClient!.getSigningKey(hdr.kid, (err, key) => {
          if (err) return cb(err);
          cb(null, key!.getPublicKey());
        });
      };
      jwt.verify(
        token,
        getKey,
        { algorithms: ["RS256", "ES256"], audience: "authenticated" },
        (err, decoded) => {
          if (err) reject(err);
          else resolve(decoded as UserClaims);
        }
      );
    });
  }

  // HS256 with shared secret
  const secret = await getSecret("SUPABASE-JWT-SECRET", "SUPABASE_JWT_SECRET");
  return jwt.verify(token, secret, {
    algorithms: ["HS256"],
    audience: "authenticated",
  }) as UserClaims;
}

const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS ??
  "http://localhost:5173,https://gudangku.space,https://www.gudangku.space,https://gudangku-steel.vercel.app"
).split(",").map(o => o.trim());

/**
 * Return CORS headers for the given request origin.
 * Falls back to the first allowed origin if the request origin isn't in the list.
 */
export function corsHeaders(req: HttpRequest): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

/**
 * Higher-order function that wraps a handler with JWT validation + CORS headers.
 * Returns 401 on failure, injects UserClaims on success.
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (
    req: HttpRequest,
    context: InvocationContext
  ): Promise<HttpResponseInit> => {
    const cors = corsHeaders(req);

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return { status: 204, headers: cors };
    }

    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return {
        status: 401,
        headers: cors,
        jsonBody: { error: "Missing or malformed Authorization header" },
      };
    }

    const token = authHeader.slice(7);
    try {
      const claims = await decodeSupabaseJwt(token);

      // Check if user is banned
      try {
        const container = getContainer("users");
        const { resource } = await container.item(claims.sub, claims.sub).read();
        if (resource?.banned) {
          return {
            status: 403,
            headers: cors,
            jsonBody: { error: "Your account has been suspended. Contact admin." },
          };
        }
      } catch {
        /* user not yet in DB, allow request (will be created on first action) */
      }

      const result = await handler(req, context, claims);
      // Merge CORS headers into successful response
      result.headers = { ...cors, ...(result.headers ?? {}) };
      return result;
    } catch (err: any) {
      context.warn(`Auth failed: ${err.message}`);
      return {
        status: 401,
        headers: cors,
        jsonBody: { error: "Unauthorized", detail: err.message },
      };
    }
  };
}
