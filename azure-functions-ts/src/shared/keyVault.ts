/**
 * Azure Key Vault secret retrieval.
 * Falls back to environment variables for local development.
 */
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

let _client: SecretClient | null = null;
const _cache = new Map<string, string>();

function getClient(): SecretClient | null {
  if (_client) return _client;
  const vaultUrl = process.env.KEYVAULT_URL;
  if (!vaultUrl) return null;
  _client = new SecretClient(vaultUrl, new DefaultAzureCredential());
  return _client;
}

/**
 * Retrieve a secret from Key Vault, falling back to env var for local dev.
 * Results are cached in-memory for the function app instance lifetime.
 */
export async function getSecret(
  kvName: string,
  envFallback?: string
): Promise<string> {
  const envKey = envFallback ?? kvName.replace(/-/g, "_");

  // In-memory cache hit
  if (_cache.has(kvName)) return _cache.get(kvName)!;

  // Try Key Vault
  try {
    const client = getClient();
    if (client) {
      const secret = await client.getSecret(kvName);
      if (secret.value) {
        _cache.set(kvName, secret.value);
        return secret.value;
      }
    }
  } catch (err) {
    console.warn(`Key Vault lookup failed for '${kvName}':`, err);
  }

  // Fallback to environment variable
  const val = process.env[envKey];
  if (!val) {
    throw new Error(
      `Secret '${kvName}' not found in Key Vault or env var '${envKey}'`
    );
  }
  _cache.set(kvName, val);
  return val;
}
