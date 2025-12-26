#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Build Start..."

# 1. Install Dependencies
pip install -r requirements.txt

# 2. Fetch Binaries FIRST (before generate)
echo "Fetching Prisma Binaries..."
prisma py fetch

# 3. Generate Prisma Client
echo "Generating Prisma Client..."
prisma generate --schema=prisma/schema.prisma

# 4. Copy binaries to the be/ directory where the app runs
echo "Copying Prisma binaries to runtime location..."

# Find where binaries are and copy them
BINARY_CACHE="/opt/render/.cache/prisma-python/binaries/5.17.0/393aa359c9ad4a4bb28630fb5613f9c281cde053"

if [ -d "$BINARY_CACHE" ]; then
  echo "Found binary cache directory"
  cp "$BINARY_CACHE"/prisma-query-engine-* . 2>/dev/null || true
fi

# Also try from venv if installed there
VENV_BINARIES="/opt/render/project/src/.venv/lib/python3.11/site-packages/prisma/binaries"
if [ -d "$VENV_BINARIES" ]; then
  echo "Found venv binary directory"
  find "$VENV_BINARIES" -name "prisma-query-engine-*" -exec cp {} . \; 2>/dev/null || true
fi

# List what we have now
echo "Binaries in current directory:"
ls -lh prisma-query-engine-* 2>/dev/null || echo "WARNING: No binaries found in current directory!"

# Make sure binaries are executable
chmod +x prisma-query-engine-* 2>/dev/null || true

echo "Build Finished Successfully."
