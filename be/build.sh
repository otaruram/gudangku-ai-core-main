#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Build Start..."
echo "Working directory: $(pwd)"

# 1. Install Dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# 2. CRITICAL: Fetch binaries BEFORE generate
echo "=== Fetching Prisma binaries explicitly ==="
prisma py fetch

# 3. DEBUG: Verify where fetch put the binaries
echo "=== Searching for binaries after fetch ==="
echo "Checking /opt/render/.cache/prisma-python:"
find /opt/render/.cache/prisma-python -name "*query-engine*" 2>/dev/null || echo "  Not found in cache"

echo "Checking venv:"
find /opt/render/project/src/.venv/lib/python3.11/site-packages/prisma -name "*query-engine*" 2>/dev/null || echo "  Not found in venv"

echo "Checking home cache:"
find "$HOME/.cache/prisma-python" -name "*query-engine*" 2>/dev/null || echo "  Not found in home"

# 4. Generate Prisma Client (should use already-fetched binaries)
echo "=== Generating Prisma Client ==="
prisma generate --schema=prisma/schema.prisma

# 5. Copy the debian-openssl-3.0.x binary to current directory
echo "=== Copying binaries to $(pwd) ==="

# Prisma Python installs binaries in these specific locations:
# 1. ${VENV}/lib/python3.11/site-packages/prisma/binaries/
# 2. ${CACHE}/.cache/prisma-python/binaries/

BINARY_NAME="prisma-query-engine-debian-openssl-3.0.x"
BINARY_FOUND=false

# Location 1: Check venv package binaries subfolder (most likely)
VENV_BINARY_PATH="/opt/render/project/src/.venv/lib/python3.11/site-packages/prisma/binaries"
if [ -d "$VENV_BINARY_PATH" ]; then
    echo "Searching in venv binaries: $VENV_BINARY_PATH"
    # Look for any query-engine binary
    for binary in "$VENV_BINARY_PATH"/*query-engine*; do
        if [ -f "$binary" ]; then
            echo "Found binary: $binary"
            # Copy and rename to the expected name
            cp "$binary" "./$BINARY_NAME"
            BINARY_FOUND=true
            break
        fi
    done
fi

# Location 2: Check cache directory
if [ "$BINARY_FOUND" = false ]; then
    CACHE_BINARY_PATH="/opt/render/.cache/prisma-python/binaries"
    if [ -d "$CACHE_BINARY_PATH" ]; then
        echo "Searching in cache binaries: $CACHE_BINARY_PATH"
        found=$(find "$CACHE_BINARY_PATH" -name "*query-engine*" -type f 2>/dev/null | head -1)
        if [ -n "$found" ]; then
            echo "Found binary: $found"
            cp "$found" "./$BINARY_NAME"
            BINARY_FOUND=true
        fi
    fi
fi

# Location 3: Check home cache
if [ "$BINARY_FOUND" = false ]; then
    HOME_CACHE="$HOME/.cache/prisma-python/binaries"
    if [ -d "$HOME_CACHE" ]; then
        echo "Searching in home cache: $HOME_CACHE"
        found=$(find "$HOME_CACHE" -name "*query-engine*" -type f 2>/dev/null | head -1)
        if [ -n "$found" ]; then
            echo "Found binary: $found"
            cp "$found" "./$BINARY_NAME"
            BINARY_FOUND=true
        fi
    fi
fi

# 6. Verify the binary exists and is executable
echo "=== Verification ==="
if [ -f "prisma-query-engine-debian-openssl-3.0.x" ]; then
    echo "✓ Binary found in current directory"
    chmod +x prisma-query-engine-debian-openssl-3.0.x
    ls -lh prisma-query-engine-debian-openssl-3.0.x
    
    # Test if binary is executable
    if ./prisma-query-engine-debian-openssl-3.0.x --version 2>/dev/null; then
        echo "✓ Binary is executable and working"
    else
        echo "⚠ Binary exists but may not be executable (this is sometimes OK)"
    fi
    
    echo "✓ BUILD SUCCESS"
else
    echo "✗ CRITICAL ERROR: Binary not found after all attempts!"
    echo ""
    echo "Debug info:"
    echo "Current directory: $(pwd)"
    echo "Files in current directory:"
    ls -la
    echo ""
    echo "This means prisma py fetch did not download the binary."
    echo "Possible causes:"
    echo "  1. Network issue preventing download"
    echo "  2. Prisma version incompatibility"
    echo "  3. binaryTargets not properly configured"
    echo ""
    exit 1
fi

echo "Build Finished Successfully."
