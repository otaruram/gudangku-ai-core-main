/**
 * Azure Cosmos DB client (NoSQL API) — Singleton.
 * Containers: users, chat_logs, prediction_history
 */
import { CosmosClient, Database, Container } from "@azure/cosmos";

let _client: CosmosClient | null = null;
let _database: Database | null = null;

const CONTAINERS = {
  users: "/id",
  chat_logs: "/id",
  prediction_history: "/id",
} as const;

export type ContainerName = keyof typeof CONTAINERS;

function getClient(): CosmosClient {
  if (!_client) {
    const endpoint = process.env.COSMOS_ENDPOINT!;
    const key = process.env.COSMOS_KEY!;
    _client = new CosmosClient({ endpoint, key });
  }
  return _client;
}

export function getDatabase(): Database {
  if (!_database) {
    const dbName = process.env.COSMOS_DATABASE ?? "geosupplyguard";
    _database = getClient().database(dbName);
  }
  return _database;
}

export function getContainer(name: ContainerName): Container {
  return getDatabase().container(name);
}

/**
 * Idempotent bootstrap — call once on first deploy or locally.
 */
export async function ensureContainers(): Promise<void> {
  const db = getDatabase();
  for (const [name, pkPath] of Object.entries(CONTAINERS)) {
    await db.containers.createIfNotExists({
      id: name,
      partitionKey: { paths: [pkPath] },
    });
  }
}
