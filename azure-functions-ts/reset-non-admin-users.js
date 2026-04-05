/**
 * ONE-TIME SCRIPT: Reset all non-admin users in Cosmos DB.
 *
 * Deletes their user documents so they are treated as brand-new users
 * on next login (fresh credits + welcome email re-triggered).
 *
 * Usage:
 *   $env:COSMOS_ENDPOINT="https://..."; $env:COSMOS_KEY="..."; $env:COSMOS_DATABASE="geosupplyguard"
 *   node reset-non-admin-users.js
 *
 * Or pass ADMIN_EMAIL to protect additional emails beyond the default.
 */

const { CosmosClient } = require("@azure/cosmos");

const ENDPOINT = process.env.COSMOS_ENDPOINT;
const KEY = process.env.COSMOS_KEY;
const DATABASE = process.env.COSMOS_DATABASE || "geosupplyguard";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "okitr52@gmail.com";
const DRY_RUN = process.env.DRY_RUN === "true";

if (!ENDPOINT || !KEY) {
  console.error("Missing COSMOS_ENDPOINT or COSMOS_KEY env vars.");
  process.exit(1);
}

(async () => {
  const client = new CosmosClient({ endpoint: ENDPOINT, key: KEY });
  const container = client.database(DATABASE).container("users");

  // Fetch all users
  const { resources } = await container.items
    .query("SELECT * FROM c")
    .fetchAll();

  console.log(`Total users found: ${resources.length}`);

  const toDelete = resources.filter(
    (u) => u.role !== "admin" && u.email !== ADMIN_EMAIL
  );
  const skipped = resources.length - toDelete.length;

  console.log(`Admin/protected users (skipping): ${skipped}`);
  console.log(`Non-admin users to reset: ${toDelete.length}`);
  if (DRY_RUN) console.log("DRY RUN — no deletions will happen.\n");

  let deleted = 0;
  let failed = 0;

  for (const user of toDelete) {
    try {
      if (!DRY_RUN) {
        await container.item(user.id, user.id).delete();
      }
      console.log(`  ${DRY_RUN ? "[DRY]" : "DELETED"} ${user.email || user.id}`);
      deleted++;
    } catch (err) {
      console.error(`  FAIL ${user.email || user.id}: ${err.message}`);
      failed++;
    }
  }

  console.log(
    `\nDone. ${DRY_RUN ? "Would delete" : "Deleted"}: ${deleted} | Failed: ${failed} | Skipped (admin): ${skipped}`
  );
})();
