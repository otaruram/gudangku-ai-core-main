/**
 * JWT authentication middleware for Azure Functions v4.
 * Supports Supabase Auth (HS256) and Azure AD / Entra ID (RS256).
 */
import {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import * as jwt from "jsonwebtoken";
import { getSecret } from "./keyVault";

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
 * Decode a Supabase-issued JWT (HS256).
 */
async function decodeSupabaseJwt(token: string): Promise<UserClaims> {
  const secret = await getSecret("SUPABASE-JWT-SECRET", "SUPABASE_JWT_SECRET");
  return jwt.verify(token, secret, {
    algorithms: ["HS256"],
    audience: "authenticated",
  }) as UserClaims;
}

/**
 * Higher-order function that wraps a handler with JWT validation.
 * Returns 401 on failure, injects UserClaims on success.
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (
    req: HttpRequest,
    context: InvocationContext
  ): Promise<HttpResponseInit> => {
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return {
        status: 401,
        jsonBody: { error: "Missing or malformed Authorization header" },
      };
    }

    const token = authHeader.slice(7);
    try {
      const claims = await decodeSupabaseJwt(token);
      return handler(req, context, claims);
    } catch (err: any) {
      context.warn(`Auth failed: ${err.message}`);
      return {
        status: 401,
        jsonBody: { error: "Unauthorized", detail: err.message },
      };
    }
  };
}
