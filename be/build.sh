#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Build Start..."

# 1. Install Dependencies
pip install -r requirements.txt

# 2. Generate Prisma Client FIRST (this triggers binary download)
echo "Generating Prisma Client..."
prisma generate --schema=prisma/schema.prisma

# 3. DEBUG: Find where binaries actually are
echo "=== DEBUGGING: Searching for Prisma binaries ==="
echo "Checking common locations..."

# Check cache directory
if [ -d "/opt/render/.cache/prisma-python" ]; then
  echo "Cache directory exists, contents:"
  find /opt/render/.cache/prisma-python -name "*query-engine*" -type f 2>/dev/null || echo "No binaries in cache"
fi

# Check venv directory
if [ -d "/opt/render/project/src/.venv/lib/python3.11/site-packages/prisma" ]; then
  echo "Venv prisma directory exists, contents:"
  find /opt/render/project/src/.venv/lib/python3.11/site-packages/prisma -name "*query-engine*" -type f 2>/dev/null || echo "No binaries in venv"
fi

# Check home directory
if [ -d "$HOME/.cache/prisma-python" ]; then
  echo "Home cache directory exists, contents:"
  find "$HOME/.cache/prisma-python" -name "*query-engine*" -type f 2>/dev/null || echo "No binaries in home cache"
fi

echo "=== END DEBUG ==="

# 4. Copy binaries to the be/ directory where the app runs
echo "Copying Prisma binaries to runtime location..."

# Try all possible locations
FOUND=false

# Location 1: Cache
if find /opt/render/.cache/prisma-python -name "prisma-query-engine-debian-openssl-3.0.x" -type f -exec cp {} . \; 2>/dev/null; then
  echo "✓ Copied from cache"
  FOUND=true
fi

# Location 2: Venv
if find /opt/render/project/src/.venv/lib/python3.11/site-packages/prisma -name "prisma-query-engine-debian-openssl-3.0.x" -type f -exec cp {} . \; 2>/dev/null; then
  echo "✓ Copied from venv"
  FOUND=true
fi

# Location 3: Home cache
if find "$HOME/.cache/prisma-python" -name "prisma-query-engine-debian-openssl-3.0.x" -type f -exec cp {} . \; 2>/dev/null; then
  echo "✓ Copied from home cache"
  FOUND=true
fi

# Fallback: Try to fetch explicitly
if [ "$FOUND" = false ]; then
  echo "⚠ Binaries not found, trying explicit fetch..."
  prisma py fetch
  
  # Try copying again after fetch
  if find /opt/render/.cache/prisma-python -name "prisma-query-engine-debian-openssl-3.0.x" -type f -exec cp {} . \; 2>/dev/null; then
    echo "✓ Copied after fetch"
    FOUND=true
  fi
fi

# List what we have now
echo "Binaries in current directory ($(pwd)):"
ls -lh prisma-query-engine-* 2>/dev/null || echo "⚠ WARNING: No binaries found!"

# Make sure binaries are executable
chmod +x prisma-query-engine-* 2>/dev/null || true

# Verify we have the right binary
if [ -f "prisma-query-engine-debian-openssl-3.0.x" ]; then
  echo "✓ SUCCESS: Found required binary: prisma-query-engine-debian-openssl-3.0.x"
  ls -lh prisma-query-engine-debian-openssl-3.0.x
else
  echo "✗ CRITICAL: prisma-query-engine-debian-openssl-3.0.x not found!"
  echo "This will cause runtime errors!"
  exit 1
fi

echo "Build Finished Successfully."
