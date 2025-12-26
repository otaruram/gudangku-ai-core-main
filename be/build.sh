#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Build Start..."

# 1. Install Dependencies
pip install -r requirements.txt

# 2. Fetch Binaries Explicitly (Fix for Render/Linux)
echo "Fetching Prisma Binaries..."
prisma py fetch

# 3. Generate Prisma Client (Force download of binaries)
# We strictly point to the schema to avoid ambiguity
prisma generate --schema=prisma/schema.prisma

echo "Build Finished Successfully."
