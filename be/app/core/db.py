import os
from pathlib import Path
from prisma import Prisma

# Set Prisma binary path for Render deployment
# Look for the binary in the be/ directory where we copy it during build
if not os.environ.get("PRISMA_QUERY_ENGINE_BINARY"):
    # Try to find the binary in the current directory (be/)
    possible_paths = [
        "/opt/render/project/src/be/prisma-query-engine-debian-openssl-3.0.x",
        "./prisma-query-engine-debian-openssl-3.0.x",
        str(Path(__file__).parent.parent.parent / "prisma-query-engine-debian-openssl-3.0.x"),
    ]
    
    for path in possible_paths:
        if os.path.exists(path) and os.access(path, os.X_OK):
            os.environ["PRISMA_QUERY_ENGINE_BINARY"] = path
            print(f"✓ Found Prisma binary at: {path}")
            break
    else:
        print("⚠ Warning: Prisma binary not found in expected locations")

db = Prisma()

async def connect_db():
    try:
        if not db.is_connected():
            await db.connect()
            print("✓ Database connected successfully")
    except Exception as e:
        print(f"✗ Database Connect Error: {e}")
        raise

async def disconnect_db():
    if db.is_connected():
        await db.disconnect()
        print("✓ Database disconnected")
