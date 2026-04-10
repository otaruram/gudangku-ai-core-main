/*
  One-time migration utility:
  - Copies data from old containers (pk=/id) to new v2 containers (pk=/userId)
  - Target containers are created if missing

  Usage (PowerShell):
    $env:COSMOS_ENDPOINT="https://<account>.documents.azure.com:443/"
    $env:COSMOS_KEY="<key>"
    $env:COSMOS_DATABASE="geosupplyguard"
    node scripts/migrate-cosmos-userid-partition.js
*/

const { CosmosClient } = require("@azure/cosmos");

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = process.env.COSMOS_DATABASE || "geosupplyguard";

const SOURCE_CHAT = process.env.COSMOS_SOURCE_CHAT || "chat_logs";
const SOURCE_FORECAST = process.env.COSMOS_SOURCE_FORECAST || "prediction_history";
const TARGET_CHAT = process.env.COSMOS_TARGET_CHAT || "chat_logs_v2";
const TARGET_FORECAST = process.env.COSMOS_TARGET_FORECAST || "prediction_history_v2";

if (!endpoint || !key) {
  console.error("Missing COSMOS_ENDPOINT/COSMOS_KEY");
  process.exit(1);
}

const client = new CosmosClient({ endpoint, key });
const db = client.database(databaseId);

async function ensureContainer(id, pkPath) {
  await db.containers.createIfNotExists({
    id,
    partitionKey: { paths: [pkPath] },
  });
}

async function migrateContainer(sourceId, targetId) {
  console.log(`Migrating ${sourceId} -> ${targetId}`);

  const source = db.container(sourceId);
  const target = db.container(targetId);

  let copied = 0;
  let skipped = 0;

  const iterator = source.items.query("SELECT * FROM c", { maxItemCount: 200 });

  while (iterator.hasMoreResults()) {
    const { resources } = await iterator.fetchNext();
    if (!resources || resources.length === 0) break;

    for (const doc of resources) {
      const userId = doc.userId || doc.user_id;
      if (!userId) {
        skipped += 1;
        continue;
      }

      const clean = {
        ...doc,
        userId,
      };
      delete clean._etag;
      delete clean._rid;
      delete clean._self;
      delete clean._attachments;
      delete clean._ts;

      await target.items.upsert(clean, { partitionKey: userId });
      copied += 1;
    }

    process.stdout.write(`\rCopied: ${copied} | Skipped: ${skipped}`);
  }

  console.log(`\nDone ${sourceId} -> ${targetId}. Copied=${copied}, Skipped=${skipped}`);
}

(async () => {
  try {
    await ensureContainer(TARGET_CHAT, "/userId");
    await ensureContainer(TARGET_FORECAST, "/userId");

    await migrateContainer(SOURCE_CHAT, TARGET_CHAT);
    await migrateContainer(SOURCE_FORECAST, TARGET_FORECAST);

    console.log("Migration complete.");
    console.log("Next: set app settings COSMOS_CONTAINER_CHAT_LOGS and COSMOS_CONTAINER_PREDICTION_HISTORY to v2 container names.");
  } catch (err) {
    console.error("Migration failed:", err.message || err);
    process.exit(1);
  }
})();
