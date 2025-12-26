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

# Function to copy binary from a location
copy_binary_from() {
    local search_path="$1"
    local binary_name="prisma-query-engine-debian-openssl-3.0.x"
    
    if [ -d "$search_path" ]; then
        local found_binary=$(find "$search_path" -name "$binary_name" -type f 2>/dev/null | head -1)
        if [ -n "$found_binary" ]; then
            echo "Found binary at: $found_binary"
            cp "$found_binary" .
            return 0
        fi
    fi
    return 1
}

# Try multiple locations in order of priority
BINARY_FOUND=false

echo "Trying cache directory..."
if copy_binary_from "/opt/render/.cache/prisma-python"; then
    BINARY_FOUND=true
fi

if [ "$BINARY_FOUND" = false ]; then
    echo "Trying venv directory..."
    if copy_binary_from "/opt/render/project/src/.venv/lib/python3.11/site-packages/prisma"; then
        BINARY_FOUND=true
    fi
fi

if [ "$BINARY_FOUND" = false ]; then
    echo "Trying home cache..."
    if copy_binary_from "$HOME/.cache/prisma-python"; then
        BINARY_FOUND=true
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
