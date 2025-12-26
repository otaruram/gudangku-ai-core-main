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

# Dynamically find Prisma binaries in cache (version-agnostic)
CACHE_BASE="/opt/render/.cache/prisma-python/binaries"
if [ -d "$CACHE_BASE" ]; then
  echo "Searching for binaries in cache..."
  find "$CACHE_BASE" -name "prisma-query-engine-*" -type f -exec cp {} . \; 2>/dev/null || true
fi

# Also try from venv if installed there
VENV_BASE="/opt/render/project/src/.venv/lib/python3.11/site-packages/prisma"
if [ -d "$VENV_BASE" ]; then
  echo "Searching for binaries in venv..."
  find "$VENV_BASE" -name "prisma-query-engine-*" -type f -exec cp {} . \; 2>/dev/null || true
fi

# List what we have now
echo "Binaries copied to current directory:"
ls -lh prisma-query-engine-* 2>/dev/null || echo "WARNING: No binaries found in current directory!"

# Make sure binaries are executable
chmod +x prisma-query-engine-* 2>/dev/null || true

# Verify we have the right binary for Render (debian-openssl-3.0.x)
if [ -f "prisma-query-engine-debian-openssl-3.0.x" ]; then
  echo "✓ Found required binary: prisma-query-engine-debian-openssl-3.0.x"
else
  echo "⚠ WARNING: prisma-query-engine-debian-openssl-3.0.x not found!"
  echo "Available binaries:"
  ls -1 prisma-query-engine-* 2>/dev/null || echo "None"
fi

echo "Build Finished Successfully."
