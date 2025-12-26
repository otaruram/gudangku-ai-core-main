#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Build Start..."

# 1. Install Dependencies
pip install -r requirements.txt

# 2. Fetch Binaries Explicitly
echo "Fetching Prisma Binaries..."
prisma py fetch

# 3. Generate Prisma Client
prisma generate --schema=prisma/schema.prisma

# 4. BRUTE FORCE: Copy binary to Current Directory (be/) where Client expects it
echo "Attempting to copy binaries to local ./be folder..."
# Try copy from cached binaries
cp /opt/render/.cache/prisma-python/binaries/*/*/prisma-query-engine* . || true
# Try copy from venv
cp /opt/render/project/src/.venv/lib/python3.11/site-packages/prisma/binaries/*/*/prisma-query-engine* . || true

# Rename if necessary (sometimes it comes with platform suffix but Client expects specific name)
# But usually the copy catches it.
echo "Binaries in current folder:"
ls -F prisma-query-engine* || echo "No binaries found in root."

echo "Build Finished Successfully."
