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

const CONTAINER_ENV_MAP: Record<ContainerName, string> = {
  users: "COSMOS_CONTAINER_USERS",
  chat_logs: "COSMOS_CONTAINER_CHAT_LOGS",
  prediction_history: "COSMOS_CONTAINER_PREDICTION_HISTORY",
};

const PARTITION_KEY_ENV_MAP: Record<ContainerName, string> = {
  users: "COSMOS_PK_USERS",
  chat_logs: "COSMOS_PK_CHAT_LOGS",
  prediction_history: "COSMOS_PK_PREDICTION_HISTORY",
};

function resolveContainerId(name: ContainerName): string {
  return process.env[CONTAINER_ENV_MAP[name]] ?? name;
}

function resolvePartitionKeyPath(name: ContainerName): string {
  return process.env[PARTITION_KEY_ENV_MAP[name]] ?? CONTAINERS[name];
}

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
  return getDatabase().container(resolveContainerId(name));
}

/**
 * Idempotent bootstrap — call once on first deploy or locally.
 */
export async function ensureContainers(): Promise<void> {
  const db = getDatabase();
  for (const name of Object.keys(CONTAINERS) as ContainerName[]) {
    const id = resolveContainerId(name);
    const pkPath = resolvePartitionKeyPath(name);
    await db.containers.createIfNotExists({
      id,
      partitionKey: { paths: [pkPath] },
    });
  }
}
