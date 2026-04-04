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
 * Decode a Supabase-issued JWT — supports both HS256 and RS256.
 */
async function decodeSupabaseJwt(token: string): Promise<UserClaims> {
  const header = jwt.decode(token, { complete: true })?.header as jwt.JwtHeader | undefined;
  const alg = header?.alg ?? "HS256";

  if (alg === "RS256" && _jwksClient) {
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
        { algorithms: ["RS256"], audience: "authenticated" },
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
